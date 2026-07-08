import type { Anthropic } from "@anthropic-ai/sdk"
import type { TrumboMessageMetricsInfo, TrumboMessageModelInfo } from "./metrics"

export type TrumboPromptInputContent = string

export type TrumboMessageRole = "user" | "assistant"

export interface TrumboReasoningDetailParam {
	type: "reasoning.text" | string
	text: string
	signature: string
	format: "anthropic-claude-v1" | string
	index: number
}

interface TrumboSharedMessageParam {
	// The id of the response that the block belongs to
	call_id?: string
}

export const REASONING_DETAILS_PROVIDERS = ["trumbo", "openrouter"]

/**
 * An extension of Anthropic.MessageParam that includes Trumbo-specific fields: reasoning_details.
 * This ensures backward compatibility where the messages were stored in Anthropic format with additional
 * fields unknown to Anthropic SDK.
 */
export interface TrumboTextContentBlock extends Anthropic.TextBlockParam, TrumboSharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: TrumboReasoningDetailParam[]
	// Thought Signature associates with Gemini
	signature?: string
}

export interface TrumboImageContentBlock extends Anthropic.ImageBlockParam, TrumboSharedMessageParam {}

export interface TrumboDocumentContentBlock extends Anthropic.DocumentBlockParam, TrumboSharedMessageParam {}

export interface TrumboUserToolResultContentBlock extends Anthropic.ToolResultBlockParam, TrumboSharedMessageParam {}

/**
 * Assistant only content types
 */
export interface TrumboAssistantToolUseBlock extends Anthropic.ToolUseBlockParam, TrumboSharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: unknown[] | TrumboReasoningDetailParam[]
	// Thought Signature associates with Gemini
	signature?: string
}

export interface TrumboAssistantThinkingBlock extends Anthropic.ThinkingBlock, TrumboSharedMessageParam {
	// The summary items returned by OpenAI response API
	// The reasoning details that will be moved to the text block when finalized
	summary?: unknown[] | TrumboReasoningDetailParam[]
}

export interface TrumboAssistantRedactedThinkingBlock extends Anthropic.RedactedThinkingBlockParam, TrumboSharedMessageParam {}

export type TrumboToolResponseContent = TrumboPromptInputContent | Array<TrumboTextContentBlock | TrumboImageContentBlock>

export type TrumboUserContent =
	| TrumboTextContentBlock
	| TrumboImageContentBlock
	| TrumboDocumentContentBlock
	| TrumboUserToolResultContentBlock

export type TrumboAssistantContent =
	| TrumboTextContentBlock
	| TrumboImageContentBlock
	| TrumboDocumentContentBlock
	| TrumboAssistantToolUseBlock
	| TrumboAssistantThinkingBlock
	| TrumboAssistantRedactedThinkingBlock

export type TrumboContent = TrumboUserContent | TrumboAssistantContent

/**
 * An extension of Anthropic.MessageParam that includes Trumbo-specific fields.
 * This ensures backward compatibility where the messages were stored in Anthropic format,
 * while allowing for additional metadata specific to Trumbo to avoid unknown fields in Anthropic SDK
 * added by ignoring the type checking for those fields.
 */
export interface TrumboStorageMessage extends Anthropic.MessageParam {
	/**
	 * Response ID associated with this message
	 */
	id?: string
	role: TrumboMessageRole
	content: TrumboPromptInputContent | TrumboContent[]
	/**
	 * NOTE: model information used when generating this message.
	 * Internal use for message conversion only.
	 * MUST be removed before sending message to any LLM provider.
	 */
	modelInfo?: TrumboMessageModelInfo
	/**
	 * LLM operational and performance metrics for this message
	 * Includes token counts, costs.
	 */
	metrics?: TrumboMessageMetricsInfo
	/**
	 * Timestamp of when the message was created
	 */
	ts?: number
}

/**
 * Converts TrumboStorageMessage to Anthropic.MessageParam by removing Trumbo-specific fields
 * Trumbo-specific fields (like modelInfo, reasoning_details) are properly omitted.
 */
export function convertTrumboStorageToAnthropicMessage(
	trumboMessage: TrumboStorageMessage,
	provider = "anthropic",
): Anthropic.MessageParam {
	const { role, content } = trumboMessage

	// Handle string content - fast path
	if (typeof content === "string") {
		return { role, content }
	}

	// Removes thinking block that has no signature (invalid thinking block that's incompatible with Anthropic API)
	const filteredContent = content.filter((b) => b.type !== "thinking" || !!b.signature)

	// Handle array content - strip Trumbo-specific fields for non-reasoning_details providers
	const shouldCleanContent = !REASONING_DETAILS_PROVIDERS.includes(provider)
	const cleanedContent = shouldCleanContent
		? filteredContent.map(cleanContentBlock)
		: (filteredContent as Anthropic.MessageParam["content"])

	return { role, content: cleanedContent }
}

/**
 * Trumbo stores images as base64, so an image block's source is always a base64 source.
 * The Anthropic SDK types the source as a Base64ImageSource | URLImageSource union, so this
 * narrows to the base64 variant for the transform layer. URL sources are not produced by Trumbo,
 * so they degrade to empty values rather than throwing.
 */
export function getBase64ImageSource(source: Anthropic.ImageBlockParam["source"]): { mediaType: string; data: string } {
	if (source.type === "base64") {
		return { mediaType: source.media_type, data: source.data }
	}
	return { mediaType: "", data: "" }
}

/**
 * Builds a base64 data URL from an image block's source. See getBase64ImageSource.
 */
export function getImageDataUrl(source: Anthropic.ImageBlockParam["source"]): string {
	const { mediaType, data } = getBase64ImageSource(source)
	return `data:${mediaType};base64,${data}`
}

/**
 * Clean a content block by removing Trumbo-specific fields and returning only Anthropic-compatible fields
 */
export function cleanContentBlock(block: TrumboContent): Anthropic.ContentBlock {
	// Fast path: if no Trumbo-specific fields exist, return as-is
	const hasTrumboFields =
		"reasoning_details" in block ||
		"call_id" in block ||
		"summary" in block ||
		(block.type !== "thinking" && "signature" in block)

	if (!hasTrumboFields) {
		return block as Anthropic.ContentBlock
	}

	// Removes Trumbo-specific fields & the signature field that's added for Gemini.
	const { reasoning_details, call_id, summary, ...rest } = block as any

	// Remove signature from non-thinking blocks that were added for Gemini
	if (block.type !== "thinking" && rest.signature) {
		rest.signature = undefined
	}

	return rest satisfies Anthropic.ContentBlock
}
