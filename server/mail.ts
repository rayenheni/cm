import nodemailer from 'nodemailer';
import type { Config } from './config.js';
import type { DatabaseSync } from 'node:sqlite';
import type { Reservation } from '../src/lib/api-types.js';
import { getReservation, transaction } from './db.js';
export interface Mailer { send: (reservation: Reservation) => Promise<void> }
export function createMailer(config: Config['smtp']): Mailer | null {
  if (!config) return null;
  const transport = nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  });
  return { async send(r) {
    const result = await transport.sendMail({
      from: config.from, to: config.to, replyTo: r.email,
      subject: `CMCB — Nouvelle consultation : ${r.domain.replace(/[\r\n]/g, ' ')}`,
      text: `Nouvelle demande ${r.id}\nReçue le ${r.createdAt}\n\nNom : ${r.name}\nE-mail : ${r.email}\nTéléphone : ${r.phone || '—'}\nDomaine : ${r.domain}\nUrgence : ${r.urgency}\nLangue : ${r.lang}\nConsentement : ${r.consentAt}\n\n${r.message}\n\nConnectez-vous à l'espace admin pour traiter cette demande.`,
    });
    if (!result.accepted.length) throw new Error('SMTP did not accept the notification.');
  } };
}
export class NotificationWorker {
  private timer?: NodeJS.Timeout;
  private running = false;
  private stopped = false;
  private pending: Promise<void> = Promise.resolve();
  constructor(private db: DatabaseSync, private mailer: Mailer | null) {}
  start(): void {
    if (!this.mailer || this.timer) return;
    this.db.prepare("UPDATE outbox SET status='pending',next_attempt_at=0 WHERE status='disabled'").run();
    const schedule = () => { this.pending = this.tick().catch(() => console.error('Notification queue tick failed.')); };
    schedule();
    this.timer = setInterval(schedule, 10000);
    this.timer.unref();
  }
  async tick(): Promise<void> {
    if (!this.mailer || this.running || this.stopped) return;
    this.running = true;
    try {
      for (let i = 0; i < 10; i++) {
        const row = this.db.prepare("SELECT reservation_id FROM outbox WHERE status='pending' AND next_attempt_at<=? ORDER BY next_attempt_at LIMIT 1").get(Date.now()) as { reservation_id: string } | undefined;
        if (!row || this.stopped) break;
        const claimed = transaction(this.db, () => {
          const result = this.db.prepare("UPDATE outbox SET status='sending',attempts=attempts+1 WHERE reservation_id=? AND status='pending'").run(row.reservation_id);
          return result.changes > 0;
        });
        if (!claimed) continue;
        const reservation = getReservation(this.db, row.reservation_id);
        try {
          if (!reservation) throw new Error('Request no longer exists.');
          await this.mailer.send(reservation);
          this.db.prepare("UPDATE outbox SET status='sent',sent_at=?,last_error=NULL WHERE reservation_id=?").run(new Date().toISOString(), row.reservation_id);
        } catch {
          this.db.prepare("UPDATE outbox SET status=?,next_attempt_at=?,last_error=? WHERE reservation_id=?").run(reservation && reservation.notification.attempts >= 8 ? 'failed' : 'pending', Date.now() + Math.min(3600000, 30000 * 2 ** (reservation?.notification.attempts ?? 1)), 'SMTP delivery failed. Check the server SMTP configuration.', row.reservation_id);
        }
      }
    } finally { this.running = false; }
  }
  async stop(): Promise<void> { this.stopped = true; if (this.timer) clearInterval(this.timer); await this.pending; }
}
