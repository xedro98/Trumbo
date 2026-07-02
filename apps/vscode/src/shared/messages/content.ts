import type { Anthropic } from "@anthropic-ai/sdk"
import type { TremboMessageMetricsInfo, TremboMessageModelInfo } from "./metrics"

export type TremboPromptInputContent = string

export type TremboMessageRole = "user" | "assistant"

export interface TremboReasoningDetailParam {
	type: "reasoning.text" | string
	text: string
	signature: string
	format: "anthropic-claude-v1" | string
	index: number
}

interface TremboSharedMessageParam {
	// The id of the response that the block belongs to
	call_id?: string
}

export const REASONING_DETAILS_PROVIDERS = ["trembo", "openrouter"]

/**
 * An extension of Anthropic.MessageParam that includes Trembo-specific fields: reasoning_details.
 * This ensures backward compatibility where the messages were stored in Anthropic format with additional
 * fields unknown to Anthropic SDK.
 */
export interface TremboTextContentBlock extends Anthropic.TextBlockParam, TremboSharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: TremboReasoningDetailParam[]
	// Thought Signature associates with Gemini
	signature?: string
}

export interface TremboImageContentBlock extends Anthropic.ImageBlockParam, TremboSharedMessageParam {}

export interface TremboDocumentContentBlock extends Anthropic.DocumentBlockParam, TremboSharedMessageParam {}

export interface TremboUserToolResultContentBlock extends Anthropic.ToolResultBlockParam, TremboSharedMessageParam {}

/**
 * Assistant only content types
 */
export interface TremboAssistantToolUseBlock extends Anthropic.ToolUseBlockParam, TremboSharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: unknown[] | TremboReasoningDetailParam[]
	// Thought Signature associates with Gemini
	signature?: string
}

export interface TremboAssistantThinkingBlock extends Anthropic.ThinkingBlock, TremboSharedMessageParam {
	// The summary items returned by OpenAI response API
	// The reasoning details that will be moved to the text block when finalized
	summary?: unknown[] | TremboReasoningDetailParam[]
}

export interface TremboAssistantRedactedThinkingBlock extends Anthropic.RedactedThinkingBlockParam, TremboSharedMessageParam {}

export type TremboToolResponseContent = TremboPromptInputContent | Array<TremboTextContentBlock | TremboImageContentBlock>

export type TremboUserContent =
	| TremboTextContentBlock
	| TremboImageContentBlock
	| TremboDocumentContentBlock
	| TremboUserToolResultContentBlock

export type TremboAssistantContent =
	| TremboTextContentBlock
	| TremboImageContentBlock
	| TremboDocumentContentBlock
	| TremboAssistantToolUseBlock
	| TremboAssistantThinkingBlock
	| TremboAssistantRedactedThinkingBlock

export type TremboContent = TremboUserContent | TremboAssistantContent

/**
 * An extension of Anthropic.MessageParam that includes Trembo-specific fields.
 * This ensures backward compatibility where the messages were stored in Anthropic format,
 * while allowing for additional metadata specific to Trembo to avoid unknown fields in Anthropic SDK
 * added by ignoring the type checking for those fields.
 */
export interface TremboStorageMessage extends Anthropic.MessageParam {
	/**
	 * Response ID associated with this message
	 */
	id?: string
	role: TremboMessageRole
	content: TremboPromptInputContent | TremboContent[]
	/**
	 * NOTE: model information used when generating this message.
	 * Internal use for message conversion only.
	 * MUST be removed before sending message to any LLM provider.
	 */
	modelInfo?: TremboMessageModelInfo
	/**
	 * LLM operational and performance metrics for this message
	 * Includes token counts, costs.
	 */
	metrics?: TremboMessageMetricsInfo
	/**
	 * Timestamp of when the message was created
	 */
	ts?: number
}

/**
 * Converts TremboStorageMessage to Anthropic.MessageParam by removing Trembo-specific fields
 * Trembo-specific fields (like modelInfo, reasoning_details) are properly omitted.
 */
export function convertTremboStorageToAnthropicMessage(
	tremboMessage: TremboStorageMessage,
	provider = "anthropic",
): Anthropic.MessageParam {
	const { role, content } = tremboMessage

	// Handle string content - fast path
	if (typeof content === "string") {
		return { role, content }
	}

	// Removes thinking block that has no signature (invalid thinking block that's incompatible with Anthropic API)
	const filteredContent = content.filter((b) => b.type !== "thinking" || !!b.signature)

	// Handle array content - strip Trembo-specific fields for non-reasoning_details providers
	const shouldCleanContent = !REASONING_DETAILS_PROVIDERS.includes(provider)
	const cleanedContent = shouldCleanContent
		? filteredContent.map(cleanContentBlock)
		: (filteredContent as Anthropic.MessageParam["content"])

	return { role, content: cleanedContent }
}

/**
 * Trembo stores images as base64, so an image block's source is always a base64 source.
 * The Anthropic SDK types the source as a Base64ImageSource | URLImageSource union, so this
 * narrows to the base64 variant for the transform layer. URL sources are not produced by Trembo,
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
 * Clean a content block by removing Trembo-specific fields and returning only Anthropic-compatible fields
 */
export function cleanContentBlock(block: TremboContent): Anthropic.ContentBlock {
	// Fast path: if no Trembo-specific fields exist, return as-is
	const hasTremboFields =
		"reasoning_details" in block ||
		"call_id" in block ||
		"summary" in block ||
		(block.type !== "thinking" && "signature" in block)

	if (!hasTremboFields) {
		return block as Anthropic.ContentBlock
	}

	// Removes Trembo-specific fields & the signature field that's added for Gemini.
	const { reasoning_details, call_id, summary, ...rest } = block as any

	// Remove signature from non-thinking blocks that were added for Gemini
	if (block.type !== "thinking" && rest.signature) {
		rest.signature = undefined
	}

	return rest satisfies Anthropic.ContentBlock
}
