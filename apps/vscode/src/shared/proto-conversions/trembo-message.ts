import { TremboAsk as AppTremboAsk, TremboMessage as AppTremboMessage, TremboSay as AppTremboSay } from "@shared/ExtensionMessage"
import { TremboAsk, TremboMessageType, TremboSay, TremboMessage as ProtoTremboMessage } from "@shared/proto/trembo/ui"

// Helper function to convert TremboAsk string to enum
function convertTremboAskToProtoEnum(ask: AppTremboAsk | undefined): TremboAsk | undefined {
	if (!ask) {
		return undefined
	}

	const mapping: Record<AppTremboAsk, TremboAsk> = {
		followup: TremboAsk.FOLLOWUP,
		plan_mode_respond: TremboAsk.PLAN_MODE_RESPOND,
		act_mode_respond: TremboAsk.ACT_MODE_RESPOND,
		command: TremboAsk.COMMAND,
		command_output: TremboAsk.COMMAND_OUTPUT,
		completion_result: TremboAsk.COMPLETION_RESULT,
		tool: TremboAsk.TOOL,
		api_req_failed: TremboAsk.API_REQ_FAILED,
		resume_task: TremboAsk.RESUME_TASK,
		resume_completed_task: TremboAsk.RESUME_COMPLETED_TASK,
		mistake_limit_reached: TremboAsk.MISTAKE_LIMIT_REACHED,
		browser_action_launch: TremboAsk.BROWSER_ACTION_LAUNCH,
		use_mcp_server: TremboAsk.USE_MCP_SERVER,
		new_task: TremboAsk.NEW_TASK,
		condense: TremboAsk.CONDENSE,
		summarize_task: TremboAsk.SUMMARIZE_TASK,
		report_bug: TremboAsk.REPORT_BUG,
		use_subagents: TremboAsk.USE_SUBAGENTS,
	}

	const result = mapping[ask]
	if (result === undefined) {
	}
	return result
}

