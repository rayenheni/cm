import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, clearSession, errorMessage, isEmbeddedPreview, setCsrfToken, setSessionToken } from '@/lib/api';
import type { AuthState } from '@/lib/api-types';
import { Lock } from '@/components/Icons';
import { Monogram } from '@/components/Logo';

export async function logout(): Promise<void> {
  await api('/auth/logout', { method: 'POST', body: {} });
  clearSession();
}

export function AdminAuth({ children }: { children: ReactNode }) {
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
    }).catch(err => { if (!controller.signal.aborted) setError(errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    const expired = () => { setAuthed(false); clearSession(); setError('Votre session a expiré. Reconnectez-vous.'); };
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
        setError(embedded ? (state.sessionToken ? 'Le proxy de la preview ne transmet pas la session. Rechargez le panneau Preview Arena et réessayez ici.' : 'La preview n’a pas activé le mode session intégré. Rechargez le panneau Preview Arena et réessayez ici.') : 'Le navigateur a bloqué la session. Autorisez les cookies pour ce site, puis réessayez.');
        return;
      }
      setCsrfToken(verified.csrfToken); setAuthed(true); setPassword('');
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  };

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec] text-ink-600" role="status">Vérification de la session…</div>;
  if (authed) return <>{children}</>;
  const inputClass = 'field';
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Monogram className="mx-auto mb-5 h-16 w-16 rounded-md shadow-tile" />
          <h1 className="font-serif text-3xl font-semibold text-wine-800">Espace Admin</h1><p className="mt-2 flex items-center justify-center gap-2 text-xs text-ink-600"><Lock className="h-3.5 w-3.5" /> Connexion sécurisée</p>
          <p className="mt-1.5 text-sm tracking-wide text-ink-600">CMCB · Cabinet Bhiri</p>
        </div>
        <div className="rounded-xl border border-sand-300 bg-white p-8 shadow-soft">
          <form onSubmit={onSubmit}>
            <label htmlFor="admin-email" className="mb-1.5 block text-xs font-medium tracking-widest text-ink-600 uppercase">Adresse e-mail</label>
            <input id="admin-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoComplete="username" required autoFocus className={inputClass} />
            <label htmlFor="admin-password" className="mt-5 mb-1.5 block text-xs font-medium tracking-widest text-ink-600 uppercase">Mot de passe</label>
            <input id="admin-password" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" required maxLength={128} className={inputClass} aria-describedby={error ? 'admin-login-error' : undefined} />
            {error && <p id="admin-login-error" role="alert" className="mt-4 text-sm leading-relaxed text-danger">{error}</p>}
            <button type="submit" disabled={loading || !email || !password} className="mt-6 w-full cursor-pointer btn-wine w-full disabled:cursor-wait">{loading ? 'Vérification…' : 'Se connecter'}</button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-ink-600">Accès réservé. Premier lancement : créez votre compte avec la commande <code>npm run admin:create</code> sur le serveur.</p>
        <a href="#/" className="mt-4 block text-center text-sm text-wine-700 hover:underline">Retour au site</a>
      </div>
    </div>
  );
}
