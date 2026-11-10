<?php
declare(strict_types=1);
namespace CMCB;

/** Minimal SMTP client: TLS certificate verification, STARTTLS or implicit TLS, AUTH LOGIN. */
final class Mailer
{
    private $socket;
    public function __construct(private readonly array $config) {}
    private function read(): string
    {
        $text = '';
        while (($line = fgets($this->socket, 4096)) !== false) {
            $text .= $line;
            if (preg_match('/^\d{3} /', $line)) break;
            if (strlen($text) > 16384) throw new \RuntimeException('Réponse SMTP trop longue.');
        }
        if ($text === '') throw new \RuntimeException('Connexion SMTP fermée.');
        return $text;
    }
    private function command(string $command, array $codes): string
    {
        if (fwrite($this->socket, $command . "\r\n") === false) throw new \RuntimeException('Écriture SMTP impossible.');
        $reply = $this->read();
        if (!in_array((int)substr($reply, 0, 3), $codes, true)) throw new \RuntimeException('Commande SMTP refusée (' . substr($reply, 0, 3) . ').');
        return $reply;
    }
    public function send(array $reservation): void
    {
        $c = $this->config;
        $context = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $c['host'], 'SNI_enabled' => true, 'allow_self_signed' => false]]);
        $this->socket = @stream_socket_client(($c['secure'] ? 'ssl://' : 'tcp://') . $c['host'] . ':' . $c['port'], $errno, $error, 12, STREAM_CLIENT_CONNECT, $context);
        if (!$this->socket) throw new \RuntimeException('Connexion SMTP impossible.');
        stream_set_timeout($this->socket, 12);
        try {
            if (!preg_match('/^220 /', $this->read())) throw new \RuntimeException('Accueil SMTP invalide.');
            $this->command('EHLO cmcb.local', [250]);
            if (!$c['secure']) {
                $this->command('STARTTLS', [220]);
                if (!@stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new \RuntimeException('TLS SMTP impossible.');
                $this->command('EHLO cmcb.local', [250]);
            }
            if ($c['user'] !== '') {
                $this->command('AUTH LOGIN', [334]);
                $this->command(base64_encode($c['user']), [334]);
                $this->command(base64_encode($c['pass']), [235]);
            }
            $this->command('MAIL FROM:<' . Config::address($c['from']) . '>', [250]);
            $this->command('RCPT TO:<' . Config::address($c['to']) . '>', [250, 251]);
            $this->command('DATA', [354]);
            $message = self::message($c['from'], $c['to'], $reservation);
            $this->command($message . "\r\n.", [250]);
            $this->command('QUIT', [221]);
        } finally { if (is_resource($this->socket)) fclose($this->socket); }
    }
    public static function message(string $from, string $to, array $r): string
    {
        $header = static function (string $v): string { if (preg_match('/[\r\n\0]/', $v)) throw new \RuntimeException('En-tête e-mail invalide.'); return $v; };
        $from = $header($from); $to = $header($to);
        $subject = '=?UTF-8?B?' . base64_encode('CMCB — Nouvelle demande de consultation') . '?=';
        $body = "Une demande est enregistrée dans l’espace administrateur.\n\nRéférence : {$r['id']}\nNom : {$r['name']}\nE-mail : {$r['email']}\nTéléphone : {$r['phone']}\nDomaine : {$r['domain']}\nUrgence : {$r['urgency']}\nLangue : {$r['lang']}\n\n{$r['message']}\n\nCeci est une demande, pas un rendez-vous confirmé.";
        $body = str_replace("\n", "\r\n", preg_replace('/^\./m', '..', str_replace(["\r\n", "\r"], "\n", $body)));
        return "From: $from\r\nTo: $to\r\nSubject: $subject\r\nDate: " . gmdate('r') . "\r\nMessage-ID: <{$r['id']}@cmcb.local>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$body";
    }
}
final class Outbox
{
    public function __construct(private readonly \PDO $db, private readonly ?Mailer $mailer) {}
    public function processOnce(?callable $sender = null): int
    {
        if (!$this->mailer && !$sender) return 0;
        $sent = 0;
        for ($i = 0; $i < 20; $i++) {
            $row = Database::transaction($this->db, function () {
                $sql = "SELECT o.*,r.id AS rid FROM outbox o JOIN reservations r ON r.id=o.reservation_id WHERE o.status='pending' AND o.next_attempt_at<=? ORDER BY o.next_attempt_at LIMIT 1";
                if (Database::isMysql($this->db)) $sql .= ' FOR UPDATE';
                $r = Database::one($this->db, $sql, [time()]);
                if (!$r) return null;
                Database::run($this->db, "UPDATE outbox SET status='sending',attempts=attempts+1 WHERE reservation_id=?", [$r['reservation_id']]);
                return $r;
            });
            if (!$row) break;
            $reservation = (new Repository($this->db))->reservation($row['rid']);
            try {
                $sender ? $sender($reservation) : $this->mailer->send($reservation);
                Database::run($this->db, "UPDATE outbox SET status='sent',sent_at=?,last_error=NULL WHERE reservation_id=?", [Database::now(), $row['reservation_id']]);
                $sent++;
            } catch (\Throwable $e) {
                $failed = (int)$row['attempts'] + 1 >= 8;
                Database::run($this->db, 'UPDATE outbox SET status=?,next_attempt_at=?,last_error=? WHERE reservation_id=?', [$failed ? 'failed' : 'pending', time() + min(3600, 30 * (2 ** ((int)$row['attempts'] + 1))), $failed ? 'Échec après 8 tentatives. Voir les journaux du serveur.' : 'Échec temporaire SMTP ; nouvel essai planifié.', $row['reservation_id']]);
                error_log('CMCB outbox: notification ' . $row['reservation_id'] . ' failed (' . get_class($e) . ').');
            }
        }
        return $sent;
    }
}
