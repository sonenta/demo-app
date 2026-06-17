import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "@sonenta/react-i18next";
import { missingStore } from "../state/missing-store";
import { scenarioStore } from "../state/scenario-store";

export function MissingKeysPanel() {
  const { t, i18n } = useTranslation();
  const state = useSyncExternalStore(
    missingStore.subscribe,
    missingStore.getSnapshot,
    missingStore.getSnapshot,
  );
  const sc = useSyncExternalStore(
    scenarioStore.subscribe,
    scenarioStore.getSnapshot,
    scenarioStore.getSnapshot,
  );
  const count = state.events.length;
  const headerRef = useRef<HTMLDivElement>(null);
  const [flushedFlash, setFlushedFlash] = useState(false);

  useEffect(() => {
    if (state.lastBatchAt == null) return;
    const el = headerRef.current;
    if (!el) return;
    el.classList.remove("pulse-amber");
    void el.offsetWidth;
    el.classList.add("pulse-amber");
    setFlushedFlash(true);
    const tm = window.setTimeout(() => setFlushedFlash(false), 1800);
    return () => window.clearTimeout(tm);
  }, [state.lastBatchAt]);

  const countLabel =
    count === 0
      ? t("live.empty")
      : t(count === 1 ? "live.count.one" : "live.count.other", {
          values: { count },
        });

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900 shadow-[0_1px_0_rgba(255,255,255,0.02),0_24px_60px_-30px_rgba(0,0,0,0.6)] overflow-hidden">
      <div
        ref={headerRef}
        className="flex items-center gap-3 px-5 py-4 border-b border-ink-800 bg-gradient-to-b from-ink-900 to-ink-900/70 rounded-t-2xl"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-amber blink" />
          <span className="absolute inset-0 rounded-full bg-amber/40 animate-ping" />
        </span>
        <h2 className="text-[1.05rem] font-semibold tracking-tight text-ink-50">
          {t("live.title")}
        </h2>
        {sc.mode !== "idle" ? (
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-ink-950 bg-emerald-400 px-1.5 py-0.5 rounded-sm ml-auto inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-ink-950 blink" />
            {sc.mode === "looping" ? "loop" : "auto"}
          </span>
        ) : (
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-amber-bright bg-amber-soft px-1.5 py-0.5 rounded-sm ml-auto">
            live
          </span>
        )}
      </div>

      <div className="px-5 py-3 flex items-center gap-3 text-sm border-b border-ink-800">
        <span className="mono text-xs tabular-nums text-ink-100">
          {String(count).padStart(2, "0")}
        </span>
        <span className="text-ink-300">{countLabel}</span>
        {flushedFlash && (
          <span className="ml-auto mono text-[11px] text-amber-bright slide-in">
            {t("live.flushed")}
          </span>
        )}
        {count > 0 && !flushedFlash && (
          <button
            type="button"
            onClick={() => missingStore.clear()}
            className="ml-auto mono text-[11px] uppercase tracking-wider text-ink-300 hover:text-ink-50 transition-colors"
          >
            {t("panel.clear")}
          </button>
        )}
      </div>

      <p className="px-5 py-3 text-xs text-ink-300 border-b border-ink-800">
        {t("live.subtitle")}
      </p>

      <ol className="divide-y divide-ink-800 max-h-[24rem] overflow-y-auto">
        {state.events.length === 0 && (
          <li className="px-5 py-12 text-center text-ink-300 text-sm">
            <span className="mono text-[11px] uppercase tracking-[0.18em] text-ink-300/60 block mb-2">
              POST /v1/missing
            </span>
            {t("live.empty")}
          </li>
        )}
        {state.events.map((ev, i) => (
          <li
            key={`${ev.language_code}-${ev.namespace}-${ev.key}-${ev._receivedAt}-${i}`}
            className="px-5 py-3 grid grid-cols-[1fr_auto_auto] items-center gap-3 slide-in"
          >
            <code
              className="mono text-[13px] text-ink-100 truncate"
              title={ev.key}
            >
              <span className="text-emerald-400">{ev.namespace}</span>
              <span className="text-ink-300">:</span>
              {ev.key}
            </code>
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-amber-bright bg-amber-soft px-1.5 py-0.5 rounded-sm">
              {ev.language_code}
            </span>
            <time
              className="mono text-[11px] text-ink-300 tabular-nums"
              dateTime={new Date(ev._receivedAt).toISOString()}
            >
              {formatTime(ev._receivedAt, i18n.locale)}
            </time>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatTime(ts: number, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleTimeString();
  }
}
