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
let setLocaleFn: ((locale: string) => Promise<void>) | null = null;
let getLocaleFn: (() => string) | null = null;
let timerId: number | null = null;

/** The visitor's own language when they pressed Play. The scenario borrows the
 *  page; it does not get to keep it. Restored when the run ends or is stopped —
 *  otherwise someone browsing in FR who clicks Play is silently left in EN. */
let entryLocale: string | null = null;

const cancelTimer = () => {
  if (timerId != null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
};

/** A locale beat is only "held" once the language has actually PAINTED.
 *  `setLocale` is async — it fetches the target bundle — so starting the dwell
 *  clock when we CALL it means that on a cold bundle the new language shows for
 *  a fraction of the dwell, or the loop moves on before it renders at all. Await
 *  the switch, then dwell. */
const runStep = async (step: Step): Promise<void> => {
  if (step.kind === "key") fireFn?.(step.key);
  else await setLocaleFn?.(step.locale);
};

const tick = () => {
  if (state.mode === "idle") return;
  const step = SCENARIO_STEPS[state.cursor];
  const advance = () => {
    // Re-check: the run may have been stopped while we awaited the switch.
    if (state.mode === "idle") return;
    const isLast = state.cursor >= SCENARIO_STEPS.length - 1;
    if (isLast) {
      if (state.mode === "looping") {
        // ⚠️ THE LOOP IS UNPROVEN. DO NOT COPY THIS INTO ANOTHER DEMO YET.
        //
        // The SDK dedups missing keys on (locale, namespace, key) and its `seen`
        // Set is never cleared, with no reachable reset — so a key is reportable
        // ONCE per i18n instance, forever. Cycle 2 re-fires the SAME keys, and
        // the inspector may therefore record NOTHING while this timeline happily
        // keeps ticking. The two look identical from the outside unless you watch
        // the PANEL rather than the scenario.
        //
        // This loop APPEARED to work across three cycles in local testing. That
        // is very likely an artifact: the locale beats rotate en→fr→es, which
        // changes the locale component of the dedup key and hands each locale a
        // fresh reporting budget. "Three cycles" was probably just "three
        // locales", i.e. this MASKS the SDK bug rather than escaping it. Once the
        // locales are exhausted the panel should go dead — demo-app-svelte proved
        // exactly that on their live looping demo.
        //
        // NOT YET VERIFIED, because it needs a live page: does cycle 2's `en`
        // phase record anything at all? Nobody has run that check.
        //
        // The real fix is i18n.resetMissingDedup() (i18n-core ≥1.1.1), which
        // @sonenta/react-i18next cannot reach today — it vendors its own engine
        // copy and does not depend on i18n-core, so the API is simply absent.
        // Wire the reset in HERE, next to resetFn(), once the SDK exposes it.
        set({ cursor: 0, nextFireAt: Date.now() + RESET_MS + TICK_MS });
        timerId = window.setTimeout(() => {
          if (resetFn) resetFn();
          timerId = window.setTimeout(tick, TICK_MS);
        }, RESET_MS);
      } else {
        set({ mode: "idle", cursor: 0, nextFireAt: null });
        restoreEntryLocale();
      }
    } else {
      const wait = stepDelay(step);
      set({ cursor: state.cursor + 1, nextFireAt: Date.now() + wait });
      timerId = window.setTimeout(tick, wait);
    }
  };
  if (!step) return advance();
  void runStep(step).then(advance, advance);
};

const restoreEntryLocale = () => {
  const back = entryLocale;
  entryLocale = null;
  if (back && getLocaleFn && getLocaleFn() !== back) void setLocaleFn?.(back);
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
    setLocale: (locale: string) => Promise<void>,
    getLocale: () => string,
  ) {
    fireFn = fire;
    resetFn = reset;
    setLocaleFn = setLocale;
    getLocaleFn = getLocale;
  },
  start(mode: Exclude<ScenarioMode, "idle">) {
    cancelTimer();
    // Remember where the visitor was before we borrow their page.
    entryLocale = getLocaleFn?.() ?? null;
    set({ mode, cursor: 0, nextFireAt: Date.now() + 200 });
    timerId = window.setTimeout(tick, 200);
  },
  stop() {
    cancelTimer();
    set({ mode: "idle", cursor: 0, nextFireAt: null });
    restoreEntryLocale();
  },
};
