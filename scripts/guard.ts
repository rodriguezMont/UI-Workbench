/**
 * The blocklist guard: no listed term may enter this repository — not in a
 * file's content, a file's path, a commit message or a branch name.
 *
 * ## The list never enters the repository
 *
 * Writing the forbidden terms anywhere in the repo would publish exactly what
 * the guard exists to keep out. So the list lives outside version control:
 *
 *   - `.blocklist` at the repository root, ignored by git (local machines);
 *   - or the `BLOCKLIST` environment variable, newline- or comma-separated
 *     (CI, where a secret holds it).
 *
 * Both are read when present. With neither, the guard refuses to pass: a
 * guard that silently checks nothing is worse than no guard, because it looks
 * like protection. If `.blocklist` ever becomes tracked or stops being
 * ignored, the guard stops too.
 *
 * Findings name the file, the line and the term's position in the list —
 * never the term itself, so CI logs do not leak the list either.
 *
 * ## Matching
 *
 * Case-insensitive and accent-insensitive, as a substring (a term embedded in
 * a longer word still counts). A space inside a term also matches `-`, `_`,
 * `.` or nothing, so "two words" catches "two-words" and "twowords".
 *
 * ## Usage
 *
 *   node scripts/guard.ts                  every tracked and untracked file
 *   node scripts/guard.ts --staged         the staged content (pre-commit hook)
 *   node scripts/guard.ts --message FILE   a commit message (commit-msg hook)
 *
 * Exit codes: 0 clean · 1 a term was found · 2 the guard cannot run.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const BLOCKLIST_FILE = ".blocklist";
export const BLOCKLIST_ENV = "BLOCKLIST";

export type Matcher = { index: number; pattern: RegExp };
export type Finding = { where: string; line: number; term: number };

/**
 * One term per line or per comma; blank entries and `#` comments are skipped,
 * and duplicates collapse.
 */
export function parseBlocklist(text: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const raw of text.split(/\r?\n|,/)) {
    const term = raw.trim();
    if (!term || term.startsWith("#")) continue;
    const key = normalize(term);
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
  }
  return terms;
}

/** Lower case, accents removed: "Ácme" and "acme" compare equal. */
export function normalize(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

export function compileTerms(terms: readonly string[]): Matcher[] {
  return terms.map((term, i) => {
    const words = normalize(term)
      .split(/[\s_.-]+/)
      .filter(Boolean)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return { index: i + 1, pattern: new RegExp(words.join("[\\s_.-]*"), "u") };
  });
}

/**
 * Lines that are random by construction and would only produce false alarms:
 * the integrity hashes of a lockfile are base64, and a short term turns up in
 * them by chance as the dependency tree grows.
 */
const NOISE = /^\s*"integrity":\s*"sha\d+-[A-Za-z0-9+/=]+",?\s*$/;

export function findInText(text: string, matchers: readonly Matcher[], where: string): Finding[] {
  const findings: Finding[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (NOISE.test(line)) return;
    const normalized = normalize(line);
    for (const m of matchers) {
      if (m.pattern.test(normalized)) findings.push({ where, line: i + 1, term: m.index });
    }
  });
  return findings;
}

/** A NUL byte near the start means binary content: images and fonts are skipped. */
export function isBinary(content: Buffer): boolean {
  return content.subarray(0, 8000).includes(0);
}

export function findInFile(path: string, content: Buffer, matchers: readonly Matcher[]): Finding[] {
  const inPath = findInText(path, matchers, `${path} (path)`).map((f) => ({ ...f, line: 0 }));
  if (isBinary(content)) return inPath;
  return [...inPath, ...findInText(content.toString("utf8"), matchers, path)];
}

// ── git ─────────────────────────────────────────────────────────────────────

