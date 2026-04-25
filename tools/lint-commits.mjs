/**
 * Portable commitlint range runner.
 *
 * Reads COMMITLINT_FROM and COMMITLINT_TO from the environment (with fallbacks)
 * so this works on Windows cmd/PowerShell as well as POSIX shells, unlike the
 * ${VAR:-default} substitution syntax that npm scripts would pass literally on
 * non-POSIX platforms.
 */

import { spawnSync } from "node:child_process";

const from = process.env.COMMITLINT_FROM || "HEAD~1";
const to = process.env.COMMITLINT_TO || "HEAD";
const command = process.platform === "win32" ? "commitlint.cmd" : "commitlint";

const result = spawnSync(command, ["--from", from, "--to", to, "--verbose"], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
