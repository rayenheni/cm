import { useAdminText, adminError } from './useAdminText';
import { Fragment, useEffect, useState } from 'react';
import type { Reservation, ReservationStatus } from '@/lib/api-types';
import { api } from '@/lib/api';
import { ChevronDown, Inbox, Refresh, Search, Trash } from '@/components/Icons';

interface Feed { reservations: Reservation[]; total: number; page: number; limit: number; counts: Record<ReservationStatus, number> }
const statuses: ReservationStatus[] = ['new', 'contacted', 'closed'];
const empty: Feed = { reservations: [], total: 0, page: 1, limit: 25, counts: { new: 0, contacted: 0, closed: 0 } };

export function ReservationsManager() {
  const a = useAdminText();
  const labels: Record<ReservationStatus, string> = { new: a('Nouveau', 'New'), contacted: a('Contacté', 'Contacted'), closed: a('Clôturé', 'Closed') };
  const mailLabels = { disabled: a('E-mail non configuré', 'Email not configured'), pending: a('E-mail en attente', 'Email pending'), sending: a('Envoi en cours', 'Sending email'), sent: a('E-mail envoyé', 'Email sent'), failed: a('Échec e-mail', 'Email failed') };
  const urgencyLabels = { normal: a('Normale', 'Normal'), '48h': a('Sous 48 h', 'Within 48 hours'), urgent: a('Urgente', 'Urgent') };
  const [feed, setFeed] = useState<Feed>(empty);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = () => setRevision(v => v + 1);
  useEffect(() => { const timer = window.setTimeout(() => { setQuery(search); setPage(1); }, 300); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (status) params.set('status', status);
    if (query) params.set('q', query);
    api<Feed>(`/admin/reservations?${params}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setFeed(data); })
      .catch(err => { if (!controller.signal.aborted) setError(adminError(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, query, revision]);
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000); return () => window.clearInterval(timer); }, []);
  const act = async (id: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(id); setError('');
    try { await action(); refresh(); setDeleteConfirm(null); } catch (err) { setError(adminError(err)); } finally { setBusy(null); }
  };
  const totalPages = Math.max(1, Math.ceil(feed.total / feed.limit));
  return <div>
    <div className="mb-6"><h2 className="font-serif text-3xl font-semibold text-wine-800">{a("Demandes de consultation", "Consultation requests")}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">{a("Suivez les demandes reçues, contactez les prospects et clôturez les dossiers. Un rendez-vous doit être confirmé par le cabinet.", "Track incoming requests, contact clients and close cases. Appointments must be confirmed by the firm.")}</p></div>
    <div className="mb-6 grid grid-cols-3 gap-3">{statuses.map(s => <button key={s} onClick={() => { setStatus(status === s ? '' : s); setPage(1); }} aria-pressed={status === s} className={`cursor-pointer rounded-xl border bg-white p-5 text-left shadow-tile transition-colors ${status === s ? 'border-wine-600 ring-2 ring-wine-600/10' : 'border-sand-300 hover:border-wine-600/40'}`}><span className="block font-serif text-4xl font-semibold text-wine-700">{feed.counts[s]}</span><span className="mt-2 text-xs font-medium tracking-[0.06em] text-ink-600 uppercase">{labels[s]}</span></button>)}</div>
    <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-sand-300 bg-white p-4 shadow-tile"><div className="relative max-w-md min-w-64 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" /><input type="search" className="field pl-10" placeholder={a("Rechercher un nom, e-mail, domaine…", "Search name, email or area…")} aria-label={a("Rechercher les demandes", "Search requests")} value={search} onChange={e => setSearch(e.target.value)} /></div><select className="field w-auto" aria-label={a("Filtrer par statut", "Filter by status")} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">{a("Tous les statuts", "All statuses")}</option>{statuses.map(s => <option key={s} value={s}>{labels[s]}</option>)}</select><button className="btn-outline px-4! py-2.5!" onClick={refresh} disabled={loading}>{loading ? a("Chargement…", "Loading…") : <><Refresh className="h-4 w-4" /> {a("Actualiser", "Refresh")}</>}</button></div>
    {error && <div role="alert" className="mb-5 rounded-lg border border-danger/25 bg-red-50 p-4 text-sm text-danger">{error} <button className="ml-2 underline" onClick={refresh}>{a("Réessayer", "Try again")}</button></div>}
    {!loading && !error && feed.reservations.length === 0 && <div className="rounded-xl border border-dashed border-sand-400 bg-white p-12 text-center text-ink-600">{feed.total === 0 && !status && !query ? <><Inbox className="mx-auto mb-3 h-8 w-8 text-ink-400" /><p>{a("Aucune demande pour l’instant. Les demandes du formulaire apparaîtront ici.", "No requests yet. Form submissions will appear here.")}</p></> : <p>{a("Aucun résultat pour ces filtres.", "No results for these filters.")}</p>}</div>}
    {feed.reservations.length > 0 && <div className="overflow-x-auto rounded-xl border border-sand-300 bg-white shadow-tile"><table className="w-full text-sm"><thead><tr className="border-b border-sand-300 bg-cream-50 text-left text-[11px] font-semibold tracking-[0.08em] text-ink-600 uppercase"><th className="px-5 py-4">{a("Date", "Date")}</th><th className="px-4 py-4">{a("Contact", "Contact")}</th><th className="hidden px-4 py-4 lg:table-cell">{a("Domaine / urgence", "Area / urgency")}</th><th className="px-4 py-4">{a("Statut", "Status")}</th><th className="px-5 py-4 text-right">{a("Actions", "Actions")}</th></tr></thead><tbody className="divide-y divide-sand-300">{feed.reservations.map(r => <Fragment key={r.id}><tr className="hover:bg-cream-50"><td className="whitespace-nowrap px-5 py-4 text-xs text-ink-600">{new Date(r.createdAt).toLocaleString(a('fr-FR', 'en-GB'), { timeZone: 'Africa/Tunis', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td className="px-4 py-4"><button className="cursor-pointer text-left" aria-expanded={expanded === r.id} onClick={() => setExpanded(expanded === r.id ? null : r.id)}><span className="flex items-center gap-2 font-medium text-ink-900">{r.name}<ChevronDown className={`h-3.5 w-3.5 text-ink-400 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} /></span><span className="text-xs text-ink-600">{r.email}</span></button></td><td className="hidden px-4 py-4 lg:table-cell"><p>{r.domain}</p><p className="mt-1 text-xs text-ink-400">{urgencyLabels[r.urgency]}</p></td><td className="px-4 py-4"><select aria-label={a(`Statut de ${r.name}`, `Status of ${r.name}`)} className="cursor-pointer rounded-md border border-sand-300 bg-white px-2 py-2 text-xs" disabled={busy === r.id} value={r.status} onChange={e => void act(r.id, () => api(`/admin/reservations/${r.id}`, { method: 'PATCH', body: { status: e.target.value } }))}>{statuses.map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></td><td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-2">{deleteConfirm === r.id ? <><button className="cursor-pointer rounded-md bg-danger px-3 py-2 text-xs font-medium text-white" disabled={busy === r.id} onClick={() => void act(r.id, () => api(`/admin/reservations/${r.id}`, { method: 'DELETE', body: {} }))}>{busy === r.id ? a("Suppression…", "Deleting…") : a("Confirmer", "Confirm")}</button><button className="px-2 text-xs" disabled={busy === r.id} onClick={() => setDeleteConfirm(null)}>{a("Annuler", "Cancel")}</button></> : <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50" onClick={() => setDeleteConfirm(r.id)}><Trash className="h-3.5 w-3.5" /> {a("Supprimer", "Delete")}</button>}</div></td></tr>{expanded === r.id && <tr className="bg-cream-50"><td colSpan={5} className="px-5 py-5"><div className="grid gap-5 md:grid-cols-[220px_1fr]"><div><p className="text-xs font-medium text-ink-400 uppercase">{a("Contact", "Contact")}</p><p className="mt-2 font-medium">{r.name}</p><a className="block text-wine-700 underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <a className="block text-wine-700 underline" href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} dir="ltr">{r.phone}</a>}<p className="mt-3 text-xs text-ink-600">{r.domain} · {urgencyLabels[r.urgency]} · {r.lang.toUpperCase()}</p><p className="mt-2 text-xs text-ink-600">{a("Consentement :", "Consent:")} {new Date(r.consentAt).toLocaleString(a('fr-FR', 'en-GB'))}</p><p className="mt-3 text-xs text-ink-600" role="status">{mailLabels[r.notification.status]}</p>{['failed', 'disabled'].includes(r.notification.status) && <button className="mt-2 cursor-pointer text-xs text-wine-700 underline" disabled={busy === r.id} onClick={() => void act(r.id, () => api(`/admin/reservations/${r.id}/retry`, { method: 'POST', body: {} }))}>{a("Réessayer l’e-mail", "Retry email")}</button>}</div><div><p className="text-xs font-medium text-ink-400 uppercase">{a("Message", "Message")}</p><p dir="auto" className="mt-2 leading-relaxed break-words whitespace-pre-wrap text-ink-900">{r.message}</p><p className="mt-3 text-xs text-ink-400">{a("Référence :", "Reference:")} {r.id}</p></div></div></td></tr>}</Fragment>)}</tbody></table></div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-600"><span>{feed.total} {a(feed.total !== 1 ? 'demandes' : 'demande', feed.total !== 1 ? 'requests' : 'request')} · page {feed.page} / {totalPages}</span><div className="flex gap-2"><button className="btn-outline px-4! py-2!" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>{a("Précédent", "Previous")}</button><button className="btn-outline px-4! py-2!" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>{a("Suivant", "Next")}</button></div></div>
  </div>;
}
