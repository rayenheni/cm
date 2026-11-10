import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { useCabinet, useT } from "@/i18n";
import { Link } from "@/router";
import { ArrowRight } from "./Icons";
import heroPortrait from "@/assets/chaima-bhiri.webp";

const DURATION = 6000;

const TONES = ["text-gold-600", "text-wine-600", "text-gold-600"];

/** Une promesse à la fois : révélation douce, ligne par ligne. */
function Phrase({
  lead,
  tail,
  tone,
  leaving = false,
}: {
  lead: string;
  tail: string;
  tone: string;
  leaving?: boolean;
}) {
  return (
    <span aria-hidden="true" className={cn("hero-promise", leaving && "hero-promise--leaving")}>
      <span className="hero-promise-line text-ink-900">{lead}</span>
      <em className={cn("hero-promise-line hero-promise-line--tail font-medium italic", tone)}>{tail}</em>
    </span>
  );
}

export function Hero() {
  const t = useT();
  const cabinet = useCabinet();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setIndex(0);
    setLeaving(null);
  }, [t.hero.srOnly]);

  useEffect(() => {
    if (reduced || paused) return;
    const total = t.hero.phrases.length;
    const timer = window.setTimeout(() => {
      setLeaving(index);
      setIndex((index + 1) % total);
    }, DURATION);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduced, t.hero.phrases.length]);

  useEffect(() => {
    if (leaving === null) return;
    const timer = window.setTimeout(() => setLeaving(null), 600);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  const current = t.hero.phrases[index] ?? t.hero.phrases[0];
  const leavingPhrase = leaving !== null ? t.hero.phrases[leaving] : null;

  return (
    <section id="accueil" className="relative overflow-hidden">
      <div className="relative">
        {/* Fond : maille chaude, grain papier, filet vertical (côté texte) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #faf6ec 0%, #f5eedf 100%)",
            }}
          />
          <div className="absolute top-0 bottom-0 left-[8%] hidden w-px bg-wine-600/[0.06] lg:block rtl:right-[8%] rtl:left-auto" />
        </div>

        <div className="relative grid lg:min-h-[664px] lg:grid-cols-[54%_46%]">
          {/* ——— Colonne photo plein cadre ——— */}
          <div className="relative h-[440px] w-full sm:h-[540px] lg:order-last lg:h-auto">
            {/* Photo plein cadre */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={heroPortrait}
                alt={t.hero.portraitAlt}
                width={2240}
                height={1120}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[84%_50%] sm:object-[100%_50%] lg:object-[78%_50%] 2xl:object-[84%_50%]"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-gold-400/60 to-transparent lg:block rtl:right-0 rtl:left-auto" aria-hidden="true" />
            </div>

            {/* Étiquette verticale à la jointure (non recadrée) */}
            <span className="absolute top-1/2 left-0 hidden -translate-x-1/2 -translate-y-1/2 rotate-180 text-[10px] font-medium tracking-[0.34em] text-ink-400 uppercase [writing-mode:vertical-rl] lg:block rtl:right-0 rtl:left-auto rtl:translate-x-1/2">
              {t.hero.vertical}
            </span>

          </div>

          {/* ——— Colonne texte ——— */}
          <div className="relative z-10 min-w-0 px-5 py-14 sm:px-8 lg:py-24 lg:pr-14 lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] rtl:lg:pr-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] rtl:lg:pl-14">
            <div className="max-w-xl min-w-0">
              <p className="rise-in eyebrow" style={{ ["--rise-delay" as string]: "0ms" }}>
                {cabinet.lawyer} · {cabinet.role}
              </p>

              <div
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocusCapture={() => setPaused(true)}
                onBlurCapture={() => setPaused(false)}
              >
                <h1
                  className={cn(
                    "hero-title mt-8 font-serif text-[clamp(2rem,5vw,4.25rem)] leading-[1.1] font-semibold tracking-tight",
                    reduced && "hero-title--static"
                  )}
                  style={{ ["--hero-play-state" as string]: paused ? "paused" : "running" }}
                >
                  <span className="sr-only">{t.hero.srOnly}</span>
                  {reduced ? (
                    t.hero.phrases.map((p, i) => (
                      <span key={p.label} aria-hidden="true" className="hero-promise">
                        <span className="hero-promise-line text-ink-900">{p.lead}</span>
                        <em className={cn("hero-promise-line hero-promise-line--tail font-medium italic", TONES[i % TONES.length])}>
                          {p.tail}
                        </em>
                      </span>
                    ))
                  ) : (
                    <>
                      {leavingPhrase && leaving !== null && (
                        <Phrase key={`out-${leaving}`} lead={leavingPhrase.lead} tail={leavingPhrase.tail} tone={TONES[leaving % TONES.length]} leaving />
                      )}
                      <Phrase key={`in-${index}`} lead={current.lead} tail={current.tail} tone={TONES[index % TONES.length]} />
                    </>
                  )}
                </h1>
              </div>

              <p className="rise-in mt-8 max-w-lg text-[16px] leading-relaxed text-ink-600" style={{ ["--rise-delay" as string]: "300ms" }}>
                <strong className="font-medium text-wine-700">{cabinet.specialty}.</strong> {t.hero.introSuffix}
              </p>

              <div className="rise-in mt-9 flex flex-wrap items-center gap-4" style={{ ["--rise-delay" as string]: "420ms" }}>
                <Link to="/contact" className="btn-wine">
                  {t.hero.ctaPrimary} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link to="/cabinet" className="btn-outline">
                  {t.hero.ctaSecondary}
                </Link>
              </div>

              <dl
                className="rise-in mt-12 flex max-w-lg items-center gap-4 border-t border-sand-300/80 pt-7 sm:gap-9"
                style={{ ["--rise-delay" as string]: "540ms" }}
              >
                {t.hero.stats.map((s, i) => (
                  <div key={s.label} className="flex min-w-0 items-center gap-4 sm:gap-9">
                    {i > 0 && <span className="h-9 w-px shrink-0 bg-sand-400/70" aria-hidden="true" />}
                    <div className="min-w-0">
                      <dt className="font-serif text-2xl leading-none font-semibold text-wine-700 sm:text-4xl">
                        <span dir="ltr" className="inline-block">{s.value}</span>
                      </dt>
                      <dd className="mt-2 text-[9.5px] font-medium tracking-[0.1em] text-ink-400 uppercase sm:text-[10.5px] sm:tracking-[0.16em]">{s.label}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-sand-300 bg-cream-100/85 py-4">
        <div className="hero-marquee" role="group" aria-label={t.hero.marqueeLabel}>
          <div className="hero-marquee__track marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="hero-marquee__group" aria-hidden={copy === 1 || undefined}>
                {t.hero.marquee.slice(0, 5).map((item) => (
                  <span key={item} className="hero-marquee__item">{item}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
