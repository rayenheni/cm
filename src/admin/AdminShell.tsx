import { useState } from "react";
import { logout } from "./AdminAuth";
import { ArticlesManager } from "./ArticlesManager";
import { ReservationsManager } from "./ReservationsManager";
import { SettingsManager } from "./SettingsManager";
import { Calendar, Close, FileText, Lock, LogOut, Menu } from "@/components/Icons";
import { Monogram } from "@/components/Logo";
import { cn } from "@/utils/cn";
import { confirmNavigation, navigate, useRoute } from "@/router";

type Tab = "articles" | "reservations" | "settings";
const NAV_ITEMS = [
  { id: "articles" as const, label: "Articles", description: "Publications FR / AR", Icon: FileText },
  { id: "reservations" as const, label: "Réservations", description: "Demandes de consultation", Icon: Calendar },
  { id: "settings" as const, label: "Sécurité", description: "Compte et configuration", Icon: Lock },
];

export function AdminShell() {
  const route = useRoute();
  const activeTab: Tab = route.path === '/admin/reservations' ? 'reservations' : route.path === '/admin/settings' ? 'settings' : 'articles';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const current = NAV_ITEMS.find((item) => item.id === activeTab)!;

  const handleLogout = async () => {
    if (!confirmNavigation()) return;
    try { await logout(); window.dispatchEvent(new Event('cmcb-signed-out')); }
    catch { setLogoutError("Déconnexion impossible. Vérifiez votre connexion et réessayez."); }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f3ec] text-ink-900">
      {sidebarOpen && <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-20 bg-wine-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-wine-900 bg-wine-950 text-cream-100 transition-transform duration-200 lg:static lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center gap-3 border-b border-cream-50/10 px-6 py-6">
          <Monogram className="h-11 w-11 shrink-0 rounded" />
          <div className="min-w-0">
            <p className="font-serif text-xl font-semibold tracking-wide text-cream-50">CMCB</p>
            <p className="text-xs text-cream-200/65">Administration du cabinet</p>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto rounded-md p-2 text-cream-200/70 hover:bg-cream-50/10 hover:text-cream-50 lg:hidden" aria-label="Fermer le menu">
            <Close className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Navigation admin">
          <p className="px-3 text-[11px] font-medium tracking-[0.14em] text-cream-200/45 uppercase">Gestion</p>
          <ul className="mt-3 space-y-1">
            {NAV_ITEMS.map(({ id, label, description, Icon }) => (
              <li key={id}>
                <button type="button" onClick={() => { navigate(id === 'articles' ? '/admin' : `/admin/${id}`); setSidebarOpen(false); }} aria-current={activeTab === id ? "page" : undefined} className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors", activeTab === id ? "border-gold-500/30 bg-cream-50/10 text-cream-50" : "border-transparent text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50")}>
                  <Icon className={cn("h-5 w-5 shrink-0", activeTab === id ? "text-gold-400" : "text-cream-200/50")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block truncate text-xs text-cream-200/50">{description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-cream-50/10 p-4">
          <a href="#/" className="mb-2 block rounded-lg px-3 py-2.5 text-sm text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50">Voir le site public</a>
          <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream-200/80 hover:bg-cream-50/5 hover:text-cream-50">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-sand-300 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-md border border-sand-300 p-2 text-ink-600 hover:bg-cream-100 lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-[0.12em] text-ink-400 uppercase">Espace administrateur</p>
              <h1 className="truncate font-serif text-2xl font-semibold text-wine-800">{current.label}</h1>
            </div>
            <div className="ml-auto hidden items-center gap-3 sm:flex">
              <span className="rounded-md border border-sand-300 bg-cream-50 px-3 py-1.5 text-xs text-ink-600">Session sécurisée</span>
              <button type="button" onClick={() => void handleLogout()} className="rounded-lg border border-sand-300 px-4 py-2 text-sm font-medium text-ink-600 hover:border-wine-600/40 hover:text-wine-700">Déconnexion</button>
            </div>
          </div>
        </header>
        {logoutError && <p role="alert" className="border-b border-danger/20 bg-red-50 px-6 py-3 text-sm text-danger">{logoutError}</p>}
        <main className="flex-1 overflow-auto p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === "articles" && <ArticlesManager />}
            {activeTab === "reservations" && <ReservationsManager />}
            {activeTab === "settings" && <SettingsManager />}
          </div>
        </main>
      </div>
    </div>
  );
}
