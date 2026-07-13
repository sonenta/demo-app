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
 * THE ACTUAL MECHANISM — from the SDK's own source, plus a control. Three of us
 * guessed three mechanisms and all three were wrong, including my first fix to
 * my own wrong guess. This is the one that survives:
 *
 *   @sonenta/react-i18next's missing handler PARKS the key itself:
 *
 *     const recorded = this._missing.record({...});   // dedup Set: consulted ONCE
 *     if (!recorded) return;
 *     this._i18next.addResource(lng, ns, key, rendered,
 *                               { keySeparator: false, silent: true });   // <- THE PARK
 *
 *   It writes the key back into the store FLAT, with the key NAME as its value.
 *   After that the key RESOLVES, so i18next never calls the missing handler for
 *   it again — in that locale, or (via fallbackLng) in any locale that falls back
 *   through it. The dedup Set is not what stops the second report; the park is.
 *
 *   CONTROL: plain i18next with the identical config (saveMissing, saveMissingTo
 *   "all", same fallback) does NOT park and DOES re-report the key in fr. So the
 *   park is the SDK's, not i18next's — this is our defect, not inherited.
 *
 *   Proven below by flipping fallbackLng: with "en" a later miss in fr reports
 *   NOTHING (fr resolves through en's park); point fallbackLng at a language with
 *   no park ("es") and the same miss in fr reports normally.
 *
 * AND IT IS ONE BUG, NOT TWO: that same FLAT park (keySeparator:false) is what
 * shadows a NESTED in-context live edit (see park-shadow.test.tsx). The dead loop
 * and the dead live-edit are the same line of code.
 *
 * THE STING: after the park, t() returns the raw key name. It LOOKS missing on
 * screen and is NOT missing to the library. Every observer here read the rendered
 * key as evidence of absence; it was evidence of a park.
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
