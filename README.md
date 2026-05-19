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
- `public/locales/{fr,en,es}/common.json` — translation bundles, mock-served from a "CDN-shaped" path so the demo mirrors production wiring.

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
