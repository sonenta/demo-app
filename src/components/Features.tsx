import { useTranslation } from "@sonenta/react-i18next";

const FEATURES = [
  {
    n: "01",
    titleKey: "features.one.title",
    bodyKey: "features.one.body",
    glyph: "⚡",
  },
  {
    n: "02",
    titleKey: "features.two.title",
    bodyKey: "features.two.body",
    glyph: "◆",
  },
  {
    n: "03",
    titleKey: "features.three.title",
    bodyKey: "features.three.body",
    glyph: "≈",
  },
] as const;

export function Features() {
  const { t } = useTranslation();
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <header className="max-w-3xl mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-ink-50">
          {t("features.title")}
        </h2>
      </header>
      <div className="grid md:grid-cols-3 gap-px bg-ink-800 rounded-2xl overflow-hidden border border-ink-800">
        {FEATURES.map((f) => (
          <article
            key={f.n}
            className="bg-ink-900 p-7 flex flex-col gap-4 min-h-[14rem]"
          >
            <div className="flex items-center justify-between">
              <span className="mono text-[11px] uppercase tracking-[0.2em] text-ink-300">
                {f.n}
              </span>
              <span aria-hidden className="text-2xl text-emerald-400">
                {f.glyph}
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-tight leading-snug text-ink-50">
              {t(f.titleKey)}
            </h3>
            <p className="text-sm leading-relaxed text-ink-300">
              {t(f.bodyKey)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
