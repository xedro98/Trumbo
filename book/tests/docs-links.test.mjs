import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

// Guards the docs/CLI rebrand: no stale x.ai *links* or typosquat (trembo)
// links may come back into the Mintlify docs (book/) or the native CLI's
// user-facing docs. Docs live at docs.trumbo.dev; the CLI updates via
// @trumbodev/cli. Upstream attribution (xai-org/grok-build) and historical
// CHANGELOG prose are intentional and skipped.
const BANNED = ["docs.x.ai", "console.x.ai", "x.ai/cli", "xedro98/trembo"];
const ALLOWED = ["media.x.ai"]; // remote brand-image CDN, not a migrated link

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const dir = (p) => join(root, p);

function walk(dirPath) {
  const out = [];
  for (const entry of readdirSync(dirPath)) {
    const full = join(dirPath, entry);
    if (statSync(full).isDirectory()) {
      if (["node_modules", "target", "dist", ".git"].includes(entry)) continue;
      out.push(...walk(full));
    } else if ([".md", ".mdx"].includes(extname(full))) {
      out.push(full);
    }
  }
  return out;
}

function docsFiles() {
  const files = walk(dir("book"));
  const cli = dir("projects/trumbo-cli");
  for (const f of ["README.md", "TRUMBO.md", "CHANGELOG.md"]) files.push(join(cli, f));
  files.push(join(cli, "crates/codegen/xai-grok-shell/README.md"));
  files.push(...walk(join(cli, "crates/codegen/xai-grok-pager/docs")));
  files.push(...walk(join(cli, "crates/codegen/xai-grok-pager/npm")));
  return files;
}

test("docs and CLI contain no stale x.ai / trembo links", () => {
  const hits = [];
  for (const file of docsFiles()) {
    if (file.endsWith("/CHANGELOG.md")) continue; // historical prose
    const text = readFileSync(file, "utf8");
    text.split("\n").forEach((line, i) => {
      if (BANNED.some((b) => line.includes(b)) && !ALLOWED.some((a) => line.includes(a))) {
        hits.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(hits, []);
});
