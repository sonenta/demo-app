import { useEffect, useRef } from "react";
import { useTranslation } from "@sonenta/react-i18next";
import { scenarioStore } from "../state/scenario-store";
import { missingStore } from "../state/missing-store";

/**
 * Side-effect-only component. Wires the scenario store's fire/reset/setLocale
 * hooks to the SDK (so calls go through the real missing-key handler and the
 * real locale switch, exactly as a user click would) and reads ?demo=play|loop
 * from the URL once the default bundle has been fetch-attempted (so the first
 * key isn't dropped by the "skip-until-attempted" guard in the SDK).
 *
 * `ready` flaps to false on every locale switch — including the ones the
 * scenario itself performs. So the scenario must be started exactly ONCE and
 * must NOT be torn down when `ready` goes false, or its own locale beat would
 * restart it from step 0 and it could never advance past the first flip.
 */
export function ScenarioRunner({ ready }: { ready: boolean }) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    scenarioStore.attach(
      (key) => {
        t(key);
      },
      () => missingStore.clear(),
      // The locale beat goes through the real SDK, same as a LangSwitcher
      // click — the reel shows the product working, not a staged animation.
      (locale) => {
        void i18n.setLocale(locale);
      },
    );
  }, [t, i18n]);

  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo === "play") scenarioStore.start("playing");
    else if (demo === "loop") scenarioStore.start("looping");
  }, [ready]);

  // Teardown belongs to unmount, NOT to `ready` — see the note above.
  useEffect(() => () => scenarioStore.stop(), []);

  return null;
}
