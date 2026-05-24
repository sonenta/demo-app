/**
 * Single source of truth for the Verbumia provider's version + realtime
 * runtime config, shared by App.tsx (provider props + the @verbumia/realtime
 * plugin) and the live showcase UI (RealtimeBadge).
 *
 * Mirrors the env-gating the removed `liveUpdates` prop used to provide: the
 * prod Vercel demo runs on the PUBLISHED `main` version over the CDN
 * (env=prod, ~60s freshness, no persistent WS — realtime stands down). Opt
 * into a dev version + live updates by setting VITE_VERBUMIA_VERSION and
 * VITE_VERBUMIA_ENV=dev for a local/dev-version showcase. Realtime is
 * DEV-VERSION ONLY by backend gating (contract #738): the plugin probes the
 * version's dev/published state and only subscribes for dev versions.
 */

/** Centrifugo node the realtime plugin dials on dev versions (prod default). */
export const PROD_REALTIME_WS = "wss://rt.verbumia.ca/connection/websocket";

export const verbumiaRuntime = {
  /** CDN version slug fed to <VerbumiaProvider version>. `main` = published. */
  version: import.meta.env.VITE_VERBUMIA_VERSION ?? "main",
  /** `prod` (CDN, default) | `dev` (live runtime fetch + realtime-eligible). */
  env: (import.meta.env.VITE_VERBUMIA_ENV ?? "prod") as "prod" | "dev",
  /** WS URL the @verbumia/realtime plugin dials on dev versions. */
  realtimeWsUrl: import.meta.env.VITE_VERBUMIA_RT_WS ?? PROD_REALTIME_WS,
} as const;

/**
 * What the realtime plugin does given the current config. Derived from the
 * configured deployment env (the plugin exposes no live-status API): a `dev`
 * env targets a dev version → realtime subscribes and live-reloads bundles on
 * `translations_published`; a published version serves static CDN bundles.
 */
export const realtimeMode: "live" | "static" =
  verbumiaRuntime.env === "dev" ? "live" : "static";
