import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { compileTerms, findInFile, findInText, parseArgs, parseBlocklist } from "./guard.ts";

// Fictional terms only: the real list must never appear in the repository.
const matchers = compileTerms(["acme corp", "globex"]);

describe("parseBlocklist", () => {
  it("skips blanks and comments, splits on commas, collapses duplicates", () => {
    expect(parseBlocklist("# a comment\n\nacme corp\nGlobex, globex\n  initech  \r\n")).toEqual([
      "acme corp",
      "Globex",
      "initech",
    ]);
  });
});

describe("matching", () => {
  it("ignores case and accents", () => {
    expect(findInText("Made by GLÓBEX", matchers, "f")).toEqual([{ where: "f", line: 1, term: 2 }]);
  });

  it("lets a space match a separator or nothing", () => {
    for (const text of ["acme corp", "Acme-Corp", "acme_corp", "acme.corp", "acmecorp", "AcmeCorpUI"]) {
      expect(findInText(text, matchers, "f"), text).toHaveLength(1);
    }
  });

  it("finds a term inside a longer word", () => {
    expect(findInText("const theglobexstore = 1;", matchers, "f")).toHaveLength(1);
  });

  it("reports the line and the term position, never the term", () => {
    const found = findInText("one\ntwo globex\nthree acme corp", matchers, "a.ts");
    expect(found).toEqual([
      { where: "a.ts", line: 2, term: 2 },
      { where: "a.ts", line: 3, term: 1 },
    ]);
    expect(JSON.stringify(found)).not.toMatch(/globex|acme/i);
  });

  it("ignores lockfile integrity hashes, which are random", () => {
    const lock = '      "integrity": "sha512-GlobexAbc+/def==",\n      "name": "globex-ui"';
    expect(findInText(lock, matchers, "package-lock.json")).toEqual([
      { where: "package-lock.json", line: 2, term: 2 },
    ]);
  });

  it("checks the path, and skips binary content", () => {
    const binary = Buffer.from([0x89, 0x50, 0x00, ...Buffer.from("globex")]);
    expect(findInFile("img/globex.png", binary, matchers)).toEqual([
      { where: "img/globex.png (path)", line: 0, term: 2 },
    ]);
  });
});

describe("parseArgs", () => {
  it("accepts the three modes and rejects anything else", () => {
    expect(parseArgs([])).toEqual({ kind: "all" });
    expect(parseArgs(["--staged"])).toEqual({ kind: "staged" });
    expect(parseArgs(["--message", "MSG"])).toEqual({ kind: "message", file: "MSG" });
    expect(parseArgs(["--nope"])).toMatch(/Unknown arguments/);
  });
});

describe("the guard as a command", () => {
  const script = fileURLToPath(new URL("./guard.ts", import.meta.url));
  let repo = "";

  const sh = (...args: string[]) => execFileSync("git", args, { cwd: repo, stdio: "ignore" });
  const guard = (args: string[] = [], env: NodeJS.ProcessEnv = {}) => {
    const r = spawnSync(process.execPath, [script, ...args], {
      cwd: repo,
      encoding: "utf8",
      env: { ...process.env, BLOCKLIST: "", ...env },
    });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  };

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), "guard-"));
    sh("init", "-q", "-b", "main");
    writeFileSync(join(repo, ".gitignore"), ".blocklist\n");
    writeFileSync(join(repo, ".blocklist"), "acme corp\nglobex\n");
  });

  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("passes a clean tree", () => {
    writeFileSync(join(repo, "a.txt"), "nothing to see\n");
    expect(guard()).toMatchObject({ code: 0 });
  });

  it("fails on a match and does not print the term", () => {
    writeFileSync(join(repo, "a.txt"), "line one\nby Globex\n");
    const r = guard();
    expect(r.code).toBe(1);
    expect(r.out).toContain("a.txt:2");
    expect(r.out).not.toMatch(/globex|acme/i);
  });

  it("checks the staged version, not the work tree", () => {
    writeFileSync(join(repo, "a.txt"), "acme corp\n");
    sh("add", "a.txt");
    writeFileSync(join(repo, "a.txt"), "clean now\n");
    expect(guard(["--staged"]).code).toBe(1);
  });

  it("checks the branch name", () => {
    sh("checkout", "-q", "-b", "feat/globex-page");
    expect(guard(["--staged"]).out).toContain("branch name");
  });

  it("checks the commit message, ignoring git's comment lines", () => {
    writeFileSync(join(repo, "MSG"), "feat: add page\n# globex in a template comment\n");
    expect(guard(["--message", "MSG"]).code).toBe(0);
    writeFileSync(join(repo, "MSG"), "feat: add the Acme-Corp page\n");
    expect(guard(["--message", "MSG"]).code).toBe(1);
  });

  it("refuses to run without a list", () => {
    rmSync(join(repo, ".blocklist"));
    expect(guard()).toMatchObject({ code: 2 });
  });

  it("reads the list from the environment when there is no file", () => {
    rmSync(join(repo, ".blocklist"));
    writeFileSync(join(repo, "a.txt"), "globex\n");
    expect(guard([], { BLOCKLIST: "initech,globex" }).code).toBe(1);
  });

  it("refuses to run when the list is not ignored", () => {
    writeFileSync(join(repo, ".gitignore"), "");
    expect(guard()).toMatchObject({ code: 2 });
  });

  it("refuses to run when the list is tracked", () => {
    sh("add", "-f", ".blocklist");
    expect(guard().code).toBe(2);
  });
});
