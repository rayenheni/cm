import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { useCabinet, useExpertises, useNavLinks, useT } from "@/i18n";
import { Link, isActivePath, useRoute } from "@/router";
import { LogoLockup } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useBodyLock } from "./Reveal";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Close,
  Facebook,
  Globe,
  ICON_MAP,
  LinkedIn,
  Mail,
  Menu,
  Phone,
} from "./Icons";

export function Navbar() {
  const route = useRoute();
  const t = useT();
  const cabinet = useCabinet();
  const navLinks = useNavLinks();
  const expertises = useExpertises();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileExpOpen, setMobileExpOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useBodyLock(open);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [route.path]);

  useEffect(() => {
    setOpen(false);
    setMegaOpen(false);
  }, [route.path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMegaOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 140);
  };

  return (
    <>
      {/* Bandeau supérieur */}
      <div className="hidden bg-wine-900 text-cream-200 lg:block">
        <div className="container-x flex h-10 items-center justify-between text-[12px] tracking-wide">
          <div className="flex items-center gap-6">
            <a href={cabinet.phoneHref} className="ltr flex items-center gap-2 transition-colors hover:text-gold-400">
              <Phone className="h-3.5 w-3.5" /> <span dir="ltr">{cabinet.phone}</span>
            </a>
            <a href={cabinet.emailHref} className="ltr flex items-center gap-2 transition-colors hover:text-gold-400">
              <Mail className="h-3.5 w-3.5" /> {cabinet.email}
            </a>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 text-cream-200/80">
              <Clock className="h-3.5 w-3.5" /> {cabinet.hours}
            </span>
            <span className="h-4 w-px bg-cream-50/20" />
            <span className="flex items-center gap-2 text-gold-400">
              <Globe className="h-3.5 w-3.5" /> {cabinet.domain}
            </span>
            <span className="h-4 w-px bg-cream-50/20" />
            <div className="flex items-center gap-3">
              <a href={cabinet.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-gold-400">
                <LinkedIn className="h-3.5 w-3.5" />
              </a>
              <a href={cabinet.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="transition-colors hover:text-gold-400">
                <Facebook className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-sand-300/80 bg-cream-50/95 shadow-[0_8px_30px_-18px_rgb(53_11_20/0.35)] backdrop-blur-md"
            : "border-b border-transparent bg-cream-50/80 backdrop-blur-sm"
        )}
      >
        <div className="container-x flex h-20 items-center justify-between gap-4">
          <Link to="/" aria-label="CMCB" className="shrink-0">
            <LogoLockup compact />
          </Link>

          <nav className="hidden h-full items-center gap-7 lg:flex xl:gap-8" aria-label={t.nav.mainNav}>
            {navLinks.map((link) =>
              link.to === "/expertises" ? (
                <div
                  key={link.to}
                  className="relative flex h-full items-center"
                  onMouseEnter={openMega}
                  onMouseLeave={closeMega}
                  onFocus={openMega}
                  onBlur={closeMega}
                >
                  <Link
                    to={link.to}
                    className={cn("nav-link flex items-center gap-1.5", isActivePath(route.path, link.to) && "active")}
                    aria-haspopup="true"
                    aria-expanded={megaOpen}
                  >
                    {link.label}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", megaOpen && "rotate-180")} />
                  </Link>

                  {megaOpen && (
                    <div className="panel-in absolute top-full left-1/2 w-[760px] max-w-[90vw] -translate-x-1/2 pt-1">
                      <div className="grid grid-cols-[1fr_230px] overflow-hidden rounded-2xl border border-sand-300 bg-cream-50 shadow-soft">
                        <div className="grid grid-cols-1 gap-1 p-3">
                          {expertises.map((exp) => {
                            const Icon = ICON_MAP[exp.icon];
                            const active = route.path === `/expertises/${exp.id}`;
                            return (
                              <Link
                                key={exp.id}
                                to={`/expertises/${exp.id}`}
                                className={cn(
                                  "group flex items-center gap-4 rounded-xl p-3 transition-colors",
                                  active ? "bg-cream-200" : "hover:bg-cream-100"
                                )}
                              >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold-500/40 bg-cream-100 text-wine-600 transition-colors group-hover:border-wine-600 group-hover:bg-wine-600 group-hover:text-cream-50">
                                  <Icon className="h-5 w-5" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block font-serif text-[17px] leading-tight font-semibold text-ink-900">
                                    {exp.shortTitle}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-600">{exp.short}</span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                        <div className="relative flex flex-col justify-end overflow-hidden bg-wine-900 p-5 text-cream-50">
                          <div
                            className="absolute inset-0 opacity-90"
                            style={{ background: "radial-gradient(18rem 14rem at 100% 0%, rgb(160 128 90 / 0.35), transparent 60%)" }}
                            aria-hidden="true"
                          />
                          <p className="relative font-serif text-sm tracking-[0.2em] text-gold-400 uppercase">{t.nav.fiveDomains}</p>
                          <p className="relative mt-2 font-serif text-2xl leading-tight">{t.nav.rigorLine}</p>
                          <Link to="/expertises" className="relative mt-5 inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.14em] text-gold-400 uppercase hover:text-cream-50">
                            {t.nav.overview} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link key={link.to} to={link.to} className={cn("nav-link", isActivePath(route.path, link.to) && "active")}>
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <Link to="/contact" className="btn-wine hidden px-5! py-2.5! md:inline-flex">
              {t.nav.appointment} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t.nav.openMenu}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-sand-300 text-wine-700 transition-colors hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-[2px] bg-gold-500 transition-[width] duration-150 rtl:right-0 rtl:left-auto" style={{ width: `${progress * 100}%` }} />
      </header>

      {/* Menu mobile */}
      {open && (
        <div className="fade-in fixed inset-0 z-[70] flex flex-col bg-wine-950 text-cream-100 lg:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(40rem 30rem at 90% 0%, rgb(160 128 90 / 0.18), transparent 60%), radial-gradient(36rem 28rem at 0% 100%, rgb(124 31 46 / 0.35), transparent 60%)",
            }}
          />
          <div className="container-x relative flex h-20 shrink-0 items-center justify-between">
            <LogoLockup dark compact />
            <div className="flex items-center gap-2">
              <LanguageSwitcher dark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.nav.closeMenu}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-cream-50/25 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400"
              >
                <Close className="h-5 w-5" />
              </button>
            </div>
          </div>
          <nav className="container-x relative mt-4 flex flex-1 flex-col overflow-y-auto" aria-label={t.nav.mobileMenu}>
            {[{ to: "/", label: t.homeLabel }, ...navLinks].map((link, i) => (
              <div
                key={link.to}
                className="rise-in border-b border-cream-50/10"
                style={{ ["--rise-delay" as string]: `${100 + i * 60}ms` }}
              >
                <div className="flex items-center">
                  <Link to={link.to} className="group flex flex-1 items-baseline gap-4 py-4">
                    <span className="font-serif text-sm text-gold-400 italic">0{i + 1}</span>
                    <span
                      className={cn(
                        "font-serif text-[30px] leading-none font-medium transition-colors group-hover:text-gold-400",
                        isActivePath(route.path, link.to) ? "text-gold-400" : "text-cream-50"
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                  {link.to === "/expertises" && (
                    <button
                      type="button"
                      onClick={() => setMobileExpOpen((v) => !v)}
                      aria-label={t.nav.showExpertises}
                      aria-expanded={mobileExpOpen}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-cream-50/20 text-gold-400"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", mobileExpOpen && "rotate-180")} />
                    </button>
                  )}
                </div>
                {link.to === "/expertises" && mobileExpOpen && (
                  <div className="panel-in mb-4 ml-9 flex flex-col gap-1 border-l border-gold-500/30 pl-4 rtl:mr-9 rtl:ml-0 rtl:border-r rtl:border-l-0 rtl:pr-4 rtl:pl-0">
                    {expertises.map((exp) => (
                      <Link key={exp.id} to={`/expertises/${exp.id}`} className="py-1.5 text-[15px] text-cream-200/85 hover:text-gold-400">
                        {exp.shortTitle}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="rise-in mt-8 pb-10" style={{ ["--rise-delay" as string]: "520ms" }}>
              <Link to="/contact" className="btn-gold w-full">
                {t.nav.bookAppointment} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <div className="mt-6 flex flex-col gap-2 text-sm text-cream-200/80">
                <a href={cabinet.phoneHref} className="flex items-center gap-3 hover:text-gold-400">
                  <Phone className="h-4 w-4 text-gold-400" /> <span dir="ltr">{cabinet.phone}</span>
                </a>
                <a href={cabinet.emailHref} className="flex items-center gap-3 break-all hover:text-gold-400">
                  <Mail className="h-4 w-4 shrink-0 text-gold-400" /> {cabinet.email}
                </a>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <a href={cabinet.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/20 hover:border-gold-400 hover:text-gold-400">
                  <LinkedIn className="h-4 w-4" />
                </a>
                <a href={cabinet.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/20 hover:border-gold-400 hover:text-gold-400">
                  <Facebook className="h-4 w-4" />
                </a>
                <span className="ml-auto text-xs tracking-[0.2em] text-gold-400 uppercase rtl:mr-auto rtl:ml-0">{cabinet.domain}</span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