function git(args: string[], cwd: string): Buffer {
  return execFileSync("git", args, { cwd, maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

function gitOk(args: string[], cwd: string): boolean {
  try {
    git(args, cwd);
    return true;
  } catch {
    return false;
  }
}

const splitZ = (out: Buffer) => out.toString("utf8").split("\0").filter(Boolean);

function repoRoot(cwd: string): string | null {
  try {
    return git(["rev-parse", "--show-toplevel"], cwd).toString("utf8").trim();
  } catch {
    return null;
  }
}

function branchName(root: string): string | null {
  try {
    return git(["symbolic-ref", "--short", "-q", "HEAD"], root).toString("utf8").trim() || null;
  } catch {
    return null; // detached HEAD: no branch name to check
  }
}

// ── the run ─────────────────────────────────────────────────────────────────

export type Mode = { kind: "all" } | { kind: "staged" } | { kind: "message"; file: string };

export type Outcome = { code: 0 | 1 | 2; lines: string[] };

export function parseArgs(argv: readonly string[]): Mode | string {
  if (argv.length === 0) return { kind: "all" };
  if (argv.length === 1 && argv[0] === "--staged") return { kind: "staged" };
  if (argv.length === 2 && argv[0] === "--message") return { kind: "message", file: argv[1]! };
  return `Unknown arguments: ${argv.join(" ")}`;
}

function loadTerms(root: string, env: NodeJS.ProcessEnv): string[] | null {
  const file = join(root, BLOCKLIST_FILE);
  const fromFile = existsSync(file) ? readFileSync(file, "utf8") : "";
  const fromEnv = env[BLOCKLIST_ENV] ?? "";
  if (!existsSync(file) && !fromEnv.trim()) return null;
  return parseBlocklist(`${fromFile}\n${fromEnv}`);
}

export function run(mode: Mode, cwd: string, env: NodeJS.ProcessEnv = process.env): Outcome {
  const root = repoRoot(cwd);
  if (!root) return { code: 2, lines: ["guard: not inside a git work tree."] };

  const terms = loadTerms(root, env);
  if (!terms || terms.length === 0) {
    return {
      code: 2,
      lines: [
        `guard: no blocklist found. Create ${BLOCKLIST_FILE} at the repository root`,
        `       (see ${BLOCKLIST_FILE}.example) or set the ${BLOCKLIST_ENV} environment variable.`,
      ],
    };
  }

  if (existsSync(join(root, BLOCKLIST_FILE))) {
    if (gitOk(["ls-files", "--error-unmatch", "--", BLOCKLIST_FILE], root)) {
      return {
        code: 2,
        lines: [`guard: ${BLOCKLIST_FILE} is tracked by git. Remove it from the index: git rm --cached ${BLOCKLIST_FILE}`],
      };
    }
    if (!gitOk(["check-ignore", "-q", "--", BLOCKLIST_FILE], root)) {
      return { code: 2, lines: [`guard: ${BLOCKLIST_FILE} is not ignored. Add it to .gitignore.`] };
    }
  }

  const matchers = compileTerms(terms);
  const findings: Finding[] = [];

  if (mode.kind === "message") {
    const text = readFileSync(mode.file, "utf8")
      .split(/\r?\n/)
      .filter((line) => !line.startsWith("#")) // git's own instructions in the editor template
      .join("\n");
    findings.push(...findInText(text, matchers, "commit message"));
  } else {
    const branch = branchName(root);
    if (branch) findings.push(...findInText(branch, matchers, "branch name").map((f) => ({ ...f, line: 0 })));

    if (mode.kind === "staged") {
      for (const path of splitZ(git(["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"], root))) {
        findings.push(...findInFile(path, git(["show", `:${path}`], root), matchers));
      }
    } else {
      for (const path of splitZ(git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"], root))) {
        const full = join(root, path);
        if (!existsSync(full)) continue; // deleted in the work tree, not yet staged
        findings.push(...findInFile(path, readFileSync(full), matchers));
      }
    }
  }

  if (findings.length === 0) {
    return { code: 0, lines: [`guard: clean (${terms.length} term${terms.length === 1 ? "" : "s"} checked).`] };
  }
  return {
    code: 1,
    lines: [
      `guard: ${findings.length} blocklisted term${findings.length === 1 ? "" : "s"} found.`,
      ...findings.map((f) => `  ${f.line > 0 ? `${f.where}:${f.line}` : f.where}  →  term #${f.term}`),
    ],
  };
}

const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const mode = parseArgs(process.argv.slice(2));
  const outcome: Outcome = typeof mode === "string" ? { code: 2, lines: [`guard: ${mode}`] } : run(mode, process.cwd());
  const print = outcome.code === 0 ? console.log : console.error;
  outcome.lines.forEach((line) => print(line));
  process.exitCode = outcome.code;
}
