import { sonentaRuntime, realtimeMode } from "../lib/sonenta-runtime";

/**
 * Language-neutral status strip for the @sonenta/realtime plugin + the
 * provider `version` param (0.9.0). Realtime is DEV-VERSION ONLY: the prod
 * demo's published `main` version serves static CDN bundles and the plugin
 * stands down; a dev version subscribes to Centrifugo and live-reloads on
 * `translations_published`. Technical/identifier labels (kept untranslated,
 * matching the existing `live` / `loop` / `POST /v1/missing` badges) reflect
 * the configured runtime (src/lib/sonenta-runtime.ts), not a live socket.
 */
export function RealtimeBadge() {
  const live = realtimeMode === "live";
  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-ink-800 bg-ink-950/60 px-4 py-2.5">
      <span className="inline-flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span
            className={[
              "absolute inset-0 rounded-full",
              live ? "bg-emerald-400" : "bg-ink-300/40",
            ].join(" ")}
          />
          {live && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
          )}
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-ink-300">
          @sonenta/realtime
        </span>
      </span>

      <span className="mono text-xs text-ink-300">
        version <span className="text-ink-50">{sonentaRuntime.version}</span>
      </span>
      <span className="mono text-xs text-ink-300">
        env <span className="text-ink-50">{sonentaRuntime.env}</span>
      </span>

      <span aria-hidden className="text-ink-300/50">
        →
      </span>

      {live ? (
        <span className="mono text-[11px] uppercase tracking-[0.14em] text-ink-950 bg-emerald-400 px-2 py-0.5 rounded-sm">
          live · Centrifugo
        </span>
      ) : (
        <span className="mono text-[11px] uppercase tracking-[0.14em] text-ink-300 border border-ink-800 px-2 py-0.5 rounded-sm">
          static · CDN ~60s
        </span>
      )}
    </div>
  );
}
