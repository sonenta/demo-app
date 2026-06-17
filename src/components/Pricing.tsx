import { useTranslation } from "@sonenta/react-i18next";

const PLANS = [
  {
    id: "free",
    nameKey: "pricing.free.name",
    priceKey: "pricing.free.price",
    line1Key: "pricing.free.line1",
    line2Key: "pricing.free.line2",
    accent: false,
  },
  {
    id: "hobby",
    nameKey: "pricing.hobby.name",
    priceKey: "pricing.hobby.price",
    line1Key: "pricing.hobby.line1",
    line2Key: "pricing.hobby.line2",
    accent: false,
  },
  {
    id: "pro",
    nameKey: "pricing.pro.name",
    priceKey: "pricing.pro.price",
    line1Key: "pricing.pro.line1",
    line2Key: "pricing.pro.line2",
    accent: true,
  },
  {
    id: "team",
    nameKey: "pricing.team.name",
    priceKey: "pricing.team.price",
    line1Key: "pricing.team.line1",
    line2Key: "pricing.team.line2",
    accent: false,
  },
] as const;

export function Pricing() {
  const { t } = useTranslation();
  return (
    <section id="pricing" className="border-t border-ink-800 bg-ink-900/40">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <header className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-ink-50">
            {t("pricing.title")}
          </h2>
          <p className="mt-3 text-ink-300">{t("pricing.subtitle")}</p>
        </header>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <article
              key={p.id}
              className={[
                "relative rounded-xl border bg-ink-900 p-6 flex flex-col gap-4",
                p.accent
                  ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
                  : "border-ink-800",
              ].join(" ")}
            >
              {p.accent && (
                <span className="absolute -top-2.5 left-6 mono text-[10px] uppercase tracking-[0.2em] bg-emerald-500 text-ink-950 px-2 py-0.5 rounded-sm">
                  popular
                </span>
              )}
              <h3 className="text-xl font-semibold tracking-tight text-ink-50">
                {t(p.nameKey)}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-ink-50">
                  {t(p.priceKey)}
                </span>
                <span className="text-xs text-ink-300">
                  {t("pricing.month")}
                </span>
              </div>
              <ul className="text-sm text-ink-300 space-y-1.5">
                <li>{t(p.line1Key)}</li>
                <li>{t(p.line2Key)}</li>
              </ul>
              <button
                type="button"
                className={[
                  "mt-auto px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  p.accent
                    ? "bg-emerald-500 text-ink-950 hover:bg-emerald-400"
                    : "border border-ink-700 bg-ink-900 text-ink-100 hover:bg-ink-800",
                ].join(" ")}
              >
                {t("pricing.cta")}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
