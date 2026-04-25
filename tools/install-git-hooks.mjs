import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

const gitDir = join(process.cwd(), ".git");

if (!existsSync(gitDir)) {
  console.error("Cannot install hooks because .git was not found.");
  process.exit(1);
}

/**
 * Resolve the effective hooks directory.
 *
 * Priority:
 *   1. core.hooksPath (git config) — respects developer overrides.
 *   2. git rev-parse --git-path hooks — handles worktrees and submodules
 *      where .git is a file pointing at the real git dir.
 */
function resolveHooksDir() {
  try {
    const customPath = execFileSync("git", ["config", "core.hooksPath"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }).trim();
    if (customPath) {
      return isAbsolute(customPath)
        ? customPath
        : resolve(process.cwd(), customPath);
    }
  } catch {
    // core.hooksPath is not set; fall through to the default resolution.
  }

  const hooksDirOutput = execFileSync(
    "git",
    ["rev-parse", "--git-path", "hooks"],
    { cwd: process.cwd(), encoding: "utf8" },
  ).trim();

  return isAbsolute(hooksDirOutput)
    ? hooksDirOutput
    : resolve(process.cwd(), hooksDirOutput);
}

const hooksDir = resolveHooksDir();
const hookPath = join(hooksDir, "commit-msg");

mkdirSync(hooksDir, { recursive: true });

const hook = `#!/bin/sh
# Installed by npm run hooks:install.
# Enforces Conventional Commits for The Pit.

npx --no-install commitlint --edit "$1"
`;

writeFileSync(hookPath, hook, "utf8");
chmodSync(hookPath, 0o755);

console.log(`Installed commit-msg hook at ${hookPath}.`);
