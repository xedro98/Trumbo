```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Sidecar Architecture — @trumbo/code

## Overview

The sidecar is a single Bun process that owns the desktop backend runtime directly. It imports `@trumbo/core` in-process and serves the Next.js frontend over HTTP plus a WebSocket.

## Directory structure

```
sidecar/
├── index.ts              # Entry point: starts HTTP+WS server
├── server.ts             # Bun HTTP server + WebSocket handlers
├── context.ts            # SidecarContext type and factory
├── commands.ts           # Command router
├── chat-session.ts       # In-process chat session management
├── session-data/         # Shared discovery, messages, artifacts, search helpers
├── paths.ts              # Path resolution
├── types.ts              # Shared types
└── ARCHITECTURE.md       # This file
```

## Transport protocol (unchanged)

```
Request:  { "type": "command", "id": string, "command": string, "args"?: object }
Response: { "type": "response", "id": string, "ok": boolean, "result"?: unknown, "error"?: string }
Event:    { "type": "event", "event": { "name": string, "payload": unknown } }
```

## Key design decisions

### 1. Chat sessions — in-process via LocalRuntimeHost

Rather than spawning a separate runtime bridge process, the sidecar uses `LocalRuntimeHost` directly:

```typescript
import { LocalRuntimeHost } from "@trumbo/core";

const sessionManager = await TrumboCore.create({
  backendMode: "hub",
  capabilities: {
    requestToolApproval: async (request) => {
      // Push approval request to frontend via WebSocket event
      broadcastEvent("tool_approval_state", { sessionId: request.sessionId, items: [request] });
      // Wait for frontend response
      return await waitForApprovalResponse(request.sessionId, request.toolCallId);
    },
  },
});

// Start session
const { sessionId } = await sessionManager.start({
  config: coreSessionConfig,
  prompt: "...",
});

// Send follow-up
await sessionManager.send({ sessionId, prompt: "..." });

// Subscribe to streaming events
sessionManager.subscribe((event) => {
  // Forward to WebSocket clients as chat_text, chat_reasoning, etc.
  broadcastEvent("chat_event", event);
});
```

### 2. Tool approval — in-memory promise resolution

Tool approvals no longer touch the filesystem. They use an in-memory promise map:

```typescript
const pendingApprovals = new Map<string, {
  resolve: (result: ToolApprovalResult) => void;
  request: ToolApprovalRequest;
}>();

// When core requests approval → store promise, push to frontend
// When frontend responds → resolve promise
```

### 3. Provider management — direct ProviderSettingsManager

```typescript
import { ProviderSettingsManager, listLocalProviders, ... } from "@trumbo/core";
const manager = new ProviderSettingsManager();
```

### 4. Session storage — direct SqliteSessionStore

```typescript
import { SqliteSessionStore, resolveSessionBackend } from "@trumbo/core";
const store = new SqliteSessionStore();
```

### 5. Routine schedules — direct hub commands

Routine operations ensure the local hub server in-process and then issue hub schedule commands directly. They still run in-process, not via a child script:

```typescript
import { ensureHubServer, sendHubCommand } from "@trumbo/core";
await ensureHubServer({ runtimeHandlers: createLocalHubScheduleRuntimeHandlers() });
await sendHubCommand({}, { command: "schedule.list", payload: { limit: 200 } });
```

### 6. Native commands

- `pick_workspace_directory` — uses macOS `osascript` or Linux `zenity` for a directory picker.
- `open_mcp_settings_file` — uses `open` or `xdg-open` to reveal a file.

### 7. Frontend connection

The frontend `desktop-client.ts` connects directly to the sidecar WebSocket:

- Discovers the endpoint from `window.__SIDECAR_WS_ENDPOINT__` or defaults to `ws://127.0.0.1:3126/transport`.
- No Tauri dependency needed.
- Same `invoke()` / `subscribe()` API surface.

## Command map

Supported commands:

| Command | Implementation |
|---------|---------------|
| `chat_session_command` | `LocalRuntimeHost` in-process |
| `list_provider_catalog` | `ProviderSettingsManager` + `listLocalProviders` |
| `list_provider_models` | `getLocalProviderModels` |
| `save_provider_settings` | `saveLocalProviderSettings` |
| `add_provider` | `addLocalProvider` |
| `run_provider_oauth_login` | `loginLocalProvider` |
| `list_chat_sessions` | `SqliteSessionStore` + file discovery |
| `list_discovered_sessions` | Merged discovery |
| `read_session_messages` | Session data readers |
| `read_session_hooks` | Session data readers |
| `delete_chat_session` | `SqliteSessionStore.delete` + file cleanup |
| `update_chat_session_title` | `resolveSessionBackend().updateSession` |
| `list_mcp_servers` | Direct file I/O |
| `upsert_mcp_server` | Direct file I/O |
| `delete_mcp_server` | Direct file I/O |
| `get_git_branch` | `execFileSync("git", ...)` |
| `list_git_branches` | `execFileSync("git", ...)` |
| `checkout_git_branch` | `execFileSync("git", ...)` |
| `search_workspace_files` | `getFileIndex` |
| `get_process_context` | In-memory context |
| `poll_tool_approvals` | In-memory pending map |
| `respond_tool_approval` | In-memory promise resolution |
| `list_routine_schedules` | Local hub schedule commands |
| `list_user_instruction_configs` | Direct core API |
| `pick_workspace_directory` | OS native dialog |
| `open_mcp_settings_file` | OS `open` command |

## Dev workflow

```bash
bun run dev:sidecar   # Start sidecar on port 3126
bun run dev:web       # Start Next.js on port 3125
bun run dev           # Both concurrently
```
