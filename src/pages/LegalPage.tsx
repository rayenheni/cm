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
  const isEn = lang === "en";
  const title = isMentions ? t.legal.mentionsTitle : t.legal.privacyTitle;
  useDocumentTitle(title);

  const fill = (text: string) =>
    text
      .replace("__EDITOR1__", isFr ? `Le site ${cabinet.domain} est édité par le cabinet CMCB avocat et conseils — ${cabinet.lawyer}, ${cabinet.role}, ${cabinet.specialty.toLowerCase()}.` : isEn ? `The website ${cabinet.domain} is published by CMCB law and legal advice — ${cabinet.lawyer}, ${cabinet.role}, ${cabinet.specialty.toLowerCase()}.` : `موقع ${cabinet.domain} يصدر عن مكتب CMCB للمحاماة والاستشارات — ${cabinet.lawyer}، ${cabinet.role}، ${cabinet.specialty}.`)
      .replace("__EDITOR2__", isFr ? `Adresse : ${cabinet.address}, ${cabinet.city}. Téléphone : ${cabinet.phone}. E-mail : ${cabinet.email}.` : isEn ? `Address: ${cabinet.address}, ${cabinet.city}. Phone: ${cabinet.phone}. Email: ${cabinet.email}.` : `العنوان : ${cabinet.address}، ${cabinet.city}. الهاتف : ${cabinet.phone}. البريد : ${cabinet.email}.`)
      .replace("__EDITOR3__", isFr ? `Directrice de la publication : ${cabinet.lawyer}.` : isEn ? `Publication director: ${cabinet.lawyer}.` : `مديرة النشر : ${cabinet.lawyer}.`)
      .replace(/__CONTACT__/g, cabinet.email)
      .replace("__RIGHTS2__", isFr ? `Pour exercer ces droits, écrivez à ${cabinet.email}. Vous pouvez également saisir l'Instance nationale de protection des données personnelles (INPDP).` : isEn ? `To exercise these rights, write to ${cabinet.email}. You may also contact the Tunisian National Authority for the Protection of Personal Data (INPDP).` : `لممارسة هذه الحقوق، راسل ${cabinet.email}. ويمكنك أيضاً اللجوء إلى الهيئة الوطنية لحماية المعطيات الشخصية.`);

  const sections = (isMentions ? t.legal.mentions : t.legal.privacy).map((s) => ({
    ...s,
    body: s.body.map(fill),
  }));

  if (!isMentions) sections.push({
    title: isFr ? 'Statistiques des articles' : isEn ? 'Article statistics' : 'إحصائيات المقالات',
    body: [isFr
      ? "Avec votre accord facultatif, un identifiant aléatoire est enregistré dans votre navigateur et renouvelé lors de la première consultation après 30 jours si vous continuez à accepter. Sans nouvelle visite, il peut rester sur votre appareil jusqu’à son effacement. Le serveur conserve une empreinte distincte pour chaque article consulté et la date de sa dernière consultation. Les statistiques affichent une estimation par article sur les 30 derniers jours ; elles ne permettent pas de compter précisément les personnes. Les enregistrements anciens sont supprimés lors d’une nouvelle consultation comptabilisée ou de l’ouverture du tableau de bord. Refuser ou retirer votre accord via le lien en bas du site arrête le comptage et supprime l’identifiant local ; les données déjà enregistrées restent jusqu’à leur nettoyage."
      : isEn ? "With your optional consent, a random identifier is stored in your browser and renewed on the first visit after 30 days if you still agree. Without another visit, it may remain on your device until removed. The server stores a separate hash for each article read and its last visit time. The dashboard estimates visitors per article in the last 30 days; this is not an exact count of people. Old records are removed when another visit is counted or the dashboard is opened. Declining or withdrawing consent using the link in the footer stops tracking and removes the local identifier; records already stored remain until cleanup."
      : "بموافقتك الاختيارية، يُحفظ معرّف عشوائي في متصفحك ويُجدّد عند أول زيارة بعد 30 يوماً إذا استمرت موافقتك. إن لم تعد للزيارة فقد يبقى على جهازك حتى حذفه. يحفظ الخادم بصمة منفصلة لكل مقال وتاريخ آخر زيارة. تعرض اللوحة تقديراً للزوار لكل مقال خلال آخر 30 يوماً، وليس عدداً دقيقاً للأشخاص. تُحذف السجلات القديمة عند احتساب زيارة جديدة أو فتح لوحة الإدارة. يؤدي رفض الموافقة أو سحبها من الرابط أسفل الموقع إلى إيقاف القياس وحذف المعرّف المحلي؛ وتبقى السجلات السابقة إلى حين تنظيفها."],
  });

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
