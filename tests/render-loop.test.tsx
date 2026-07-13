import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { useState, useEffect } from "react";
import { SonentaProvider, useTranslation } from "@sonenta/react-i18next";
import fs from "node:fs";

const EN = { hero: { title: "EN-TITLE" } };
const ok = (b: unknown) =>
  new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
const log: string[] = [];
const dump = () => fs.writeFileSync("/tmp/loop.txt", log.join("\n"));

const KEYS = [
  "legal.gdpr.long_clause",
  "checkout.tax.tooltip",
  "error.payment.declined",
  "landing.coming_soon",
];

/**
 * GUARD FOR THE SAFETY NET 2.6.0 REMOVED.
 *
 * The flat park in 2.5.0 was not gratuitous: per sdk it was belt-and-suspenders
 * against react-i18next@17's `forceStoreRerender` on `saveMissing` — a missing
 * key rendered inside a component could re-render the component that rendered
 * it, producing "Maximum update depth exceeded". The park made i18next stop
 * seeing the key as missing, which short-circuited the handler.
 *
 * 2.6.0 removes that park to fix the shadow, leaving only the dedup-gated
 * `if (!recorded) return` as the loop breaker. sdk believes that is sufficient
 * on React web and is UNSURE about React Native. I deployed 2.6.0 to production,
 * so "believes" is not good enough — this proves it on web.
 *
 * The RN case is NOT covered here and remains open (demo-app-expo / sdk).
 */
describe("2.6.0 un-park: does a MISSING key rendered in a component runaway-loop?", () => {
  it("ARM CHECK: this counter can actually detect a runaway loop", async () => {
    // Induce the exact failure mode the tests below claim to rule out. If the
    // instrument cannot see THIS, a green below means nothing. (My own rule —
    // the one that caught my vacuous dedup harness earlier today.)
    let renders = 0;
    function Runaway() {
      const [, setN] = useState(0);
      renders++;
      useEffect(() => {
        if (renders < 120) setN((n) => n + 1);
      });
      return null;
    }
    render(<Runaway />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    log.push(`ARM: induced runaway loop measured as   : ${renders} renders  (must be >> 25)`);
    dump();
    expect(renders).toBeGreaterThan(25);
  });

  it("one missing key rendered in a component does not loop", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: unknown) =>
      String(u).includes("/en/common.json") ? ok(EN) : ok([])));
    let renders = 0;
    function Missing() {
      const { t } = useTranslation();
      renders++;
      return <span>{t("legal.gdpr.long_clause")}</span>;
    }
    render(
      <SonentaProvider
        token="t" projectUuid="p" defaultLocale="en" fallbackLng="en"
        namespaces={["common"]} keySeparator="." missingHandler="send"
        flushIntervalMs={10} transport={() => {}}
      >
        <Missing />
      </SonentaProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });
    log.push(`ONE missing key rendered in a component : ${renders} renders`);
    dump();
    expect(renders).toBeLessThan(25);
  });

  it("the scenario's four missing keys, rendered together, do not loop", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: unknown) =>
      String(u).includes("/en/common.json") ? ok(EN) : ok([])));
    let renders = 0;
    function Many() {
      const { t } = useTranslation();
      renders++;
      return <span>{KEYS.map((k) => t(k)).join("|")}</span>;
    }
    render(
      <SonentaProvider
        token="t" projectUuid="p" defaultLocale="en" fallbackLng="en"
        namespaces={["common"]} keySeparator="." missingHandler="send"
        flushIntervalMs={10} transport={() => {}}
      >
        <Many />
      </SonentaProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });
    log.push(`FOUR missing keys (the scenario set)    : ${renders} renders`);
    dump();
    expect(renders).toBeLessThan(25);
  });
});
