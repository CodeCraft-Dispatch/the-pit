import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const requiredPaths = [
  "README.md",
  "AGENTS.md",
  "package.json",
  "netlify.toml",
  "specifications/README.md",
  "specifications/foundations/test-first-delivery.feature",
  "docs/knowledge-base/README.md",
  "docs/knowledge-base/engineering-foundations.md",
  "docs/knowledge-base/delivery-pipeline.md",
  "docs/knowledge-base/security-standards.md",
  "codex/instructions/engineering-workflow.md",
  "codex/agents/reactive-architect.md",
  "codex/agents/quality-guardian.md",
  "codex/skills/test-first-slice/README.md",
];

export function validateRepoContract(rootDir = process.cwd()) {
  const errors = [];

  for (const relativePath of requiredPaths) {
    const absolutePath = join(rootDir, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push(`missing required path: ${relativePath}`);
    }
  }

  const kbReadmePath = join(rootDir, "docs/knowledge-base/README.md");
  if (existsSync(kbReadmePath)) {
    const kbReadme = readFileSync(kbReadmePath, "utf8");
    for (const requiredReference of [
      "engineering-foundations.md",
      "delivery-pipeline.md",
      "security-standards.md",
    ]) {
      if (!kbReadme.includes(requiredReference)) {
        errors.push(
          `knowledge base README must reference ${requiredReference}`,
        );
      }
    }
  }

  const specificationsDir = join(rootDir, "specifications");
  if (existsSync(specificationsDir)) {
    const entries = readdirSync(specificationsDir, { recursive: true });
    const featureCount = entries.filter(
      (entry) => typeof entry === "string" && entry.endsWith(".feature"),
    ).length;
    if (featureCount === 0) {
      errors.push(
        "specifications directory must contain at least one .feature file",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
