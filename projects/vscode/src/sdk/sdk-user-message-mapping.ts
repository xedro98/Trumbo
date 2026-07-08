import type { TrumboMessage } from "@shared/ExtensionMessage"
import { normalizeUserInput } from "@trumbo/shared"
import { ACT_MODE_CONTINUATION_PROMPT } from "./sdk-mode-coordinator"

export type SdkUserMessage = {
	role?: unknown
	content?: unknown
	metadata?: unknown
}

export function extractSdkUserText(message: SdkUserMessage): string {
	const { content } = message
	if (typeof content === "string") {
		return content.trim()
	}
	if (!Array.isArray(content)) {
		return ""
	}
	return content
		.map((block) => {
			if (!block || typeof block !== "object") {
				return ""
			}
			const typed = block as { type?: unknown; text?: unknown; content?: unknown }
			if (typed.type === "text" && typeof typed.text === "string") {
				return typed.text.trim()
			}
			if (typed.type === "file" && typeof typed.content === "string") {
				return typed.content.trim()
			}
			return ""
		})
		.filter(Boolean)
		.join("\n")
		.trim()
}

/**
 * Prompts sent to the SDK without a visible user_feedback echo (task
 * resumption, plan -> act auto-continue). They exist in SDK history but not
 * in the visible transcript, so ordinal mapping between the two must skip
 * them or every later user message maps one slot too early.
 */
export function isSyntheticUserPrompt(text: string): boolean {
	// Persisted prompts are wrapped by formatModePrompt as
	// <user_input mode="...">...</user_input>; strip that before matching.
	const normalized = normalizeUserInput(text)
	return normalized.startsWith("[TASK RESUMPTION]") || normalized === ACT_MODE_CONTINUATION_PROMPT
}

function hasAttachmentBlocks(message: SdkUserMessage): boolean {
	if (!Array.isArray(message.content)) {
		return false
	}
	let hasAttachment = false
	for (const block of message.content) {
		if (!block || typeof block !== "object") {
			continue
		}
		const type = (block as { type?: unknown }).type
		// Tool results are role "user" in SDK history but are not user input;
		// any media they carry must not make the message count as one.
		if (type === "tool_result" || type === "tool-result") {
			return false
		}
		if (type === "image" || type === "file") {
			hasAttachment = true
		}
	}
	return hasAttachment
}

/**
 * True when the SDK message has no visible user_feedback counterpart. An
 * attachment-only continuation carries the synthetic text alongside the
 * user's image/file blocks AND a visible bubble, so it must still be counted.
 */
export function isSyntheticSdkUserMessage(message: SdkUserMessage): boolean {
	const text = extractSdkUserText(message)
	return !!text && isSyntheticUserPrompt(text) && !hasAttachmentBlocks(message)
}

/**
 * Maps the Nth visible user message (1-based ordinal over task/user_feedback
 * rows) to its index in the persisted SDK message history, skipping synthetic
 * prompts that have no visible counterpart.
 */
export function findSdkUserMessageIndexByOrdinal(sdkMessages: SdkUserMessage[], userOrdinal: number): number {
	let seenUsers = 0
	return sdkMessages.findIndex((message) => {
		if (message.role !== "user") {
			return false
		}
		const text = extractSdkUserText(message)
		const hasUserContent = !!text || hasAttachmentBlocks(message)
		if (!hasUserContent || isSyntheticSdkUserMessage(message)) {
			return false
		}
		seenUsers += 1
		return seenUsers === userOrdinal
	})
}

function readSdkUserMetadata(message: SdkUserMessage): Record<string, unknown> | undefined {
	if (!message.metadata || typeof message.metadata !== "object" || Array.isArray(message.metadata)) {
		return undefined
	}
	return message.metadata as Record<string, unknown>
}

function isRecoveryNoticeSdkUserMessage(message: SdkUserMessage): boolean {
	return readSdkUserMetadata(message)?.kind === "recovery_notice"
}

/** Count SDK user turns using the same rules as core checkpoint restore. */
export function countSdkCheckpointRunsUpToIndex(sdkMessages: SdkUserMessage[], index: number): number {
	let count = 0
	for (let i = 0; i <= index; i += 1) {
		const message = sdkMessages[i]
		if (message?.role !== "user" || isRecoveryNoticeSdkUserMessage(message)) {
			continue
		}
		count += 1
	}
	return count
}

export function countSdkCheckpointRuns(sdkMessages: SdkUserMessage[]): number {
	if (sdkMessages.length === 0) {
		return 0
	}
	return countSdkCheckpointRunsUpToIndex(sdkMessages, sdkMessages.length - 1)
}

/** Ordinal over every visible task/user_feedback row, including followup answers. */
export function getVisibleTrumboUserOrdinal(messages: TrumboMessage[], targetIndex: number): number | undefined {
	if (targetIndex < 0 || targetIndex >= messages.length) {
		return undefined
	}
	const message = messages[targetIndex]
	if (message.type !== "say" || (message.say !== "task" && message.say !== "user_feedback")) {
		return undefined
	}
	let ordinal = 0
	for (let index = 0; index <= targetIndex; index += 1) {
		const candidate = messages[index]
		if (candidate.type === "say" && (candidate.say === "task" || candidate.say === "user_feedback")) {
			ordinal += 1
		}
	}
	return ordinal
}
