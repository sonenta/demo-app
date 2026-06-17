/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sonenta `missing:write` API key (vrb_live_<prefix>.<secret>). Injected
   *  at build/deploy — never committed. See .env.example. */
  readonly VITE_SONENTA_TOKEN: string;
  /** Override the Sonenta API base. Unset → prod `https://api.sonenta.dev`.
   *  Set to `http://localhost:8820` for the LIVE feedback loop against the
   *  dev backend (demo-live-provisioning, kb sdk/demo-live-provisioning). */
  readonly VITE_SONENTA_API_BASE?: string;
  /** Project version slug fed to <SonentaProvider version> (0.9.0). Defaults
   *  to `main` (the published prod bundle). Set to a dev version slug to fetch
   *  that version's bundles and (with env=dev) enable live updates. */
  readonly VITE_SONENTA_VERSION?: string;
  /** Deployment env fed to <SonentaProvider env>: `prod` (default, CDN ~60s
   *  freshness) or `dev` (live runtime fetch; realtime-eligible). Leave unset
   *  for the prod Vercel demo. */
  readonly VITE_SONENTA_ENV?: "prod" | "dev";
  /** Centrifugo WebSocket URL (…/connection/websocket) dialed by the
   *  @sonenta/realtime plugin on dev versions. Defaults to the prod node
   *  `wss://rt.sonenta.dev/connection/websocket`; the plugin stands down on
   *  published versions regardless. */
  readonly VITE_SONENTA_RT_WS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
