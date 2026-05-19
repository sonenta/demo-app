import { useEffect } from "react";
import { VerbumiaProvider, useTranslation } from "@verbumia/react-i18next";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { LiveSection } from "./components/LiveSection";
import { Features } from "./components/Features";
import { Pricing } from "./components/Pricing";
import { InstallSnippet } from "./components/InstallSnippet";
import { Footer } from "./components/Footer";
import { ScenarioRunner } from "./components/ScenarioRunner";
import { Splash } from "./components/Splash";
import { missingStore } from "./state/missing-store";
import { QuizApp } from "./quiz/QuizApp";
import { feedbackPlugins } from "./quiz/feedback";

/**
 * Built once at module load so the provider's one-time plugin `setup()`
 * is not re-triggered on re-render (stable array identity).
 */
const PLUGINS = feedbackPlugins();

/** True when the browser is on the trivia-showcase route. */
const isQuizRoute = () =>
  typeof window !== "undefined" &&
  window.location.pathname.replace(/\/+$/, "") === "/quiz";

export function App() {
  return (
    <VerbumiaProvider
      token={import.meta.env.VITE_VERBUMIA_TOKEN}
      projectUuid="06a07109-3e3c-7bd7-8000-95368a87bd2e"
      defaultLocale="en"
      fallbackLng="en"
      namespaces={["common", "quiz"]}
      apiBase={
        import.meta.env.VITE_VERBUMIA_API_BASE ?? "https://api.verbumia.ca"
      }
      missingHandler="send"
      flushIntervalMs={5000}
      // Realtime is DEV-VERSION ONLY (master ruling, ltm 341): a promoted
      // PROD version has no Centrifugo WS — freshness comes from the CDN's
      // ~60s cache. Off by default so the Vercel prod demo runs WITHOUT a
      // persistent WS; opt in via env only for a local/dev-version showcase.
      // (Missing-key push still works in both modes over HTTP.)
      liveUpdates={import.meta.env.VITE_VERBUMIA_LIVE_UPDATES === "true"}
      centrifugoWsUrl={
        import.meta.env.VITE_VERBUMIA_CENTRIFUGO_WS ??
        "ws://localhost:8830/connection/websocket"
      }
      transport={(batch) => missingStore.pushBatch(batch)}
      // @verbumia/feedback attaches here as a provider plugin (frozen
      // contract c8e86de1): no 2nd context, rendered as an isolated
      // sibling leaf, opened imperatively from the quiz CTA. Wiring is
      // isolated in ./quiz/feedback.ts.
      plugins={PLUGINS}
    >
      {isQuizRoute() ? <QuizApp /> : <Shell />}
    </VerbumiaProvider>
  );
}

function Shell() {
  const { i18n } = useTranslation();

  // keep <html lang> in sync with the active locale for SEO + a11y.
  useEffect(() => {
    document.documentElement.lang = i18n.locale;
  }, [i18n.locale]);

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
          <Pricing />
        </main>
        <Footer />
      </div>
    </>
  );
}
