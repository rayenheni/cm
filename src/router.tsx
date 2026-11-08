import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes } from "react";

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

const LEGACY: Record<string, string> = {
  accueil: "/",
  cabinet: "/cabinet",
  methode: "/cabinet",
  expertises: "/expertises",
  articles: "/articles",
  faq: "/faq",
  contact: "/contact",
};

function parse(): Route {
  let raw = window.location.hash.replace(/^#/, "");
  if (!raw.startsWith("/")) raw = LEGACY[raw] ?? "/";
  const [p, q = ""] = raw.split("?");
  const segments = p.split("/").filter(Boolean);
  return { path: "/" + segments.join("/"), segments, query: new URLSearchParams(q) };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export const RouteContext = createContext<Route>({ path: "/", segments: [], query: new URLSearchParams() });

export function useRoute() {
  return useContext(RouteContext);
}

const BASE_TITLE_FR = "CMCB · Maître Chaima Bhiri — Avocat et conseils";
const BASE_TITLE_AR = "CMCB · الأستاذة شيماء البحيري — محاماة واستشارات";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const isAr = document.documentElement.lang === "ar";
    const base = isAr ? BASE_TITLE_AR : BASE_TITLE_FR;
    document.title = title ? `${title} | ${base}` : isAr ? `${base} بمساكن، سوسة` : `${base} à Msaken, Sousse`;
  }, [title]);
  // Re-run when language changes (title prop changes on re-render, but also observe lang attr)
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const isAr = document.documentElement.lang === "ar";
      const base = isAr ? BASE_TITLE_AR : BASE_TITLE_FR;
      document.title = title ? `${title} | ${base}` : isAr ? `${base} بمساكن، سوسة` : `${base} à Msaken, Sousse`;
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => obs.disconnect();
  }, [title]);
}

export function navigate(to: string) {
  window.location.hash = to;
}

export function isActivePath(current: string, to: string) {
  if (to === "/") return current === "/";
  return current === to || current.startsWith(to + "/");
}

type LinkProps = { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export function Link({ to, ...rest }: LinkProps) {
  return <a href={`#${to}`} {...rest} />;
}
