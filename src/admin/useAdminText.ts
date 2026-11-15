import { useLang } from '@/i18n';
import { ApiError, errorMessage } from '@/lib/api';

/** Admin has historically used French for Arabic as well; English is optional. */
export function useAdminText() {
  const { lang } = useLang();
  return (fr: string, en: string) => lang === 'en' ? en : fr;
}

export function adminError(error: unknown): string {
  if (document.documentElement.lang !== 'en') return errorMessage(error);
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      NETWORK_ERROR: 'The server is unavailable. Check your connection and try again.',
      INVALID_CREDENTIALS: 'Incorrect email address or password.',
      INVALID_PASSWORD: 'The current password is incorrect.',
      VALIDATION_ERROR: 'Please check the submitted fields.',
      RATE_LIMITED: 'Too many attempts. Please try again later.',
      DUPLICATE_SLUG: 'An article with this identifier already exists.',
      SMTP_DISABLED: 'Email notifications are not configured.',
      NOT_FOUND: 'The requested item was not found.',
      CSRF_REJECTED: 'Your session could not be verified. Please sign in again.',
    };
    return messages[error.code] ?? 'The request could not be completed. Please try again.';
  }
  return 'The request could not be completed. Please try again.';
}
