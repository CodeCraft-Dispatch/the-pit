import { validateRepoContract } from './lib/repo-contract.mjs';

const result = validateRepoContract(process.cwd());

if (!result.isValid) {
  console.error('Repository contract failed:\n');
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Repository contract is satisfied.');
