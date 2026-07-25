/**
 * Patch @opentui-ui/dialog for opentui 0.4.x remove() contract.
 *
 * In opentui 0.1.x, `node.remove(id)` accepted a child ID (string/number).
 * In opentui 0.4.x, `node.remove(child)` expects the child node object itself.
 * The @opentui-ui/dialog@0.1.2 package (the latest available) still passes IDs,
 * which causes a runtime crash when the dialog tries to clean up nodes.
 *
 * This script patches the dialog dist files in-place after `bun install` to
 * pass the node object instead of the ID. It's idempotent — running it on
 * already-patched files is a no-op.
 */
import { readFileSync, writeFileSync, globSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PATCHES = [
	// react.mjs: renderer.root.remove(container.id) → renderer.root.remove(container)
	{
		pattern: /\.root\.remove\((\w+)\.id\)/g,
		replacement: ".root.remove($1)",
	},
	// dialog-container: this.remove(renderable.id) → this.remove(renderable)
	{
		pattern: /this\.remove\((\w+)\.id\)/g,
		replacement: "this.remove($1)",
	},
];

// The script lives at projects/console/scripts/patch-opentui-dialog.mjs.
// node_modules is at the repo root (2 levels up from the script dir) OR at the
// CWD (when run from the repo root). Search both to handle all contexts.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const searchRoots = [
	process.cwd(),
	join(scriptDir, "..", ".."), // projects/console → repo root
	join(scriptDir, "..", "..", ".."), // scripts/ → repo root
];

// Find all @opentui-ui/dialog dist files across all search roots.
const candidates = new Set();
for (const root of searchRoots) {
	for (const pattern of [
		"node_modules/@opentui-ui/dialog/dist/react.mjs",
		"node_modules/.bun/@opentui-ui+dialog@*/node_modules/@opentui-ui/dialog/dist/react.mjs",
		"node_modules/@opentui-ui/dialog/dist/dialog-container-*.mjs",
		"node_modules/.bun/@opentui-ui+dialog@*/node_modules/@opentui-ui/dialog/dist/dialog-container-*.mjs",
	]) {
		for (const match of globSync(pattern, { cwd: root })) {
			candidates.add(join(root, match));
		}
	}
}

let patched = 0;
for (const file of candidates) {
	let content = readFileSync(file, "utf8");
	let mutated = false;
	for (const { pattern, replacement } of PATCHES) {
		const next = content.replace(pattern, replacement);
		if (next !== content) {
			content = next;
			mutated = true;
		}
	}
	if (mutated) {
		writeFileSync(file, content, "utf8");
		patched++;
		console.log(`[patch-opentui-dialog] patched ${file}`);
	}
}

if (patched === 0) {
	console.log("[patch-opentui-dialog] no files needed patching (already patched or not found)");
}
