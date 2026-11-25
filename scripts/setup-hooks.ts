/**
 * Points git at the versioned hooks in `.githooks/`, so every clone runs the
 * blocklist guard before a commit lands.
 *
 * Runs on `npm install` (the `prepare` script). Outside a git work tree — a
 * CI build that ships without `.git`, for instance — it does nothing and exits
 * cleanly, because there is no commit to protect there.
 */
import { execFileSync } from "node:child_process";

function insideWorkTree(): boolean {
  try {
    return (
      execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "true"
    );
  } catch {
    return false;
  }
}

if (insideWorkTree()) {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
  console.log("git hooks: core.hooksPath set to .githooks");
} else {
  console.log("git hooks: not a git work tree, skipped");
}
