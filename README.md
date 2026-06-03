# Verbumia Demo

Live showcase of [`@verbumia/react-i18next`](https://verbumia.ca) — the i18n SDK with a runtime missing-key handler.

This app is the dogfood + marketing surface for Verbumia. It runs in three languages (FR / EN / ES) and visualises the SDK's missing-key detection in realtime, on stage, on demand.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Scenario URLs (for marketing videos)

- `/?demo=play` — fires the four pre-baked missing-key triggers in sequence (3.5 s spacing) then stops.
- `/?demo=loop` — same sequence, then a 1.5 s reset (clears the panel) and restarts. Perfect for hands-off video loops.

## Layout

- `src/sdk/verbumia-react-i18next.tsx` — local stub of the SDK while the real package (`@verbumia/react-i18next`) is being built by the backend peer. Same public surface; one-line swap when published.
- `src/components/MissingKeysPanel.tsx` — the live telemetry strip that shows untranslated keys as the user clicks around.
- `src/components/ScenarioRunner.tsx` — drives the autoplay/loop scenario via the SDK's real `t()` path (same code path as a manual click).
- `src/state/missing-store.ts`, `src/state/scenario-store.ts` — small external stores (`useSyncExternalStore`) for the live panel and scenario state.
- `src/components/InContextPanel.tsx`, `src/state/in-context-store.ts` — the live-translate (in-context) showcase: pairing box + live edit log. See below.
- `public/locales/{fr,en,es}/common.json` — translation bundles, mock-served from a "CDN-shaped" path so the demo mirrors production wiring.

## In-context live editing (`@verbumia/in-context`)

The demo also showcases [`@verbumia/in-context`](https://verbumia.ca) — pair the running
app to a translator's editor session and watch dashboard edits apply to the
on-screen strings **in place, with no reload**.

The plugin is **headless** (same model as `@verbumia/feedback` / `@verbumia/realtime`):
it owns no UI. The host (this app) provides the pairing UI and drives the plugin
through an imperative controller.

1. **Register** the plugin in the provider's `plugins[]` (`src/App.tsx`):

   ```tsx
   import { inContextPlugin } from "@verbumia/in-context/react";

   inContextPlugin({
     device: "demo-app · web",
     onReady:   (c)  => inContextStore.setController(c), // imperative handle
     onStatus:  (s)  => inContextStore.setStatus(s),     // idle→connecting→connected
     onEdit:    (e)  => inContextStore.pushEdit(e),       // applied edit (after re-render)
     onPaired:  ()   => inContextStore.markPaired(),
     onSessionEnd: () => inContextStore.reset(),
   })
   ```

   It reuses the provider's `apiBase` / `projectUuid` / locale; the pair response
   carries its own realtime URL + scoped sub-token (no hardcoded WS host).

2. **Pair** from the UI (`src/components/InContextPanel.tsx`): the translator opens
   in-context mode in the Verbumia dashboard, gets a pairing code (the QR's
   `ict_` token), pastes it into the box, and the panel calls:

   ```ts
   await controller.pair(code, "demo-app · web");
   ```

3. **Report on-screen keys** so the editor can highlight what's visible. The plugin
   reports automatically on pair and on language change; this app additionally calls
   `controller.reportKeys()` on in-page (hash) navigation (`src/App.tsx`).

Once paired, every edit the translator makes in the dashboard is pushed over the
session channel and applied as an in-memory i18next override with an immediate
re-render — the `EDIT · SESSION CHANNEL` log in the panel is the proof. The panel
is intentionally language-neutral chrome (it edits the *real* `t(...)` strings
elsewhere on the page), matching the realtime/live-status badges.

## Surface variants (`@verbumia/react-i18next` ≥1.1.0)

The demo also showcases **surface variants** — a second resolution dimension
layered on top of the locale chain. A *surface* (`desktop` / `tablet` /
`mobile`) is an additive overlay: the base bundle applies to every surface, and
a sparse overlay overrides individual keys per surface. `t()` returns the
surface's value when an overlay provides one, else the base — so one key serves
long desktop copy and short mobile copy with no separate keys and no reload.

- **Wiring** (`src/components/SurfaceShowcase.tsx`): an isolated
  `VerbumiaProvider` with `surface="desktop"` + `surfaceBreakpoints={true}`. The
  provider maps `window.innerWidth` → surface via `matchMedia` and calls
  `setSurface` on resize. A manual `desktop/tablet/mobile` toggle (calls
  `i18n.setSurface`) lets you force a surface without resizing.
- **Asset variants**: an overlay key can carry `{ "$value": …, "$asset": {
  kind, ref } }`. `t()` returns `$value`; `i18n.asset(key)` returns the
  per-surface `$asset` (here, a device icon that swaps desktop↔tablet↔mobile).
- **Locale**: the showcase provider's locale is synced to the main app's, so it
  respects the FR/EN/ES switcher.

**Overlay content** is served from a demo-hosted, CDN-shaped path
(`public/surface-cdn/p/{project}/{version}/latest/{locale}/{ns}.{surface}.json`,
generated by `scripts/gen-surface-cdn.mjs`) via the provider's `cdnBase`
override. The SDK fetches overlays from
`{cdnBase}/p/{projectUuid}/{version}/latest/{locale}/{ns}.{surface}.json`. This
is self-contained because surface-overlay authoring isn't yet exposed on the
production CDN tooling; swap `cdnBase` back to the default once it is.

## Stack

React 19 · TypeScript · Vite 6 · Tailwind v4 — system fonts only, zero Google Fonts payload. Deployable to Vercel / Netlify / any static host.

## Deploy

### Vercel

```bash
npm i -g vercel
vercel
```

Vercel auto-detects the Vite framework. `vercel.json` ships the right cache policy (immutable on `/assets/*`, 60 s + SWR on `/locales/*`).

Or deploy via the Vercel dashboard: import this repo, set the root to `demo-app/`, accept the Vite preset.

### Netlify / static host

```bash
npm run build
```

Serve the `dist/` folder. SPA fallback is not required (single route).

## Build output

A clean build is around **68 KB gzip** (JS + CSS combined). No images other than two SVGs (favicon + OG card).

## License

MIT.
