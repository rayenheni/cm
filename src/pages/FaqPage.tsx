import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { useCabinet, useFaqCategories, useT } from "@/i18n";
import { Link, useDocumentTitle } from "@/router";
import { Reveal } from "@/components/Reveal";
import { CtaBand, FaqAccordion, PageHeader } from "@/components/Blocks";
import { ArrowRight, Phone, Search, WhatsApp } from "@/components/Icons";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

export function FaqPage() {
  const t = useT();
  const cabinet = useCabinet();
  const faqCategories = useFaqCategories();
  useDocumentTitle(t.faq.docTitle);
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    return faqCategories
      .filter((c) => active === "all" || c.id === active)
      .map((c) => ({ ...c, items: c.items.filter((f) => !q || normalize(f.q + " " + f.a).includes(q)) }))
      .filter((c) => c.items.length > 0);
  }, [faqCategories, active, query]);

  return (
    <>
      <PageHeader
        eyebrow={t.faq.headerEyebrow}
        crumbs={[{ label: t.faq.headerCrumb }]}
        title={<>{t.faq.headerTitleA} <em className="text-gold-400 italic">{t.faq.headerTitleB}</em></>}
        subtitle={t.faq.headerSub}
      >
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-5 h-4 w-4 -translate-y-1/2 text-cream-200/60 rtl:right-5 rtl:left-auto" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.faq.searchPh}
            aria-label={t.faq.searchLabel}
            className="w-full rounded-full border border-cream-50/20 bg-cream-50/10 py-3.5 pr-5 pl-12 text-[15px] text-cream-50 placeholder:text-cream-200/50 focus:border-gold-400 focus:bg-cream-50/15 focus:outline-none rtl:pr-12 rtl:pl-5"
          />
        </div>
      </PageHeader>

      <section className="py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
          <aside className="min-w-0">
            <div className="min-w-0 lg:sticky lg:top-28">
              <p className="hidden text-[11px] font-medium tracking-[0.24em] text-ink-400 uppercase lg:block">{t.faq.categories}</p>
              <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-2 lg:mt-4 lg:flex-col lg:overflow-visible">
                {[{ id: "all", label: t.faq.all }, ...faqCategories].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-xl px-4 py-3 text-left text-[14px] font-medium whitespace-nowrap transition-all rtl:text-right",
                      active === c.id ? "bg-wine-600 text-cream-50 shadow-tile" : "border border-sand-300 text-ink-600 hover:border-wine-600/50 hover:text-wine-700 lg:border-transparent"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="mt-8 hidden rounded-2xl bg-wine-900 p-6 text-cream-50 lg:block">
                <p className="font-serif text-[22px] leading-tight">{t.faq.otherQ}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-200/75">{t.faq.otherT}</p>
                <a href={cabinet.whatsappHref} target="_blank" rel="noreferrer" className="btn-gold mt-5 w-full px-4!">
                  <WhatsApp className="h-4 w-4" /> WhatsApp
                </a>
                <a href={cabinet.phoneHref} className="mt-3 flex items-center justify-center gap-2 text-sm text-cream-200/80 hover:text-gold-400">
                  <Phone className="h-4 w-4" /> <span dir="ltr">{cabinet.phone}</span>
                </a>
              </div>
            </div>
          </aside>

          <div key={`${active}-${query}`} className="panel-in min-w-0 space-y-14">
            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sand-400 py-16 text-center">
                <p className="font-serif text-3xl font-semibold text-ink-900">{t.faq.emptyTitle}</p>
                <p className="mt-2 text-ink-600">{t.faq.emptyText}</p>
                <Link to="/contact" className="btn-wine mt-6">{t.faq.emptyCta} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
              </div>
            ) : (
              groups.map((g) => (
                <Reveal key={g.id}>
                  <h2 className="mb-2 font-serif text-[30px] font-semibold text-ink-900">
                    {g.label} <span className="ml-1 text-base text-gold-500 italic rtl:mr-1 rtl:ml-0">({g.items.length})</span>
                  </h2>
                  <FaqAccordion items={g.items} defaultOpen={query ? 0 : -1} />
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>

      <CtaBand
        title={<>{t.faq.ctaTitle}</>}
        text={t.faq.ctaText}
      />
    </>
  );
}
