import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import type { ToolApprovalRequest, ToolApprovalResult } from "@trumbo/shared";
import type { Config } from "../../utils/types";
import {
	applyInteractiveAutoApproveOverride,
	cloneToolPolicies,
	resolveInteractiveAutoApprovePolicy,
} from "../tool-policies";

/**
 * Compute a pre-execution diff preview for file-editing tools (editor, write,
 * apply_patch). Reads the current file content, applies the edit in-memory, and
 * produces a unified line-by-line diff. Returns undefined for non-edit tools or
 * when the file can't be read.
 */
function computeDiffPreview(
	toolName: string,
	input: unknown,
	cwd: string,
): string | undefined {
	try {
		if (toolName !== "editor" && toolName !== "edit" && toolName !== "write") {
			return undefined;
		}
		const editInput = input as {
			path?: string;
			filePath?: string;
			old_str?: string;
			oldStr?: string;
			new_str?: string | null;
			newStr?: string | null;
			content?: string;
			file_text?: string;
		};
		const filePath = editInput.path ?? editInput.filePath;
		if (!filePath) return undefined;

		const resolved = resolve(cwd, filePath);
		const rel = relative(cwd, resolved);
		if (rel.startsWith("..") || resolve(rel) === resolved) {
			// Path escapes cwd — skip preview for safety.
			return undefined;
		}

		let oldContent: string;
		try {
			oldContent = readFileSync(resolved, "utf8");
		} catch {
			// File doesn't exist yet — it's a create, not an edit.
			return undefined;
		}

		const oldStr = editInput.old_str ?? editInput.oldStr;
		const newStr = editInput.new_str ?? editInput.newStr;
		if (oldStr === undefined) return undefined;

		// Apply the replacement in-memory (same logic as the executor's exact
		// match path; the fuzzy path is harder to preview without the full
		// executor).
		const occurrences = oldContent.split(oldStr).length - 1;
		if (occurrences !== 1) return undefined;

		const newContent = oldContent.replace(oldStr, newStr ?? "");
		return createPreviewDiff(oldContent, newContent, 40);
	} catch {
		return undefined;
	}
}

function createPreviewDiff(
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
		if (oldLine === newLine) continue;
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

export interface InteractiveRuntimeRefs {
	tuiToolApprover: {
		current:
			| ((request: ToolApprovalRequest) => Promise<ToolApprovalResult>)
			| null;
	};
	tuiAskQuestion: {
		current: ((question: string, options: string[]) => Promise<string>) | null;
	};
}

export function createInteractiveApprovalController(config: Config) {
	const autoApproveAllRef = {
		current: config.toolPolicies["*"]?.autoApprove !== false,
	};
	const baselineToolPolicies = cloneToolPolicies(config.toolPolicies);
	const refs: InteractiveRuntimeRefs = {
		tuiToolApprover: { current: null },
		tuiAskQuestion: { current: null },
	};

	const setInteractiveAutoApprove = (enabled: boolean) => {
		autoApproveAllRef.current = enabled;
		applyInteractiveAutoApproveOverride({
			targetPolicies: config.toolPolicies,
			baselinePolicies: baselineToolPolicies,
			enabled,
		});
	};

	const requestToolApproval = async (
		request: ToolApprovalRequest,
	): Promise<ToolApprovalResult> => {
		if (autoApproveAllRef.current) {
			return { approved: true };
		}
		if (request.policy?.autoApprove === true) {
			return { approved: true };
		}
		// Compute a diff preview for file-editing tools so the user can review
		// the proposed changes before approving. This runs before the executor,
		// reading the file in-memory and applying the edit without writing.
		if (!request.diffPreview) {
			const preview = computeDiffPreview(
				request.toolName,
				request.input,
				config.cwd ?? process.cwd(),
			);
			if (preview) {
				request = { ...request, diffPreview: preview };
			}
		}
		if (refs.tuiToolApprover.current) {
			return refs.tuiToolApprover.current(request);
		}
		return { approved: false };
	};

	return {
		autoApproveAllRef,
		setInteractiveAutoApprove,
		requestToolApproval,
		resolveToolPolicy: (toolName: string) =>
			resolveInteractiveAutoApprovePolicy({
				toolName,
				baselinePolicies: baselineToolPolicies,
				enabled: autoApproveAllRef.current,
			}),
		...refs,
	};
}
