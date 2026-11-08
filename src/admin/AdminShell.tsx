import { useState } from "react";
import { logout } from "./AdminAuth";
import { ArticlesManager } from "./ArticlesManager";
import { ReservationsManager } from "./ReservationsManager";

type Tab = "articles" | "reservations";

interface NavItem {
  id: Tab;
  label: string;
  emoji: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "articles", label: "Articles", emoji: "📝" },
  { id: "reservations", label: "Réservations", emoji: "📅" },
];

export function AdminShell() {
  const [activeTab, setActiveTab] = useState<Tab>("articles");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* ——— Mobile overlay ——— */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-wine-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ——— Sidebar ——— */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-wine-950 shadow-frame transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 border-b border-wine-800/50 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-wine-900">
            <span className="font-serif text-lg font-bold text-gold-400">C</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-wide text-cream-50 truncate">Espace Admin</p>
            <p className="text-[11px] text-gold-500/70 tracking-wider truncate">CMCB</p>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto cursor-pointer text-wine-500 hover:text-cream-100 lg:hidden"
            aria-label="Fermer le menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation admin">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-wine-700/60 text-cream-50"
                      : "text-wine-400 hover:bg-wine-900/60 hover:text-cream-100"
                  }`}
                  aria-current={activeTab === item.id ? "page" : undefined}
                >
                  <span className="text-base">{item.emoji}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer — logout */}
        <div className="border-t border-wine-800/50 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-wine-500 transition-colors hover:bg-wine-900/60 hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ——— Main content ——— */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-sand-300 bg-cream-50/95 px-5 py-4 backdrop-blur-sm sm:px-8">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer rounded-lg p-2 text-ink-600 hover:bg-cream-200 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="font-serif text-xl font-semibold text-wine-800 sm:text-2xl">
            Espace Admin <span className="text-gold-500">CMCB</span>
          </h1>

          {/* Desktop tab pills */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-wine-600 text-cream-50"
                    : "text-ink-600 hover:bg-cream-200"
                }`}
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>

          {/* Desktop logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-4 hidden cursor-pointer rounded-full border border-sand-300 px-4 py-1.5 text-[13px] font-medium text-ink-600 transition-all hover:border-wine-600/40 hover:text-wine-700 lg:block"
          >
            Déconnexion
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5 sm:p-8">
          {activeTab === "articles" && <ArticlesManager />}
          {activeTab === "reservations" && <ReservationsManager />}
        </main>
      </div>
    </div>
  );
}
