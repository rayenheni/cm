import { Link, useDocumentTitle } from "@/router";
import { useExpertises, useT } from "@/i18n";
import { Monogram } from "@/components/Logo";
import { ArrowRight } from "@/components/Icons";

export function NotFoundPage() {
  const t = useT();
  const expertises = useExpertises();
  useDocumentTitle(t.notFound.docTitle);
  return (
    <section className="relative overflow-hidden py-28">
      <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[16rem] leading-none font-bold text-wine-600/10 select-none" aria-hidden="true">
        404
      </span>
      <div className="container-x relative text-center">
        <Monogram className="rise-in mx-auto h-20 w-20 rounded-md shadow-tile" />
        <p className="rise-in eyebrow mt-8 justify-center" style={{ ["--rise-delay" as string]: "80ms" }}>{t.notFound.eyebrow}</p>
        <h1 className="rise-in mx-auto mt-5 max-w-2xl font-serif text-5xl leading-tight font-semibold text-ink-900 sm:text-6xl" style={{ ["--rise-delay" as string]: "160ms" }}>
          {t.notFound.titleA} <em className="text-wine-600 italic">{t.notFound.titleB}</em>
        </h1>
        <p className="rise-in mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-ink-600" style={{ ["--rise-delay" as string]: "240ms" }}>
          {t.notFound.text}
        </p>
        <div className="rise-in mt-9 flex flex-wrap justify-center gap-3" style={{ ["--rise-delay" as string]: "320ms" }}>
          <Link to="/" className="btn-wine">{t.notFound.home} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
          <Link to="/contact" className="btn-outline">{t.notFound.contact}</Link>
        </div>
        <div className="rise-in mt-12 flex flex-wrap justify-center gap-2" style={{ ["--rise-delay" as string]: "400ms" }}>
          {expertises.map((e) => (
            <Link key={e.id} to={`/expertises/${e.id}`} className="chip transition-colors hover:border-wine-600 hover:text-wine-700">
              {e.shortTitle}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
