import { useState, useEffect, useCallback } from "react";
import { ARTICLES, type Article } from "@/data/content";

const LS_KEY = "cmcb-admin-articles";

function loadAdminArticles(): Article[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Article[];
  } catch {
    return [];
  }
}

function saveAdminArticles(articles: Article[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(articles));
    // Notify same-tab listeners (useArticles in i18n.tsx)
    window.dispatchEvent(new Event("cmcb-articles-updated"));
  } catch {
    /* ignore */
  }
}

export function useAdminArticles() {
  const [adminArticles, setAdminArticles] = useState<Article[]>(loadAdminArticles);

  // Keep in sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        setAdminArticles(loadAdminArticles());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Merged list: built-in first, then admin-created
  const allArticles = [...ARTICLES, ...adminArticles];

  const addArticle = useCallback((article: Article) => {
    setAdminArticles((prev) => {
      const updated = [...prev, article];
      saveAdminArticles(updated);
      return updated;
    });
  }, []);

  const updateArticle = useCallback((id: string, patch: Partial<Article>) => {
    setAdminArticles((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      saveAdminArticles(updated);
      return updated;
    });
  }, []);

  const deleteArticle = useCallback((id: string) => {
    setAdminArticles((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveAdminArticles(updated);
      return updated;
    });
  }, []);

  return { allArticles, adminArticles, addArticle, updateArticle, deleteArticle };
}
