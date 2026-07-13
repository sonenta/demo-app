import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/**
 * Fail the PRODUCTION build when the API token is missing, instead of quietly
 * inlining `undefined`.
 *
 * Without this, an absent VITE_SONENTA_TOKEN produces a bundle that sends
 * `Authorization: ApiKey undefined` to every visitor. Every authed call then
 * 401s — silently, because the CDN still serves the translation bundles, so the
 * page looks completely fine. Production shipped exactly that for as long as the
 * demo has existed and nobody noticed until a peer asked what status code our
 * requests returned.
 *
 * The token is gitignored, so it is absent by DEFAULT in any fresh clone, any
 * CI runner, and any second machine — i.e. the broken build is the one you get
 * by doing nothing wrong. A silent failure that is also the default is not a
 * bug you find, it is a bug you ship. So: shout.
 *
 * Dev is unaffected — `vite` runs fine without a token.
 */
const requireTokenForProdBuild = (env: Record<string, string>): Plugin => ({
  name: "demo-app:require-token-for-prod-build",
  apply: "build",
  config() {
    const token = env.VITE_SONENTA_TOKEN;
    if (token && token !== "undefined" && token.trim() !== "") return;
    throw new Error(
      [
        "",
        "VITE_SONENTA_TOKEN is not set — refusing to build.",
        "",
        "Building without it inlines the string `undefined`, so the bundle would",
        "send `Authorization: ApiKey undefined` to every visitor and every authed",
        "call would 401 — silently, because the CDN still serves the bundles and",
        "the page still looks fine. That is a bug you ship, not one you find.",
        "",
        "Get the key from the bridge `secrets` peer:",
        "    name=demo_public_missing_write   scope=demo-app",
        "then put it in .env.production.local (gitignored):",
        "    VITE_SONENTA_TOKEN=<value>",
        "",
        "See .env.example. To build deliberately without a token (it will 401):",
        "    VITE_SONENTA_TOKEN=none npm run build",
        "",
      ].join("\n"),
    );
  },
});

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // Served under https://sonenta.com/demos/react/ in prod (flat docroot,
    // see scripts/deploy.sh). Dev keeps the root so `vite` still works at /.
    base: command === "build" ? "/demos/react/" : "/",
    plugins: [react(), tailwindcss(), requireTokenForProdBuild(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
