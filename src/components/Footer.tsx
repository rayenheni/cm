import { Link } from "@/router";
import { useCabinet, useExpertises, useNavLinks, useT } from "@/i18n";
import { LogoLockup } from "./Logo";
import { Facebook, Globe, LinkedIn, Mail, MapPin, Phone, WhatsApp } from "./Icons";

export function Footer() {
  const t = useT();
  const cabinet = useCabinet();
  const navLinks = useNavLinks();
  const expertises = useExpertises();

  return (
    <footer className="relative overflow-hidden bg-wine-950 pt-18 pb-8 text-cream-200">
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{ background: "radial-gradient(44rem 28rem at 100% 100%, rgb(124 31 46 / 0.35), transparent 60%)" }}
      />

      <div className="container-x relative">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.1fr_1.2fr]">
          <div>
            <LogoLockup dark />
            <p className="mt-6 max-w-xs font-serif text-[19px] leading-snug text-cream-100/85 italic">
              {cabinet.tagline.join(" ")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { href: cabinet.linkedin, label: t.footer.linkedin, Icon: LinkedIn },
                { href: cabinet.facebook, label: t.footer.facebook, Icon: Facebook },
                { href: cabinet.whatsappHref, label: t.footer.whatsapp, Icon: WhatsApp },
              ].map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/20 transition-all hover:-translate-y-0.5 hover:border-gold-400 hover:text-gold-400">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label={t.footer.siteNav}>
            <p className="text-[11px] font-medium tracking-[0.28em] text-gold-400 uppercase">{t.footer.site}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {[{ to: "/", label: t.homeLabel }, ...navLinks].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-cream-200/75 transition-colors hover:text-gold-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.expNav}>
            <p className="text-[11px] font-medium tracking-[0.28em] text-gold-400 uppercase">{t.footer.expertises}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {expertises.map((expertise) => (
                <li key={expertise.id}>
                  <Link to={`/expertises/${expertise.id}`} className="text-cream-200/75 transition-colors hover:text-gold-400">
                    {expertise.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[11px] font-medium tracking-[0.28em] text-gold-400 uppercase">{t.footer.cabinet}</p>
            <ul className="mt-5 space-y-4 text-sm text-cream-200/75">
              <li>
                <a href={cabinet.mapsHref} target="_blank" rel="noreferrer" className="flex gap-3 transition-colors hover:text-gold-400">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <span>{cabinet.address}<br />{cabinet.city}</span>
                </a>
              </li>
              <li>
                <a href={cabinet.phoneHref} className="flex gap-3 transition-colors hover:text-gold-400">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> <span dir="ltr">{cabinet.phone}</span>
                </a>
              </li>
              <li>
                <a href={cabinet.emailHref} className="ltr flex gap-3 break-all transition-colors hover:text-gold-400">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> {cabinet.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> {cabinet.domain}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-cream-50/10 pt-6 text-xs text-cream-200/55">
          <p>{t.footer.rights(new Date().getFullYear(), cabinet.lawyer, cabinet.role)}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/mentions-legales" className="transition-colors hover:text-gold-400">{t.footer.legal}</Link>
            <Link to="/confidentialite" className="transition-colors hover:text-gold-400">{t.footer.privacy}</Link>
            <span className="hidden text-cream-200/40 sm:inline">{t.footer.secret}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
