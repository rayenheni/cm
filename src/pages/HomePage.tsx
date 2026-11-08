import { Link, useDocumentTitle } from "@/router";
import { useAllFaqs, useArticles, useCabinet, useCabinetAr, useLang, useT } from "@/i18n";
import { IMAGES } from "@/data/content";
import { Hero } from "@/components/Hero";
import { PracticeExplorer } from "@/components/PracticeExplorer";
import { Reveal } from "@/components/Reveal";
import { ArticleCard, CtaBand, FaqAccordion, MethodSection, SectionHeading } from "@/components/Blocks";
import { ArrowRight, Compass, Handshake, Shield } from "@/components/Icons";

const PILLAR_ICONS = [Compass, Handshake, Shield];

export function HomePage() {
  const t = useT();
  const { lang } = useLang();
  const cabinet = useCabinet();
  const cabinetAr = useCabinetAr();
  const articles = useArticles();
  const allFaqs = useAllFaqs();
  useDocumentTitle();
  const [featured, ...others] = articles;
  const signature = lang === "ar" ? cabinetAr.lawyerShort : "Chaima Bhiri";

  return (
    <>
      <Hero />

      {/* ——— Le cabinet en bref ——— */}
      <section className="relative overflow-hidden py-24">
        <div className="container-x grid items-center gap-16 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <figure className="max-w-[590px]">
              <div className="overflow-hidden rounded-[8px] bg-wine-950">
                <img
                  src={IMAGES.library}
                  alt={t.home.libraryAlt}
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <figcaption className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-5 border-t border-sand-300 pt-5 sm:gap-8">
                <span className="font-serif text-[56px] leading-[0.8] font-medium text-wine-700 sm:text-[68px]">05</span>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.18em] text-gold-600 uppercase">{t.home.domainsLabel}</p>
                  <blockquote className="mt-2 font-serif text-[22px] leading-[1.15] text-ink-900 italic sm:text-[25px]">
                    {t.home.quote}
                  </blockquote>
                  <p className="mt-2 text-[11px] tracking-[0.14em] text-ink-600 uppercase">{t.home.quoteAuthor}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>

          <div>
            <SectionHeading
              eyebrow={t.home.cabinetEyebrow}
              title={<>{t.home.cabinetTitleA} <em className="text-wine-600 italic">{t.home.cabinetTitleB}</em></>}
              text={
                <>
                  {t.home.cabinetTextA} <strong className="font-medium text-ink-900">{t.home.cabinetTextB}</strong>{" "}
                  {t.home.cabinetTextC}
                </>
              }
            />
            <Reveal delay={120}>
              <ul className="mt-8 space-y-3">
                {t.home.pillars.map((title, i) => {
                  const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
                  return (
                    <li key={title} className="flex items-center gap-4 rounded-xl border border-sand-300/80 bg-cream-100/60 px-4 py-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wine-600 text-cream-50">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-serif text-[19px] font-semibold text-ink-900">{title}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/cabinet" className="btn-wine">
                  {t.home.discoverCabinet} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <span className="font-serif text-2xl text-gold-600 italic">{signature}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="practice-section" aria-labelledby="home-practices-title">
        <div className="container-x">
          <Reveal>
            <div className="practice-section__heading">
              <div>
                <p className="eyebrow">{t.home.practiceEyebrow}</p>
                <h2 id="home-practices-title">{t.home.practiceTitleA} <em>{t.home.practiceTitleB}</em></h2>
              </div>
              <div className="practice-section__intro">
                <p>{t.home.practiceText}</p>
                <Link to="/expertises" className="practice-section__all">
                  {t.home.practiceAll} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
          <PracticeExplorer />
        </div>
      </section>

      <MethodSection />

      {/* ——— Articles ——— */}
      <section className="py-24">
        <div className="container-x">
          <SectionHeading
            eyebrow={t.home.articlesEyebrow}
            title={<>{t.home.articlesTitleA} <em className="text-wine-600 italic">{t.home.articlesTitleB}</em></>}
            text={t.home.articlesText}
            action={
              <Link to="/articles" className="btn-outline">
                {t.home.articlesAll} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            }
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <ArticleCard article={featured} featured />
            </div>
            {others.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section className="bg-cream-100 py-24">
        <div className="container-x grid gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow={t.home.faqEyebrow} title={<>{t.home.faqTitleA} <em className="text-wine-600 italic">{t.home.faqTitleB}</em></>} />
            <Reveal delay={100}>
              <p className="mt-5 text-[15.5px] leading-relaxed text-ink-600">
                {t.home.faqText}
              </p>
              <Link to="/faq" className="btn-outline mt-8">
                {t.home.faqAll} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <p className="mt-8 text-sm text-ink-600">
                {t.home.urgent}{" "}
                <a href={cabinet.phoneHref} className="font-medium text-wine-700 underline decoration-gold-500/60 underline-offset-4">
                  <span dir="ltr" className="inline-block">{cabinet.phone}</span>
                </a>
              </p>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <FaqAccordion items={[allFaqs[0], allFaqs[3], allFaqs[6], allFaqs[9]]} />
          </Reveal>
        </div>
      </section>

      <CtaBand
        title={<>{t.home.ctaTitleA} <em className="text-sand-300 italic">{t.home.ctaTitleB}</em></>}
        text={t.home.ctaText}
      />
    </>
  );
}
