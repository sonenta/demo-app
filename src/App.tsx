import { useEffect } from "react";
import {
  SonentaProvider,
  useTranslation,
  type SonentaPlugin,
} from "@sonenta/react-i18next";
import { sonentaRealtime } from "@sonenta/realtime/react";
import { inContextPlugin } from "@sonenta/in-context/react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { LiveSection } from "./components/LiveSection";
import { Features } from "./components/Features";
import { Pricing } from "./components/Pricing";
import { InstallSnippet } from "./components/InstallSnippet";
import { Footer } from "./components/Footer";
import { ScenarioRunner } from "./components/ScenarioRunner";
import { SurfaceShowcase } from "./components/SurfaceShowcase";
import { Splash } from "./components/Splash";
import { missingStore } from "./state/missing-store";
import { inContextStore } from "./state/in-context-store";
import { QuizApp } from "./quiz/QuizApp";
import { feedbackPlugins } from "./quiz/feedback";
import { sonentaRuntime } from "./lib/sonenta-runtime";

/**
 * Built once at module load so each plugin's one-time `setup()` is not
 * re-triggered on re-render (stable array identity). Feedback + realtime
 * are siblings in the same provider `plugins` array.
 */
const PLUGINS: SonentaPlugin[] = [
  ...feedbackPlugins(),
  // Realtime moved OUT of the provider core in 0.9.0 — it is now a plugin.
  // `wsUrl` is the only required option; tokenEndpoint defaults to
  // `${apiBase}/v1/auth/centrifugo-token` and reuses the provider token.
  // DEV-VERSION ONLY: the plugin probes the version's dev/published state and
  // stands down (console warning) on a published version like prod's `main`,
  // where freshness comes from the CDN ~60s cache instead.
  sonentaRealtime({ wsUrl: sonentaRuntime.realtimeWsUrl }),
  // In-context (live-translate) showcase — HEADLESS plugin (same model as
  // feedback/realtime): no extra context, no render outlet. The host owns the
  // pairing UI (InContextPanel) and drives it via the controller handed back
  // here. Lifecycle callbacks funnel into inContextStore so the panel can show
  // status + a live log of edits applied in place. Reuses the provider's
  // apiBase/projectUuid/locale; the pair response carries its own rtUrl + token.
  inContextPlugin({
    device: "demo-app · web",
    onReady: (controller) => inContextStore.setController(controller),
    onStatus: (status) => inContextStore.setStatus(status),
    onEdit: (edit) => inContextStore.pushEdit(edit),
    onPaired: () => inContextStore.markPaired(),
    onSessionEnd: () => inContextStore.reset(),
  }),
];

/** True when the browser is on the trivia-showcase route, relative to BASE_URL. */
const isQuizRoute = () => {
  if (typeof window === "undefined") return false;
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  const path = window.location.pathname.replace(/\/+$/, "");
  return path === `${base}/quiz`;
};

export function App() {
  return (
    <SonentaProvider
      token={import.meta.env.VITE_SONENTA_TOKEN}
      projectUuid="06a07109-3e3c-7bd7-8000-95368a87bd2e"
      defaultLocale="en"
      fallbackLng="en"
      namespaces={["common", "quiz"]}
      apiBase={
        import.meta.env.VITE_SONENTA_API_BASE ?? "https://api.sonenta.dev"
      }
      missingHandler="send"
      flushIntervalMs={5000}
      // Version slug + deployment env (0.9.0). The prod Vercel demo runs on
      // the published `main` version over the CDN (env=prod, ~60s freshness,
      // no WS). Opt into a dev version + live updates by setting
      // VITE_SONENTA_VERSION + VITE_SONENTA_ENV=dev (see
      // src/lib/sonenta-runtime.ts). Realtime is the @sonenta/realtime
      // plugin in PLUGINS above (replaces the removed liveUpdates/centrifugoWsUrl).
      version={sonentaRuntime.version}
      env={sonentaRuntime.env}
      transport={(batch) => missingStore.pushBatch(batch)}
      // @sonenta/feedback attaches here as a provider plugin (frozen
      // contract c8e86de1): no 2nd context, rendered as an isolated
      // sibling leaf, opened imperatively from the quiz CTA. Wiring is
      // isolated in ./quiz/feedback.ts.
      plugins={PLUGINS}
    >
      {isQuizRoute() ? <QuizApp /> : <Shell />}
    </SonentaProvider>
  );
}

function Shell() {
  const { i18n } = useTranslation();

  // keep <html lang> in sync with the active locale for SEO + a11y.
  useEffect(() => {
    document.documentElement.lang = i18n.locale;
  }, [i18n.locale]);

  // Re-report on-screen keys to a paired in-context editor as the visitor moves
  // between sections (this SPA navigates via hash anchors). The plugin already
  // reports on pair + on language change; this covers in-page navigation.
  useEffect(() => {
    const onNav = () => void inContextStore.getSnapshot().controller?.reportKeys();
    window.addEventListener("hashchange", onNav);
    return () => window.removeEventListener("hashchange", onNav);
  }, []);

  return (
    <>
      <Splash ready={i18n.ready} />
      <ScenarioRunner ready={i18n.ready} />
      <div
        className={[
          "min-h-screen flex flex-col transition-opacity duration-300",
          i18n.ready ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <Header />
        <main className="flex-1">
          <Hero />
          <LiveSection />
          <InstallSnippet />
          <Features />
          <SurfaceShowcase />
          <Pricing />
        </main>
        <Footer />
      </div>
    </>
  );
}
