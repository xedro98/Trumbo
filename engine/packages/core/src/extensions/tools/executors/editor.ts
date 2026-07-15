/**
 * Editor Executor
 *
 * Built-in implementation for filesystem editing operations.
 * Uses the fuzzy-diff module for robust text matching that survives
 * Unicode normalization differences, trailing whitespace mismatches,
 * smart quote/dash variants, BOM-prefixed files, and CRLF line endings.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AgentToolContext } from "@trumbo/shared";
import type { EditFileInput } from "../schemas";
import type { EditorExecutor } from "../types";
import {
	applyEditsToNormalizedContent,
	detectLineEnding,
	type Edit,
	generateDiffString,
	normalizeForFuzzyMatch,
	normalizeToLF,
	restoreLineEndings,
	stripBom,
} from "./fuzzy-diff";

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
	 * Maximum number of diff lines in the editor output
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
	const rawContent = await fs.readFile(filePath, encoding);

	// Strip BOM before matching (the model won't include the invisible BOM in oldText)
	const { bom, text: content } = stripBom(rawContent);

	// Detect and normalize line endings
	const lineEnding = detectLineEnding(content);
	const normalizedContent = normalizeToLF(content);

	// Apply the edit using the fuzzy diff engine
	const edits: Edit[] = [{ oldText: oldStr, newText: newStr ?? "" }];
	const { baseContent, newContent } = applyEditsToNormalizedContent(
		normalizedContent,
		edits,
		filePath,
	);

	// Restore line endings and BOM before writing
	const restoredContent = restoreLineEndings(newContent, lineEnding);
	await fs.writeFile(filePath, bom + restoredContent, { encoding });

	// Generate a display diff
	const { diff, firstChangedLine } = generateDiffString(
		baseContent,
		newContent,
	);
	const truncatedDiff =
		diff.split("\n").length > maxDiffLines
			? `${diff.split("\n").slice(0, maxDiffLines).join("\n")}\n... diff truncated ...`
			: diff;

	const fuzzyNote =
		normalizeForFuzzyMatch(content) !== content
			? " (fuzzy match — the file had minor Unicode or whitespace differences from the provided old_text)"
			: "";

	const lineNote =
		firstChangedLine !== undefined
			? ` (first change at line ${firstChangedLine})`
			: "";
	return `Edited ${filePath}${fuzzyNote}${lineNote}\n\`\`\`diff\n${truncatedDiff}\n\`\`\``;
}

async function insertInFile(
	filePath: string,
	insertLineOneBased: number,
	newStr: string,
	encoding: BufferEncoding,
): Promise<string> {
	const rawContent = await fs.readFile(filePath, encoding);

	// Strip BOM before processing
	const { bom, text: content } = stripBom(rawContent);

	// Detect and normalize line endings
	const lineEnding = detectLineEnding(content);
	const normalizedContent = normalizeToLF(content);

	const lines = normalizedContent.split("\n");
	const maxBoundaryLine = lines.length + 1;

	if (insertLineOneBased < 1 || insertLineOneBased > maxBoundaryLine) {
		throw new Error(
			`Invalid insert_line: ${insertLineOneBased}. insert_line must be a positive one-based boundary line in the range 1-${maxBoundaryLine}. Use ${maxBoundaryLine} to append at EOF.`,
		);
	}

	const insertLine = insertLineOneBased - 1;
	lines.splice(insertLine, 0, ...normalizeToLF(newStr).split("\n"));

	// Restore line endings and BOM before writing
	const restoredContent = restoreLineEndings(lines.join("\n"), lineEnding);
	await fs.writeFile(filePath, bom + restoredContent, { encoding });

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
