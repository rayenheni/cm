import { useState, useEffect } from "react";

const LS_KEY = "cmcb-reservations";

export interface Reservation {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  domain: string;
  urgency: string;
  message: string;
  status: "new" | "contacted" | "closed";
}

function loadReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Reservation[]).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveReservations(reservations: Reservation[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(reservations));
  } catch {
    /* ignore */
  }
}

function statusLabel(status: Reservation["status"]): string {
  switch (status) {
    case "new":
      return "Nouveau";
    case "contacted":
      return "Contacté";
    case "closed":
      return "Clôturé";
  }
}

function statusClasses(status: Reservation["status"]): string {
  switch (status) {
    case "new":
      return "border-wine-600/40 bg-wine-50 text-wine-700";
    case "contacted":
      return "border-gold-500/40 bg-gold-50 text-gold-700";
    case "closed":
      return "border-green-600/30 bg-green-50 text-green-700";
  }
}

function nextStatus(status: Reservation["status"]): Reservation["status"] {
  switch (status) {
    case "new":
      return "contacted";
    case "contacted":
      return "closed";
    case "closed":
      return "new";
  }
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function ReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>(loadReservations);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Keep in sync with other tabs / windows
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        setReservations(loadReservations());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateStatus = (id: string, status: Reservation["status"]) => {
    setReservations((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, status } : r));
      saveReservations(updated);
      return updated;
    });
  };

  const deleteReservation = (id: string) => {
    setReservations((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveReservations(updated);
      return updated;
    });
    setDeleteConfirm(null);
    if (expandedId === id) setExpandedId(null);
  };

  const counts = {
    new: reservations.filter((r) => r.status === "new").length,
    contacted: reservations.filter((r) => r.status === "contacted").length,
    closed: reservations.filter((r) => r.status === "closed").length,
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-wine-800">Réservations</h2>
        <p className="mt-0.5 text-sm text-ink-600">
          {reservations.length} demande{reservations.length !== 1 ? "s" : ""} · soumises via le formulaire de contact
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {(["new", "contacted", "closed"] as const).map((s) => (
          <div
            key={s}
            className={`rounded-xl border p-4 ${
              s === "new"
                ? "border-wine-600/30 bg-wine-50"
                : s === "contacted"
                ? "border-gold-500/30 bg-gold-50"
                : "border-green-600/20 bg-green-50"
            }`}
          >
            <p
              className={`text-2xl font-bold font-serif ${
                s === "new" ? "text-wine-700" : s === "contacted" ? "text-gold-600" : "text-green-700"
              }`}
            >
              {counts[s]}
            </p>
            <p
              className={`text-xs font-medium mt-0.5 ${
                s === "new" ? "text-wine-600" : s === "contacted" ? "text-gold-600" : "text-green-600"
              }`}
            >
              {statusLabel(s)}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {reservations.length === 0 && (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-cream-100/50 px-6 py-16 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="font-serif text-lg text-ink-600">Aucune demande pour l'instant.</p>
          <p className="mt-2 text-sm text-ink-400">
            Les demandes soumises via le formulaire de contact apparaîtront ici.
          </p>
        </div>
      )}

      {/* Table */}
      {reservations.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-tile">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-300 bg-cream-100/80">
                  <th className="px-5 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400">Date</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400">Nom</th>
                  <th className="hidden px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400 sm:table-cell">Domaine</th>
                  <th className="hidden px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400 md:table-cell">Urgence</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400">Statut</th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-medium tracking-widest uppercase text-ink-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-300/60">
                {reservations.map((r) => (
                  <>
                    <tr
                      key={r.id}
                      className="group cursor-pointer hover:bg-cream-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      <td className="px-5 py-4 text-ink-600 whitespace-nowrap text-xs">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-ink-900">{r.name}</div>
                        <div className="text-xs text-ink-400">{r.email}</div>
                      </td>
                      <td className="hidden px-4 py-4 sm:table-cell">
                        <span className="inline-flex items-center rounded-full border border-sand-300 bg-cream-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">
                          {r.domain}
                        </span>
                      </td>
                      <td className="hidden px-4 py-4 text-ink-600 md:table-cell text-xs">{r.urgency}</td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => updateStatus(r.id, nextStatus(r.status))}
                          className={`cursor-pointer inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all hover:opacity-80 ${statusClasses(r.status)}`}
                          title="Cliquer pour changer le statut"
                        >
                          {statusLabel(r.status)}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-ink-400 group-hover:text-ink-600 transition-colors">
                            {expandedId === r.id ? "▲" : "▼"}
                          </span>
                          {deleteConfirm === r.id ? (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => deleteReservation(r.id)}
                                className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                              >
                                Confirmer
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className="cursor-pointer rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-cream-200 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(r.id)}
                              className="cursor-pointer rounded-lg border border-sand-300 bg-cream-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedId === r.id && (
                      <tr key={`${r.id}-expanded`} className="bg-cream-50">
                        <td colSpan={6} className="px-5 py-5">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-[11px] font-medium tracking-widest uppercase text-ink-400 mb-1">Contact</p>
                              <p className="text-sm text-ink-900 font-medium">{r.name}</p>
                              {r.phone && <p className="text-sm text-ink-600">{r.phone}</p>}
                              <p className="text-sm text-ink-600">{r.email}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium tracking-widest uppercase text-ink-400 mb-1">Demande</p>
                              <p className="text-sm text-ink-900">{r.domain}</p>
                              <p className="text-xs text-ink-400 mt-0.5">Urgence : {r.urgency}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                              <p className="text-[11px] font-medium tracking-widest uppercase text-ink-400 mb-1">Message</p>
                              <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line">{r.message}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
