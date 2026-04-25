import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const gitDir = join(process.cwd(), ".git");
const hooksDir = join(gitDir, "hooks");
const hookPath = join(hooksDir, "commit-msg");

if (!existsSync(gitDir)) {
  console.error("Cannot install hooks because .git was not found.");
  process.exit(1);
}

mkdirSync(hooksDir, { recursive: true });

const hook = `#!/bin/sh
# Installed by npm run hooks:install.
# Enforces Conventional Commits for The Pit.

npx --no-install commitlint --edit "$1"
`;

writeFileSync(hookPath, hook, "utf8");
chmodSync(hookPath, 0o755);

console.log("Installed .git/hooks/commit-msg Conventional Commits hook.");
