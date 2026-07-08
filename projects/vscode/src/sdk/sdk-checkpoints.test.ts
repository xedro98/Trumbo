import type { TrumboMessage } from "@shared/ExtensionMessage"
import { describe, expect, it } from "vitest"
import {
	buildCheckpointSdkRunCountByMessageTs,
	findCheckpointRunCountAtOrBefore,
	findVisibleCheckpointUserMessageByRun,
	getCheckpointRunCountForMessage,
	getSdkCheckpointRunCountForTrumboUserIndex,
	getSdkCheckpointRunCountForUiRun,
	hasCheckpointForRunCounts,
	isCheckpointAnswerMessage,
	isVisibleCheckpointUserMessage,
} from "./sdk-checkpoints"
import type { SdkUserMessage } from "./sdk-user-message-mapping"

const userTask = (text: string, ts: number): TrumboMessage => ({
	ts,
	type: "say",
	say: "task",
	text,
	partial: false,
})

const userFeedback = (text: string, ts: number): TrumboMessage => ({
	ts,
	type: "say",
	say: "user_feedback",
	text,
	partial: false,
})

const assistant = (text: string, ts: number): TrumboMessage => ({
	ts,
	type: "say",
	say: "text",
	text,
	partial: false,
})

const followupAsk = (text: string, ts: number): TrumboMessage => ({
	ts,
	type: "ask",
	ask: "followup",
	text,
	partial: false,
})

const checkpointRow = (runCount: number, ts: number, ref = "old-ref"): TrumboMessage => ({
	ts,
	type: "say",
	say: "checkpoint_created",
	partial: false,
	conversationHistoryIndex: runCount,
	lastCheckpointHash: ref,
})

describe("SDK checkpoint user-run mapping", () => {
	it("recognizes only visible user messages", () => {
		expect(isVisibleCheckpointUserMessage(userTask("start", 1))).toBe(true)
		expect(isVisibleCheckpointUserMessage(userFeedback("continue", 2))).toBe(true)
		expect(isVisibleCheckpointUserMessage(assistant("done", 3))).toBe(false)
		expect(isVisibleCheckpointUserMessage(checkpointRow(1, 4))).toBe(false)
	})

	it("finds visible user messages by checkpoint run count", () => {
		const messages = [userTask("start", 1), checkpointRow(1, 2), assistant("done", 3), userFeedback("next", 4)]

		expect(findVisibleCheckpointUserMessageByRun(messages, 1)?.message.text).toBe("start")
		expect(findVisibleCheckpointUserMessageByRun(messages, 2)?.message.text).toBe("next")
		expect(findVisibleCheckpointUserMessageByRun(messages, 3)).toBeUndefined()
	})

	it("does not count ask_question answers as checkpoint runs", () => {
		const messages = [
			userTask("start", 1),
			checkpointRow(1, 2),
			followupAsk("which file?", 3),
			userFeedback("src/index.ts", 4),
			assistant("ok", 5),
			userFeedback("next task", 6),
		]

		expect(isCheckpointAnswerMessage(messages, 3)).toBe(true)
		expect(getCheckpointRunCountForMessage(messages, 0)).toBe(1)
		expect(getCheckpointRunCountForMessage(messages, 3)).toBeUndefined()
		expect(getCheckpointRunCountForMessage(messages, 5)).toBe(2)
		expect(findVisibleCheckpointUserMessageByRun(messages, 2)?.message.text).toBe("next task")
	})

	it("keeps ask answers tied to the ask when assistant rows arrive between them", () => {
		const messages = [
			userTask("start", 1),
			followupAsk("which file?", 2),
			assistant("Let me know the file path.", 3),
			checkpointRow(1, 4),
			userFeedback("src/index.ts", 5),
			userFeedback("next task", 6),
		]

		expect(isCheckpointAnswerMessage(messages, 4)).toBe(true)
		expect(getCheckpointRunCountForMessage(messages, 4)).toBeUndefined()
		expect(getCheckpointRunCountForMessage(messages, 5)).toBe(2)
		expect(findVisibleCheckpointUserMessageByRun(messages, 1)?.message.text).toBe("start")
		expect(findVisibleCheckpointUserMessageByRun(messages, 2)?.message.text).toBe("next task")
	})
})

describe("checkpoint availability helpers", () => {
	it("finds the latest checkpoint run at or before the target run", () => {
		expect(findCheckpointRunCountAtOrBefore([1, 3], 2)).toBe(1)
		expect(findCheckpointRunCountAtOrBefore([1, 3], 3)).toBe(3)
		expect(findCheckpointRunCountAtOrBefore([1, 3], 4)).toBe(3)
		expect(findCheckpointRunCountAtOrBefore([], 1)).toBeUndefined()
	})

	it("reports whether a run has a restorable workspace checkpoint", () => {
		expect(hasCheckpointForRunCounts([1, 2], 2)).toBe(true)
		expect(hasCheckpointForRunCounts([1], 2)).toBe(true)
		expect(hasCheckpointForRunCounts([3], 2)).toBe(false)
		expect(hasCheckpointForRunCounts([], 1)).toBe(false)
		expect(hasCheckpointForRunCounts([1], undefined)).toBe(false)
	})
})

describe("UI to SDK checkpoint run mapping", () => {
	const sdkMessages: SdkUserMessage[] = [
		{ role: "user", content: "start" },
		{ role: "assistant", content: "done" },
		{ role: "user", content: "src/index.ts" },
		{ role: "assistant", content: "ok" },
		{ role: "user", content: "next task" },
	]

	it("maps visible user runs to SDK checkpoint run counts", () => {
		const messages = [
			userTask("start", 1),
			followupAsk("which file?", 2),
			assistant("Let me know the file path.", 3),
			checkpointRow(1, 4),
			userFeedback("src/index.ts", 5),
			userFeedback("next task", 6),
		]

		expect(getCheckpointRunCountForMessage(messages, 0)).toBe(1)
		expect(getCheckpointRunCountForMessage(messages, 4)).toBeUndefined()
		expect(getSdkCheckpointRunCountForTrumboUserIndex(messages, 0, sdkMessages)).toBe(1)
		expect(getSdkCheckpointRunCountForTrumboUserIndex(messages, 5, sdkMessages)).toBe(3)
		expect(getSdkCheckpointRunCountForUiRun(messages, 2, sdkMessages)).toBe(3)
	})

	it("builds per-message SDK run counts for the webview", () => {
		const messages = [
			userTask("start", 1),
			followupAsk("which file?", 2),
			assistant("Let me know the file path.", 3),
			userFeedback("src/index.ts", 5),
			userFeedback("next task", 6),
		]
		expect(buildCheckpointSdkRunCountByMessageTs(messages, sdkMessages)).toEqual({
			1: 1,
			6: 3,
		})
	})
})
