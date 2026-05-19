/**
 * Tiny syntax highlighter for the install/usage snippets only.
 * Two grammars (bash, tsx) — keeps the bundle clean (no shiki/prism dep).
 *
 * Output is an array of {kind, text} tokens that the React component
 * renders as <span> tags styled via CSS.
 */
export type Token = {
  kind:
    | "plain"
    | "comment"
    | "keyword"
    | "string"
    | "number"
    | "type"
    | "tag"
    | "attr"
    | "punct"
    | "fn";
  text: string;
};

const BASH_KEYWORDS = new Set([
  "npm",
  "yarn",
  "pnpm",
  "bun",
  "install",
  "i",
  "add",
  "run",
  "dev",
  "build",
]);

export function tokenizeBash(src: string): Token[] {
  const out: Token[] = [];
  const re = /(#[^\n]*)|("[^"]*"|'[^']*')|(\$\w+)|(--?[\w-]+)|(\b\d+\b)|([A-Za-z_@/.][\w@/.-]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1]) out.push({ kind: "comment", text: m[1] });
    else if (m[2]) out.push({ kind: "string", text: m[2] });
    else if (m[3]) out.push({ kind: "type", text: m[3] });
    else if (m[4]) out.push({ kind: "attr", text: m[4] });
    else if (m[5]) out.push({ kind: "number", text: m[5] });
    else if (m[6]) {
      const tok = m[6];
      if (BASH_KEYWORDS.has(tok)) out.push({ kind: "keyword", text: tok });
      else out.push({ kind: "plain", text: tok });
    } else if (m[7]) out.push({ kind: "plain", text: m[7] });
    else out.push({ kind: "punct", text: m[8]! });
  }
  return out;
}

const TSX_KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "true",
  "false",
  "null",
  "undefined",
  "default",
  "async",
  "await",
  "new",
  "as",
  "type",
  "interface",
]);

const TSX_TYPES = new Set([
  "string",
  "number",
  "boolean",
  "void",
  "any",
  "never",
  "ReactNode",
]);

export function tokenizeTsx(src: string): Token[] {
  const out: Token[] = [];
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`[^`]*`|"[^"]*"|'[^']*')|(\b\d+\b)|(<\/?[A-Za-z][\w.-]*)|(\b[A-Z][A-Za-z0-9_]*)|(\b[a-z_$][\w$]*)(\s*[(])?|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1]) out.push({ kind: "comment", text: m[1] });
    else if (m[2]) out.push({ kind: "string", text: m[2] });
    else if (m[3]) out.push({ kind: "number", text: m[3] });
    else if (m[4]) out.push({ kind: "tag", text: m[4] });
    else if (m[5]) {
      if (TSX_TYPES.has(m[5])) out.push({ kind: "type", text: m[5] });
      else out.push({ kind: "type", text: m[5] });
    } else if (m[6]) {
      const tok = m[6];
      const followedByCall = !!m[7];
      if (TSX_KEYWORDS.has(tok)) out.push({ kind: "keyword", text: tok });
      else if (followedByCall) out.push({ kind: "fn", text: tok });
      else out.push({ kind: "plain", text: tok });
      if (followedByCall) out.push({ kind: "punct", text: m[7]! });
    } else if (m[8]) out.push({ kind: "plain", text: m[8] });
    else out.push({ kind: "punct", text: m[9]! });
  }
  return out;
}
