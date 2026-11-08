import { IMAGES } from "@/data/content";
import { useDocumentTitle } from "@/router";
import { useT } from "@/i18n";
import { Reveal } from "@/components/Reveal";
import { CtaBand, PageHeader } from "@/components/Blocks";
import { PracticeExplorer } from "@/components/PracticeExplorer";

export function ExpertisesPage() {
  const t = useT();
  useDocumentTitle(t.expertises.docTitle);

  return (
    <>
      <PageHeader
        eyebrow={t.expertises.headerEyebrow}
        crumbs={[{ label: t.expertises.headerCrumb }]}
        image={IMAGES.lawBook}
        title={<>{t.expertises.headerTitleA} <em className="text-gold-400 italic">{t.expertises.headerTitleB}</em></>}
        subtitle={t.expertises.headerSub}
      />

      <section className="practice-section" aria-labelledby="practice-directory-title">
        <div className="container-x">
          <Reveal>
            <div className="practice-section__heading">
              <div>
                <p className="eyebrow">{t.expertises.dirEyebrow}</p>
                <h2 id="practice-directory-title">{t.expertises.dirTitleA} <em>{t.expertises.dirTitleB}</em></h2>
              </div>
              <div className="practice-section__intro">
                <p>{t.expertises.dirText}</p>
              </div>
            </div>
          </Reveal>
          <PracticeExplorer detailed />
        </div>
      </section>

      <CtaBand
        title={<>{t.expertises.ctaTitleA} <em className="text-sand-300 italic">{t.expertises.ctaTitleB}</em></>}
        text={t.expertises.ctaText}
      />
    </>
  );
}
