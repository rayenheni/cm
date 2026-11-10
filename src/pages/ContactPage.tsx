import { useEffect } from "react";
import { useDocumentTitle, useRoute } from "@/router";
import { useCabinet, useExpertises, useT } from "@/i18n";
import { cn } from "@/utils/cn";
import { focusConsultation } from "@/utils/consultation";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { PageHeader } from "@/components/Blocks";
import { ArrowUpRight, Clock, Lock, Mail, MapPin, Phone, WhatsApp } from "@/components/Icons";

export function ContactPage() {
  const t = useT();
  const cabinet = useCabinet();
  const expertises = useExpertises();
  useDocumentTitle(t.contact.docTitle);
  const route = useRoute();
  const preset = expertises.find((e) => e.id === route.query.get("domaine"))?.title ?? "";
  const appointmentRequested = route.query.get("rendezvous") === "1";

  useEffect(() => {
    if (!appointmentRequested) return;
    // Wait until the route's scroll-to-top effect has finished.
    const frame = window.requestAnimationFrame(focusConsultation);
    return () => window.cancelAnimationFrame(frame);
  }, [appointmentRequested, t.dir]);

  const tiles = [
    { icon: Phone, label: t.contact.phone, value: cabinet.phone, sub: t.contact.phoneSub, href: cabinet.phoneHref, external: false, accent: false, ltr: true },
    { icon: WhatsApp, label: t.contact.whatsapp, value: cabinet.phone, sub: t.contact.whatsappSub, href: cabinet.whatsappHref, external: true, accent: true, ltr: true },
    { icon: Mail, label: t.contact.email, value: cabinet.email, sub: t.contact.emailSub, href: cabinet.emailHref, external: false, accent: false, ltr: true },
    { icon: MapPin, label: t.contact.address, value: cabinet.address, sub: cabinet.city, href: cabinet.mapsHref, external: true, accent: false, ltr: false },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t.contact.headerEyebrow}
        crumbs={[{ label: t.contact.headerCrumb }]}
        title={<>{t.contact.headerTitleA} <em className="text-gold-400 italic">{t.contact.headerTitleB}</em></>}
        subtitle={t.contact.headerSub}
      />

      <section className="py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tiles.map((tile, i) => (
                <Reveal key={tile.label} delay={i * 80} className="h-full">
                  <a
                    href={tile.href}
                    {...(tile.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="group relative flex h-full flex-col gap-3 rounded-lg border border-sand-300 bg-white p-5 transition-colors duration-200 hover:border-wine-600/50 hover:shadow-tile"
                  >
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-cream-50", tile.accent ? "bg-whatsapp" : "bg-wine-600")}>
                      <tile.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-medium tracking-[0.18em] text-ink-400 uppercase">{tile.label}</span>
                      <span dir={tile.ltr ? "ltr" : undefined} className="mt-1 block text-[15px] leading-snug font-medium break-all text-ink-900">{tile.value}</span>
                      <span className="mt-0.5 block text-xs text-ink-600">{tile.sub}</span>
                    </span>
                    <ArrowUpRight className="absolute top-5 right-5 h-4 w-4 text-gold-500 opacity-0 transition-all duration-300 group-hover:opacity-100 rtl:right-auto rtl:left-5 rtl:-scale-x-100" />

                  </a>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-4 rounded-lg border border-sand-300 bg-cream-100/70 p-5">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                  <div className="text-sm leading-relaxed text-ink-600">
                    <p className="font-medium text-ink-900">{t.contact.hoursTitle}</p>
                    <p>{cabinet.hours}</p>
                    <p>{cabinet.hoursSat}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg border border-sand-300 bg-cream-100/70 p-5">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                  <div className="text-sm leading-relaxed text-ink-600">
                    <p className="font-medium text-ink-900">{t.contact.privacyTitle}</p>
                    <p>{t.contact.privacyText}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-4 overflow-hidden rounded-lg border border-sand-300 shadow-tile">
                <iframe
                  title={t.contact.mapTitle}
                  src={cabinet.mapsEmbed}
                  loading="lazy"
                  className="h-72 w-full border-0"
                  style={{ filter: "sepia(0.3) saturate(0.85)" }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 bg-cream-50 px-5 py-4">
                  <span className="flex items-center gap-2 text-sm text-ink-900">
                    <MapPin className="h-4 w-4 text-wine-600" /> {cabinet.address}, {cabinet.city}
                  </span>
                  <a href={cabinet.mapsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-wine-700 hover:text-wine-500">
                    {t.contact.route} <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={100}>
            <div id="consultation-form" tabIndex={-1} aria-label={t.form.title} className="scroll-mt-28 rounded-xl border border-sand-300 bg-white p-7 shadow-soft sm:p-10 lg:sticky lg:top-28">
              <ContactForm presetDomain={preset} />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
