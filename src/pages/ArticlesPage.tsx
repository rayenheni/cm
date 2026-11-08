import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { useArticles, useCabinet, useT } from "@/i18n";
import { useDocumentTitle } from "@/router";
import { Reveal } from "@/components/Reveal";
import { ArticleCard, CtaBand, PageHeader } from "@/components/Blocks";
import { Close, LinkedIn, Search } from "@/components/Icons";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

export function ArticlesPage() {
  const t = useT();
  const cabinet = useCabinet();
  const articles = useArticles();
  useDocumentTitle(t.articles.docTitle);
  const [category, setCategory] = useState(t.articles.all);
  const [query, setQuery] = useState("");

  const allLabel = t.articles.all;
  const categories = [allLabel, ...Array.from(new Set(articles.map((a) => a.category)))];
  const activeCategory = categories.includes(category) ? category : allLabel;

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return articles.filter((a) => {
      if (activeCategory !== allLabel && a.category !== activeCategory) return false;
      if (!q) return true;
      return normalize(`${a.title} ${a.excerpt} ${a.category}`).includes(q);
    });
  }, [articles, activeCategory, allLabel, query]);

  const filtered = activeCategory !== allLabel || query.trim() !== "";

  return (
    <>
      <PageHeader
        eyebrow={t.articles.headerEyebrow}
        crumbs={[{ label: t.articles.headerCrumb }]}
        image={articles[0]?.image}
        title={<>{t.articles.headerTitleA} <em className="text-gold-400 italic">{t.articles.headerTitleB}</em></>}
        subtitle={t.articles.headerSub}
      >
        <a href={cabinet.linkedin} target="_blank" rel="noreferrer" className="btn-cream">
          <LinkedIn className="h-4 w-4" /> {t.articles.follow}
        </a>
      </PageHeader>

      <section className="py-20">
        <div className="container-x">
          <Reveal>
            <div className="flex flex-col gap-5 rounded-2xl border border-sand-300 bg-cream-100/70 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.articles.categoriesLabel}>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200",
                      activeCategory === c ? "bg-wine-600 text-cream-50 shadow-tile" : "text-ink-600 hover:bg-cream-50 hover:text-wine-700"
                    )}
                  >
                    {c}
                    <span className={cn("ml-2 text-[11px] rtl:mr-2 rtl:ml-0", activeCategory === c ? "text-gold-400" : "text-ink-400")}>
                      {c === allLabel ? articles.length : articles.filter((a) => a.category === c).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative lg:w-80">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400 rtl:right-4 rtl:left-auto" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.articles.searchPh}
                  aria-label={t.articles.searchLabel}
                  className="field rounded-full! bg-cream-50! pl-11 rtl:pr-11 rtl:pl-4"
                />
              </div>
            </div>
          </Reveal>

          {filtered && (
            <p className="mt-6 text-sm text-ink-600">
              {t.articles.found(results.length)}
            </p>
          )}

          {results.length === 0 ? (
            <div className="panel-in mt-10 rounded-2xl border border-dashed border-sand-400 py-16 text-center">
              <p className="font-serif text-3xl font-semibold text-ink-900">{t.articles.emptyTitle}</p>
              <p className="mt-2 text-ink-600">{t.articles.emptyText}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory(allLabel);
                }}
                className="btn-outline mt-6"
              >
                <Close className="h-4 w-4" /> {t.articles.reset}
              </button>
            </div>
          ) : (
            <div key={`${activeCategory}-${query}`} className="mt-10 grid gap-6 md:grid-cols-2">
              {results.map((a, i) => (
                <div key={a.id} className={cn(!filtered && i === 0 && "md:col-span-2")}>
                  <ArticleCard article={a} index={i} featured={!filtered && i === 0} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title={<>{t.articles.ctaTitleA} <em className="text-sand-300 italic">{t.articles.ctaTitleB}</em></>}
        text={t.articles.ctaText}
      />
    </>
  );
}
