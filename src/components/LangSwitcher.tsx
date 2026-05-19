import { useTranslation } from "@verbumia/react-i18next";

const LOCALES = [
  { code: "fr", labelKey: "lang.fr" },
  { code: "en", labelKey: "lang.en" },
  { code: "es", labelKey: "lang.es" },
] as const;

export function LangSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("lang.switcher.label")}
      className="inline-flex items-center rounded-full border border-ink-700 bg-ink-900/60 p-0.5 text-xs font-medium"
    >
      {LOCALES.map((l) => {
        const active = i18n.locale === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => {
              void i18n.setLocale(l.code);
            }}
            className={[
              "px-3 py-1 rounded-full transition-colors uppercase tracking-wider",
              active
                ? "bg-ink-50 text-ink-950"
                : "text-ink-300 hover:text-ink-50",
            ].join(" ")}
            aria-pressed={active}
            aria-label={t(l.labelKey)}
            lang={l.code}
          >
            {l.code}
          </button>
        );
      })}
    </div>
  );
}
