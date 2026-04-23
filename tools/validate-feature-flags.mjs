import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateFeatureFlagManifest } from "./lib/feature-flags.mjs";

const manifestPath = join(process.cwd(), "config/feature-flags.json");
const errors = [];

if (!existsSync(manifestPath)) {
  errors.push("missing feature flag manifest: config/feature-flags.json");
} else {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const result = validateFeatureFlagManifest(manifest, {
      path: "config/feature-flags.json",
    });
    errors.push(...result.errors);
  } catch (error) {
    errors.push(`config/feature-flags.json: invalid JSON (${error.message})`);
  }
}

if (errors.length > 0) {
  console.error("Feature flag manifest failed validation:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Feature flag manifest is valid.");
