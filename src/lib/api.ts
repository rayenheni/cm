import type { ApiErrorBody } from './api-types';
export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public fields?: Record<string, string>) { super(message); }
}
let csrfToken: string | null = null;
let sessionToken: string | null = null;
export function setSessionToken(token: string | null): void { sessionToken = token; }
export function clearSession(): void { csrfToken = null; sessionToken = null; }
export function isEmbeddedPreview(): boolean { try { return window.self !== window.top; } catch { return true; } }
export function setCsrfToken(token: string | null): void { csrfToken = token; }
export async function api<T>(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal } = {}): Promise<T> {
  const method = options.method ?? 'GET';
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin', cache: 'no-store', signal: options.signal,
      headers: { ...(sessionToken ? { Authorization: `Bearer ${sessionToken}`, 'X-CMCB-Session': sessionToken } : {}), ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}), ...options.headers },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Le serveur est indisponible. Vérifiez votre connexion et réessayez.', 0, 'NETWORK_ERROR');
  }
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    if (response.status === 401 && path !== '/auth/login') { clearSession(); window.dispatchEvent(new Event('cmcb-session-expired')); }
    throw new ApiError(error?.message ?? 'La demande a échoué. Veuillez réessayer.', response.status, error?.code ?? 'REQUEST_FAILED', error?.fields);
  }
  return body as T;
}
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Une erreur est survenue.'; }
