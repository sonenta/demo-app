// One-shot: merge public/locales/{en,fr,es}/<ns>.json into the backend
// seed shape. `en` is the source-of-truth keyset per namespace.
// Namespaces: `common` (site chrome/nav) + `quiz` (the trivia strings —
// task 619: distinct ns so the feedback panel scopes to quiz only).
import { readFileSync, writeFileSync } from "node:fs";

const PROJECT_UUID = "06a07109-3e3c-7bd7-8000-95368a87bd2e";
const LANGS = ["en", "fr", "es"];
const NAMESPACES = ["common", "quiz"];

const load = (l, ns) =>
  JSON.parse(readFileSync(`public/locales/${l}/${ns}.json`, "utf8"));

const problems = [];
const namespaces = {};
const counts = {};

for (const ns of NAMESPACES) {
  const bundles = Object.fromEntries(LANGS.map((l) => [l, load(l, ns)]));
  const enKeys = Object.keys(bundles.en);

  // Integrity: every language must have exactly the en keyset, no blanks.
  for (const l of ["fr", "es"]) {
    const ks = new Set(Object.keys(bundles[l]));
    for (const k of enKeys) {
      if (!ks.has(k)) problems.push(`${ns}/${l} missing ${k}`);
      else if (typeof bundles[l][k] !== "string" || bundles[l][k] === "")
        problems.push(`${ns}/${l} blank ${k}`);
    }
    for (const k of ks)
      if (!(k in bundles.en)) problems.push(`${ns}/${l} extra ${k}`);
  }

  const tree = {};
  for (const k of enKeys) {
    tree[k] = { en: bundles.en[k], fr: bundles.fr[k], es: bundles.es[k] };
  }
  namespaces[ns] = tree;
  counts[ns] = enKeys.length;
}

if (problems.length) {
  console.error("INTEGRITY FAIL:\n" + problems.join("\n"));
  process.exit(1);
}

const doc = {
  project_uuid: PROJECT_UUID,
  source_language: "en",
  languages: LANGS,
  namespaces,
};

writeFileSync("demo-public-seed.json", JSON.stringify(doc, null, 2) + "\n");
console.log(
  `OK langs=${LANGS.join(",")} ns=${NAMESPACES.map(
    (n) => `${n}(${counts[n]})`,
  ).join(",")} total=${Object.values(counts).reduce(
    (a, b) => a + b,
    0,
  )} bytes=${JSON.stringify(doc).length}`,
);
