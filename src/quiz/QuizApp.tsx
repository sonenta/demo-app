import { useState, useSyncExternalStore } from "react";
import { useTranslation } from "@verbumia/react-i18next";
import { Brand } from "../components/Brand";
import { LangSwitcher } from "../components/LangSwitcher";
import { Splash } from "../components/Splash";
import { quizStore } from "./quiz-store";
import { QUESTIONS, ANSWER_INDICES, TOTAL_QUESTIONS } from "./questions";
import { openFeedbackPanel, feedbackReady } from "./feedback";

/**
 * The trivia showcase. Every visible string is resolved through the
 * Verbumia SDK's `t()` so it is a live rate-able / suggest-able target
 * for the @verbumia/feedback plugin. The "Rate the translations" CTA
 * drives the plugin through its imperative controller (see ./feedback).
 */
export function QuizApp() {
  const { t, i18n } = useTranslation("quiz");
  const state = useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot);

  return (
    <div
      className={`min-h-screen flex flex-col transition-opacity duration-300 ${
        i18n.ready ? "opacity-100" : "opacity-0"
      }`}
    >
      <Splash ready={i18n.ready} />
      <header className="sticky top-0 z-30 backdrop-blur-md bg-ink-950/75 border-b border-ink-800">
        <div className="mx-auto max-w-3xl flex items-center gap-4 px-6 h-14">
          <a href={import.meta.env.BASE_URL} className="inline-flex" aria-label="Verbumia">
            <Brand />
          </a>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-300 px-2 py-0.5 border border-ink-700 rounded-sm">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            {t("meta.title")}
          </span>
          <div className="ml-auto flex items-center gap-4">
            <LangSwitcher />
            <a
              href={import.meta.env.BASE_URL}
              className="hidden sm:inline-flex items-center text-sm font-medium text-ink-300 hover:text-ink-50 transition-colors"
            >
              ← {t("nav.back")}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
        {state.phase === "setup" && <Setup />}
        {(state.phase === "playing" || state.phase === "answered") && <Play />}
        {state.phase === "result" && <Result />}
      </main>

      <RateBar />
    </div>
  );
}

function Setup() {
  const { t } = useTranslation("quiz");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    quizStore.start(
      p1.trim() || t("setup.player1.default"),
      p2.trim() || t("setup.player2.default"),
    );
  };

  return (
    <form onSubmit={submit} className="slide-in">
      <p className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-400">
        {t("meta.tagline")}
      </p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-50">
        {t("setup.heading")}
      </h1>
      <p className="mt-4 text-ink-300 leading-relaxed">
        {t("setup.blurb")}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field
          label={t("setup.player1.label")}
          value={p1}
          onChange={setP1}
          placeholder={t("setup.player1.default")}
        />
        <Field
          label={t("setup.player2.label")}
          value={p2}
          onChange={setP2}
          placeholder={t("setup.player2.default")}
        />
      </div>

      <button
        type="submit"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-ink-950 transition-colors hover:bg-emerald-400"
      >
        {t("setup.start")} →
      </button>
    </form>
  );
}

function Field(props: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-ink-300">{props.label}</span>
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        maxLength={24}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-ink-700 bg-ink-900/60 px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 focus-visible:border-emerald-400"
      />
    </label>
  );
}

