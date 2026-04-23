import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateFeatureFlagManifest } from "./lib/feature-flags.mjs";
import { validateRepoContract } from "./lib/repo-contract.mjs";

const result = validateRepoContract(process.cwd());
const errors = [...result.errors];
const manifestPath = join(process.cwd(), "config/feature-flags.json");

if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const validation = validateFeatureFlagManifest(manifest, {
      path: "config/feature-flags.json",
    });
    errors.push(...validation.errors);
  } catch (error) {
    errors.push(`config/feature-flags.json: invalid JSON (${error.message})`);
  }
}

if (errors.length > 0) {
  console.error("Repository validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Repository validation is satisfied.");
