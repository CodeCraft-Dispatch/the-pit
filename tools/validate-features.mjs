import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateFeatureDocument } from './lib/feature-grammar.mjs';

function collectFeatureFiles(rootDir) {
  const results = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith('.feature')) {
        results.push(absolutePath);
      }
    }
  }

  return results.sort();
}

const rootDir = join(process.cwd(), 'specifications');
const featureFiles = collectFeatureFiles(rootDir);
const errors = [];

for (const featureFile of featureFiles) {
  const source = readFileSync(featureFile, 'utf8');
  const result = validateFeatureDocument(source, { path: featureFile });
  errors.push(...result.errors);
}

if (featureFiles.length === 0) {
  errors.push('specifications must contain at least one .feature file');
}

if (errors.length > 0) {
  console.error('Executable specification contract failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${featureFiles.length} executable specification file(s).`);
