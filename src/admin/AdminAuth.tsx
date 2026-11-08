import { useState, type FormEvent } from "react";

const SESSION_KEY = "cmcb-admin-session";
const HASHED_PWD = btoa("cmcb2026admin");

function isAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === HASHED_PWD;
  } catch {
    return false;
  }
}

function login(password: string): boolean {
  if (btoa(password) === HASHED_PWD) {
    try {
      sessionStorage.setItem(SESSION_KEY, HASHED_PWD);
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

interface AdminAuthProps {
  children: React.ReactNode;
}

export function AdminAuth({ children }: AdminAuthProps) {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authed) {
    return <>{children}</>;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Small delay to feel responsive
    setTimeout(() => {
      if (login(password)) {
        setAuthed(true);
      } else {
        setError("Mot de passe incorrect. Veuillez réessayer.");
        setPassword("");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-wine-950 px-4">
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] texture-grain" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        {/* Logo area */}
        <div className="mb-10 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-500/30 bg-wine-900/80 shadow-tile mb-5">
            <span className="font-serif text-2xl font-bold text-gold-400">C</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-cream-50">Espace Admin</h1>
          <p className="mt-1.5 text-sm text-cream-200/60 tracking-wide">CMCB · Cabinet Bhiri</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-wine-800/60 bg-wine-900/70 p-8 shadow-frame backdrop-blur-sm">
          <form onSubmit={onSubmit} noValidate>
            <div>
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-medium tracking-[0.18em] uppercase text-gold-500/80 mb-1.5"
              >
                Mot de passe
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••••"
                autoComplete="current-password"
                autoFocus
                className="w-full rounded-xl border border-wine-700/60 bg-wine-950/60 px-4 py-3 text-[15px] text-cream-100 placeholder:text-wine-600 transition-all duration-200 focus:border-gold-500/60 focus:ring-4 focus:ring-gold-500/10 focus:outline-none"
                aria-invalid={!!error}
                aria-describedby={error ? "admin-login-error" : undefined}
              />
              {error && (
                <p
                  id="admin-login-error"
                  role="alert"
                  className="mt-2 text-xs text-red-400"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="mt-6 w-full rounded-full bg-gold-500 px-7 py-3.5 text-[13px] font-medium tracking-[0.14em] uppercase text-cream-50 shadow-tile transition-all duration-300 hover:bg-gold-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  Vérification…
                </span>
              ) : (
                "Accéder à l'espace admin"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-wine-600">
          Cabinet CMCB · Accès réservé
        </p>
      </div>
    </div>
  );
}
