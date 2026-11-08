import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Article } from "@/data/content";
import { useCabinet, useCommitments, useSteps, useT } from "@/i18n";
import { Link } from "@/router";
import { Reveal } from "./Reveal";
import { ArrowRight, ChevronRight, Clock, ICON_MAP, Phone, Plus, WhatsApp } from "./Icons";

/* ─────────────── En-tête des pages intérieures ─────────────── */
interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  crumbs,
  image,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  crumbs: Crumb[];
  image?: string;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <section className="relative overflow-hidden bg-wine-950 text-cream-100">
      {image && (
        <img src={image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(100deg, rgb(36 7 14 / 0.96) 25%, rgb(36 7 14 / 0.7) 70%, rgb(36 7 14 / 0.5)), radial-gradient(40rem 26rem at 90% 0%, rgb(160 128 90 / 0.25), transparent 60%)",
        }}
      />
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" aria-hidden="true" />

      <div className="container-x relative py-16 sm:py-20 lg:py-24">
        <nav aria-label={t.blocks.breadcrumb} className="rise-in">
          <ol className="flex flex-wrap items-center gap-1.5 text-[12px] tracking-[0.08em] text-cream-200/60">
            <li>
              <Link to="/" className="transition-colors hover:text-gold-400">{t.blocks.home}</Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-gold-500 rtl:rotate-180" />
                {crumb.to ? (
                  <Link to={crumb.to} className="transition-colors hover:text-gold-400">{crumb.label}</Link>
                ) : (
                  <span className="text-cream-100" aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <p className="rise-in mt-8 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold-400 uppercase" style={{ ["--rise-delay" as string]: "80ms" }}>
          <span className="h-px w-10 bg-gold-500" /> {eyebrow}
        </p>
        <h1 className="rise-in mt-5 max-w-4xl font-serif text-[clamp(2.3rem,5vw,4rem)] leading-[1.06] font-semibold tracking-tight text-cream-50" style={{ ["--rise-delay" as string]: "160ms" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="rise-in mt-6 max-w-2xl text-[16.5px] leading-relaxed text-cream-200/80" style={{ ["--rise-delay" as string]: "240ms" }}>
            {subtitle}
          </p>
        )}
        {children && (
          <div className="rise-in mt-8" style={{ ["--rise-delay" as string]: "320ms" }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────── Titre de section ─────────────── */
export function SectionHeading({
  eyebrow,
  title,
  text,
  center = false,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  text?: ReactNode;
  center?: boolean;
  action?: ReactNode;
}) {
  return (
    <Reveal>
      <div className={cn("flex flex-wrap items-end justify-between gap-6", center && "justify-center text-center")}>
        <div className={cn("max-w-2xl", center && "mx-auto")}>
          <p className={cn("eyebrow", center && "justify-center")}>{eyebrow}</p>
          <h2 className="mt-5 font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-ink-900 sm:text-5xl">{title}</h2>
          {text && <p className="mt-5 text-[16px] leading-relaxed text-ink-600">{text}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Reveal>
  );
}

/* ─────────────── Carte article ─────────────── */
export function ArticleCard({ article, index = 0, featured = false }: { article: Article; index?: number; featured?: boolean }) {
  const t = useT();
  return (
    <Reveal delay={index * 90} className="h-full">
      <Link
        to={`/articles/${article.id}`}
        className={cn(
          "group flex h-full overflow-hidden rounded-2xl border border-sand-300 bg-cream-50 transition-all duration-500 hover:-translate-y-1.5 hover:border-wine-600/40 hover:shadow-soft",
          featured ? "flex-col lg:flex-row" : "flex-col"
        )}
      >
        <span className={cn("relative block shrink-0 overflow-hidden", featured ? "h-60 lg:h-auto lg:w-[52%]" : "h-48")}>
          <img
            src={article.image}
            alt={article.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-wine-950/40 to-transparent" />
          <span className="absolute top-4 left-4 rounded-full bg-cream-50/95 px-3 py-1 text-[10px] font-medium tracking-[0.14em] text-wine-700 uppercase backdrop-blur-sm rtl:right-4 rtl:left-auto">
            {article.category}
          </span>
        </span>
        <span className={cn("flex flex-1 flex-col", featured ? "p-8 lg:p-10" : "p-6")}>
          <span className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-ink-400 uppercase">
            {article.date} <span className="text-gold-500">·</span>
            <Clock className="h-3 w-3" /> {article.readTime}
          </span>
          <span
            className={cn(
              "mt-3 font-serif leading-snug font-semibold text-ink-900 transition-colors group-hover:text-wine-700",
              featured ? "text-[30px] lg:text-[34px]" : "line-clamp-3 text-[21px]"
            )}
          >
            {article.title}
          </span>
          <span className={cn("mt-3 text-[14px] leading-relaxed text-ink-600", !featured && "line-clamp-3")}>{article.excerpt}</span>
          <span className="mt-auto inline-flex items-center gap-2 pt-6 text-[12px] font-medium tracking-[0.16em] text-wine-700 uppercase">
            {t.blocks.readArticle}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 rtl:rotate-180 rtl:group-hover:-translate-x-1.5" />
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

/* ─────────────── Accordéon FAQ ─────────────── */
export function FaqAccordion({ items, defaultOpen = 0 }: { items: { q: string; a: string }[]; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-sand-300">
      {items.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.q} className="border-b border-sand-300">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left rtl:text-right"
            >
              <span className="flex min-w-0 flex-1 items-baseline gap-4">
                <span className="font-serif text-lg text-gold-500 italic">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={cn(
                    "min-w-0 font-serif text-[20px] leading-snug font-semibold transition-colors sm:text-[22px]",
                    isOpen ? "text-wine-700" : "text-ink-900 group-hover:text-wine-700"
                  )}
                >
                  {faq.q}
                </span>
              </span>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  isOpen ? "rotate-45 border-wine-600 bg-wine-600 text-cream-50" : "border-sand-400 text-wine-700 group-hover:border-wine-600"
                )}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-500 ease-in-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="max-w-3xl pb-7 pl-9 text-[15px] leading-[1.8] text-ink-600 sm:pl-10 rtl:pr-9 rtl:pl-0 rtl:sm:pr-10">{faq.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────── Section méthode (fond bordeaux) ─────────────── */
export function MethodSection({ withCommitments = true }: { withCommitments?: boolean }) {
  const t = useT();
  const steps = useSteps();
  const commitments = useCommitments();
  return (
    <section className="relative overflow-hidden bg-wine-950 py-24 text-cream-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50rem 34rem at 12% 0%, rgb(160 128 90 / 0.16), transparent 58%), radial-gradient(46rem 32rem at 95% 90%, rgb(124 31 46 / 0.4), transparent 60%)",
          }}
        />
        <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
      </div>

      <div className="container-x relative">
        <Reveal className="text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold-400 uppercase">
            <span className="h-px w-10 bg-gold-500" /> {t.blocks.methodEyebrow} <span className="h-px w-10 bg-gold-500" />
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-cream-50 sm:text-5xl">
            {t.blocks.methodTitleA} <em className="text-gold-400 italic">{t.blocks.methodTitleB}</em>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-cream-200/75">
            {t.blocks.methodSub}
          </p>
        </Reveal>

        <div className="relative mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="absolute top-[52px] right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-gold-500/0 via-gold-500/40 to-gold-500/0 xl:block" aria-hidden="true" />
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <article className="group relative h-full rounded-2xl border border-cream-50/10 bg-wine-950/60 p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-400/40 hover:bg-cream-50/[0.06]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/50 bg-wine-950 font-serif text-lg font-semibold text-gold-400 italic transition-colors duration-500 group-hover:bg-gold-500 group-hover:text-wine-950">
                  {step.num}
                </span>
                <h3 className="mt-6 font-serif text-2xl font-semibold text-cream-50">{step.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-cream-200/70">{step.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        {withCommitments && (
          <div className="mt-16 grid gap-8 border-t border-cream-50/10 pt-12 sm:grid-cols-2 xl:grid-cols-4">
            {commitments.map((c, i) => {
              const Icon = ICON_MAP[c.icon];
              return (
                <Reveal key={c.title} delay={i * 100}>
                  <div className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-400/40 text-gold-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-medium text-cream-50">{c.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-cream-200/60">{c.text}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────── Bandeau d'appel à l'action ─────────────── */
export function CtaBand({ title, text }: { title?: ReactNode; text?: ReactNode }) {
  const t = useT();
  const cabinet = useCabinet();
  return (
    <section className="py-20">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-wine-600 px-7 py-14 text-cream-50 shadow-soft sm:px-14 lg:py-16">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(30rem 20rem at 100% 0%, rgb(160 128 90 / 0.45), transparent 60%), radial-gradient(28rem 18rem at 0% 100%, rgb(36 7 14 / 0.55), transparent 60%)",
              }}
            />
            <span className="pointer-events-none absolute -right-4 -bottom-16 font-serif text-[13rem] leading-none text-cream-50/10 select-none rtl:right-auto rtl:-left-4" aria-hidden="true">
              §
            </span>
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-[11px] font-medium tracking-[0.32em] text-gold-400 uppercase">{t.blocks.ctaEyebrow}</p>
                <h2 className="mt-4 font-serif text-3xl leading-[1.1] font-semibold sm:text-[44px]">
                  {title ?? <>{t.blocks.ctaDefaultTitleA} <em className="text-sand-300 italic">{t.blocks.ctaDefaultTitleB}</em></>}
                </h2>
                <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-cream-100/80">
                  {text ?? t.blocks.ctaDefaultText}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link to="/contact" className="btn flex-1 bg-cream-50 text-wine-700 shadow-tile hover:bg-gold-400 hover:text-wine-950 active:scale-[0.98]">
                  {t.blocks.appointment} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <div className="flex flex-1 gap-3">
                  <a href={cabinet.whatsappHref} target="_blank" rel="noreferrer" className="btn-cream flex-1 px-4!">
                    <WhatsApp className="h-4 w-4" /> {t.blocks.whatsapp}
                  </a>
                  <a href={cabinet.phoneHref} className="btn-cream flex-1 px-4!">
                    <Phone className="h-4 w-4" /> {t.blocks.call}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
