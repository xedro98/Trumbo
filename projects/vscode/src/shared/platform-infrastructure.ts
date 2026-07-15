/**
 * Trumbo platform MCP tool names (trumbo-platform server).
 * Kept in sync with projects/web/src/server/routes/mcp.ts.
 */

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

export interface PlatformAgentRow {
	id: string
	name: string
	model: string
	status: string
	created_at: number
	updated_at: number
}

export interface PlatformSandboxRow {
	id: string
	status: string
	reserved_cpu_seconds: number
	created_at: number
	updated_at: number
}

export interface PlatformAgentsUsage {
	enabled: boolean
	hoursMonthly: number
	hoursUsed: number
	resetsAtSec: number
	concurrentAgents: number
	concurrentUsed: number
}

export interface PlatformSandboxUsage {
	enabled: boolean
	cpuSecondsMonthly: number
	cpuSecondsUsed: number
	resetsAtSec: number
	concurrentSandboxes: number
	concurrentUsed: number
	maxBackups?: number
}