function Play() {
  const { t } = useTranslation("quiz");
  const state = useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot);
  const q = QUESTIONS[state.questionIndex];
  const answered = state.phase === "answered";
  const active = state.players[state.active];
  const last = state.questionIndex === TOTAL_QUESTIONS - 1;

  return (
    <div className="slide-in" key={q.id}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono uppercase tracking-[0.16em] text-ink-300">
          {t("hud.question", {
            current: state.questionIndex + 1,
            total: TOTAL_QUESTIONS,
          })}
        </span>
        <span className="rounded-full border border-emerald-600/50 bg-emerald-500/10 px-3 py-1 text-emerald-300">
          {t("hud.turn", { name: active.name })}
        </span>
      </div>

      <Scoreboard />

      <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink-50">
        {t(`q.${q.id}.prompt`)}
      </h2>

      <ul className="mt-6 grid gap-3">
        {ANSWER_INDICES.map((i) => {
          const isCorrect = i === q.correct;
          const isPicked = state.picked === i;
          let cls =
            "border-ink-700 bg-ink-900/50 hover:border-ink-500 hover:bg-ink-900";
          if (answered) {
            if (isCorrect)
              cls = "border-emerald-500 bg-emerald-500/15 text-emerald-100";
            else if (isPicked)
              cls = "border-amber bg-amber-soft text-amber-bright";
            else cls = "border-ink-800 bg-ink-900/30 text-ink-500";
          }
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => quizStore.answer(i)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-default ${cls}`}
              >
                <span className="mono mr-3 text-ink-500">{i}</span>
                {t(`q.${q.id}.a.${i}`)}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div className="mt-6 slide-in">
          <p
            className={
              state.picked === q.correct
                ? "text-emerald-300"
                : "text-amber-bright"
            }
          >
            {state.picked === q.correct
              ? t("feedback.correct")
              : t("feedback.wrong", {
                  answer: t(`q.${q.id}.a.${q.correct}`),
                })}
          </p>
          <button
            type="button"
            onClick={() => quizStore.next()}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-ink-950 transition-colors hover:bg-emerald-400"
          >
            {last ? t("action.finish") : t("action.next")} →
          </button>
        </div>
      )}
    </div>
  );
}

function Scoreboard() {
  const { t } = useTranslation("quiz");
  const state = useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot);
  return (
    <div className="mt-4 flex gap-3">
      {state.players.map((p, i) => (
        <div
          key={i}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            state.active === i && state.phase !== "result"
              ? "border-emerald-600/50 bg-emerald-500/10 text-ink-50"
              : "border-ink-800 bg-ink-900/40 text-ink-300"
          }`}
        >
          {t("hud.score", { name: p.name, score: p.score })}
        </div>
      ))}
    </div>
  );
}

function Result() {
  const { t } = useTranslation("quiz");
  const state = useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot);
  const [a, b] = state.players;
  const tie = a.score === b.score;
  const winner = a.score > b.score ? a : b;

  return (
    <div className="slide-in text-center">
      <p className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-400">
        {t("result.heading")}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-50">
        {tie
          ? t("result.tie")
          : t("result.winner", { name: winner.name })}
      </h1>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {state.players.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border border-ink-800 bg-ink-900/40 px-4 py-4 text-ink-100"
          >
            {t("result.scoreline", {
              name: p.name,
              score: p.score,
              total: TOTAL_QUESTIONS,
            })}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => quizStore.reset()}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-ink-950 transition-colors hover:bg-emerald-400"
        >
          {t("result.again")}
        </button>
        <a
          href={import.meta.env.BASE_URL}
          className="inline-flex items-center justify-center rounded-lg border border-ink-700 px-6 py-3 font-medium text-ink-100 transition-colors hover:border-ink-500"
        >
          {t("nav.back")}
        </a>
      </div>
    </div>
  );
}

/**
 * Fixed CTA that opens the @verbumia/feedback panel for the strings on
 * screen. Hidden until the plugin binds its controller (i.e. once the
 * package is wired) so it never looks broken in the pre-publish demo.
 */
function RateBar() {
  const { t } = useTranslation("quiz");
  const ready = useSyncExternalStore(
    feedbackReady.subscribe,
    feedbackReady.getSnapshot,
  );
  if (!ready) return null;
  return (
    <div className="sticky bottom-0 z-30 border-t border-ink-800 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-end px-6 py-3">
        <button
          type="button"
          onClick={openFeedbackPanel}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-600/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
        >
          ★ {t("action.rate")}
        </button>
      </div>
    </div>
  );
}
