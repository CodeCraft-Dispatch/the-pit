import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const knowledgeBaseDir = join(rootDir, "docs/knowledge-base");
const specificationsDir = join(rootDir, "specifications");
const outputDir = join(rootDir, "dist");
const outputKnowledgeBaseDir = join(outputDir, "knowledge-base");
const outputSpecificationsDir = join(outputDir, "specifications");

function collectFiles(directory, extension) {
  return readdirSync(directory, { recursive: true })
    .filter((entry) => typeof entry === "string" && entry.endsWith(extension))
    .sort();
}

const knowledgeBaseFiles = collectFiles(knowledgeBaseDir, ".md");
const featureFiles = collectFiles(specificationsDir, ".feature");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputKnowledgeBaseDir, { recursive: true });
mkdirSync(outputSpecificationsDir, { recursive: true });

cpSync(knowledgeBaseDir, outputKnowledgeBaseDir, { recursive: true });
cpSync(specificationsDir, outputSpecificationsDir, { recursive: true });

const docLinks = knowledgeBaseFiles
  .map((file) => `<li><a href="knowledge-base/${file}">${file}</a></li>`)
  .join("\n");

const featureLinks = featureFiles
  .map((file) => `<li><a href="specifications/${file}">${file}</a></li>`)
  .join("\n");

const readme = readFileSync(join(rootDir, "README.md"), "utf8");
const title = readme.match(/^#\s+(.+)$/m)?.[1] ?? "The Pit";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} - knowledge base</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 60rem; line-height: 1.5; padding: 0 1rem; }
      code { background: #f4f4f5; padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
      h1, h2 { line-height: 1.2; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p>This static output is the zero-cost Netlify surface for the repository knowledge base and executable specification inventory.</p>
    <h2>Knowledge base</h2>
    <ul>
      ${docLinks}
    </ul>
    <h2>Executable specifications</h2>
    <ul>
      ${featureLinks}
    </ul>
  </body>
</html>
`;

writeFileSync(join(outputDir, "index.html"), html, "utf8");
console.log(
  `Built knowledge-base site with ${knowledgeBaseFiles.length} documents and ${featureFiles.length} executable specification file(s).`,
);
