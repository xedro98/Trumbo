import { TrumboAsk as AppTrumboAsk, TrumboMessage as AppTrumboMessage, TrumboSay as AppTrumboSay } from "@shared/ExtensionMessage"
import { TrumboAsk, TrumboMessageType, TrumboSay, TrumboMessage as ProtoTrumboMessage } from "@shared/proto/trumbo/ui"

// Helper function to convert TrumboAsk string to enum
function convertTrumboAskToProtoEnum(ask: AppTrumboAsk | undefined): TrumboAsk | undefined {
	if (!ask) {
		return undefined
	}

	const mapping: Record<AppTrumboAsk, TrumboAsk> = {
		followup: TrumboAsk.FOLLOWUP,
		plan_mode_respond: TrumboAsk.PLAN_MODE_RESPOND,
		act_mode_respond: TrumboAsk.ACT_MODE_RESPOND,
		command: TrumboAsk.COMMAND,
		command_output: TrumboAsk.COMMAND_OUTPUT,
		completion_result: TrumboAsk.COMPLETION_RESULT,
		tool: TrumboAsk.TOOL,
		api_req_failed: TrumboAsk.API_REQ_FAILED,
		resume_task: TrumboAsk.RESUME_TASK,
		resume_completed_task: TrumboAsk.RESUME_COMPLETED_TASK,
		mistake_limit_reached: TrumboAsk.MISTAKE_LIMIT_REACHED,
		browser_action_launch: TrumboAsk.BROWSER_ACTION_LAUNCH,
		use_mcp_server: TrumboAsk.USE_MCP_SERVER,
		new_task: TrumboAsk.NEW_TASK,
		condense: TrumboAsk.CONDENSE,
		summarize_task: TrumboAsk.SUMMARIZE_TASK,
		report_bug: TrumboAsk.REPORT_BUG,
		use_subagents: TrumboAsk.USE_SUBAGENTS,
	}

	const result = mapping[ask]
	if (result === undefined) {
	}
	return result
}

