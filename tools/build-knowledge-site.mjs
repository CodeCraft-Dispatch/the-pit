import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function collectFiles(directory, extension) {
  return readdirSync(directory, { recursive: true })
    .filter((entry) => typeof entry === "string" && entry.endsWith(extension))
    .sort();
}

export function toPosixPath(filePath) {
  return filePath.replaceAll("\\", "/");
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function encodePathForHref(filePath) {
  return toPosixPath(filePath).split("/").map(encodeURIComponent).join("/");
}

export function renderFileLink(prefix, filePath) {
  const href = `${prefix}/${encodePathForHref(filePath)}`;
  const label = escapeHtml(toPosixPath(filePath));
  return `<li><a href="${href}">${label}</a></li>`;
}

export function buildKnowledgeSite(rootDir = process.cwd()) {
  const knowledgeBaseDir = join(rootDir, "docs/knowledge-base");
  const specificationsDir = join(rootDir, "specifications");
  const outputDir = join(rootDir, "dist");
  const outputKnowledgeBaseDir = join(outputDir, "knowledge-base");
  const outputSpecificationsDir = join(outputDir, "specifications");

  const knowledgeBaseFiles = collectFiles(knowledgeBaseDir, ".md");
  const featureFiles = collectFiles(specificationsDir, ".feature");

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputKnowledgeBaseDir, { recursive: true });
  mkdirSync(outputSpecificationsDir, { recursive: true });

  cpSync(knowledgeBaseDir, outputKnowledgeBaseDir, { recursive: true });
  cpSync(specificationsDir, outputSpecificationsDir, { recursive: true });

  const docLinks = knowledgeBaseFiles
    .map((file) => renderFileLink("knowledge-base", file))
    .join("\n");

  const featureLinks = featureFiles
    .map((file) => renderFileLink("specifications", file))
    .join("\n");

  const readme = readFileSync(join(rootDir, "README.md"), "utf8");
  const title = escapeHtml(readme.match(/^#\s+(.+)$/m)?.[1] ?? "The Pit");

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

  return {
    knowledgeBaseCount: knowledgeBaseFiles.length,
    featureCount: featureFiles.length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = buildKnowledgeSite(process.cwd());
  console.log(
    `Built knowledge-base site with ${result.knowledgeBaseCount} documents and ${result.featureCount} executable specification file(s).`,
  );
}
