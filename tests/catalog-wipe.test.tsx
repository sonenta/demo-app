import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { SonentaProvider, useTranslation } from "@sonenta/react-i18next";
import fs from "node:fs";

// A realistic catalog — many keys, like a real app's namespace.
const EN = { hero: { title: "EN-TITLE" }, nav: { product: "Product", pricing: "Pricing" }, auth: { signIn: "Sign in" } };
const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });

/**
 * P0 REGRESSION GUARD — one empty key used to destroy the entire catalog.
 *
 * If an app calls t("") — or t(someVar) where the variable is empty/undefined —
 * the SDK's missing-key park handed i18next's addResource a FALSY key. i18next
 * builds its path as [lng, ns] and only appends the key `if (key)`, so an empty
 * key left the path two elements long and setPath REPLACED THE WHOLE NAMESPACE.
 * Every translation gone, in one call, silently. The app then rendered raw key
 * names — buttons literally reading `auth.signIn`.
 *
 * Reproduced here on 2.6.2 (which was in OUR PRODUCTION at the time): a single
 * t("") took the namespace from 3 keys to 0 and turned every string into its own
 * key name. Fixed in 2.6.6 by an `if (!key) return` guard.
 *
 * This test must stay: our own t() call sites are all fed from const arrays
 * today, but any future `t(item.labelKey)` where the field is optional puts the
 * whole catalog one render away from disappearing.
 */
describe("P0: does t('') wipe the whole namespace?", () => {
  it("a single empty key must NOT destroy the catalog", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: any) => String(u).includes("/en/common.json") ? ok(EN) : ok([])));
    let api: any = null;
    function P() { const { t, i18n } = useTranslation(); api = { t, i18n }; return null; }
    render(<SonentaProvider token="t" projectUuid="p" defaultLocale="en" fallbackLng="en"
      namespaces={["common"]} keySeparator="." missingHandler="send" flushIntervalMs={10}
      transport={() => {}}><P /></SonentaProvider>);
    await act(async () => { await new Promise(r => setTimeout(r, 400)); });
    const i = api.i18n.i18next;
    const count = () => Object.keys(i.getResourceBundle("en", "common") ?? {}).length;
    const o: string[] = [];
    o.push(`version under test: ${JSON.parse(fs.readFileSync("node_modules/@sonenta/react-i18next/package.json","utf8")).version}`);
    o.push(`ARM: catalog loaded -> t('hero.title')=${JSON.stringify(api.t("hero.title"))}, top-level keys=${count()}`);

    // the customer's incident: t() with a variable that happens to be empty
    const emptyVar: string = "";
    act(() => { api.t(emptyVar); });
    await act(async () => { await new Promise(r => setTimeout(r, 120)); });

    o.push(`AFTER a single t(""):`);
    o.push(`  top-level keys now : ${count()}   <- 0 means THE CATALOG IS GONE`);
    o.push(`  t('hero.title') now: ${JSON.stringify(api.t("hero.title"))}   <- raw key = app is showing key names`);
    o.push(`  t('auth.signIn')   : ${JSON.stringify(api.t("auth.signIn"))}`);
    fs.writeFileSync("/tmp/wipe.txt", o.join("\n"));
    // The catalog must survive, and strings must still resolve.
    expect(count()).toBe(3);
    expect(api.t("hero.title")).toBe("EN-TITLE");
    expect(api.t("auth.signIn")).toBe("Sign in");
  });
});
