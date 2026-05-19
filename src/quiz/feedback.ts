/**
 * Single integration seam for the @verbumia/feedback add-on.
 *
 * LIVE wiring against the FROZEN v5 surface. @verbumia/feedback is a
 * PLUGIN of the @verbumia/react-i18next provider — it attaches via the
 * provider's `plugins` prop, the provider runs `setup({ i18n, config })`
 * once and mounts the plugin's `render()` as an ISOLATED sibling leaf
 * (no 2nd context, no host re-render). The host opens the panel
 * imperatively via `controllerRef.current.open()`. sessionId is
 * SERVER-MINTED (no client groupingKey), exposed read-only as
 * `controller.client.sessionId` after ToS acceptance.
 *
 * SDK = published npm `@verbumia/react-i18next@^0.7.0` +
 * `@verbumia/feedback@^0.2.0`.
 *  - v4: `tosVersion` is a build-time SDK constant — the host MUST NOT
 *    pass it; the SDK self-supplies it.
 *  - v5: RENDERED auto-scoping — the SDK builds the on-screen key
 *    registry, so the panel auto-scopes to the keys actually rendered on
 *    the current view. We DO NOT pass an explicit `keys` list.
 *  - v6: `namespace` filter — the quiz strings live in the dedicated
 *    `quiz` i18n namespace (spec v3); passing `namespace: "quiz"` makes
 *    the panel show ONLY quiz strings (rendered ∩ quiz), never site
 *    chrome/nav (which is ns=common). Canonical kb spec: topic=demo
 *    sub_topic=quiz-spec (v3, seed v3 04a5d395).
 */
import { feedbackPlugin } from "@verbumia/feedback/react";
import type { FeedbackController } from "@verbumia/feedback/react";
import type { VerbumiaPlugin } from "@verbumia/react-i18next";

/** Imperative panel controller delivered by the plugin (SDK-frozen). */
export type { FeedbackController };

/**
 * Ref handed to feedbackPlugin({ controllerRef }). The plugin assigns
 * `.current` once mounted; the host CTA reads it imperatively. A plain
 * object (NOT React state) so open/close never re-renders the host.
 */
export const controllerRef: { current: FeedbackController | null } = {
  current: null,
};

/**
 * Tiny external store so the CTA can appear the moment the plugin is
 * ready WITHOUT the controller itself living in React state (keeps the
 * "no host re-render on open/close" guarantee — only readiness flips).
 */
let ready = false;
const readyListeners = new Set<() => void>();
export const feedbackReady = {
  subscribe(l: () => void) {
    readyListeners.add(l);
    return () => readyListeners.delete(l);
  },
  getSnapshot() {
    return ready;
  },
};

/** Host CTA entry points. Safe before the plugin binds (no-op). */
export function openFeedbackPanel() {
  controllerRef.current?.open();
}
export function closeFeedbackPanel() {
  controllerRef.current?.close();
}

/** The array for the VerbumiaProvider `plugins` prop. */
export function feedbackPlugins(): VerbumiaPlugin[] {
  const plugin = feedbackPlugin({
    // tosVersion NOT passed — v4 SDK self-supplies it.
    // No explicit `keys` — v5 SDK auto-scopes to rendered strings.
    // v6 namespace filter: only the `quiz` ns (spec v3) → panel shows
    // quiz strings only, never ns=common site chrome/nav.
    namespace: "quiz",
    // apiBase / projectId / language are REUSED from the provider config.
    // No sessionId/groupingKey — server-minted.
    controllerRef,
    onReady: () => {
      ready = true;
      readyListeners.forEach((l) => l());
    },
  });
  // feedbackPlugin returns an I18nPlugin (structural mirror of
  // VerbumiaPlugin — same name/setup/render shape).
  return [plugin as unknown as VerbumiaPlugin];
}
