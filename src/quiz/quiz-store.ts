import { QUESTIONS, TOTAL_QUESTIONS } from "./questions";

/**
 * Hot-seat 2-player quiz state machine. External-store shape (subscribe /
 * getSnapshot) mirrors `missing-store` so it plugs straight into
 * `useSyncExternalStore`. Pure logic — no React, no SDK, no i18n.
 */
export type Phase = "setup" | "playing" | "answered" | "result";

export type Player = { name: string; score: number };

export type QuizState = {
  phase: Phase;
  players: [Player, Player];
  /** Index of the player whose turn it is (0 or 1). */
  active: 0 | 1;
  /** 0-based index into QUESTIONS. */
  questionIndex: number;
  /** The answer (1..5) the active player picked this question, or null. */
  picked: 1 | 2 | 3 | 4 | 5 | null;
};

type Listener = () => void;

const freshState = (): QuizState => ({
  phase: "setup",
  players: [
    { name: "", score: 0 },
    { name: "", score: 0 },
  ],
  active: 0,
  questionIndex: 0,
  picked: null,
});

let state: QuizState = freshState();
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export const quizStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): QuizState {
    return state;
  },

  start(name1: string, name2: string) {
    state = {
      ...freshState(),
      phase: "playing",
      players: [
        { name: name1, score: 0 },
        { name: name2, score: 0 },
      ],
    };
    emit();
  },

  /** Lock in the active player's answer and score it. */
  answer(choice: 1 | 2 | 3 | 4 | 5) {
    if (state.phase !== "playing") return;
    const q = QUESTIONS[state.questionIndex];
    const correct = choice === q.correct;
    const players = state.players.map((p, i) =>
      i === state.active && correct ? { ...p, score: p.score + 1 } : p,
    ) as [Player, Player];
    state = { ...state, phase: "answered", picked: choice, players };
    emit();
  },

  /** Advance to the next question (or the result screen) and pass the device. */
  next() {
    if (state.phase !== "answered") return;
    const nextIndex = state.questionIndex + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      state = { ...state, phase: "result", picked: null };
    } else {
      state = {
        ...state,
        phase: "playing",
        questionIndex: nextIndex,
        active: state.active === 0 ? 1 : 0,
        picked: null,
      };
    }
    emit();
  },

  reset() {
    state = freshState();
    emit();
  },
};