// Helper function to convert TrumboAsk enum to string
function convertProtoEnumToTrumboAsk(ask: TrumboAsk): AppTrumboAsk | undefined {
	if (ask === TrumboAsk.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<TrumboAsk, TrumboAsk.UNRECOGNIZED>, AppTrumboAsk> = {
		[TrumboAsk.FOLLOWUP]: "followup",
		[TrumboAsk.PLAN_MODE_RESPOND]: "plan_mode_respond",
		[TrumboAsk.ACT_MODE_RESPOND]: "act_mode_respond",
		[TrumboAsk.COMMAND]: "command",
		[TrumboAsk.COMMAND_OUTPUT]: "command_output",
		[TrumboAsk.COMPLETION_RESULT]: "completion_result",
		[TrumboAsk.TOOL]: "tool",
		[TrumboAsk.API_REQ_FAILED]: "api_req_failed",
		[TrumboAsk.RESUME_TASK]: "resume_task",
		[TrumboAsk.RESUME_COMPLETED_TASK]: "resume_completed_task",
		[TrumboAsk.MISTAKE_LIMIT_REACHED]: "mistake_limit_reached",
		[TrumboAsk.BROWSER_ACTION_LAUNCH]: "browser_action_launch",
		[TrumboAsk.USE_MCP_SERVER]: "use_mcp_server",
		[TrumboAsk.NEW_TASK]: "new_task",
		[TrumboAsk.CONDENSE]: "condense",
		[TrumboAsk.SUMMARIZE_TASK]: "summarize_task",
		[TrumboAsk.REPORT_BUG]: "report_bug",
		[TrumboAsk.USE_SUBAGENTS]: "use_subagents",
	}

	return mapping[ask]
}

// Helper function to convert TrumboSay string to enum
function convertTrumboSayToProtoEnum(say: AppTrumboSay | undefined): TrumboSay | undefined {
	if (!say) {
		return undefined
	}

	const mapping: Record<AppTrumboSay, TrumboSay> = {
		task: TrumboSay.TASK,
		error: TrumboSay.ERROR,
		api_req_started: TrumboSay.API_REQ_STARTED,
		api_req_finished: TrumboSay.API_REQ_FINISHED,
		text: TrumboSay.TEXT,
		reasoning: TrumboSay.REASONING,
		completion_result: TrumboSay.COMPLETION_RESULT_SAY,
		user_feedback: TrumboSay.USER_FEEDBACK,
		user_feedback_diff: TrumboSay.USER_FEEDBACK_DIFF,
		api_req_retried: TrumboSay.API_REQ_RETRIED,
		command: TrumboSay.COMMAND_SAY,
		command_output: TrumboSay.COMMAND_OUTPUT_SAY,
		tool: TrumboSay.TOOL_SAY,
		shell_integration_warning: TrumboSay.SHELL_INTEGRATION_WARNING,
		shell_integration_warning_with_suggestion: TrumboSay.SHELL_INTEGRATION_WARNING,
		browser_action_launch: TrumboSay.BROWSER_ACTION_LAUNCH_SAY,
		browser_action: TrumboSay.BROWSER_ACTION,
		browser_action_result: TrumboSay.BROWSER_ACTION_RESULT,
		mcp_server_request_started: TrumboSay.MCP_SERVER_REQUEST_STARTED,
		mcp_server_response: TrumboSay.MCP_SERVER_RESPONSE,
		mcp_notification: TrumboSay.MCP_NOTIFICATION,
		use_mcp_server: TrumboSay.USE_MCP_SERVER_SAY,
		diff_error: TrumboSay.DIFF_ERROR,
		deleted_api_reqs: TrumboSay.DELETED_API_REQS,
		trumboignore_error: TrumboSay.TRUMBOIGNORE_ERROR,
		command_permission_denied: TrumboSay.COMMAND_PERMISSION_DENIED,
		checkpoint_created: TrumboSay.CHECKPOINT_CREATED,
		load_mcp_documentation: TrumboSay.LOAD_MCP_DOCUMENTATION,
		info: TrumboSay.INFO,
		task_progress: TrumboSay.TASK_PROGRESS,
		error_retry: TrumboSay.ERROR_RETRY,
		hook_status: TrumboSay.HOOK_STATUS,
		hook_output_stream: TrumboSay.HOOK_OUTPUT_STREAM,
		conditional_rules_applied: TrumboSay.CONDITIONAL_RULES_APPLIED,
		subagent: TrumboSay.SUBAGENT_STATUS,
		use_subagents: TrumboSay.USE_SUBAGENTS_SAY,
		subagent_usage: TrumboSay.SUBAGENT_USAGE,
	}

	const result = mapping[say]

	return result
}

// Helper function to convert TrumboSay enum to string
function convertProtoEnumToTrumboSay(say: TrumboSay): AppTrumboSay | undefined {
	if (say === TrumboSay.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<TrumboSay, TrumboSay.UNRECOGNIZED>, AppTrumboSay> = {
		[TrumboSay.TASK]: "task",
		[TrumboSay.ERROR]: "error",
		[TrumboSay.API_REQ_STARTED]: "api_req_started",
		[TrumboSay.API_REQ_FINISHED]: "api_req_finished",
		[TrumboSay.TEXT]: "text",
		[TrumboSay.REASONING]: "reasoning",
		[TrumboSay.COMPLETION_RESULT_SAY]: "completion_result",
		[TrumboSay.USER_FEEDBACK]: "user_feedback",
		[TrumboSay.USER_FEEDBACK_DIFF]: "user_feedback_diff",
		[TrumboSay.API_REQ_RETRIED]: "api_req_retried",
		[TrumboSay.COMMAND_SAY]: "command",
		[TrumboSay.COMMAND_OUTPUT_SAY]: "command_output",
		[TrumboSay.TOOL_SAY]: "tool",
		[TrumboSay.SHELL_INTEGRATION_WARNING]: "shell_integration_warning",
		[TrumboSay.BROWSER_ACTION_LAUNCH_SAY]: "browser_action_launch",
		[TrumboSay.BROWSER_ACTION]: "browser_action",
		[TrumboSay.BROWSER_ACTION_RESULT]: "browser_action_result",
		[TrumboSay.MCP_SERVER_REQUEST_STARTED]: "mcp_server_request_started",
		[TrumboSay.MCP_SERVER_RESPONSE]: "mcp_server_response",
		[TrumboSay.MCP_NOTIFICATION]: "mcp_notification",
		[TrumboSay.USE_MCP_SERVER_SAY]: "use_mcp_server",
		[TrumboSay.DIFF_ERROR]: "diff_error",
		[TrumboSay.DELETED_API_REQS]: "deleted_api_reqs",
		[TrumboSay.TRUMBOIGNORE_ERROR]: "trumboignore_error",
		[TrumboSay.COMMAND_PERMISSION_DENIED]: "command_permission_denied",
		[TrumboSay.CHECKPOINT_CREATED]: "checkpoint_created",
		[TrumboSay.LOAD_MCP_DOCUMENTATION]: "load_mcp_documentation",
		[TrumboSay.INFO]: "info",
		[TrumboSay.TASK_PROGRESS]: "task_progress",
		[TrumboSay.ERROR_RETRY]: "error_retry",
		[TrumboSay.HOOK_STATUS]: "hook_status",
		[TrumboSay.HOOK_OUTPUT_STREAM]: "hook_output_stream",
		[TrumboSay.CONDITIONAL_RULES_APPLIED]: "conditional_rules_applied",
		[TrumboSay.SUBAGENT_STATUS]: "subagent",
		[TrumboSay.USE_SUBAGENTS_SAY]: "use_subagents",
		[TrumboSay.SUBAGENT_USAGE]: "subagent_usage",
	}

	return mapping[say]
}

/**
 * Convert application TrumboMessage to proto TrumboMessage
 */
export function convertTrumboMessageToProto(message: AppTrumboMessage): ProtoTrumboMessage {
	// For sending messages, we need to provide values for required proto fields
	const askEnum = message.ask ? convertTrumboAskToProtoEnum(message.ask) : undefined
	const sayEnum = message.say ? convertTrumboSayToProtoEnum(message.say) : undefined

	// Determine appropriate enum values based on message type
	let finalAskEnum: TrumboAsk = TrumboAsk.FOLLOWUP // Proto default
	let finalSayEnum: TrumboSay = TrumboSay.TEXT // Proto default

	if (message.type === "ask") {
		finalAskEnum = askEnum ?? TrumboAsk.FOLLOWUP // Use FOLLOWUP as default for ask messages
	} else if (message.type === "say") {
		finalSayEnum = sayEnum ?? TrumboSay.TEXT // Use TEXT as default for say messages
	}

	const protoMessage: ProtoTrumboMessage = {
		ts: message.ts,
		type: message.type === "ask" ? TrumboMessageType.ASK : TrumboMessageType.SAY,
		ask: finalAskEnum,
		say: finalSayEnum,
		text: message.text ?? "",
		reasoning: message.reasoning ?? "",
		images: message.images ?? [],
		files: message.files ?? [],
		partial: message.partial ?? false,
		// Convergent-replica fields (default 0 = unstamped, e.g. classic/legacy path).
		seq: message.seq ?? 0,
		epoch: message.epoch ?? 0,
		lastCheckpointHash: message.lastCheckpointHash ?? "",
		isCheckpointCheckedOut: message.isCheckpointCheckedOut ?? false,
		isOperationOutsideWorkspace: message.isOperationOutsideWorkspace ?? false,
		conversationHistoryIndex: message.conversationHistoryIndex ?? 0,
		conversationHistoryDeletedRange: message.conversationHistoryDeletedRange
			? {
					startIndex: message.conversationHistoryDeletedRange[0],
					endIndex: message.conversationHistoryDeletedRange[1],
				}
			: undefined,
		// Additional optional fields for specific ask/say types
		sayTool: undefined,
		sayBrowserAction: undefined,
		browserActionResult: undefined,
		askUseMcpServer: undefined,
		planModeResponse: undefined,
		askQuestion: undefined,
		askNewTask: undefined,
		apiReqInfo: undefined,
		modelInfo: message.modelInfo ?? undefined,
	}

	return protoMessage
}

/**
 * Convert proto TrumboMessage to application TrumboMessage
 */
export function convertProtoToTrumboMessage(protoMessage: ProtoTrumboMessage): AppTrumboMessage {
	const message: AppTrumboMessage = {
		ts: protoMessage.ts,
		type: protoMessage.type === TrumboMessageType.ASK ? "ask" : "say",
	}

	// Convert ask enum to string
	if (protoMessage.type === TrumboMessageType.ASK) {
		const ask = convertProtoEnumToTrumboAsk(protoMessage.ask)
		if (ask !== undefined) {
			message.ask = ask
		}
	}

	// Convert say enum to string
	if (protoMessage.type === TrumboMessageType.SAY) {
		const say = convertProtoEnumToTrumboSay(protoMessage.say)
		if (say !== undefined) {
			message.say = say
		}
	}

	// Convert other fields - preserve empty strings as they may be intentional
	if (protoMessage.text !== "") {
		message.text = protoMessage.text
	}
	if (protoMessage.reasoning !== "") {
		message.reasoning = protoMessage.reasoning
	}
	if (protoMessage.images.length > 0) {
		message.images = protoMessage.images
	}
	if (protoMessage.files.length > 0) {
		message.files = protoMessage.files
	}
	if (protoMessage.partial) {
		message.partial = protoMessage.partial
	}
	if (protoMessage.lastCheckpointHash !== "") {
		message.lastCheckpointHash = protoMessage.lastCheckpointHash
	}
	if (protoMessage.isCheckpointCheckedOut) {
		message.isCheckpointCheckedOut = protoMessage.isCheckpointCheckedOut
	}
	if (protoMessage.isOperationOutsideWorkspace) {
		message.isOperationOutsideWorkspace = protoMessage.isOperationOutsideWorkspace
	}
	if (protoMessage.conversationHistoryIndex !== 0) {
		message.conversationHistoryIndex = protoMessage.conversationHistoryIndex
	}

	// Convert conversationHistoryDeletedRange from object to tuple
	if (protoMessage.conversationHistoryDeletedRange) {
		message.conversationHistoryDeletedRange = [
			protoMessage.conversationHistoryDeletedRange.startIndex,
			protoMessage.conversationHistoryDeletedRange.endIndex,
		]
	}

	// Convergent-replica fields. 0 means unstamped (classic/legacy path) — leave undefined so
	// the webview reducer treats such messages as always-applicable rather than epoch 0.
	if (protoMessage.seq && protoMessage.seq !== 0) {
		message.seq = protoMessage.seq
	}
	if (protoMessage.epoch && protoMessage.epoch !== 0) {
		message.epoch = protoMessage.epoch
	}

	return message
}