// Helper function to convert TremboAsk enum to string
function convertProtoEnumToTremboAsk(ask: TremboAsk): AppTremboAsk | undefined {
	if (ask === TremboAsk.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<TremboAsk, TremboAsk.UNRECOGNIZED>, AppTremboAsk> = {
		[TremboAsk.FOLLOWUP]: "followup",
		[TremboAsk.PLAN_MODE_RESPOND]: "plan_mode_respond",
		[TremboAsk.ACT_MODE_RESPOND]: "act_mode_respond",
		[TremboAsk.COMMAND]: "command",
		[TremboAsk.COMMAND_OUTPUT]: "command_output",
		[TremboAsk.COMPLETION_RESULT]: "completion_result",
		[TremboAsk.TOOL]: "tool",
		[TremboAsk.API_REQ_FAILED]: "api_req_failed",
		[TremboAsk.RESUME_TASK]: "resume_task",
		[TremboAsk.RESUME_COMPLETED_TASK]: "resume_completed_task",
		[TremboAsk.MISTAKE_LIMIT_REACHED]: "mistake_limit_reached",
		[TremboAsk.BROWSER_ACTION_LAUNCH]: "browser_action_launch",
		[TremboAsk.USE_MCP_SERVER]: "use_mcp_server",
		[TremboAsk.NEW_TASK]: "new_task",
		[TremboAsk.CONDENSE]: "condense",
		[TremboAsk.SUMMARIZE_TASK]: "summarize_task",
		[TremboAsk.REPORT_BUG]: "report_bug",
		[TremboAsk.USE_SUBAGENTS]: "use_subagents",
	}

	return mapping[ask]
}

// Helper function to convert TremboSay string to enum
function convertTremboSayToProtoEnum(say: AppTremboSay | undefined): TremboSay | undefined {
	if (!say) {
		return undefined
	}

	const mapping: Record<AppTremboSay, TremboSay> = {
		task: TremboSay.TASK,
		error: TremboSay.ERROR,
		api_req_started: TremboSay.API_REQ_STARTED,
		api_req_finished: TremboSay.API_REQ_FINISHED,
		text: TremboSay.TEXT,
		reasoning: TremboSay.REASONING,
		completion_result: TremboSay.COMPLETION_RESULT_SAY,
		user_feedback: TremboSay.USER_FEEDBACK,
		user_feedback_diff: TremboSay.USER_FEEDBACK_DIFF,
		api_req_retried: TremboSay.API_REQ_RETRIED,
		command: TremboSay.COMMAND_SAY,
		command_output: TremboSay.COMMAND_OUTPUT_SAY,
		tool: TremboSay.TOOL_SAY,
		shell_integration_warning: TremboSay.SHELL_INTEGRATION_WARNING,
		shell_integration_warning_with_suggestion: TremboSay.SHELL_INTEGRATION_WARNING,
		browser_action_launch: TremboSay.BROWSER_ACTION_LAUNCH_SAY,
		browser_action: TremboSay.BROWSER_ACTION,
		browser_action_result: TremboSay.BROWSER_ACTION_RESULT,
		mcp_server_request_started: TremboSay.MCP_SERVER_REQUEST_STARTED,
		mcp_server_response: TremboSay.MCP_SERVER_RESPONSE,
		mcp_notification: TremboSay.MCP_NOTIFICATION,
		use_mcp_server: TremboSay.USE_MCP_SERVER_SAY,
		diff_error: TremboSay.DIFF_ERROR,
		deleted_api_reqs: TremboSay.DELETED_API_REQS,
		tremboignore_error: TremboSay.TREMBOIGNORE_ERROR,
		command_permission_denied: TremboSay.COMMAND_PERMISSION_DENIED,
		checkpoint_created: TremboSay.CHECKPOINT_CREATED,
		load_mcp_documentation: TremboSay.LOAD_MCP_DOCUMENTATION,
		info: TremboSay.INFO,
		task_progress: TremboSay.TASK_PROGRESS,
		error_retry: TremboSay.ERROR_RETRY,
		hook_status: TremboSay.HOOK_STATUS,
		hook_output_stream: TremboSay.HOOK_OUTPUT_STREAM,
		conditional_rules_applied: TremboSay.CONDITIONAL_RULES_APPLIED,
		subagent: TremboSay.SUBAGENT_STATUS,
		use_subagents: TremboSay.USE_SUBAGENTS_SAY,
		subagent_usage: TremboSay.SUBAGENT_USAGE,
	}

	const result = mapping[say]

	return result
}

// Helper function to convert TremboSay enum to string
function convertProtoEnumToTremboSay(say: TremboSay): AppTremboSay | undefined {
	if (say === TremboSay.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<TremboSay, TremboSay.UNRECOGNIZED>, AppTremboSay> = {
		[TremboSay.TASK]: "task",
		[TremboSay.ERROR]: "error",
		[TremboSay.API_REQ_STARTED]: "api_req_started",
		[TremboSay.API_REQ_FINISHED]: "api_req_finished",
		[TremboSay.TEXT]: "text",
		[TremboSay.REASONING]: "reasoning",
		[TremboSay.COMPLETION_RESULT_SAY]: "completion_result",
		[TremboSay.USER_FEEDBACK]: "user_feedback",
		[TremboSay.USER_FEEDBACK_DIFF]: "user_feedback_diff",
		[TremboSay.API_REQ_RETRIED]: "api_req_retried",
		[TremboSay.COMMAND_SAY]: "command",
		[TremboSay.COMMAND_OUTPUT_SAY]: "command_output",
		[TremboSay.TOOL_SAY]: "tool",
		[TremboSay.SHELL_INTEGRATION_WARNING]: "shell_integration_warning",
		[TremboSay.BROWSER_ACTION_LAUNCH_SAY]: "browser_action_launch",
		[TremboSay.BROWSER_ACTION]: "browser_action",
		[TremboSay.BROWSER_ACTION_RESULT]: "browser_action_result",
		[TremboSay.MCP_SERVER_REQUEST_STARTED]: "mcp_server_request_started",
		[TremboSay.MCP_SERVER_RESPONSE]: "mcp_server_response",
		[TremboSay.MCP_NOTIFICATION]: "mcp_notification",
		[TremboSay.USE_MCP_SERVER_SAY]: "use_mcp_server",
		[TremboSay.DIFF_ERROR]: "diff_error",
		[TremboSay.DELETED_API_REQS]: "deleted_api_reqs",
		[TremboSay.TREMBOIGNORE_ERROR]: "tremboignore_error",
		[TremboSay.COMMAND_PERMISSION_DENIED]: "command_permission_denied",
		[TremboSay.CHECKPOINT_CREATED]: "checkpoint_created",
		[TremboSay.LOAD_MCP_DOCUMENTATION]: "load_mcp_documentation",
		[TremboSay.INFO]: "info",
		[TremboSay.TASK_PROGRESS]: "task_progress",
		[TremboSay.ERROR_RETRY]: "error_retry",
		[TremboSay.HOOK_STATUS]: "hook_status",
		[TremboSay.HOOK_OUTPUT_STREAM]: "hook_output_stream",
		[TremboSay.CONDITIONAL_RULES_APPLIED]: "conditional_rules_applied",
		[TremboSay.SUBAGENT_STATUS]: "subagent",
		[TremboSay.USE_SUBAGENTS_SAY]: "use_subagents",
		[TremboSay.SUBAGENT_USAGE]: "subagent_usage",
	}

	return mapping[say]
}

/**
 * Convert application TremboMessage to proto TremboMessage
 */
export function convertTremboMessageToProto(message: AppTremboMessage): ProtoTremboMessage {
	// For sending messages, we need to provide values for required proto fields
	const askEnum = message.ask ? convertTremboAskToProtoEnum(message.ask) : undefined
	const sayEnum = message.say ? convertTremboSayToProtoEnum(message.say) : undefined

	// Determine appropriate enum values based on message type
	let finalAskEnum: TremboAsk = TremboAsk.FOLLOWUP // Proto default
	let finalSayEnum: TremboSay = TremboSay.TEXT // Proto default

	if (message.type === "ask") {
		finalAskEnum = askEnum ?? TremboAsk.FOLLOWUP // Use FOLLOWUP as default for ask messages
	} else if (message.type === "say") {
		finalSayEnum = sayEnum ?? TremboSay.TEXT // Use TEXT as default for say messages
	}

	const protoMessage: ProtoTremboMessage = {
		ts: message.ts,
		type: message.type === "ask" ? TremboMessageType.ASK : TremboMessageType.SAY,
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
 * Convert proto TremboMessage to application TremboMessage
 */
export function convertProtoToTremboMessage(protoMessage: ProtoTremboMessage): AppTremboMessage {
	const message: AppTremboMessage = {
		ts: protoMessage.ts,
		type: protoMessage.type === TremboMessageType.ASK ? "ask" : "say",
	}

	// Convert ask enum to string
	if (protoMessage.type === TremboMessageType.ASK) {
		const ask = convertProtoEnumToTremboAsk(protoMessage.ask)
		if (ask !== undefined) {
			message.ask = ask
		}
	}

	// Convert say enum to string
	if (protoMessage.type === TremboMessageType.SAY) {
		const say = convertProtoEnumToTremboSay(protoMessage.say)
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
