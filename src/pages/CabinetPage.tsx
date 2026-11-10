import { IMAGES } from "@/data/content";
import { Link, useDocumentTitle } from "@/router";
import { useAudiences, useCabinet, useT, useValues } from "@/i18n";
import { Reveal } from "@/components/Reveal";
import heroPortrait from "@/assets/chaima-bhiri.webp";
import { CtaBand, MethodSection, PageHeader, SectionHeading } from "@/components/Blocks";
import { ArrowRight, Check, Compass, Handshake, ICON_MAP, LinkedIn, MapPin, Quote, Shield } from "@/components/Icons";

const MOTTO_ICONS = [Compass, Shield, Handshake];

export function CabinetPage() {
  const t = useT();
  const cabinet = useCabinet();
  const values = useValues();
  const audiences = useAudiences();
  useDocumentTitle(t.cabinet.docTitle);

  return (
    <>
      <PageHeader
        eyebrow={t.cabinet.headerEyebrow}
        crumbs={[{ label: t.cabinet.headerCrumb }]}
        image={IMAGES.officeDetail}
        title={<>{t.cabinet.headerTitleA} <em className="text-gold-400 italic">{t.cabinet.headerTitleB}</em> {t.cabinet.headerTitleC} <em className="text-gold-400 italic">{t.cabinet.headerTitleD}</em></>}
        subtitle={`${cabinet.lawyer} — ${cabinet.role}. ${cabinet.specialty}.`}
      />

      {/* ——— Présentation ——— */}
      <section className="py-24">
        <div className="container-x grid items-start gap-16 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-5">
            <div className="relative mx-auto max-w-[430px] lg:sticky lg:top-28">
              <div className="absolute -top-4 -left-4 h-28 w-28 border-t-2 border-l-2 border-gold-500/70 rtl:right-4 rtl:left-auto rtl:border-r-2 rtl:border-l-0" aria-hidden="true" />
              <div className="absolute -right-4 -bottom-4 h-28 w-28 border-r-2 border-b-2 border-gold-500/70 rtl:right-auto rtl:-left-4 rtl:border-l-2 rtl:border-r-0" aria-hidden="true" />
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-sand-300 shadow-soft">
                <img
                  src={heroPortrait}
                  alt={t.cabinet.portraitAlt}
                  width={2240}
                  height={1120}
                  className="h-full w-full object-cover object-[82%_50%]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-0 rounded-lg outline-1 outline-offset-[-12px] outline-cream-50/25" aria-hidden="true" />
              </div>
              <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-cream-50/92 px-4 py-1.5 text-[11px] font-medium tracking-[0.16em] text-wine-700 uppercase backdrop-blur-sm rtl:right-5 rtl:left-auto">
                <MapPin className="h-3.5 w-3.5" /> {t.cabinet.location}
              </span>
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">{t.cabinet.eyebrow}</p>
              <h2 className="mt-5 font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-ink-900 sm:text-5xl">
                {t.cabinet.titleA} <em className="text-wine-600 italic">{t.cabinet.titleB}</em>
              </h2>
              <div className="mt-7 space-y-5 text-[16.5px] leading-[1.85] text-ink-600">
                <p className="dropcap">
                  {t.cabinet.p1a}{" "}
                  <strong className="font-medium text-ink-900">{t.cabinet.p1b}</strong> {t.cabinet.p1c}
                </p>
                <p>{t.cabinet.p2}</p>
                <p>{t.cabinet.p3}</p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                {t.cabinet.pillars.map((item) => (
                  <div key={item} className="rounded-xl border border-sand-300 bg-cream-100/70 p-4">
                    <Check className="h-5 w-5 text-gold-500" />
                    <p className="mt-2 text-[14px] leading-snug font-medium text-ink-900">{item}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={160}>
              <figure className="mt-10 rounded-lg bg-wine-700 p-8 text-cream-50 shadow-tile">
                <Quote className="h-8 w-8 text-gold-400" />
                <blockquote className="mt-3 font-serif text-[24px] leading-snug italic">
                  {t.cabinet.quote}
                </blockquote>
                <figcaption className="mt-5 border-t border-cream-50/20 pt-4 text-[12px] tracking-[0.2em] text-gold-400 uppercase">
                  {cabinet.lawyer}
                </figcaption>
              </figure>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/contact" className="btn-wine">
                  {t.cabinet.appointment} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <a href={cabinet.linkedin} target="_blank" rel="noreferrer" className="btn-outline">
                  <LinkedIn className="h-4 w-4" /> {t.cabinet.linkedin}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ——— Devise ——— */}
      <section className="bg-cream-100 py-24">
        <div className="container-x">
          <SectionHeading center eyebrow={t.cabinet.mottoEyebrow} title={<>{t.cabinet.mottoTitleA} <em className="text-wine-600 italic">{t.cabinet.mottoTitleB}</em></>} />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {t.cabinet.motto.map(({ verb, line, text }, i) => {
              const Icon = MOTTO_ICONS[i % MOTTO_ICONS.length];
              return (
                <Reveal key={verb} delay={i * 120} className="h-full">
                  <article className="group relative h-full overflow-hidden rounded-lg border border-sand-300 bg-white p-8 text-center transition-colors duration-200 hover:border-wine-600/40 hover:shadow-tile">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/50 text-wine-600 transition-all duration-500 group-hover:bg-wine-600 group-hover:text-cream-50">
                      <Icon className="h-7 w-7" />
                    </span>
                    <p className="mt-6 font-serif text-4xl font-semibold text-wine-600">{verb}</p>
                    <p className="mt-2 font-serif text-lg text-gold-600 italic">{line}</p>
                    <p className="mt-4 text-[14.5px] leading-relaxed text-ink-600">{text}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— Valeurs ——— */}
      <section className="py-24">
        <div className="container-x">
          <SectionHeading eyebrow={t.cabinet.valuesEyebrow} title={<>{t.cabinet.valuesTitleA} <em className="text-wine-600 italic">{t.cabinet.valuesTitleB}</em></>} />
          <div className="mt-12 divide-y divide-sand-300 border-y border-sand-300">
            {values.map((v, i) => (
              <Reveal key={v.word} delay={i * 80}>
                <div className="group grid items-center gap-4 py-9 md:grid-cols-[100px_300px_1fr] md:gap-10">
                  <span className="font-serif text-xl text-gold-500 italic">0{i + 1}</span>
                  <p className="font-serif text-5xl font-semibold text-ink-900 transition-colors duration-300 group-hover:text-wine-600">{v.word}</p>
                  <p className="max-w-2xl text-[15.5px] leading-relaxed text-ink-600">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Publics ——— */}
      <section className="bg-cream-100 py-24">
        <div className="container-x">
          <SectionHeading eyebrow={t.cabinet.audEyebrow} title={<>{t.cabinet.audTitleA} <em className="text-wine-600 italic">{t.cabinet.audTitleB}</em></>} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {audiences.map((a, i) => {
              const Icon = ICON_MAP[a.icon];
              return (
                <Reveal key={a.title} delay={i * 100} className="h-full">
                  <div className="h-full rounded-lg border border-sand-300 bg-white p-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-wine-600 text-cream-50">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 font-serif text-2xl font-semibold text-ink-900">{a.title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink-600">{a.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <MethodSection />
      <CtaBand
        title={<>{t.cabinet.ctaTitleA} <em className="text-sand-300 italic">{t.cabinet.ctaTitleB}</em></>}
        text={t.cabinet.ctaText}
      />
    </>
  );
}
