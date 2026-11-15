import { useAdminText, adminError } from './useAdminText';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, clearSession, isEmbeddedPreview, setCsrfToken, setSessionToken } from '@/lib/api';
import type { AuthState } from '@/lib/api-types';
import { Lock } from '@/components/Icons';
import { Monogram } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST', body: {} });
  clearSession();
}

export function AdminAuth({ children }: { children: ReactNode }) {
  const a = useAdminText();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api<AuthState>('/auth/session', { signal: controller.signal }).then(state => {
      setCsrfToken(state.csrfToken); setAuthed(state.authenticated);
    }).catch(err => { if (!controller.signal.aborted) setError(adminError(err)); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    const expired = () => { setAuthed(false); clearSession(); setError(a("Votre session a expiré. Reconnectez-vous.", "Your session has expired. Please sign in again.")); };
    const signedOut = () => { setAuthed(false); setError(''); };
    window.addEventListener('cmcb-session-expired', expired);
    window.addEventListener('cmcb-signed-out', signedOut);
    return () => { controller.abort(); window.removeEventListener('cmcb-session-expired', expired); window.removeEventListener('cmcb-signed-out', signedOut); };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const embedded = isEmbeddedPreview();
      const state = await api<AuthState>('/auth/login', { method: 'POST', body: { email, password, ...(embedded ? { transport: 'bearer' as const } : {}) }, headers: embedded ? { 'X-Auth-Transport': 'bearer' } : {} });
      setCsrfToken(state.csrfToken);
      setSessionToken(state.sessionToken ?? null);
      // Verify the chosen transport before mounting protected admin queries.
      const verified = await api<AuthState>('/auth/session');
      if (!verified.authenticated || !verified.csrfToken) {
        clearSession();
        setError(embedded ? (state.sessionToken ? a("Le proxy de la preview ne transmet pas la session. Rechargez le panneau Preview Arena et réessayez ici.", "The preview proxy is not forwarding the session. Reload the Arena preview and try again.") : a("La preview n’a pas activé le mode session intégré. Rechargez le panneau Preview Arena et réessayez ici.", "Embedded preview sessions are not enabled. Reload the Arena preview and try again.")) : a("Le navigateur a bloqué la session. Autorisez les cookies pour ce site, puis réessayez.", "The browser blocked the session. Enable cookies for this website and try again."));
        return;
      }
      setCsrfToken(verified.csrfToken); setAuthed(true); setPassword('');
    } catch (err) { setError(adminError(err)); }
    finally { setLoading(false); }
  };

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec] text-ink-600" role="status">{a("Vérification de la session…", "Checking your session…")}</div>;
  if (authed) return <>{children}</>;
  const inputClass = 'field';
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex justify-end"><LanguageSwitcher includeArabic={false} /></div>
        <div className="mb-10 text-center">
          <Monogram className="mx-auto mb-5 h-16 w-16 rounded-md shadow-tile" />
          <h1 className="font-serif text-3xl font-semibold text-wine-800">{a("Espace Admin", "Admin area")}</h1><p className="mt-2 flex items-center justify-center gap-2 text-xs text-ink-600"><Lock className="h-3.5 w-3.5" /> {a("Connexion sécurisée", "Secure sign-in")}</p>
          <p className="mt-1.5 text-sm tracking-wide text-ink-600">{a("CMCB · Cabinet Bhiri", "CMCB · Bhiri Law Firm")}</p>
        </div>
        <div className="rounded-xl border border-sand-300 bg-white p-8 shadow-soft">
          <form onSubmit={onSubmit}>
            <label htmlFor="admin-email" className="mb-1.5 block text-xs font-medium tracking-widest text-ink-600 uppercase">{a("Adresse e-mail", "Email address")}</label>
            <input id="admin-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoComplete="username" required autoFocus className={inputClass} />
            <label htmlFor="admin-password" className="mt-5 mb-1.5 block text-xs font-medium tracking-widest text-ink-600 uppercase">{a("Mot de passe", "Password")}</label>
            <input id="admin-password" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" required maxLength={128} className={inputClass} aria-describedby={error ? 'admin-login-error' : undefined} />
            {error && <p id="admin-login-error" role="alert" className="mt-4 text-sm leading-relaxed text-danger">{error}</p>}
            <button type="submit" disabled={loading || !email || !password} className="mt-6 w-full cursor-pointer btn-wine w-full disabled:cursor-wait">{loading ? a("Vérification…", "Checking…") : a("Se connecter", "Sign in")}</button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-ink-600">{a("Accès réservé. Premier lancement : créez votre compte avec la commande ", "Restricted access. On first launch, create your account with ")}<code>npm run admin:create</code>{a(" sur le serveur.", " on the server.")}</p>
        <a href="#/" className="mt-4 block text-center text-sm text-wine-700 hover:underline">{a("Retour au site", "Return to the website")}</a>
      </div>
    </div>
  );
}
