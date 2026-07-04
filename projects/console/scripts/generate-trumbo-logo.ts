import { copyFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TRUMBO_LOGO_ASCII_SOURCE } from "../src/tui/logo-config.ts";

const rootDir = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(rootDir, "../src/tui/assets");
const sourcePath =
	process.env.TRUMBO_LOGO_ASCII_PATH?.trim() ||
	join(assetsDir, TRUMBO_LOGO_ASCII_SOURCE);
const logoTxtPath = join(assetsDir, "trumbo-logo.txt");

copyFileSync(sourcePath, logoTxtPath);

const text = readFileSync(logoTxtPath, "utf8");
const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
const trimmedLines = lines.map((line) => line.trimEnd());
while (
	trimmedLines.length > 0 &&
	trimmedLines[trimmedLines.length - 1] === ""
) {
	trimmedLines.pop();
}
const width = Math.max(0, ...trimmedLines.map((line) => line.length));

console.log(
	`Synced logo from ${sourcePath} -> ${logoTxtPath} (${trimmedLines.length} lines, ${width} cols).`,
);
