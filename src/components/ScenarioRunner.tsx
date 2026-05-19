import { useEffect } from "react";
import { useTranslation } from "@verbumia/react-i18next";
import { scenarioStore } from "../state/scenario-store";
import { missingStore } from "../state/missing-store";

/**
 * Side-effect-only component. Wires the scenario store's fire/reset hooks
 * to t() (so calls go through the SDK's missing-key handler exactly as a
 * real user click would) and reads ?demo=play|loop from the URL once the
 * default bundle has been fetch-attempted (so the first key isn't dropped
 * by the "skip-until-attempted" guard in the SDK).
 */
export function ScenarioRunner({ ready }: { ready: boolean }) {
  const { t } = useTranslation();

  useEffect(() => {
    scenarioStore.attach(
      (key) => {
        t(key);
      },
      () => missingStore.clear(),
    );
  }, [t]);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo === "play") scenarioStore.start("playing");
    else if (demo === "loop") scenarioStore.start("looping");
    return () => scenarioStore.stop();
  }, [ready]);

  return null;
}
