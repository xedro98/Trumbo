// LanguageModelV3 middleware that trims tool descriptions for Kimi/Moonshot
// models. Kimi's openai-completions endpoint handles large tool sets poorly:
// verbose descriptions inflate per-request token overhead and can exceed
// context limits on the first turn. This middleware trims each tool's prose
// description to a capped length while leaving the tool name and input schema
// intact, so tool calling still works — only the descriptive text is shortened.
//
// Applied only for the `moonshot` provider (see `openai-compatible.ts`), so
// non-Kimi providers are unaffected.

import type {
	LanguageModelV3CallOptions,
	LanguageModelV3Middleware,
} from "@ai-sdk/provider";

const MAX_TOOL_DESCRIPTION_LENGTH = 512;
const ELLIPSIS = "...";

/**
 * Trim a tool description to {@link MAX_TOOL_DESCRIPTION_LENGTH} characters,
 * appending an ellipsis if truncation occurred.
 */
function trimDescription(description: string): string {
	if (description.length <= MAX_TOOL_DESCRIPTION_LENGTH) {
		return description;
	}
	return `${description.slice(0, MAX_TOOL_DESCRIPTION_LENGTH - ELLIPSIS.length)}${ELLIPSIS}`;
}

/**
 * `LanguageModelV3Middleware` that caps tool description length for
 * Kimi/Moonshot models. Tool names and input schemas are untouched.
 */
export const deferKimiToolsMiddleware: LanguageModelV3Middleware = {
	specificationVersion: "v3",
	transformParams: async ({ params }) => {
		if (!params.tools || params.tools.length === 0) {
			return params;
		}
		let mutated = false;
		const trimmedTools = params.tools.map((tool) => {
			// `LanguageModelV3Tool` is a union of function and provider tools;
			// only function tools carry a `description` string.
			const description = (tool as { description?: unknown }).description;
			if (
				typeof description !== "string" ||
				description.length <= MAX_TOOL_DESCRIPTION_LENGTH
			) {
				return tool;
			}
			mutated = true;
			return {
				...tool,
				description: trimDescription(description),
			};
		});
		if (!mutated) {
			return params;
		}
		const next: LanguageModelV3CallOptions = {
			...params,
			tools: trimmedTools,
		};
		return next;
	},
};
