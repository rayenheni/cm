import { cn } from "@/utils/cn";
import { useLang, useT } from "@/i18n";

export function LanguageSwitcher({ dark = false, className }: { dark?: boolean; className?: string }) {
  const { lang, setLang } = useLang();
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t.lang.label}
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-[11px] font-semibold tracking-wider",
        dark ? "border-cream-50/25 bg-cream-50/5" : "border-sand-300 bg-cream-100/70",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        title={t.lang.switchToFr}
        className={cn(
          "cursor-pointer rounded-full px-3 py-1.5 transition-all duration-200",
          lang === "fr"
            ? "bg-wine-600 text-cream-50 shadow-tile"
            : dark
              ? "text-cream-200/70 hover:text-cream-50"
              : "text-ink-600 hover:text-wine-700"
        )}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang("ar")}
        aria-pressed={lang === "ar"}
        title={t.lang.switchToAr}
        className={cn(
          "cursor-pointer rounded-full px-3 py-1.5 font-[family-name:var(--font-arabic-sans)] transition-all duration-200",
          lang === "ar"
            ? "bg-wine-600 text-cream-50 shadow-tile"
            : dark
              ? "text-cream-200/70 hover:text-cream-50"
              : "text-ink-600 hover:text-wine-700"
        )}
      >
        عربي
      </button>
    </div>
  );
}
