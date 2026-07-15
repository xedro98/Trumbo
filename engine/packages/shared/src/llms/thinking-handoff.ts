/**
 * Cross-provider thinking block handoff.
 *
 * When the user switches models mid-session, thinking/reasoning blocks
 * from the previous provider may not be understood by the new provider.
 * This module transforms thinking blocks into a portable format.
 *
 * Strategy:
 * - Anthropic thinking blocks with signatures → convert to `<thinking>` text tags
 * - OpenAI reasoning blocks → convert to `<thinking>` text tags
 * - Gemini thought blocks → convert to `<thinking>` text tags
 * - Any provider that doesn't support thinking → strip thinking blocks entirely
 */

import type {
	MessageWithMetadata,
	TextContent,
	ThinkingContent,
} from "@trumbodev/shared";

/**
 * Convert thinking blocks in messages to portable `<thinking>` text tags.
 *
 * This is used when switching to a provider that doesn't support the
 * source provider's native thinking format. The thinking content is
 * preserved as text so the context isn't lost.
 *
 * @param messages The messages to transform
 * @returns New messages with thinking blocks converted to text
 */
export function convertThinkingToTextTags(
	messages: readonly MessageWithMetadata[],
): MessageWithMetadata[] {
	return messages.map((message) => {
		if (typeof message.content === "string") {
			return message;
		}
		const converted = message.content.map((block) => {
			if (block.type === "thinking") {
				return thinkingBlockToText(block);
			}
			if (block.type === "redacted_thinking") {
				return {
					type: "text" as const,
					text: "[redacted thinking]",
				};
			}
			return block;
		});
		return { ...message, content: converted };
	});
}

/**
 * Strip thinking blocks entirely from messages.
 *
 * Used when the target provider doesn't support thinking at all and
 * thinking content would cause errors.
 */
export function stripThinkingBlocks(
	messages: readonly MessageWithMetadata[],
): MessageWithMetadata[] {
	return messages.map((message) => {
		if (typeof message.content === "string") {
			return message;
		}
		const filtered = message.content.filter(
			(block) =>
				block.type !== "thinking" && block.type !== "redacted_thinking",
		);
		return {
			...message,
			content: filtered.length > 0 ? filtered : [{ type: "text", text: "" }],
		};
	});
}

/**
 * Transform a single thinking block into a text block with `<thinking>` tags.
 */
function thinkingBlockToText(block: ThinkingContent): TextContent {
	const text = `<thinking>\n${block.thinking}\n</thinking>`;
	return { type: "text", text };
}

/**
 * Prepare messages for a provider switch.
 *
 * Detects the source and target provider and applies the appropriate
 * transformation to thinking blocks.
 *
 * @param messages The current session messages
 * @param targetProviderId The provider being switched to
 * @returns Transformed messages compatible with the target provider
 */
export function prepareForProviderSwitch(
	messages: readonly MessageWithMetadata[],
	targetProviderId: string,
): MessageWithMetadata[] {
	// Providers that support native thinking blocks
	const nativeThinkingProviders = new Set([
		"anthropic",
		"openai",
		"google",
		"bedrock",
		"vertex",
		"gemini",
	]);

	// If target supports thinking, keep blocks as-is
	// (the provider layer will handle format conversion)
	if (nativeThinkingProviders.has(targetProviderId)) {
		return [...messages];
	}

	// Otherwise convert thinking to text tags
	return convertThinkingToTextTags(messages);
}
