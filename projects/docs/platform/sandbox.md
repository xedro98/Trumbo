---
title: "Sandbox"
description: "Remote Linux VMs for shell, code, git, tunnels, and backups."
---
# Sandbox

Sandboxes are remote Linux VMs for code execution. They start lazily, can sleep when idle, and are metered by monthly CPU-seconds and concurrent slots.

## Dashboard

[platform.trumbo.dev/sandbox](https://platform.trumbo.dev/sandbox)

Use **Copy ID** on a sandbox row for Automations `sandbox_command` steps.

## REST API

Base: `https://api.trumbo.dev/api/v1/sandbox`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sandbox` | List sandboxes |
| `POST` | `/sandbox` | Create (optional `restoreFromBackupId`) |
| `GET` | `/sandbox/{id}` | Status |
| `DELETE` | `/sandbox/{id}` | Destroy |
| `POST` | `/sandbox/{id}/exec` | Run shell command |
| `POST` | `/sandbox/{id}/run-code` | Run Python / JS / TS |
| `GET`/`POST` | `/sandbox/{id}/files` | Read / write files |
| `POST` | `/sandbox/{id}/git-checkout` | Clone a repo |
| `POST` | `/sandbox/{id}/tunnels` | Expose a port (preview URL) |
| `POST` | `/sandbox/{id}/processes` | Background process |
| `POST` | `/sandbox/{id}/backups` | Create backup |
| `POST` | `/sandbox/{id}/keepalive` | Toggle keep-alive |

Exec example:

```bash
curl -X POST https://api.trumbo.dev/api/v1/sandbox/SANDBOX_ID/exec \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"uname -a","timeout":60000}'
```

## MCP tools

`sandbox_create`, `sandbox_status`, `sandbox_exec`, `sandbox_run_code`, `sandbox_write_file`, `sandbox_read_file`, `sandbox_list_files`, `sandbox_git_clone`, `sandbox_expose_port`, `sandbox_list_ports`, `sandbox_close_port`, `sandbox_start_process`, `sandbox_list_processes`, `sandbox_kill_process`, `sandbox_get_process_logs`, `sandbox_create_context`, `sandbox_list_contexts`, `sandbox_delete_context`, `sandbox_create_backup`, `sandbox_list_backups`, `sandbox_restore_backup`, `sandbox_delete_backup`, `sandbox_set_keepalive`, `sandbox_destroy`

## Automations

```json
{
  "id": "sandbox-probe",
  "type": "sandbox_command",
  "config": {
    "sandboxId": "YOUR-SANDBOX-UUID",
    "command": "echo ok && date -u",
    "timeout": 60000
  }
}
```

## Limits

Monthly CPU-seconds and concurrent sandboxes come from your plan. Sleeping sandboxes do not burn CPU.
