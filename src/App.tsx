import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { useCabinet, useT } from "@/i18n";
import { RouteContext, useHashRoute, type Route } from "@/router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileContactBar } from "@/components/MobileContactBar";
import { ArrowRight, WhatsApp } from "@/components/Icons";
import { HomePage } from "@/pages/HomePage";
import { CabinetPage } from "@/pages/CabinetPage";
import { ExpertisesPage } from "@/pages/ExpertisesPage";
import { ExpertiseDetailPage } from "@/pages/ExpertiseDetailPage";
import { ArticlesPage } from "@/pages/ArticlesPage";
import { ArticleDetailPage } from "@/pages/ArticleDetailPage";
import { FaqPage } from "@/pages/FaqPage";
import { ContactPage } from "@/pages/ContactPage";
import { LegalPage } from "@/pages/LegalPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminPage } from "@/pages/AdminPage";

function resolve(route: Route): ReactNode {
  const [first, second, ...rest] = route.segments;
  if (rest.length) return <NotFoundPage />;
  switch (first) {
    case undefined:
      return <HomePage />;
    case "cabinet":
      return second ? <NotFoundPage /> : <CabinetPage />;
    case "expertises":
      return second ? <ExpertiseDetailPage id={second} /> : <ExpertisesPage />;
    case "articles":
      return second ? <ArticleDetailPage id={second} /> : <ArticlesPage />;
    case "faq":
      return second ? <NotFoundPage /> : <FaqPage />;
    case "contact":
      return second ? <NotFoundPage /> : <ContactPage />;
    case "admin":
      return <AdminPage />;
    case "mentions-legales":
      return <LegalPage variant="mentions" />;
    case "confidentialite":
      return <LegalPage variant="privacy" />;
    default:
      return <NotFoundPage />;
  }
}

function FloatingActions() {
  const t = useT();
  const cabinet = useCabinet();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="floating-actions fixed z-40 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t.app.top}
        className={cn(
          "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-sand-300 bg-cream-50 text-wine-700 shadow-tile transition-all duration-300 hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50",
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        )}
      >
        <ArrowRight className="h-4.5 w-4.5 -rotate-90" />
      </button>
      <a
        href={cabinet.whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label={t.app.whatsapp}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-soft transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        <span className="pulse-ring absolute inset-0 rounded-full" aria-hidden="true" />
        <WhatsApp className="relative h-6.5 w-6.5" />
        <span className="pointer-events-none absolute right-full mr-3 hidden rounded-full bg-wine-950 px-4 py-2 text-xs font-medium whitespace-nowrap text-cream-50 opacity-0 shadow-tile transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100 sm:block rtl:right-auto rtl:left-full rtl:mr-0 rtl:ml-3 rtl:group-hover:translate-x-1">
          {t.app.whatsappTip}
        </span>
      </a>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  const t = useT();
  const pageKey = route.segments.join("/");
  const isAdmin = route.segments[0] === "admin";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pageKey]);

  // Admin panel: render outside the main site shell (no Navbar/Footer)
  if (isAdmin) {
    return (
      <RouteContext.Provider value={route}>
        <AdminPage />
      </RouteContext.Provider>
    );
  }

  return (
    <RouteContext.Provider value={route}>
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }} className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:rounded-full focus:bg-wine-600 focus:px-5 focus:py-2.5 focus:text-cream-50 rtl:focus:right-3 rtl:focus:left-auto">
        {t.skipLink}
      </a>
      <div className="site-shell flex min-h-screen flex-col">
        <Navbar />
        <main id="main" tabIndex={-1} key={`${pageKey}-${t.dir}`} className="page-in flex-1 outline-none">
          {resolve(route)}
        </main>
        <Footer />
        <FloatingActions />
        <MobileContactBar />
      </div>
    </RouteContext.Provider>
  );
}
