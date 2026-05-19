/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Verbumia `missing:write` API key (vrb_live_<prefix>.<secret>). Injected
   *  at build/deploy — never committed. See .env.example. */
  readonly VITE_VERBUMIA_TOKEN: string;
  /** Override the Verbumia API base. Unset → prod `https://api.verbumia.ca`.
   *  Set to `http://localhost:8820` for the LIVE feedback loop against the
   *  dev backend (demo-live-provisioning, kb sdk/demo-live-provisioning). */
  readonly VITE_VERBUMIA_API_BASE?: string;
  /** "true" enables the SDK realtime path (Centrifugo subscribe +
   *  translations_published cache-bust). DEV-VERSION ONLY — leave unset for
   *  the prod Vercel demo, which runs without a persistent WS. */
  readonly VITE_VERBUMIA_LIVE_UPDATES?: string;
  /** Centrifugo WebSocket URL (…/connection/websocket). Only consulted when
   *  VITE_VERBUMIA_LIVE_UPDATES=true. Falls back to localhost for local dev. */
  readonly VITE_VERBUMIA_CENTRIFUGO_WS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
