import type { TrumboAskUseMcpServer, TrumboMessage } from "@shared/ExtensionMessage"

/** Managed platform MCP server id (synced by @trumbodev/core platform-mcp). */
export const PLATFORM_MCP_SERVER = "trumbo-platform"

export const CLOUD_AGENT_TOOLS = new Set([
	"agent_create",
	"agent_send_message",
	"agent_get_state",
	"agent_stop",
	"agent_list",
	"agent_delete",
	"agent_add_channel",
	"agent_list_channels",
	"agent_remove_channel",
])

export const SANDBOX_TOOLS = new Set([
	"sandbox_create",
	"sandbox_status",
	"sandbox_exec",
	"sandbox_run_code",
	"sandbox_write_file",
	"sandbox_read_file",
	"sandbox_list_files",
	"sandbox_git_clone",
	"sandbox_expose_port",
	"sandbox_list_ports",
	"sandbox_close_port",
	"sandbox_start_process",
	"sandbox_list_processes",
	"sandbox_kill_process",
	"sandbox_get_process_logs",
	"sandbox_create_context",
	"sandbox_list_contexts",
	"sandbox_delete_context",
	"sandbox_create_backup",
	"sandbox_list_backups",
	"sandbox_restore_backup",
	"sandbox_delete_backup",
	"sandbox_set_keepalive",
	"sandbox_destroy",
])

export type PlatformSessionKind = "browser" | "cloud_agent" | "sandbox"

export function parseMcpToolPayload(message: TrumboMessage): TrumboAskUseMcpServer | null {
	if (message.ask !== "use_mcp_server" && message.say !== "use_mcp_server") {
		return null
	}
	try {
		const parsed = JSON.parse(message.text || "{}") as TrumboAskUseMcpServer
		if (parsed.type === "use_mcp_tool" && parsed.serverName && parsed.toolName) {
			return parsed
		}
	} catch {
		// ignore malformed payloads
	}
	return null
}

export function isCloudAgentTool(toolName: string): boolean {
	return CLOUD_AGENT_TOOLS.has(toolName)
}

export function isSandboxTool(toolName: string): boolean {
	return SANDBOX_TOOLS.has(toolName)
}

export function isPlatformCloudAgentMessage(message: TrumboMessage): boolean {
	const payload = parseMcpToolPayload(message)
	return payload?.serverName === PLATFORM_MCP_SERVER && isCloudAgentTool(payload.toolName || "")
}

export function isPlatformSandboxMessage(message: TrumboMessage): boolean {
	const payload = parseMcpToolPayload(message)
	return payload?.serverName === PLATFORM_MCP_SERVER && isSandboxTool(payload.toolName || "")
}

export function getSessionGroupKind(messages: TrumboMessage[]): PlatformSessionKind | null {
	if (messages.length === 0) return null
	const first = messages[0]
	if (first.ask === "browser_action_launch" || first.say === "browser_action_launch") {
		return "browser"
	}
	if (messages.some(isPlatformCloudAgentMessage)) {
		return "cloud_agent"
	}
	if (messages.some(isPlatformSandboxMessage)) {
		return "sandbox"
	}
	return null
}

export function formatToolLabel(toolName: string): string {
	return toolName
		.replace(/^agent_/, "")
		.replace(/^sandbox_/, "")
		.replace(/_/g, " ")
}
