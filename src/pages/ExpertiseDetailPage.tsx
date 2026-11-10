import { useArticles } from "@/lib/useArticles";
import { Link, useDocumentTitle } from "@/router";
import { useCabinet, useExpertises, useT } from "@/i18n";
import { cn } from "@/utils/cn";
import { Reveal } from "@/components/Reveal";
import { ArticleCard, CtaBand, FaqAccordion, PageHeader } from "@/components/Blocks";
import { ArrowRight, Phone, WhatsApp } from "@/components/Icons";
import { NotFoundPage } from "./NotFoundPage";

function Block({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-4 font-serif text-[32px] leading-[1.1] font-semibold text-ink-900 sm:text-[38px]">{title}</h2>
        <div className="mt-7">{children}</div>
      </Reveal>
    </section>
  );
}

export function ExpertiseDetailPage({ id }: { id: string }) {
  const t = useT();
  const cabinet = useCabinet();
  const expertises = useExpertises();
  const articles = useArticles();
  const index = expertises.findIndex((e) => e.id === id);
  const exp = expertises[index];
  useDocumentTitle(exp?.shortTitle ?? t.expDetail.notFound);
  if (!exp) return <NotFoundPage />;

  const prev = expertises[(index - 1 + expertises.length) % expertises.length];
  const next = expertises[(index + 1) % expertises.length];
  const related = articles.filter((a) => a.expertiseId === exp.id);

  return (
    <>
      <PageHeader
        eyebrow={t.expDetail.domain(exp.num)}
        crumbs={[{ label: t.expDetail.expertisesCrumb, to: "/expertises" }, { label: exp.shortTitle }]}
        image={exp.image}
        title={exp.title}
        subtitle={exp.short}
      >
        <div className="flex flex-wrap gap-3">
          <Link to={`/contact?domaine=${exp.id}`} className="btn-gold">
            {t.expDetail.consult} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <a href={cabinet.phoneHref} className="btn-cream">
            <Phone className="h-4 w-4" /> <span dir="ltr">{cabinet.phone}</span>
          </a>
        </div>
      </PageHeader>

      <div className="py-16 lg:py-20">
        <div className="container-x grid gap-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-20">
          <div className="min-w-0 space-y-20">
            <Reveal>
              <div className="border-l-2 border-gold-500 pl-6 sm:pl-8 rtl:border-r-2 rtl:border-l-0 rtl:pr-6 rtl:pl-0 sm:rtl:pr-8">
                <p className="text-[11px] font-medium tracking-[0.18em] text-gold-600 uppercase">{t.expDetail.approachTitle}</p>
                <p className="mt-3 max-w-[56ch] font-serif text-[22px] leading-[1.5] text-ink-900 sm:text-[25px]">{exp.intro}</p>
              </div>
            </Reveal>

            <Block id="prestations" eyebrow={t.expDetail.servicesEyebrow} title={t.expDetail.servicesTitle}>
              <div className="border-t border-sand-300">
                {exp.services.map((s, i) => (
                  <article key={s.title} className="grid gap-3 border-b border-sand-300 py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-5">
                    <span className="font-serif text-xl text-gold-600 italic">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-serif text-[24px] leading-tight font-semibold text-ink-900">{s.title}</h3>
                      <p className="mt-2 max-w-[62ch] text-[15px] leading-[1.75] text-ink-600">{s.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </Block>

            <Block id="situations" eyebrow={t.expDetail.situationsEyebrow} title={t.expDetail.situationsTitle}>
              <ul className="border-t border-sand-300">
                {exp.situations.map((s) => (
                  <li key={s} className="flex items-start gap-4 border-b border-sand-300 py-4 text-[15px] leading-relaxed text-ink-900/85">
                    <span className="mt-3 block h-px w-4 shrink-0 bg-gold-500" aria-hidden="true" />{s}
                  </li>
                ))}
              </ul>
            </Block>

            <Block id="demarche" eyebrow={t.expDetail.approachEyebrow} title={t.expDetail.approachSectionTitle}>
              <ol className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {exp.approach.map((step, i) => (
                  <li key={step.title} className="border-t border-gold-500/60 pt-4">
                    <span className="font-serif text-lg text-gold-600 italic">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-1 font-serif text-[22px] font-semibold text-ink-900">{step.title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink-600">{step.text}</p>
                  </li>
                ))}
              </ol>
            </Block>

            <Block id="documents" eyebrow={t.expDetail.docsEyebrow} title={t.expDetail.docsTitle}>
              <div className="border-t border-sand-300 pt-5">
                <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {exp.documents.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-ink-900/85">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-500" aria-hidden="true" /> {d}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[13px] text-ink-600 italic">{t.expDetail.docsNote}</p>
              </div>
            </Block>

            <Block id="faq" eyebrow={t.expDetail.faqEyebrow} title={t.expDetail.faqTitle}>
              <FaqAccordion items={exp.faqs} />
            </Block>

            {related.length > 0 && (
              <Block id="articles" eyebrow={t.expDetail.articlesEyebrow} title={t.expDetail.articlesTitle}>
                <div className="grid gap-6">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} featured />
                  ))}
                </div>
              </Block>
            )}
          </div>

          {/* Barre latérale */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border-t-2 border-wine-600 pt-6">
              <p className="text-[11px] font-medium tracking-[0.2em] text-gold-600 uppercase">{t.expDetail.sideEyebrow}</p>
              <p className="mt-3 font-serif text-[27px] leading-tight text-ink-900">{t.expDetail.sideTitle(exp.shortTitle)}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{t.expDetail.sideText}</p>
              <Link to={`/contact?domaine=${exp.id}`} className="btn-wine mt-6 w-full">
                {t.expDetail.sideCta} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <a href={cabinet.whatsappHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-wine-700 underline decoration-gold-500/60 underline-offset-4 transition-colors hover:text-wine-500">
                <WhatsApp className="h-4 w-4" /> {t.expDetail.sideWa}
              </a>
            </div>

            <nav className="mt-10" aria-label={t.expDetail.sideNavLabel}>
              <p className="pb-3 text-[11px] font-medium tracking-[0.2em] text-ink-600 uppercase">{t.expDetail.sideNavTitle}</p>
              <div className="border-t border-sand-300">
                {expertises.map((e) => (
                  <Link
                    key={e.id}
                    to={`/expertises/${e.id}`}
                    aria-current={e.id === exp.id ? "page" : undefined}
                    className={cn(
                      "flex items-baseline gap-3 border-b border-sand-300 py-3 text-[14px] transition-colors hover:text-wine-700",
                      e.id === exp.id ? "font-medium text-wine-700" : "text-ink-600"
                    )}
                  >
                    <span className="font-serif text-lg text-gold-600 italic">{e.num}</span>
                    {e.shortTitle}
                  </Link>
                ))}
              </div>
            </nav>
          </aside>
        </div>

        {/* Précédent / suivant */}
        <div className="container-x mt-20">
          <div className="grid gap-6 border-t border-sand-300 pt-8 sm:grid-cols-2">
            <Link to={`/expertises/${prev.id}`} className="group">
              <span className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-ink-400 uppercase">
                <ArrowRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-1 rtl:rotate-0 rtl:group-hover:translate-x-1" /> {t.expDetail.prev}
              </span>
              <span className="mt-2 block font-serif text-2xl font-semibold text-ink-900 group-hover:text-wine-700">{prev.shortTitle}</span>
            </Link>
            <Link to={`/expertises/${next.id}`} className="group sm:text-right">
              <span className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-ink-400 uppercase sm:justify-end">
                {t.expDetail.next} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </span>
              <span className="mt-2 block font-serif text-2xl font-semibold text-ink-900 group-hover:text-wine-700">{next.shortTitle}</span>
            </Link>
          </div>
        </div>
      </div>

      <CtaBand
        title={<>{t.expDetail.ctaTitle(exp.shortTitle)}</>}
        text={t.expDetail.ctaText}
      />
    </>
  );
}
