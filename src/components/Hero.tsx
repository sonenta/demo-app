import { useTranslation } from "@sonenta/react-i18next";

export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-24">
        <p className="mono text-[11px] uppercase tracking-[0.22em] text-emerald-400 mb-5 sm:mb-6 inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          {t("hero.eyebrow")}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.04] tracking-[-0.025em] text-ink-50 max-w-4xl">
          <span className="block">{t("hero.title.line1")}</span>
          <span className="block text-emerald-400">
            {t("hero.title.line2")}
          </span>
        </h1>
        <p className="mt-6 sm:mt-7 max-w-2xl text-base sm:text-lg leading-relaxed text-ink-300">
          {t("hero.lede")}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#signup"
            className="inline-flex items-center gap-2 bg-emerald-500 text-ink-950 px-5 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors"
          >
            {t("hero.cta.primary")}
            <span aria-hidden>→</span>
          </a>
          <a
            href="#docs"
            className="inline-flex items-center gap-2 border border-ink-700 bg-ink-900 px-5 py-3 rounded-lg text-sm font-medium text-ink-100 hover:bg-ink-800 hover:border-ink-700 transition-colors"
          >
            {t("hero.cta.secondary")}
          </a>
          <p className="mono text-xs text-ink-300 sm:ml-1 basis-full sm:basis-auto">
            {t("hero.note")}
          </p>
        </div>
      </div>
      <DecorativeRule />
    </section>
  );
}

function DecorativeRule() {
  return (
    <div
      aria-hidden
      className="mx-auto max-w-6xl px-6 flex items-center gap-3 text-[10px] mono uppercase tracking-[0.2em] text-ink-300/60"
    >
      <span>FR</span>
      <span className="h-px flex-1 bg-ink-800" />
      <span>EN</span>
      <span className="h-px flex-1 bg-ink-800" />
      <span>ES</span>
    </div>
  );
}
