import { useCabinet, useExpertises, useT } from "@/i18n";
import { Link, useRoute } from "@/router";
import { focusConsultation } from "@/utils/consultation";
import { Calendar, Phone } from "./Icons";

export function MobileContactBar() {
  const t = useT();
  const cabinet = useCabinet();
  const expertises = useExpertises();
  const route = useRoute();
  const query = new URLSearchParams(route.path === "/contact" ? route.query : undefined);

  // Carry the selected practice into the existing consultation form.
  if (route.segments[0] === "expertises" && expertises.some((e) => e.id === route.segments[1])) {
    query.set("domaine", route.segments[1]);
  }
  query.set("rendezvous", "1");

  return (
    <nav className="mobile-contact-bar" aria-label={t.mobileActions.label}>
      <Link
        to={`/contact?${query.toString()}`}
        className="mobile-contact-bar__link mobile-contact-bar__link--appointment"
        aria-label={t.mobileActions.appointmentLabel}
        onClick={(event) => {
          if (
            route.path === "/contact" && event.button === 0 &&
            !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
          ) {
            event.preventDefault();
            focusConsultation();
          }
        }}
      >
        <Calendar className="h-[18px] w-[18px] shrink-0" />
        <span>{t.mobileActions.appointment}</span>
      </Link>
      <a
        href={cabinet.phoneHref}
        className="mobile-contact-bar__link mobile-contact-bar__link--call"
        aria-label={`${t.mobileActions.callLabel} ${cabinet.phone}`}
        style={{ direction: t.dir === "rtl" ? "rtl" : "ltr" }}
      >
        <Phone className="h-[18px] w-[18px] shrink-0" />
        <span>{t.mobileActions.call}</span>
      </a>
    </nav>
  );
}