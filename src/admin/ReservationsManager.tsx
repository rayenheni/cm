import { Fragment, useEffect, useState } from 'react';
import type { Reservation, ReservationStatus } from '@/lib/api-types';
import { api, errorMessage } from '@/lib/api';
import { ChevronDown, Inbox, Refresh, Search, Trash } from '@/components/Icons';

interface Feed { reservations: Reservation[]; total: number; page: number; limit: number; counts: Record<ReservationStatus, number> }
const statuses: ReservationStatus[] = ['new', 'contacted', 'closed'];
const labels: Record<ReservationStatus, string> = { new: 'Nouveau', contacted: 'Contacté', closed: 'Clôturé' };
const mailLabels = { disabled: 'E-mail non configuré', pending: 'E-mail en attente', sending: 'Envoi en cours', sent: 'E-mail envoyé', failed: 'Échec e-mail' };
const urgencyLabels = { normal: 'Normale', '48h': 'Sous 48 h', urgent: 'Urgente' };
const empty: Feed = { reservations: [], total: 0, page: 1, limit: 25, counts: { new: 0, contacted: 0, closed: 0 } };

export function ReservationsManager() {
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
      .catch(err => { if (!controller.signal.aborted) setError(errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, status, query, revision]);
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000); return () => window.clearInterval(timer); }, []);
  const act = async (id: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(id); setError('');
    try { await action(); refresh(); setDeleteConfirm(null); } catch (err) { setError(errorMessage(err)); } finally { setBusy(null); }
  };
  const totalPages = Math.max(1, Math.ceil(feed.total / feed.limit));
  return <div>
    <div className="mb-6"><h2 className="font-serif text-3xl font-semibold text-wine-800">Demandes de consultation</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Suivez les demandes reçues, contactez les prospects et clôturez les dossiers. Un rendez-vous doit être confirmé par le cabinet.</p></div>
    <div className="mb-6 grid grid-cols-3 gap-3">{statuses.map(s => <button key={s} onClick={() => { setStatus(status === s ? '' : s); setPage(1); }} aria-pressed={status === s} className={`cursor-pointer rounded-xl border bg-white p-5 text-left shadow-tile transition-colors ${status === s ? 'border-wine-600 ring-2 ring-wine-600/10' : 'border-sand-300 hover:border-wine-600/40'}`}><span className="block font-serif text-4xl font-semibold text-wine-700">{feed.counts[s]}</span><span className="mt-2 text-xs font-medium tracking-[0.06em] text-ink-600 uppercase">{labels[s]}</span></button>)}</div>
    <div className="mb-5 flex flex-wrap gap-3 rounded-xl border border-sand-300 bg-white p-4 shadow-tile"><div className="relative max-w-md min-w-64 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" /><input type="search" className="field pl-10" placeholder="Rechercher un nom, e-mail, domaine…" aria-label="Rechercher les demandes" value={search} onChange={e => setSearch(e.target.value)} /></div><select className="field w-auto" aria-label="Filtrer par statut" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tous les statuts</option>{statuses.map(s => <option key={s} value={s}>{labels[s]}</option>)}</select><button className="btn-outline px-4! py-2.5!" onClick={refresh} disabled={loading}>{loading ? 'Chargement…' : <><Refresh className="h-4 w-4" /> Actualiser</>}</button></div>
    {error && <div role="alert" className="mb-5 rounded-lg border border-danger/25 bg-red-50 p-4 text-sm text-danger">{error} <button className="ml-2 underline" onClick={refresh}>Réessayer</button></div>}
    {!loading && !error && feed.reservations.length === 0 && <div className="rounded-xl border border-dashed border-sand-400 bg-white p-12 text-center text-ink-600">{feed.total === 0 && !status && !query ? <><Inbox className="mx-auto mb-3 h-8 w-8 text-ink-400" /><p>Aucune demande pour l’instant. Les demandes du formulaire apparaîtront ici.</p></> : <p>Aucun résultat pour ces filtres.</p>}</div>}
    {feed.reservations.length > 0 && <div className="overflow-x-auto rounded-xl border border-sand-300 bg-white shadow-tile"><table className="w-full text-sm"><thead><tr className="border-b border-sand-300 bg-cream-50 text-left text-[11px] font-semibold tracking-[0.08em] text-ink-600 uppercase"><th className="px-5 py-4">Date</th><th className="px-4 py-4">Contact</th><th className="hidden px-4 py-4 lg:table-cell">Domaine / urgence</th><th className="px-4 py-4">Statut</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-sand-300">{feed.reservations.map(r => <Fragment key={r.id}><tr className="hover:bg-cream-50"><td className="whitespace-nowrap px-5 py-4 text-xs text-ink-600">{new Date(r.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td className="px-4 py-4"><button className="cursor-pointer text-left" aria-expanded={expanded === r.id} onClick={() => setExpanded(expanded === r.id ? null : r.id)}><span className="flex items-center gap-2 font-medium text-ink-900">{r.name}<ChevronDown className={`h-3.5 w-3.5 text-ink-400 transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} /></span><span className="text-xs text-ink-600">{r.email}</span></button></td><td className="hidden px-4 py-4 lg:table-cell"><p>{r.domain}</p><p className="mt-1 text-xs text-ink-400">{urgencyLabels[r.urgency]}</p></td><td className="px-4 py-4"><select aria-label={`Statut de ${r.name}`} className="cursor-pointer rounded-md border border-sand-300 bg-white px-2 py-2 text-xs" disabled={busy === r.id} value={r.status} onChange={e => void act(r.id, () => api(`/admin/reservations/${r.id}`, { method: 'PATCH', body: { status: e.target.value } }))}>{statuses.map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></td><td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-2">{deleteConfirm === r.id ? <><button className="cursor-pointer rounded-md bg-danger px-3 py-2 text-xs font-medium text-white" disabled={busy === r.id} onClick={() => void act(r.id, () => api(`/admin/reservations/${r.id}`, { method: 'DELETE', body: {} }))}>{busy === r.id ? 'Suppression…' : 'Confirmer'}</button><button className="px-2 text-xs" disabled={busy === r.id} onClick={() => setDeleteConfirm(null)}>Annuler</button></> : <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50" onClick={() => setDeleteConfirm(r.id)}><Trash className="h-3.5 w-3.5" /> Supprimer</button>}</div></td></tr>{expanded === r.id && <tr className="bg-cream-50"><td colSpan={5} className="px-5 py-5"><div className="grid gap-5 md:grid-cols-[220px_1fr]"><div><p className="text-xs font-medium text-ink-400 uppercase">Contact</p><p className="mt-2 font-medium">{r.name}</p><a className="block text-wine-700 underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <a className="block text-wine-700 underline" href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} dir="ltr">{r.phone}</a>}<p className="mt-3 text-xs text-ink-600">{r.domain} · {urgencyLabels[r.urgency]} · {r.lang.toUpperCase()}</p><p className="mt-2 text-xs text-ink-600">Consentement : {new Date(r.consentAt).toLocaleString('fr-FR')}</p><p className="mt-3 text-xs text-ink-600" role="status">{mailLabels[r.notification.status]}</p>{['failed', 'disabled'].includes(r.notification.status) && <button className="mt-2 cursor-pointer text-xs text-wine-700 underline" disabled={busy === r.id} onClick={() => void act(r.id, () => api(`/admin/reservations/${r.id}/retry`, { method: 'POST', body: {} }))}>Réessayer l’e-mail</button>}</div><div><p className="text-xs font-medium text-ink-400 uppercase">Message</p><p dir="auto" className="mt-2 leading-relaxed break-words whitespace-pre-wrap text-ink-900">{r.message}</p><p className="mt-3 text-xs text-ink-400">Référence : {r.id}</p></div></div></td></tr>}</Fragment>)}</tbody></table></div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-600"><span>{feed.total} demande{feed.total !== 1 ? 's' : ''} · page {feed.page} / {totalPages}</span><div className="flex gap-2"><button className="btn-outline px-4! py-2!" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Précédent</button><button className="btn-outline px-4! py-2!" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>Suivant</button></div></div>
  </div>;
}
