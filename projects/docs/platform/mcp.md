---
title: "Hosted MCP"
description: "Trumbo Platform MCP server at api.trumbo.dev with product tools for agents, sandbox, browser, security, knowledge, and automations."
---
# Hosted MCP

Trumbo exposes a hosted Model Context Protocol server so agents and IDEs can call platform products as tools.

## Endpoint

```text
https://api.trumbo.dev/v1/mcp
```

Authenticate with a device-auth session (CLI / VS Code) or a Bearer token that is allowed to call MCP. See [Authentication](authentication).

This is separate from **user-configured MCP servers** you add in the CLI or VS Code for third-party tools. For local MCP configuration, see [MCP Overview](../mcp/mcp-overview).

## Tool groups

### Knowledge

- `search_knowledge`

### Browser Run

- Quick: `browser_screenshot`, `browser_markdown`, `browser_content`, `browser_pdf`, `browser_scrape`, `browser_json`, `browser_links`, `browser_accessibility_tree`, `browser_snapshot`, `browser_crawl`
- Sessions: `browser_session_launch`, `browser_session_navigate`, `browser_session_click`, `browser_session_type`, `browser_session_scroll`, `browser_session_screenshot`, `browser_session_handoff`, `browser_session_wait`, `browser_session_close`

### Cloud Agents

- `agent_create`, `agent_list`, `agent_send_message`, `agent_get_state`, `agent_stop`, `agent_delete`
- Channels: `agent_add_channel`, `agent_list_channels`, `agent_remove_channel`
- Schedules: `agent_schedule_create`, `agent_schedule_list`, `agent_schedule_update`, `agent_schedule_delete`

### Automations

- `workflow_create`, `workflow_list`, `workflow_trigger`, `workflow_runs`, `workflow_cancel`

### Sandbox

- Lifecycle: `sandbox_create`, `sandbox_status`, `sandbox_destroy`, `sandbox_set_keepalive`
- Exec: `sandbox_exec`, `sandbox_run_code`
- Files: `sandbox_write_file`, `sandbox_read_file`, `sandbox_list_files`
- Git / ports / processes / contexts / backups: matching `sandbox_*` tools

### Security

- `security_list_repos`, `security_scan_repo`, `security_list_findings`, `security_get_finding`, `security_remediate_finding`, `security_update_finding`, `security_get_stats`

## Scopes and billing

Tools enforce the same server-side plan gates as the REST APIs. Browser and agent tools consume monthly product windows when those products are enabled.

## Example (conceptual)

1. `agent_create` → get `agentId`
2. `sandbox_create` → get `sandboxId`
3. `workflow_create` with steps referencing those ids
4. `workflow_trigger` with a payload
5. `workflow_runs` to inspect status
