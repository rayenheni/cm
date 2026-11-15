import { useCallback, useEffect, useState } from 'react';
import type { Article } from '@/data/content';
import { useLang } from '@/i18n';
import { api, errorMessage } from './api';
export function useArticleFeed() {
  const { lang } = useLang();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadedLang, setLoadedLang] = useState(lang);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api<{ articles: Article[] }>(`/articles?lang=${lang}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setArticles(data.articles); setLoadedLang(lang); } })
      .catch(err => { if (!controller.signal.aborted) { setError(lang === 'en' ? 'Unable to load articles. Please try again.' : errorMessage(err)); setArticles([]); setLoadedLang(lang); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [lang, revision]);
  useEffect(() => {
    const refreshIfVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('cmcb-articles-updated', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshIfVisible);
    const timer = window.setInterval(refreshIfVisible, 60000);
    return () => { window.removeEventListener('cmcb-articles-updated', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refreshIfVisible); window.clearInterval(timer); };
  }, [refresh]);
  return { articles: loadedLang === lang ? articles : [], loading: loading || loadedLang !== lang, error: loadedLang === lang ? error : '', refresh };
}
export function useArticles(): Article[] { return useArticleFeed().articles; }
