/**
 * Scenario store — drives the autoplay/loop demo.
 *
 * Runs a curated, ordered timeline of two kinds of beat:
 *   - `key`    — a t() call on an intentionally-missing key, so the SDK's
 *                missing-key handler fires and the inspector records it.
 *   - `locale` — a real locale switch through the SDK, so the whole page
 *                re-renders in the new language.
 *
 * The locale beats exist because a demo of an i18n product that never
 * switches language is a weak demo: the timeline reads "trigger fires ->
 * keys land -> language flips -> same page, new language". Both beats go
 * through the real SDK (t() / setLocale), exactly as a user click would —
 * nothing here is faked for the camera.
 *
 * One ordered timeline rather than two parallel lists, so the beats keep a
 * deterministic order and loop cleanly.
 *
 * The callbacks are wired by ScenarioRunner once it's mounted inside
 * <SonentaProvider> (where useTranslation is available).
 */
type Listener = () => void;

export type ScenarioMode = "idle" | "playing" | "looping";

export type Step =
  | { kind: "key"; key: string }
  | { kind: "locale"; locale: string };

export const SCENARIO_STEPS: readonly Step[] = [
  { kind: "key", key: "legal.gdpr.long_clause" },
  { kind: "key", key: "checkout.tax.tooltip" },
  { kind: "key", key: "error.payment.declined" },
  { kind: "key", key: "landing.coming_soon" },
  // …then show what the product is actually for.
  { kind: "locale", locale: "fr" },
  { kind: "locale", locale: "es" },
  // back to the default so a loop starts from a clean, identical frame.
  { kind: "locale", locale: "en" },
] as const;

/** The missing keys this scenario fires (still exported for the UI list). */
export const SCENARIO_KEYS = SCENARIO_STEPS.filter(
  (s): s is Extract<Step, { kind: "key" }> => s.kind === "key",
).map((s) => s.key);

export const TICK_MS = 3500;
/** Locale beats dwell a little shorter — the payoff is instant and the
 *  viewer only needs long enough to read that the page changed language. */
export const LOCALE_HOLD_MS = 2500;
export const RESET_MS = 1500;

const stepDelay = (s: Step | undefined) =>
  s?.kind === "locale" ? LOCALE_HOLD_MS : TICK_MS;

type State = {
  mode: ScenarioMode;
  cursor: number;
  nextFireAt: number | null;
};

let state: State = { mode: "idle", cursor: 0, nextFireAt: null };
const listeners = new Set<Listener>();

const emit = () => {
  for (const l of listeners) l();
};

const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

let fireFn: ((key: string) => void) | null = null;
let resetFn: (() => void) | null = null;
let setLocaleFn: ((locale: string) => void) | null = null;
let timerId: number | null = null;

const cancelTimer = () => {
  if (timerId != null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
};

const runStep = (step: Step) => {
  if (step.kind === "key") fireFn?.(step.key);
  else setLocaleFn?.(step.locale);
};

const tick = () => {
  if (state.mode === "idle") return;
  const step = SCENARIO_STEPS[state.cursor];
  if (step) runStep(step);
  const isLast = state.cursor >= SCENARIO_STEPS.length - 1;
  if (isLast) {
    if (state.mode === "looping") {
      set({ cursor: 0, nextFireAt: Date.now() + RESET_MS + TICK_MS });
      timerId = window.setTimeout(() => {
        if (resetFn) resetFn();
        timerId = window.setTimeout(tick, TICK_MS);
      }, RESET_MS);
    } else {
      set({ mode: "idle", cursor: 0, nextFireAt: null });
    }
  } else {
    const next = state.cursor + 1;
    const wait = stepDelay(SCENARIO_STEPS[state.cursor]);
    set({ cursor: next, nextFireAt: Date.now() + wait });
    timerId = window.setTimeout(tick, wait);
  }
};

export const scenarioStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): State {
    return state;
  },
  attach(
    fire: (key: string) => void,
    reset: () => void,
    setLocale: (locale: string) => void,
  ) {
    fireFn = fire;
    resetFn = reset;
    setLocaleFn = setLocale;
  },
  start(mode: Exclude<ScenarioMode, "idle">) {
    cancelTimer();
    set({ mode, cursor: 0, nextFireAt: Date.now() + 200 });
    timerId = window.setTimeout(tick, 200);
  },
  stop() {
    cancelTimer();
    set({ mode: "idle", cursor: 0, nextFireAt: null });
  },
};
