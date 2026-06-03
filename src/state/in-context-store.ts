import type {
  EditEvent,
  InContextController,
  SessionStatus,
} from "@verbumia/in-context/react";

/**
 * External store backing the in-context (live-translate) showcase panel.
 *
 * The `@verbumia/in-context` plugin is HEADLESS — it owns no UI. Its
 * lifecycle callbacks (onReady / onStatus / onEdit / onPaired / onSessionEnd,
 * wired in App.tsx) funnel into this module-singleton store, and
 * InContextPanel reads it via useSyncExternalStore to render the pairing box,
 * connection status, and a live log of edits applied in place. The imperative
 * `controller` (handed back by the plugin's onReady) lives here too so the
 * paste-box can call `controller.pair(code)`.
 */
export type AppliedEdit = EditEvent & { _receivedAt: number };

type Listener = () => void;

type State = {
  /** Imperative handle from the plugin; null until the provider calls setup(). */
  controller: InContextController | null;
  status: SessionStatus;
  sessionId: string | undefined;
  /** Most-recent-first log of edits the editor pushed and we applied live. */
  edits: AppliedEdit[];
  /** Count of devices (incl. the editor) seen joining the session. */
  paired: number;
  /** Last pairing error surfaced to the paste-box, if any. */
  error: string | null;
};

let state: State = {
  controller: null,
  status: "idle",
  sessionId: undefined,
  edits: [],
  paired: 0,
  error: null,
};

const listeners = new Set<Listener>();
const emit = () => {
  for (const l of listeners) l();
};

export const inContextStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): State {
    return state;
  },
  setController(controller: InContextController) {
    state = { ...state, controller };
    emit();
  },
  setStatus(status: SessionStatus) {
    // Mirror the controller's sessionId whenever the connection state moves.
    state = {
      ...state,
      status,
      sessionId: state.controller?.sessionId ?? state.sessionId,
      // A fresh connect clears the prior error.
      error: status === "connecting" ? null : state.error,
    };
    emit();
  },
  pushEdit(edit: EditEvent) {
    const stamped: AppliedEdit = { ...edit, _receivedAt: Date.now() };
    state = { ...state, edits: [stamped, ...state.edits].slice(0, 50) };
    emit();
  },
  markPaired() {
    state = { ...state, paired: state.paired + 1 };
    emit();
  },
  setError(error: string | null) {
    state = { ...state, error };
    emit();
  },
  reset() {
    // Session ended: keep the edit log (it's the proof), drop the live state.
    state = {
      ...state,
      status: "ended",
      sessionId: undefined,
      paired: 0,
    };
    emit();
  },
};
