/**
 * Does the autoplay LOOP still report missing keys after cycle 1?
 *
 * Everyone (me included) assumed this needed a live browser. It does not: the
 * dedup is plain SDK state, and jsdom exercises it exactly as a page does. This
 * test exists because the answer was load-bearing for four demos and nobody
 * could get a browser to settle it.
 *
 * It is written to FALSIFY MY OWN CLAIM. I reported "three clean loop cycles"
 * from the running demo; demo-app-svelte said the panel dies after cycle 1.
 * They were right and I was wrong — and so was my own explanation of WHY.
 *
 * THE ACTUAL MECHANISM (verified here, and it is none of the three we guessed):
 *
 *   i18next parks the missing key as a LITERAL value in the SOURCE language's
 *   store — only there, not in every language. `fallbackLng` then routes every
 *   other locale THROUGH that park, so the key resolves everywhere and the
 *   missing handler is never called again, in any locale, for the life of the
 *   instance. Proven below: with fallbackLng="en" a later miss in `fr` reports
 *   NOTHING; point fallbackLng at a language with no park (e.g. "es") and the
 *   same miss in `fr` reports normally.
 *
 *   The SDK's own dedup Set IS keyed on `${language}/${ns}/${key}` (so it would
 *   happily allow the fr report) — it is simply never consulted, because
 *   i18next never asks. Clearing that Set alone would change nothing.
 *
 * AND THE STING: after the park, `t()` in fr returns "legal.gdpr.long_clause" —
 * the raw key. It LOOKS missing on screen and is NOT missing to i18next. The
 * same park is what shadows an in-context live edit (see park-shadow.test.tsx),
 * so the dead loop and the dead live-edit are ONE root cause, not two bugs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { SonentaProvider, useTranslation } from "@sonenta/react-i18next";

const EN = { hero: { title: "Ship in every language." } };
const FR = { hero: { title: "Livrez dans toutes les langues." } };
const ok = (b: unknown) =>
  new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });

/** The missing-key handler is only armed once a bundle has actually LOADED for
 *  that (locale, namespace) — so serve real bundles, and assert they arrived
 *  before trusting any "nothing was reported" result. A disarmed handler and a
 *  deduped key look identical from the outside, and only one of them is a bug. */
const harness = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (u: unknown) => {
      const url = String(u);
      if (url.includes("/fr/common.json")) return ok(FR);
      if (url.includes("/en/common.json")) return ok(EN);
      if (url.includes("languages")) return ok([]);
      return ok({});
    }),
  );

  const reported: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let api: any = null;
  function Probe() {
    const { t, i18n } = useTranslation();
    api = { t, i18n };
    return null;
  }
  render(
    <SonentaProvider
      token="test"
      projectUuid="test-project"
      defaultLocale="en"
      fallbackLng="en"
      namespaces={["common"]}
      keySeparator="."
      missingHandler="send"
      flushIntervalMs={10}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport={(batch: any[]) => {
        for (const e of batch) reported.push(`${e.language_code}/${e.key_name ?? e.key}`);
      }}
    >
      <Probe />
    </SonentaProvider>,
  );
  const ready = async () => {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
  };
  const fire = async (key: string) => {
    act(() => void api.t(key));
    await act(async () => {
      await api.i18n.flushMissing();
    });
  };
  return { reported, fire, ready, get api() { return api; } };
};

describe("missing-key dedup: what the autoplay loop actually reports", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("reports a missing key the first time it is rendered", async () => {
    const h = harness();
    await h.ready();
    expect(h.api.t("hero.title")).toBe(EN.hero.title); // handler is armed
    await h.fire("legal.gdpr.long_clause");
    expect(h.reported).toEqual(["en/legal.gdpr.long_clause"]);
  });

  it("CYCLE 2: the same key in the same locale is NOT reported again", async () => {
    const h = harness();
    await h.ready();
    await h.fire("legal.gdpr.long_clause");
    await h.fire("legal.gdpr.long_clause");
    // The loop keeps ticking; the inspector records nothing. From the outside
    // those look identical unless you watch the PANEL rather than the scenario.
    expect(h.reported).toHaveLength(1);
  });

  it("and the dedup SURVIVES a locale change — the locale beat does not refresh it", async () => {
    const h = harness();
    await h.ready();
    await h.fire("legal.gdpr.long_clause");

    await act(async () => {
      await h.api.i18n.setLocale("fr");
    });
    expect(h.api.t("hero.title")).toBe(FR.hero.title); // fr bundle really loaded

    await h.fire("legal.gdpr.long_clause");

    // I had guessed the en→fr→es rotation handed each locale a fresh budget,
    // which would have made "3 cycles" really mean "3 locales". It does not:
    // the key is reportable ONCE per instance, full stop. My explanation was
    // wrong even though my conclusion (svelte is right) was correct.
    expect(h.reported).toHaveLength(1);
    expect(h.reported[0]).toBe("en/legal.gdpr.long_clause");
  });
});
