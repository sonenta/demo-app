import { useState } from "react";
import { useTranslation } from "@sonenta/react-i18next";

const LOCALES = [
  { code: "fr", labelKey: "lang.fr" },
  { code: "en", labelKey: "lang.en" },
  { code: "es", labelKey: "lang.es" },
] as const;

export function LangSwitcher() {
  const { t, i18n } = useTranslation();
  // `setLocale` only resolves once the target locale's bundles have been
  // fetched, and it repaints nothing until then. On a fast connection that is
  // ~15ms and invisible; on a slow one it is many seconds during which the
  // switcher looked completely inert — a visitor clicks FR, nothing happens,
  // and concludes the language switcher is broken. So acknowledge the click
  // immediately and optimistically, and mark the group busy while the bundle
  // is in flight. The strings still arrive when they arrive; what changes is
  // that the UI is never silent about it.
  const [pending, setPending] = useState<string | null>(null);

  const select = (code: string) => {
    if (code === i18n.locale || pending) return;
    setPending(code);
    void i18n.setLocale(code).finally(() => setPending(null));
  };

  return (
    <div
      role="group"
      aria-label={t("lang.switcher.label")}
      aria-busy={pending !== null}
      className="inline-flex items-center rounded-full border border-ink-700 bg-ink-900/60 p-0.5 text-xs font-medium"
    >
      {LOCALES.map((l) => {
        const settled = i18n.locale === l.code;
        // Optimistic: the pending target reads as active the moment it is
        // clicked, so the control always responds on the first press.
        const active = pending ? pending === l.code : settled;
        const loading = pending === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => select(l.code)}
            className={[
              "relative px-3 py-1 rounded-full transition-colors uppercase tracking-wider",
              active
                ? "bg-ink-50 text-ink-950"
                : "text-ink-300 hover:text-ink-50",
              loading ? "animate-pulse" : "",
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
