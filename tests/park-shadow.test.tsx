/**
 * PARK-SHADOW (sdk's P1, and it hits React): does a live in-context edit to a
 * key that was previously MISSING actually repaint?
 *
 * Why this matters here specifically: my landing page ships BOTH features — the
 * missing-key inspector and the @sonenta/in-context live-edit panel. If a key
 * that was reported missing can never be repainted by a live edit, then the two
 * headline features of this demo break each other in exactly the case a visitor
 * would try: "look, that key is missing — now watch me fix it live."
 *
 * Mechanism per sdk: i18next parks the missing key FLAT ("a.b.c" as a literal
 * key), in-context writes the edit NESTED ({a:{b:{c}}}), and the flat park wins
 * the lookup — so t() keeps returning the raw key for the rest of the session.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { SonentaProvider, useTranslation } from "@sonenta/react-i18next";

const EN = { hero: { title: "Ship in every language." } };
const ok = (b: unknown) =>
  new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });

describe("in-context live edit after a missing key", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn(async (u: unknown) =>
      String(u).includes("/en/common.json") ? ok(EN) : ok([]),
    ));
  });

  // KNOWN BROKEN in @sonenta/react-i18next@2.5.0 (sdk's park-shadow P1), so this
  // is `it.fails`: it PASSES while the bug exists and turns RED the moment the
  // fix lands. That is deliberate — it is a canary, not an excuse. When this
  // goes red, take the @sonenta/react-i18next bump (2.6.0) and flip it back to
  // a normal `it`.
  it.fails("repaints a live edit to a key that was previously MISSING", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let api: any = null;
    function Probe() {
      const { t, i18n } = useTranslation();
      api = { t, i18n };
      return null;
    }
    render(
      <SonentaProvider
        token="t" projectUuid="p" defaultLocale="en" fallbackLng="en"
        namespaces={["common"]} keySeparator="." missingHandler="send" flushIntervalMs={10}
        transport={() => {}}
      >
        <Probe />
      </SonentaProvider>,
    );
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    expect(api.t("hero.title")).toBe(EN.hero.title); // bundle really loaded

    // 1. the key is missing — this is what the demo's inspector captures, and
    //    it is also what makes i18next PARK it.
    expect(api.t("legal.gdpr.long_clause")).toBe("legal.gdpr.long_clause");

    // 2. an in-context editor pushes a live edit for that same key. This is what
    //    @sonenta/in-context does when a paired editor saves: it writes the value
    //    into the active bundle, NESTED, and expects t() to repaint.
    await act(async () => {
      api.i18n.i18next.addResourceBundle(
        "en", "common",
        { legal: { gdpr: { long_clause: "We keep your data for 24 months." } } },
        true, true,
      );
    });

    // 3. does the page now show the edit, or is it still shadowed by the park?
    expect(api.t("legal.gdpr.long_clause")).toBe("We keep your data for 24 months.");
  });
});
