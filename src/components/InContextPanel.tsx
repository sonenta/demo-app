import { useState, useSyncExternalStore } from "react";
import { inContextStore } from "../state/in-context-store";
import type { SessionStatus } from "@sonenta/in-context/react";

/**
 * Visible affordance for the @sonenta/in-context plugin (headless — the host
 * owns this UI). The customer (a translator) opens the editor in the Sonenta
 * dashboard, gets a short pairing code, pastes it here and hits Pair; from then
 * on every edit they make in the dashboard is pushed over the session channel
 * and applied to the on-screen strings IN PLACE — no reload. The edit log below
 * is the proof.
 *
 * Language-neutral by design, matching the RealtimeBadge / live-status chrome:
 * the strings it live-edits are the *real* t(...) strings elsewhere on the page,
 * so this control surface stays untranslated (and out of the missing-key feed).
 */
const STATUS_STYLE: Record<SessionStatus, { dot: string; label: string }> = {
  idle: { dot: "bg-ink-300/40", label: "idle" },
  connecting: { dot: "bg-amber blink", label: "connecting" },
  connected: { dot: "bg-emerald-400", label: "connected" },
  disconnected: { dot: "bg-amber", label: "disconnected" },
  ended: { dot: "bg-ink-300/40", label: "ended" },
};

export function InContextPanel() {
  const state = useSyncExternalStore(
    inContextStore.subscribe,
    inContextStore.getSnapshot,
    inContextStore.getSnapshot,
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const live = state.status === "connected";
  const status = STATUS_STYLE[state.status];

  async function pair(e: React.FormEvent) {
    e.preventDefault();
    const token = code.trim();
    if (!token || !state.controller) return;
    setBusy(true);
    inContextStore.setError(null);
    try {
      await state.controller.pair(token, "demo-app · web");
      setCode("");
    } catch (err) {
      inContextStore.setError(
        err instanceof Error ? err.message : "pairing failed",
      );
    } finally {
      setBusy(false);
    }
  }

  function end() {
    state.controller?.end();
  }

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900 shadow-[0_1px_0_rgba(255,255,255,0.02),0_24px_60px_-30px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-800 bg-gradient-to-b from-ink-900 to-ink-900/70">
        <span className="relative flex h-2.5 w-2.5">
          <span className={["absolute inset-0 rounded-full", status.dot].join(" ")} />
          {live && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
          )}
        </span>
        <h2 className="mono text-[11px] uppercase tracking-[0.18em] text-ink-50">
          @sonenta/in-context
        </h2>
        <span
          className={[
            "mono text-[10px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-sm ml-auto",
            live
              ? "text-ink-950 bg-emerald-400"
              : "text-ink-300 border border-ink-800",
          ].join(" ")}
        >
          {status.label}
        </span>
      </div>

      <p className="px-5 py-3 text-xs text-ink-300 border-b border-ink-800">
        Paste the pairing code from the Sonenta editor to live-translate this
        page in place — edits apply on screen, no reload.
      </p>

      {!live ? (
        <form onSubmit={pair} className="px-5 py-4 flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="pairing code"
            autoComplete="off"
            spellCheck={false}
            aria-label="editor pairing code"
            className="flex-1 mono text-sm tracking-[0.12em] bg-ink-950/60 border border-ink-800 rounded-lg px-3 py-2 text-ink-50 placeholder:text-ink-300/50 focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/40 transition-colors"
          />
          <button
            type="submit"
            disabled={!code.trim() || !state.controller || busy}
            className="mono text-[11px] uppercase tracking-[0.14em] px-3 py-2 rounded-lg bg-emerald-400 text-ink-950 font-semibold hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? "pairing…" : "pair"}
          </button>
        </form>
      ) : (
        <div className="px-5 py-3 flex items-center gap-3 text-sm border-b border-ink-800">
          {state.sessionId && (
            <span className="mono text-xs text-ink-300">
              session{" "}
              <span className="text-ink-50">{state.sessionId.slice(0, 8)}</span>
            </span>
          )}
          <span className="mono text-xs text-ink-300">
            devices <span className="text-ink-50 tabular-nums">{state.paired}</span>
          </span>
          <button
            type="button"
            onClick={end}
            className="ml-auto mono text-[11px] uppercase tracking-wider text-ink-300 hover:text-ink-50 transition-colors"
          >
            end
          </button>
        </div>
      )}

      {state.error && (
        <p className="px-5 py-2 mono text-[11px] text-amber-bright bg-amber-soft border-b border-ink-800">
          {state.error}
        </p>
      )}

      {!state.controller && (
        <p className="px-5 py-2 mono text-[10px] uppercase tracking-[0.18em] text-ink-300/60 border-b border-ink-800">
          plugin initializing…
        </p>
      )}

      <ol className="divide-y divide-ink-800 max-h-[18rem] overflow-y-auto">
        {state.edits.length === 0 && (
          <li className="px-5 py-10 text-center text-ink-300 text-sm">
            <span className="mono text-[11px] uppercase tracking-[0.18em] text-ink-300/60 block mb-2">
              edit · session channel
            </span>
            No edits yet — pair an editor session to see live overrides land here.
          </li>
        )}
        {state.edits.map((ev, i) => (
          <li
            key={`${ev.languageCode}-${ev.namespace}-${ev.key}-${ev._receivedAt}-${i}`}
            className="px-5 py-3 grid grid-cols-[1fr_auto] items-start gap-3 slide-in"
          >
            <div className="min-w-0">
              <code className="mono text-[13px] text-ink-100 truncate block" title={ev.key}>
                <span className="text-emerald-400">{ev.namespace}</span>
                <span className="text-ink-300">:</span>
                {ev.key}
              </code>
              <span className="text-xs text-ink-300 truncate block" title={ev.value}>
                {ev.value}
              </span>
            </div>
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-ink-950 bg-emerald-400 px-1.5 py-0.5 rounded-sm">
              {ev.languageCode}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
