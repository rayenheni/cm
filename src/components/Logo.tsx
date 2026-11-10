import { useId } from "react";
import { cn } from "@/utils/cn";
import { useLang, useT } from "@/i18n";
import monogram from "@/assets/cmcb-monogram.png";

/** Monogramme extrait du logo fourni par le cabinet. */
export function Monogram({ className }: { className?: string }) {
  return (
    <img
      src={monogram}
      alt="Monogramme CMCB"
      width={290}
      height={290}
      className={className}
      style={{ background: "linear-gradient(135deg, #ece1c9, #d6c29d)" }}
    />
  );
}

export function LogoLockup({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const t = useT();
  const { lang } = useLang();
  return (
    <span className="inline-flex items-center gap-3">
      <Monogram className={cn("shrink-0 rounded-[5px] shadow-tile", compact ? "h-11 w-11" : "h-13 w-13")} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif font-medium tracking-[0.04em]",
            compact ? "text-[24px]" : "text-[28px]",
            dark ? "text-cream-50" : "text-wine-600"
          )}
        >
          CMCB
        </span>
        <span
          className={cn(
            "mt-1 border-b pb-1 font-normal",
            lang === "ar" ? "text-[12px] tracking-normal" : "text-[10.5px] tracking-[0.2em]",
            dark ? "border-gold-400/50 text-gold-400" : "border-gold-500/60 text-gold-600"
          )}
        >
          {t.logo.sub}
        </span>
      </span>
    </span>
  );
}

export function CircularSeal({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pathId = `seal-${uid}`;
  const t = useT();
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden="true">
        <defs>
          <path id={pathId} d="M70,70 m-54,0 a54,54 0 1,1 108,0 a54,54 0 1,1 -108,0" />
        </defs>
        <circle cx="70" cy="70" r="69" className="fill-cream-50" />
        <circle cx="70" cy="70" r="66" fill="none" stroke="#a0805a" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx="70" cy="70" r="40" fill="none" stroke="#a0805a" strokeOpacity="0.4" strokeWidth="1" />
        <text
          fill="#7c1f2e"
          fontSize={isAr ? 13 : 11.5}
          letterSpacing={isAr ? 0.5 : 2.8}
          fontFamily={isAr ? "'IBM Plex Sans Arabic', sans-serif" : "Jost, sans-serif"}
          fontWeight={500}
        >
          <textPath href={`#${pathId}`}>{t.logo.seal}</textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <Monogram className="h-11 w-11 rounded-[4px]" />
      </span>
    </div>
  );
}
