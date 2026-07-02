```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Desktop App Example

A Tauri desktop shell paired with a Bun sidecar backend and a Next.js UI for running and inspecting Trumbo chat sessions. The native layer stays thin (window, file pickers, open-path helpers); everything else — chat runtime, sessions, provider settings, schedules — lives in the sidecar and is reached over a single websocket.

## Dev commands

Run from `projects/samples/desktop-app/`:

- `bun run dev:web` — Next.js UI only at <http://localhost:3125>.
- `bun run dev:sidecar` — sidecar backend only.
- `bun run dev` — full Tauri desktop dev (web + sidecar + native window).
- `bun run build` — build web assets.
- `bun run build:sidecar` — build the Bun sidecar bundle.
- `bun run build:sidecar:bin` — compile the Bun sidecar into a local binary.
- `bun run build:binary` — build the desktop binary.
- `bun run typecheck` — TypeScript check.

## Runtime overview

Startup flow:

1. Tauri boots a persistent local desktop backend and keeps only native responsibilities: window, file picker, and open-path helpers.
2. The desktop backend starts the Bun sidecar and exposes a single websocket transport (`/transport`) that carries commands, queries, and pushed events.
3. The React app talks to the backend through `lib/desktop-client.ts`; feature code never imports `@tauri-apps/api/core` directly.
4. Tool approval updates are pushed from the backend instead of being polled from the UI.
5. Session process context resolves `workspaceRoot` from the git root and reuses that path as the default `cwd` for the chat runtime and git operations unless you override it.

Desktop transport envelope:

- Request: `{ "type": "command", "id": string, "command": string, "args"?: object }`
- Response: `{ "type": "response", "id": string, "ok": boolean, "result"?: unknown, "error"?: string }`
- Event: `{ "type": "event", "event": { "name": string, "payload": unknown } }`

## Settings: Routine

- The Settings sidebar includes a `Routine` view for hub-backed automations.
- `Routine` lists every RPC schedule and shows status (`enabled`, `nextRunAt`, active execution).
- From the UI you can open a create form and then add, pause/resume, trigger-now, and delete schedules.
- The view is wired to the same scheduler APIs used by `trumbo schedule`, reached through Tauri commands and `scripts/routine-schedules.ts`.

## Key files

- [`src-tauri/src/main.rs`](./src-tauri/src/main.rs) — Tauri shell lifecycle, backend launch, and the native-only commands.
- [`sidecar/index.ts`](./sidecar/index.ts) — persistent Bun sidecar backend.
- [`sidecar/chat-session.ts`](./sidecar/chat-session.ts) — in-process chat session runtime.
- [`webview/lib/desktop-client.ts`](./webview/lib/desktop-client.ts) — typed desktop websocket client.
- [`webview/hooks/use-chat-session.ts`](./webview/hooks/use-chat-session.ts) — UI chat session state and backend subscriptions.
- [`webview/lib/chat-schema.ts`](./webview/lib/chat-schema.ts) — chat message schema used by the UI.
- [`webview/components/views/settings/routine-view.tsx`](./webview/components/views/settings/routine-view.tsx) — Routine schedules UI.

## Data and storage

- Session artifacts are written under `~/.trumbo/data/sessions/<sessionId>/` (or `TRUMBO_SESSION_DATA_DIR`).
- The canonical replay/export artifact is `<sessionId>.messages.json`.
- `<sessionId>.messages.json` is expected to contain ordered messages plus assistant `modelInfo` and `metrics` (including cache token fields when the model runtime provides them).
- `<sessionId>.hooks.jsonl` is observability and debug telemetry; it is not required for normal history replay or export flows.
- The full v1 schema for the persisted messages file — including failure and retry semantics and golden fixtures — is documented in [`packages/core/book/messages-contract-v1.md`](../../../engine/packages/core/book/messages-contract-v1.md).

## Troubleshooting

- If live updates stall, verify the desktop backend websocket is connected and `chat_event` messages are arriving.
- Tauri restarts the desktop backend if the sidecar process exits, and tears it down on app shutdown.
- Chat sends now preflight provider credentials. If a provider that requires API-key auth is selected without a key, the UI blocks the turn with a clear error instead of starting a hanging session.
- If a turn ends with `finishReason=error` before any assistant content is produced, the UI adds an explicit error chat message so failed turns are visible in the transcript.
- If package changes are not reflected, rebuild the SDK packages (`bun run build:sdk`). The next `trumbo rpc ensure` call attaches to the current build's sidecar automatically.
- Provider settings updates are patch-style: only the fields you edit change. Unset fields are preserved instead of being cleared.
