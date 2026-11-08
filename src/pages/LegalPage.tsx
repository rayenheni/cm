import { Link, useDocumentTitle } from "@/router";
import { useCabinet, useLang, useT } from "@/i18n";
import { Reveal } from "@/components/Reveal";
import { PageHeader } from "@/components/Blocks";

export function LegalPage({ variant }: { variant: "mentions" | "privacy" }) {
  const t = useT();
  const { lang } = useLang();
  const cabinet = useCabinet();
  const isMentions = variant === "mentions";
  const isFr = lang === "fr";
  const title = isMentions ? t.legal.mentionsTitle : t.legal.privacyTitle;
  useDocumentTitle(title);

  const fill = (text: string) =>
    text
      .replace("__EDITOR1__", isFr ? `Le site ${cabinet.domain} est édité par le cabinet CMCB avocat et conseils — ${cabinet.lawyer}, ${cabinet.role}, ${cabinet.specialty.toLowerCase()}.` : `موقع ${cabinet.domain} يصدر عن مكتب CMCB للمحاماة والاستشارات — ${cabinet.lawyer}، ${cabinet.role}، ${cabinet.specialty}.`)
      .replace("__EDITOR2__", isFr ? `Adresse : ${cabinet.address}, ${cabinet.city}. Téléphone : ${cabinet.phone}. E-mail : ${cabinet.email}.` : `العنوان : ${cabinet.address}، ${cabinet.city}. الهاتف : ${cabinet.phone}. البريد : ${cabinet.email}.`)
      .replace("__EDITOR3__", isFr ? `Directrice de la publication : ${cabinet.lawyer}.` : `مديرة النشر : ${cabinet.lawyer}.`)
      .replace("__RIGHTS2__", isFr ? `Pour exercer ces droits, écrivez à ${cabinet.email}. Vous pouvez également saisir l'Instance nationale de protection des données personnelles (INPDP).` : `لممارسة هذه الحقوق، راسل ${cabinet.email}. ويمكنك أيضاً اللجوء إلى الهيئة الوطنية لحماية المعطيات الشخصية.`);

  const sections = (isMentions ? t.legal.mentions : t.legal.privacy).map((s) => ({
    ...s,
    body: s.body.map(fill),
  }));

  return (
    <>
      <PageHeader
        eyebrow={t.legal.eyebrow}
        crumbs={[{ label: title }]}
        title={title}
        subtitle={isMentions ? t.legal.mentionsSub : t.legal.privacySub}
      />
      <section className="py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[240px_1fr]">
          <aside>
            <div className="flex gap-2 lg:sticky lg:top-28 lg:flex-col">
              <Link to="/mentions-legales" className={isMentions ? "btn-wine px-5! py-2.5!" : "btn-outline px-5! py-2.5!"}>
                {t.legal.mentionsTitle}
              </Link>
              <Link to="/confidentialite" className={!isMentions ? "btn-wine px-5! py-2.5!" : "btn-outline px-5! py-2.5!"}>
                {t.legal.privacyTitle}
              </Link>
            </div>
          </aside>
          <div className="max-w-3xl space-y-10">
            {sections.map((s, i) => (
              <Reveal key={s.title} delay={i * 60}>
                <h2 className="flex items-baseline gap-3 font-serif text-[28px] font-semibold text-ink-900">
                  <span className="text-lg text-gold-500 italic">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="mt-3 space-y-3 border-l border-sand-300 pl-8 rtl:border-r rtl:border-l-0 rtl:pr-8 rtl:pl-0">
                  {s.body.map((p, j) => (
                    <p key={j} className="text-[15.5px] leading-[1.85] text-ink-600">{p}</p>
                  ))}
                </div>
              </Reveal>
            ))}
            <p className="border-t border-sand-300 pt-6 text-sm text-ink-400">{t.legal.updated}</p>
          </div>
        </div>
      </section>
    </>
  );
}
