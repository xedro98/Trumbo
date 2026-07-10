/**
 * Editor Executor
 *
 * Built-in implementation for filesystem editing operations.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AgentToolContext } from "@trumbo/shared";
import type { EditFileInput } from "../schemas";
import type { EditorExecutor } from "../types";

/**
 * Options for the editor executor
 */
export interface EditorExecutorOptions {
	/**
	 * File encoding used for read/write operations
	 * @default "utf-8"
	 */
	encoding?: BufferEncoding;

	/**
	 * Restrict relative-path file operations to paths inside cwd.
	 * Absolute paths are always accepted as-is.
	 * @default true
	 */
	restrictToCwd?: boolean;

	/**
	 * Maximum number of diff lines in str_replace output
	 * @default 200
	 */
	maxDiffLines?: number;
}

function resolveFilePath(
	cwd: string,
	inputPath: string,
	restrictToCwd: boolean,
): string {
	const isAbsoluteInput = path.isAbsolute(inputPath);
	const resolved = isAbsoluteInput
		? path.normalize(inputPath)
		: path.resolve(cwd, inputPath);
	if (!restrictToCwd) {
		return resolved;
	}

	// Absolute paths are accepted directly; cwd restriction applies to relative inputs.
	if (isAbsoluteInput) {
		return resolved;
	}

	const rel = path.relative(cwd, resolved);
	if (rel.startsWith("..") || path.isAbsolute(rel)) {
		throw new Error(`Path must stay within cwd: ${inputPath}`);
	}
	return resolved;
}

function countOccurrences(content: string, needle: string): number {
	if (needle.length === 0) return 0;
	return content.split(needle).length - 1;
}

// --- Fuzzy matching (ported from apply-patch-parser.ts) ----------------------
// Allows edits to succeed when the file has minor differences (whitespace,
// formatting) from the model's `oldStr`. Falls back to a similarity-based
// search when the exact match fails.

function levenshteinDistance(str1: string, str2: string): number {
	const rows = str2.length + 1;
	const cols = str1.length + 1;
	const matrix = new Array<number>(rows * cols).fill(0);
	const at = (r: number, c: number): number => matrix[r * cols + c] ?? 0;
	const set = (r: number, c: number, value: number): void => {
		matrix[r * cols + c] = value;
	};

	for (let r = 0; r < rows; r++) set(r, 0, r);
	for (let c = 0; c < cols; c++) set(0, c, c);

	for (let r = 1; r < rows; r++) {
		for (let c = 1; c < cols; c++) {
			const cost = str2[r - 1] === str1[c - 1] ? 0 : 1;
			set(
				r,
				c,
				Math.min(at(r - 1, c) + 1, at(r, c - 1) + 1, at(r - 1, c - 1) + cost),
			);
		}
	}
	return at(rows - 1, cols - 1);
}

function calculateSimilarity(str1: string, str2: string): number {
	const longer = str1.length > str2.length ? str1 : str2;
	const shorter = str1.length > str2.length ? str2 : str1;
	if (longer.length === 0) return 1;
	const dist = levenshteinDistance(shorter, longer);
	return (longer.length - dist) / longer.length;
}

const FUZZY_THRESHOLD = 0.66;

/**
 * Find the best matching region in `content` for `oldStr` and replace it.
 * Tries exact match first, then falls back to fuzzy (line-level similarity).
 * Returns `{ result, fuzzy }` on success, or `null` if no good match found.
 */
function fuzzyReplace(
	content: string,
	oldStr: string,
	newStr: string,
): { result: string; fuzzy: boolean } | null {
	// Exact match
	if (content.includes(oldStr)) {
		return { result: content.replace(oldStr, newStr), fuzzy: false };
	}

	// Fuzzy: slide a window of the same line count over the content and find
	// the region with the highest similarity to oldStr.
	const oldLines = oldStr.split("\n");
	const contentLines = content.split("\n");
	const windowLen = oldLines.length;
	if (windowLen === 0 || windowLen > contentLines.length) return null;

	let bestScore = 0;
	let bestStart = -1;

	for (let i = 0; i <= contentLines.length - windowLen; i++) {
		const candidate = contentLines.slice(i, i + windowLen).join("\n");
		const score = calculateSimilarity(candidate, oldStr);
		if (score > bestScore) {
			bestScore = score;
			bestStart = i;
		}
	}

	if (bestScore >= FUZZY_THRESHOLD && bestStart >= 0) {
		const before = contentLines.slice(0, bestStart).join("\n");
		const after = contentLines.slice(bestStart + windowLen).join("\n");
		const result = `${before}\n${newStr}\n${after}`;
		return { result, fuzzy: true };
	}

	return null;
}

