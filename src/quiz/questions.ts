/**
 * Quiz question metadata. The prompt and the five answers are NOT stored
 * here — they live in the `common` i18n namespace as `quiz.q.<n>.prompt`
 * and `quiz.q.<n>.a.<1..5>` so every visible string flows through the
 * Verbumia SDK (and is therefore a rate-able / suggest-able target for the
 * @verbumia/feedback plugin). Only the answer key stays in code: it must
 * never be translatable, and end users rating answer strings must not be
 * able to infer correctness from the locale bundle.
 */
export type Question = {
  /** 1-based id; maps to the `quiz.q.<id>.*` i18n keys. */
  id: number;
  /** 1-based index (1..5) of the correct answer. */
  correct: 1 | 2 | 3 | 4 | 5;
};

export const QUESTIONS: readonly Question[] = [
  { id: 1, correct: 1 },
  { id: 2, correct: 2 },
  { id: 3, correct: 3 },
  { id: 4, correct: 2 },
  { id: 5, correct: 3 },
  { id: 6, correct: 3 },
  { id: 7, correct: 3 },
  { id: 8, correct: 3 },
  { id: 9, correct: 1 },
  { id: 10, correct: 3 },
] as const;

export const TOTAL_QUESTIONS = QUESTIONS.length;
export const ANSWER_INDICES = [1, 2, 3, 4, 5] as const;
