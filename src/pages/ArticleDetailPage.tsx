import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { useArticles, useCabinet, useExpertises, useT } from "@/i18n";
import { Link, useDocumentTitle } from "@/router";
import { Monogram } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { ArticleCard, CtaBand } from "@/components/Blocks";
import { ArrowRight, Check, ChevronRight, Clock, Copy, Facebook, LinkedIn, WhatsApp } from "@/components/Icons";
import { NotFoundPage } from "./NotFoundPage";

const slug = (i: number) => `section-${i + 1}`;

export function ArticleDetailPage({ id }: { id: string }) {
  const t = useT();
  const cabinet = useCabinet();
  const articles = useArticles();
  const expertises = useExpertises();
  const index = articles.findIndex((a) => a.id === id);
  const article = articles[index];
  useDocumentTitle(article?.title ?? t.articleDetail.notFound);

  const [activeSection, setActiveSection] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) return;
    const els = article.sections.map((_, i) => document.getElementById(slug(i))).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(Number(entry.target.id.replace("section-", "")) - 1);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [article]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!article) return <NotFoundPage />;

  const expertise = expertises.find((e) => e.id === article.expertiseId);
  const prev = index > 0 ? articles[index - 1] : null;
  const next = index < articles.length - 1 ? articles[index + 1] : null;
  const others = articles.filter((a) => a.id !== article.id).slice(0, 3);
  const url = `https://${cabinet.domain}/#/articles/${article.id}`;

  const scrollTo = (i: number) => {
    document.getElementById(slug(i))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* presse-papiers indisponible */
    }
    setCopied(true);
  };

  const share = [
    { label: "LinkedIn", Icon: LinkedIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: "Facebook", Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "WhatsApp", Icon: WhatsApp, href: `https://wa.me/?text=${encodeURIComponent(`${article.title} — ${url}`)}` },
  ];

  return (
    <>
      {/* En-tête */}
      <header className="relative overflow-hidden bg-wine-950 text-cream-100">
        <img src={article.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-950 via-wine-950/85 to-wine-950/55" aria-hidden="true" />
        <div className="container-x relative py-16 sm:py-24">
          <nav aria-label={t.articleDetail.breadcrumb} className="rise-in">
            <ol className="flex flex-wrap items-center gap-1.5 text-[12px] tracking-[0.08em] text-cream-200/60">
              <li><Link to="/" className="hover:text-gold-400">{t.articleDetail.home}</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-gold-500 rtl:rotate-180" /><Link to="/articles" className="hover:text-gold-400">{t.articleDetail.articles}</Link></li>
              <li className="flex items-center gap-1.5"><ChevronRight className="h-3 w-3 text-gold-500 rtl:rotate-180" /><span className="text-cream-100">{article.category}</span></li>
            </ol>
          </nav>
          <div className="mx-auto max-w-3xl text-center">
            <span className="rise-in mt-10 inline-block rounded-full border border-gold-400/50 px-4 py-1.5 text-[11px] font-medium tracking-[0.18em] text-gold-400 uppercase" style={{ ["--rise-delay" as string]: "80ms" }}>
              {article.category}
            </span>
            <h1 className="rise-in mt-6 font-serif text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.08] font-semibold text-cream-50" style={{ ["--rise-delay" as string]: "160ms" }}>
              {article.title}
            </h1>
            <div className="rise-in mt-8 flex flex-wrap items-center justify-center gap-5 text-[13px] text-cream-200/75" style={{ ["--rise-delay" as string]: "240ms" }}>
              <span className="flex items-center gap-3">
                <Monogram className="h-9 w-9 rounded" />
                <span className="text-left leading-tight rtl:text-right">
                  <span className="block font-medium text-cream-50">{cabinet.lawyer}</span>
                  <span className="block text-xs">{cabinet.role}</span>
                </span>
              </span>
              <span className="hidden h-8 w-px bg-cream-50/20 sm:block" />
              <span>{article.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {article.readTime} {t.articleDetail.readSuffix}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="py-16">
        <div className="container-x grid gap-12 lg:grid-cols-[220px_1fr_240px] xl:gap-16">
          {/* Sommaire */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-[11px] font-medium tracking-[0.24em] text-ink-400 uppercase">{t.articleDetail.toc}</p>
              <ol className="mt-4 space-y-1 border-l border-sand-300 rtl:border-r rtl:border-l-0">
                {article.sections.map((s, i) => (
                  <li key={s.heading}>
                    <button
                      type="button"
                      onClick={() => scrollTo(i)}
                      className={cn(
                        "-ml-px block w-full cursor-pointer border-l-2 py-2 pl-4 text-left text-[13.5px] leading-snug transition-colors rtl:mr-[-1px] rtl:ml-0 rtl:border-r-2 rtl:border-l-0 rtl:pr-4 rtl:pl-0 rtl:text-right",
                        activeSection === i ? "border-wine-600 font-medium text-wine-700" : "border-transparent text-ink-600 hover:text-wine-700"
                      )}
                    >
                      {s.heading}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Corps */}
          <article className="min-w-0">
            <div className="mx-auto max-w-[680px]">
              <p className="dropcap font-serif text-[22px] leading-[1.65] text-ink-900/90">{article.intro}</p>

              {article.sections.map((s, i) => (
                <section key={s.heading} id={slug(i)} className="mt-12 scroll-mt-28">
                  <h2 className="flex items-baseline gap-3 font-serif text-[30px] leading-tight font-semibold text-ink-900">
                    <span className="text-lg text-gold-500 italic">{String(i + 1).padStart(2, "0")}</span>
                    {s.heading}
                  </h2>
                  <div className="mt-5 space-y-5">
                    {s.paragraphs.map((p, j) => (
                      <p key={j} className="text-[16.5px] leading-[1.9] text-ink-900/80">{p}</p>
                    ))}
                  </div>
                </section>
              ))}

              <div className="mt-12 rounded-2xl border-l-4 border-gold-500 bg-cream-100 p-7 rtl:border-r-4 rtl:border-l-0">
                <p className="font-serif text-2xl font-semibold text-wine-700 italic">{t.articleDetail.remember}</p>
                <ul className="mt-4 space-y-3">
                  {article.keyPoints.map((k) => (
                    <li key={k} className="flex gap-3 text-[15px] leading-relaxed text-ink-900/85">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-success" /> {k}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-8 text-[13px] leading-relaxed text-ink-400 italic">
                {t.articleDetail.disclaimer}
              </p>

              {/* Auteur */}
              <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-sand-300 bg-cream-50 p-6 sm:flex-row sm:items-center">
                <Monogram className="h-16 w-16 shrink-0 rounded-md shadow-tile" />
                <div className="flex-1">
                  <p className="font-serif text-xl font-semibold text-ink-900">{cabinet.lawyer}</p>
                  <p className="text-sm text-ink-600">{cabinet.role} — {cabinet.specialty}</p>
                </div>
                {expertise && (
                  <Link to={`/expertises/${expertise.id}`} className="btn-outline shrink-0 px-5! py-2.5!">
                    {expertise.shortTitle}
                  </Link>
                )}
              </div>

              {/* Précédent / suivant */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {prev ? (
                  <Link to={`/articles/${prev.id}`} className="group rounded-2xl border border-sand-300 p-5 transition-all hover:border-wine-600/40 hover:shadow-tile">
                    <span className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-ink-400 uppercase">
                      <ArrowRight className="h-3.5 w-3.5 rotate-180 rtl:rotate-0" /> {t.articleDetail.prev}
                    </span>
                    <span className="mt-2 line-clamp-2 block font-serif text-lg leading-snug font-semibold text-ink-900 group-hover:text-wine-700">{prev.title}</span>
                  </Link>
                ) : <span />}
                {next && (
                  <Link to={`/articles/${next.id}`} className="group rounded-2xl border border-sand-300 p-5 text-right transition-all hover:border-wine-600/40 hover:shadow-tile rtl:text-left">
                    <span className="flex items-center justify-end gap-2 text-[11px] tracking-[0.18em] text-ink-400 uppercase rtl:justify-start">
                      {t.articleDetail.next} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </span>
                    <span className="mt-2 line-clamp-2 block font-serif text-lg leading-snug font-semibold text-ink-900 group-hover:text-wine-700">{next.title}</span>
                  </Link>
                )}
              </div>
            </div>
          </article>

          {/* Partage */}
          <aside>
            <div className="space-y-5 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-sand-300 bg-cream-50 p-5">
                <p className="text-[11px] font-medium tracking-[0.24em] text-ink-400 uppercase">{t.articleDetail.share}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {share.map(({ label, Icon, href }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={t.articleDetail.shareOn(label)} className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-300 text-wine-700 transition-all hover:-translate-y-0.5 hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50">
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={copy}
                    aria-label={t.articleDetail.copyLink}
                    className={cn(
                      "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all",
                      copied ? "border-success bg-success text-white" : "border-sand-300 text-wine-700 hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50"
                    )}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copied && <p className="panel-in mt-3 text-xs text-success">{t.articleDetail.copied}</p>}
              </div>
              <div className="rounded-2xl bg-wine-900 p-6 text-cream-50">
                <p className="font-serif text-[22px] leading-tight">{t.articleDetail.similar}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-200/75">{t.articleDetail.similarText}</p>
                <Link to={expertise ? `/contact?domaine=${expertise.id}` : "/contact"} className="btn-gold mt-5 w-full px-4!">
                  {t.articleDetail.consult}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Autres articles */}
      <section className="bg-cream-100 py-20">
        <div className="container-x">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-serif text-4xl font-semibold text-ink-900">{t.articleDetail.alsoTitleA} <em className="text-wine-600 italic">{t.articleDetail.alsoTitleB}</em></h2>
              <Link to="/articles" className="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.12em] text-wine-700 uppercase hover:text-wine-500">
                {t.articleDetail.allArticles} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {others.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={<>{t.articleDetail.ctaTitle}</>}
        text={t.articleDetail.ctaText}
      />
    </>
  );
}