function createLineDiff(
	oldContent: string,
	newContent: string,
	maxLines: number,
): string {
	const oldLines = oldContent.split("\n");
	const newLines = newContent.split("\n");
	const max = Math.max(oldLines.length, newLines.length);
	const out: string[] = ["```diff"];
	let emitted = 0;

	for (let i = 0; i < max; i++) {
		if (emitted >= maxLines) {
			out.push("... diff truncated ...");
			break;
		}

		const oldLine = oldLines[i];
		const newLine = newLines[i];

		if (oldLine === newLine) {
			continue;
		}

		const lineNo = i + 1;
		if (oldLine !== undefined) {
			out.push(`-${lineNo}: ${oldLine}`);
			emitted++;
		}
		if (newLine !== undefined && emitted < maxLines) {
			out.push(`+${lineNo}: ${newLine}`);
			emitted++;
		}
	}

	out.push("```");
	return out.join("\n");
}

async function createFile(
	filePath: string,
	fileText: string,
	encoding: BufferEncoding,
): Promise<string> {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, fileText, { encoding });
	return `File created successfully at: ${filePath}`;
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function replaceInFile(
	filePath: string,
	oldStr: string,
	newStr: string | null | undefined,
	encoding: BufferEncoding,
	maxDiffLines: number,
): Promise<string> {
	const content = await fs.readFile(filePath, encoding);

	// Try exact match first (fast path), then fall back to fuzzy matching
	// for cases where the file has minor differences from the model's oldStr.
	const fuzzyResult = fuzzyReplace(content, oldStr, newStr ?? "");

	if (!fuzzyResult) {
		throw new Error(
			`No replacement performed: text not found in ${filePath} (exact and fuzzy match both failed).`,
		);
	}

	// For exact matches, verify there's only one occurrence (avoid ambiguous
	// replacements). Fuzzy matches are inherently single-result.
	if (!fuzzyResult.fuzzy) {
		const occurrences = countOccurrences(content, oldStr);
		if (occurrences > 1) {
			throw new Error(
				`No replacement performed: multiple occurrences of text found in ${filePath}.`,
			);
		}
	}

	await fs.writeFile(filePath, fuzzyResult.result, { encoding });

	const diff = createLineDiff(content, fuzzyResult.result, maxDiffLines);
	const fuzzyNote = fuzzyResult.fuzzy
		? " (fuzzy match — the file had minor differences from the provided old_str)"
		: "";
	return `Edited ${filePath}${fuzzyNote}\n${diff}`;
}

async function insertInFile(
	filePath: string,
	insertLineOneBased: number,
	newStr: string,
	encoding: BufferEncoding,
): Promise<string> {
	const content = await fs.readFile(filePath, encoding);
	const lines = content.split("\n");
	const maxBoundaryLine = lines.length + 1;

	if (insertLineOneBased < 1 || insertLineOneBased > maxBoundaryLine) {
		throw new Error(
			`Invalid insert_line: ${insertLineOneBased}. insert_line must be a positive one-based boundary line in the range 1-${maxBoundaryLine}. Use ${maxBoundaryLine} to append at EOF.`,
		);
	}

	const insertLine = insertLineOneBased - 1;
	lines.splice(insertLine, 0, ...newStr.split("\n"));
	await fs.writeFile(filePath, lines.join("\n"), { encoding });

	return `Inserted content at line ${insertLineOneBased} in ${filePath}.`;
}

/**
 * Create an editor executor using Node.js fs module
 */
export function createEditorExecutor(
	options: EditorExecutorOptions = {},
): EditorExecutor {
	const {
		encoding = "utf-8",
		restrictToCwd = true,
		maxDiffLines = 200,
	} = options;

	return async (
		input: EditFileInput,
		cwd: string,
		_context: AgentToolContext,
	): Promise<string> => {
		const filePath = resolveFilePath(cwd, input.path, restrictToCwd);

		if (input.insert_line != null) {
			return insertInFile(
				filePath,
				input.insert_line, // One-based index
				input.new_text,
				encoding,
			);
		}

		if (!(await fileExists(filePath))) {
			return createFile(filePath, input.new_text, encoding);
		}
		if (input.old_text == null) {
			throw new Error(
				"Parameter `old_text` is required when editing an existing file without `insert_line`",
			);
		}

		return replaceInFile(
			filePath,
			input.old_text,
			input.new_text,
			encoding,
			maxDiffLines,
		);
	};
}
