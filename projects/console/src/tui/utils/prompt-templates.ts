/**
 * Prompt template loader.
 *
 * Loads markdown prompt templates from `~/.trumbo/prompts/` and
 * `.trumbo/prompts/` (project-local). Templates are markdown files with
 * optional YAML frontmatter:
 *
 * ```markdown
 * ---
 * description: Review a file for issues
 * arguments:
 *   - name: file
 *     description: File path to review
 * ---
 * Review the file at $1 for potential issues, bugs, and improvements.
 * Focus on: $@.
 * ```
 *
 * Templates are registered as slash commands (e.g. `/review src/index.ts`)
 * and expanded by replacing `$1`, `$2`, etc. with positional arguments and
 * `$@` with all arguments joined.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { resolveTrumboDir } from "@trumbo/shared/storage";

export interface PromptTemplateArgument {
	name: string;
	description?: string;
}

export interface PromptTemplate {
	/** Template name (used as the slash command, e.g. "review" → /review) */
	name: string;
	/** Human-readable description */
	description?: string;
	/** Template content with $1, $2, $@ placeholders */
	content: string;
	/** Declared arguments from frontmatter */
	arguments?: PromptTemplateArgument[];
	/** Source path (global or project-local) */
	source: "global" | "project";
}

/**
 * Parse simple YAML-like frontmatter from a markdown string.
 *
 * This is a minimal parser that handles `key: value` pairs and
 * `  - name: value` list items. It does NOT support nested structures
 * or complex YAML — just enough for prompt template frontmatter.
 */
export function parseFrontmatter(raw: string): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
	if (!match) {
		return { frontmatter: {}, body: raw };
	}

	const frontmatterRaw = match[1];
	const body = match[2];
	const frontmatter: Record<string, unknown> = {};

	let currentKey: string | null = null;
	let currentList: unknown[] = [];

	for (const line of frontmatterRaw.split("\n")) {
		const listMatch = line.match(/^\s+-\s+(\S+):\s*(.*)$/);
		const kvMatch = line.match(/^(\S+):\s*(.*)$/);

		if (listMatch && currentKey) {
			if (currentList.length === 0) {
				currentList = [];
			}
			const itemName = listMatch[1];
			const itemValue = listMatch[2].trim();
			currentList.push({ [itemName]: itemValue });
			frontmatter[currentKey] = currentList;
		} else if (kvMatch) {
			if (currentKey && currentList.length > 0) {
				currentList = [];
			}
			currentKey = kvMatch[1];
			const value = kvMatch[2].trim();
			if (value) {
				frontmatter[currentKey] = value;
				currentList = [];
			} else {
				currentList = [];
			}
		}
	}

	return { frontmatter, body };
}

/**
 * Load a single prompt template from a file.
 */
function loadTemplateFile(
	filePath: string,
	name: string,
	source: "global" | "project",
): PromptTemplate | undefined {
	try {
		const raw = readFileSync(filePath, "utf8");
		const { frontmatter, body } = parseFrontmatter(raw);
		return {
			name,
			description:
				typeof frontmatter.description === "string"
					? frontmatter.description
					: undefined,
			content: body.trim(),
			arguments: Array.isArray(frontmatter.arguments)
				? (frontmatter.arguments as PromptTemplateArgument[])
				: undefined,
			source,
		};
	} catch {
		return undefined;
	}
}

/**
 * Load all prompt templates from global and project-local directories.
 *
 * Project-local templates override global templates with the same name.
 */
export function loadPromptTemplates(
	workspacePath?: string,
): Map<string, PromptTemplate> {
	const templates = new Map<string, PromptTemplate>();

	// Load global templates from ~/.trumbo/prompts/
	const globalDir = join(resolveTrumboDir(), "prompts");
	loadTemplatesFromDir(globalDir, "global", templates);

	// Load project-local templates from .trumbo/prompts/
	if (workspacePath) {
		const projectDir = join(workspacePath, ".trumbo", "prompts");
		loadTemplatesFromDir(projectDir, "project", templates);
	}

	return templates;
}

function loadTemplatesFromDir(
	dir: string,
	source: "global" | "project",
	templates: Map<string, PromptTemplate>,
): void {
	if (!existsSync(dir)) return;
	try {
		const entries = readdirSync(dir);
		for (const entry of entries) {
			const fullPath = join(dir, entry);
			try {
				const stat = statSync(fullPath);
				if (!stat.isFile()) continue;
				if (!entry.endsWith(".md") && !entry.endsWith(".markdown")) continue;
				const name = entry.replace(/\.(md|markdown)$/, "");
				const template = loadTemplateFile(fullPath, name, source);
				if (template) {
					templates.set(name, template);
				}
			} catch {
				// Skip invalid files
			}
		}
	} catch {
		// Skip if directory read fails
	}
}

/**
 * Expand a prompt template with the given arguments.
 *
 * Replaces `$1`, `$2`, etc. with positional arguments and `$@` with all
 * arguments joined by spaces.
 *
 * @example
 * expandTemplate("Review $1 for issues. Focus on: $@", ["src/index.ts", "performance"])
 * → "Review src/index.ts for issues. Focus on: src/index.ts performance"
 */
export function expandTemplate(template: string, args: string[]): string {
	let result = template;

	// Replace $@ with all arguments joined
	result = result.replace(/\$@/g, args.join(" "));

	// Replace $1, $2, etc. with positional arguments
	result = result.replace(/\$(\d+)/g, (match, numStr) => {
		const num = parseInt(numStr, 10);
		if (num >= 1 && num <= args.length) {
			return args[num - 1];
		}
		return match;
	});

	return result;
}

/**
 * Parse a slash command invocation into template name and arguments.
 *
 * @example
 * parseTemplateInvocation("/review src/index.ts performance")
 * → { name: "review", args: ["src/index.ts", "performance"] }
 */
export function parseTemplateInvocation(
	input: string,
): { name: string; args: string[] } | undefined {
	const trimmed = input.trim();
	if (!trimmed.startsWith("/")) return undefined;
	const parts = trimmed.slice(1).split(/\s+/);
	if (parts.length === 0) return undefined;
	return {
		name: parts[0],
		args: parts.slice(1),
	};
}
