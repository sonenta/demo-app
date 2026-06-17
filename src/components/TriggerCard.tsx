import { useSyncExternalStore } from "react";
import { useTranslation } from "@sonenta/react-i18next";
import {
  scenarioStore,
  SCENARIO_KEYS,
  type ScenarioMode,
} from "../state/scenario-store";

const TRIGGERS = SCENARIO_KEYS.map((k, i) => ({
  key: k,
  labelKey: [
    "live.trigger.button.legal",
    "live.trigger.button.checkout",
    "live.trigger.button.error",
    "live.trigger.button.coming",
  ][i]!,
}));

export function TriggerCard() {
  const { t } = useTranslation();
  const sc = useSyncExternalStore(
    scenarioStore.subscribe,
    scenarioStore.getSnapshot,
    scenarioStore.getSnapshot,
  );

  const trigger = (missingKey: string) => {
    t(missingKey);
  };

  const setMode = (mode: ScenarioMode) => {
    if (mode === "idle") scenarioStore.stop();
    else scenarioStore.start(mode);
  };

  const isAuto = sc.mode !== "idle";

  return (
    <aside className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
      <div className="flex items-center gap-2 mb-1.5">
        <svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-emerald-400"
        >
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" strokeLinejoin="round" />
        </svg>
        <h3 className="text-[1.05rem] font-semibold tracking-tight text-ink-50">
          {t("live.trigger.title")}
        </h3>
      </div>
      <p className="text-sm text-ink-300 mb-4">{t("live.trigger.subtitle")}</p>

      <div className="flex items-center gap-1 mb-4 p-1 rounded-full border border-ink-800 bg-ink-950/60">
        <ScenarioPill
          active={sc.mode === "playing"}
          onClick={() => setMode(sc.mode === "playing" ? "idle" : "playing")}
        >
          ▷ {t("scenario.play")}
        </ScenarioPill>
        <ScenarioPill
          active={sc.mode === "looping"}
          onClick={() => setMode(sc.mode === "looping" ? "idle" : "looping")}
        >
          ↻ {t("scenario.loop")}
        </ScenarioPill>
      </div>

      <div className="grid gap-2.5">
        {TRIGGERS.map((trig, i) => {
          const isCurrent = isAuto && sc.cursor === i;
          return (
            <button
              key={trig.key}
              type="button"
              onClick={() => trigger(trig.key)}
              disabled={isAuto}
              className={[
                "group flex items-center justify-between gap-3 px-4 py-3 rounded-lg border bg-ink-950/40 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-70",
                isCurrent
                  ? "border-amber bg-amber-soft"
                  : "border-ink-800 hover:border-ink-700 hover:bg-ink-900",
              ].join(" ")}
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium text-ink-100">
                  {t(trig.labelKey)}
                </span>
                <code className="mono text-[11px] text-ink-300 mt-0.5">
                  t(&quot;{trig.key}&quot;)
                </code>
              </span>
              <span
                aria-hidden
                className={[
                  "mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-sm transition-colors",
                  isCurrent
                    ? "bg-amber text-ink-50"
                    : "bg-amber-soft text-amber-bright group-hover:bg-amber group-hover:text-ink-50",
                ].join(" ")}
              >
                {isCurrent ? "firing" : "fire"}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ScenarioPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
        active
          ? "bg-emerald-500 text-ink-950"
          : "text-ink-300 hover:text-ink-50 hover:bg-ink-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
