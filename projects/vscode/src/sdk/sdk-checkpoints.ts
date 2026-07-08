import type { TrumboMessage } from "@shared/ExtensionMessage"
import {
	countSdkCheckpointRunsUpToIndex,
	findSdkUserMessageIndexByOrdinal,
	getVisibleTrumboUserOrdinal,
	type SdkUserMessage,
} from "./sdk-user-message-mapping"

export function isVisibleCheckpointUserMessage(message: TrumboMessage): boolean {
	return message.type === "say" && (message.say === "task" || message.say === "user_feedback")
}

export function isCheckpointAnswerMessage(messages: TrumboMessage[], index: number): boolean {
	const message = messages[index]
	if (message?.type !== "say" || message.say !== "user_feedback") {
		return false
	}

	for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
		const previous = messages[cursor]
		if (previous.say === "checkpoint_created") {
			continue
		}
		if (previous.type === "ask") {
			return previous.ask === "followup" || previous.ask === "mistake_limit_reached"
		}
		if (isVisibleCheckpointUserMessage(previous)) {
			return false
		}
	}

	return false
}

export function isCheckpointRunUserMessage(messages: TrumboMessage[], index: number): boolean {
	return isVisibleCheckpointUserMessage(messages[index]) && !isCheckpointAnswerMessage(messages, index)
}

export function getCheckpointRunCountForMessage(messages: TrumboMessage[], targetIndex: number): number | undefined {
	if (!isCheckpointRunUserMessage(messages, targetIndex)) {
		return undefined
	}

	let runCount = 0
	for (let index = 0; index <= targetIndex; index += 1) {
		if (isCheckpointRunUserMessage(messages, index)) {
			runCount += 1
		}
	}
	return runCount
}

export function findCheckpointRunCountAtOrBefore(
	checkpointAvailableRunCounts: readonly number[],
	runCount: number,
): number | undefined {
	return checkpointAvailableRunCounts.reduce<number | undefined>((best, candidate) => {
		if (candidate > runCount) {
			return best
		}
		if (best === undefined || candidate > best) {
			return candidate
		}
		return best
	}, undefined)
}

export function hasCheckpointForRunCounts(
	checkpointAvailableRunCounts: readonly number[],
	runCount: number | undefined,
): boolean {
	if (runCount === undefined || checkpointAvailableRunCounts.length === 0) {
		return false
	}
	return findCheckpointRunCountAtOrBefore(checkpointAvailableRunCounts, runCount) !== undefined
}

export function getSdkCheckpointRunCountForTrumboUserIndex(
	trumboMessages: TrumboMessage[],
	targetIndex: number,
	sdkMessages: SdkUserMessage[],
): number | undefined {
	const userOrdinal = getVisibleTrumboUserOrdinal(trumboMessages, targetIndex)
	if (userOrdinal === undefined) {
		return undefined
	}
	const sdkIndex = findSdkUserMessageIndexByOrdinal(sdkMessages, userOrdinal)
	if (sdkIndex === -1) {
		return undefined
	}
	const runCount = countSdkCheckpointRunsUpToIndex(sdkMessages, sdkIndex)
	return runCount > 0 ? runCount : undefined
}

export function getSdkCheckpointRunCountForUiRun(
	trumboMessages: TrumboMessage[],
	uiRunCount: number,
	sdkMessages: SdkUserMessage[],
): number | undefined {
	const target = findVisibleCheckpointUserMessageByRun(trumboMessages, uiRunCount)
	if (!target) {
		return undefined
	}
	return getSdkCheckpointRunCountForTrumboUserIndex(trumboMessages, target.index, sdkMessages)
}

export function buildCheckpointSdkRunCountByMessageTs(
	trumboMessages: TrumboMessage[],
	sdkMessages: SdkUserMessage[],
): Record<number, number> {
	const byTs: Record<number, number> = {}
	for (let index = 0; index < trumboMessages.length; index += 1) {
		if (!isCheckpointRunUserMessage(trumboMessages, index)) {
			continue
		}
		const sdkRunCount = getSdkCheckpointRunCountForTrumboUserIndex(trumboMessages, index, sdkMessages)
		const ts = trumboMessages[index]?.ts
		if (sdkRunCount !== undefined && ts !== undefined) {
			byTs[ts] = sdkRunCount
		}
	}
	return byTs
}

export function findVisibleCheckpointUserMessageByRun(
	messages: TrumboMessage[],
	runCount: number,
): { message: TrumboMessage; index: number } | undefined {
	let seenUsers = 0
	for (let index = 0; index < messages.length; index += 1) {
		const message = messages[index]
		if (!isCheckpointRunUserMessage(messages, index)) {
			continue
		}
		seenUsers += 1
		if (seenUsers === runCount) {
			return { message, index }
		}
	}
	return undefined
}
