import { useCallback, useEffect, useState } from 'react';
import type { ArticleInput, StoredArticle } from '@/lib/api-types';
import { api, errorMessage } from '@/lib/api';

export function useAdminArticles() {
  const [articles, setArticles] = useState<StoredArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api<{ articles: StoredArticle[] }>('/admin/articles', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setArticles(data.articles); })
      .catch(err => { if (!controller.signal.aborted) setError(errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const saveArticle = useCallback(async (article: ArticleInput, editing: boolean) => {
    await api(`/admin/articles${editing ? `/${encodeURIComponent(article.id)}` : ''}`, { method: editing ? 'PUT' : 'POST', body: article });
    setRevision(v => v + 1);
    window.dispatchEvent(new Event('cmcb-articles-updated'));
  }, []);
  const deleteArticle = useCallback(async (id: string) => {
    await api(`/admin/articles/${encodeURIComponent(id)}`, { method: 'DELETE', body: {} });
    setRevision(v => v + 1);
    window.dispatchEvent(new Event('cmcb-articles-updated'));
  }, []);
  return { articles, loading, error, refresh, saveArticle, deleteArticle };
}
