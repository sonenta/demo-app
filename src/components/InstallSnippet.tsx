import { useMemo, useState } from "react";
import { useTranslation } from "@verbumia/react-i18next";
import { tokenizeBash, tokenizeTsx, type Token } from "../lib/highlight";

const INSTALL = `npm install @verbumia/react-i18next`;

const USAGE = `import { VerbumiaProvider, useTranslation } from "@verbumia/react-i18next";

function App() {
  return (
    <VerbumiaProvider
      projectId="proj_xxx"
      apiKey={import.meta.env.VITE_VERBUMIA_KEY}
      defaultLocale="en"
    >
      <Hero />
    </VerbumiaProvider>
  );
}

function Hero() {
  const { t } = useTranslation();
  return <h1>{t("hero.title")}</h1>;
}`;

export function InstallSnippet() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <header className="max-w-2xl mb-8">
        <p className="mono text-[11px] uppercase tracking-[0.22em] text-emerald-400 inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          {t("install.eyebrow")}
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-ink-50 mt-3">
          {t("install.title")}
        </h2>
      </header>
      <div className="grid lg:grid-cols-2 gap-4">
        <CodeBlock code={INSTALL} lang="bash" caption="terminal" />
        <CodeBlock code={USAGE} lang="tsx" caption="src/App.tsx" />
      </div>
    </section>
  );
}

function CodeBlock({
  code,
  lang,
  caption,
}: {
  code: string;
  lang: "bash" | "tsx";
  caption: string;
}) {
  const tokens = useMemo<Token[]>(
    () => (lang === "bash" ? tokenizeBash(code) : tokenizeTsx(code)),
    [code, lang],
  );
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked — non-fatal in demo context
    }
  };

  return (
    <figure className="rounded-2xl border border-ink-800 bg-ink-900 overflow-hidden shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]">
      <figcaption className="flex items-center gap-3 px-4 py-2.5 border-b border-ink-800 text-xs">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
        </span>
        <span className="mono uppercase tracking-[0.18em] text-ink-300">
          {caption}
        </span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto mono text-[10px] uppercase tracking-[0.18em] text-ink-300 hover:text-emerald-400 transition-colors"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </figcaption>
      <pre className="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed mono">
        <code>
          {tokens.map((tok, i) => (
            <span key={i} className={`tok-${tok.kind}`}>
              {tok.text}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
