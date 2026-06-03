// gen-surface-cdn.mjs — emit CDN-shaped surface-overlay bundles for the
// surface-variant showcase (task #915). The @verbumia/react-i18next SDK
// (>=1.1.0) fetches surface overlays from
//   {cdnBase}/p/{projectUuid}/{version}/latest/{locale}/{ns}.{surface}.json
// (base = {ns}.json). The real demo CDN can't yet author surface overlays
// (no MCP/back-end surface authoring), so the showcase serves its own
// overlays from a demo-controlled cdnBase (public/surface-cdn/...) via a
// dedicated, isolated VerbumiaProvider. Run: node scripts/gen-surface-cdn.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = "surface-demo";
const VERSION = "v1";
const NS = "showcase";
const LOCALES = ["en", "fr", "es"];

// base = the DESKTOP-oriented full copy (applies to every surface); a sparse
// overlay overrides individual keys for mobile / tablet only. The `device`
// key carries an asset variant: { $value, $asset:{kind,ref} } — t() returns
// $value, i18n.asset("device") returns $asset (a per-surface icon ref).
const CONTENT = {
  en: {
    base: {
      banner: { message: "Manage every translation, on every screen, from a single key — desktop layouts get the full descriptive copy." },
      cta: "Get started for free",
      device: { $value: "Desktop", $asset: { kind: "icon", ref: "monitor" } },
    },
    mobile: {
      banner: { message: "One key. Every screen." },
      cta: "Start",
      device: { $value: "Mobile", $asset: { kind: "icon", ref: "smartphone" } },
    },
    tablet: {
      banner: { message: "One key, every screen — tuned per surface." },
      device: { $value: "Tablet", $asset: { kind: "icon", ref: "tablet" } },
    },
  },
  fr: {
    base: {
      banner: { message: "Gérez chaque traduction, sur chaque écran, depuis une seule clé — les mises en page bureau reçoivent le texte descriptif complet." },
      cta: "Commencer gratuitement",
      device: { $value: "Bureau", $asset: { kind: "icon", ref: "monitor" } },
    },
    mobile: {
      banner: { message: "Une clé. Chaque écran." },
      cta: "Démarrer",
      device: { $value: "Mobile", $asset: { kind: "icon", ref: "smartphone" } },
    },
    tablet: {
      banner: { message: "Une clé, chaque écran — adaptée par surface." },
      device: { $value: "Tablette", $asset: { kind: "icon", ref: "tablet" } },
    },
  },
  es: {
    base: {
      banner: { message: "Gestiona cada traducción, en cada pantalla, desde una sola clave — los diseños de escritorio reciben el texto descriptivo completo." },
      cta: "Empieza gratis",
      device: { $value: "Escritorio", $asset: { kind: "icon", ref: "monitor" } },
    },
    mobile: {
      banner: { message: "Una clave. Cada pantalla." },
      cta: "Empezar",
      device: { $value: "Móvil", $asset: { kind: "icon", ref: "smartphone" } },
    },
    tablet: {
      banner: { message: "Una clave, cada pantalla — ajustada por superficie." },
      device: { $value: "Tableta", $asset: { kind: "icon", ref: "tablet" } },
    },
  },
};

let n = 0;
for (const locale of LOCALES) {
  const dir = resolve(ROOT, "public/surface-cdn/p", PROJECT, VERSION, "latest", locale);
  mkdirSync(dir, { recursive: true });
  const c = CONTENT[locale];
  const files = {
    [`${NS}.json`]: c.base, // base bundle (desktop copy)
    [`${NS}.mobile.json`]: c.mobile, // sparse mobile overlay
    [`${NS}.tablet.json`]: c.tablet, // sparse tablet overlay
    [`${NS}.desktop.json`]: {}, // empty: base already IS desktop (avoids 404 noise)
  };
  for (const [file, data] of Object.entries(files)) {
    writeFileSync(resolve(dir, file), JSON.stringify(data, null, 2) + "\n");
    n++;
  }
}
console.log(`wrote ${n} surface-cdn files under public/surface-cdn/p/${PROJECT}/${VERSION}/latest/{${LOCALES.join(",")}}/`);
