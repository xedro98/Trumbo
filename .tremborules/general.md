# General tribal knowledge

This file captures the non-obvious patterns that separate a quick fix from hours of back-and-forth. It is high-signal by design: the things you'd only learn by reading many files, getting corrected, or watching something work differently than expected.

**When to add a note here:**
- You had to intervene, correct, or hand-hold the agent
- Something took several attempts to get working
- You discovered something that required reading many files to understand
- A change touched files you wouldn't have guessed
- Something behaved differently than expected
- A user explicitly asks to record a pattern

**Proactively suggest additions** when any of the above happen — don't wait to be asked.

**What not to add:** anything obvious from reading a few files, standard practices, or things a contributor can derive quickly. Keep this dense.

## Miscellaneous

- The whole repo (including `apps/vscode`) uses **bun** for package management and task running. Emit `bun run X` / `bun install` / `bunx <bin>` / `bun file.ts` — never npm/npx. Node stays the *runtime* (VS Code's extension host and the standalone trembo-core run on Node), so Node-runtime tokens are legitimate and must not be "fixed" to bun. See @.tremborules/bun-and-node.md for the full keep-list vs rewrite-list.
- Avoid provider-specific string matching and hardcoded provider branches when fixing provider/config plumbing. Prefer provider metadata, the shared catalog/defaults, explicit protocol/client capabilities, or centralized normalization utilities that branch on data shape rather than `providerId === "..."`. If a provider exception seems necessary, stop and explain why instead of adding ad-hoc string matching.
- This is a VS Code extension — check `package.json` for available scripts before verifying builds (e.g. `bun run compile`, not `bun run build`).
- Contributors should not create changelog-entry files. Maintainers handle release versioning and changelog curation during the release process.
- When adding new feature flags, mirror the existing feature-flag patterns already in the codebase. The repo is at https://github.com/xedro98/trembo.
- Additional guidance on making network requests: @.tremborules/network.md

## Searching the codebase — avoiding build output

Several directories contain build output or generated code that produces noisy, unusable results with `search_files` / `grep`:

| Directory | What it is | Why it's a problem |
|-----------|-----------|-------------------|
| `out/` | esbuild bundle output | Mirrors `src/` as minified JS — every search gets duplicate hits on single-line files |
| `dist/` | Packaged extension | Entire extension bundled into one minified `extension.js` (~1 long line) |
| `dist-standalone/` | Standalone build output | Same minification issue |
| `src/generated/` | Generated protobuf code | Auto-generated from `proto/`; not the source of truth |
| `src/shared/proto/` | Generated proto type defs | Auto-generated from `proto/`; not the source of truth |
| `node_modules/` | Dependencies | Huge, not project source |

### How to skip build output

**`search_files`** — Point at `src/` (not the project root) and use `file_pattern`:
```
search_files(path="src/core", regex="myFunction", file_pattern="*.ts")
```
The `file_pattern` parameter is the strongest filter — e.g. `"*.ts"`, `"*.tsx"`, `"*.proto"`.

**`grep` directly** — Exclude build dirs and restrict to source extensions:
```bash
grep -rn "myFunction" src/ --include="*.ts" --exclude-dir={out,dist,node_modules,generated}
```

### When you must search minified files

Sometimes you need to verify what got bundled (e.g. checking whether a change made it into the build). Minified files are usually one long line, so a normal `grep` shows the entire file as context. Use these instead:

- **`grep -oP`** to extract just the match with limited surrounding context:
  ```bash
  grep -oP '.{0,40}myFunction.{0,40}' dist/extension.js
  ```
- **`read_file`** on files in `out/src/` — these keep source maps and are more readable than `dist/extension.js` (the fully bundled output).
- **Source maps** — `out/src/*.js.map` and `dist/extension.js.map` trace minified output back to original source locations.

## gRPC / protobuf communication

The extension and webview talk over a gRPC-like protocol layered on VS Code message passing.

**Proto files live in `proto/`** (e.g. `proto/trembo/task.proto`, `proto/trembo/ui.proto`).
- Each feature domain gets its own `.proto` file.
- For simple data, reuse the shared types in `proto/trembo/common.proto` (`StringRequest`, `Empty`, `Int64Request`).
- For complex data, define custom messages in the feature's `.proto` file.
- Naming: services `PascalCaseService`, RPCs `camelCase`, messages `PascalCase`.
- For streaming responses, use the `stream` keyword (see `subscribeToAuthCallback` in `account.proto`).

**Run `bun run protos`** after any proto change. It generates types into:
- `src/shared/proto/` — shared type definitions
- `src/generated/grpc-js/` — service implementations
- `src/generated/nice-grpc/` — promise-based clients
- `src/generated/hosts/` — generated handlers

**Adding a new enum value** (like a new `TremboSay` type) also requires updating the conversion mappings in `src/shared/proto-conversions/trembo-message.ts`.

**Adding a new RPC method** requires:
- A handler in `src/core/controller/<domain>/`
- A call from the webview via the generated client: `UiServiceClient.scrollToSettings(StringRequest.create({ value: "browser" }))`

**Example — the `explain-changes` feature touched:**
- `proto/trembo/task.proto` — added `ExplainChangesRequest` message and `explainChanges` RPC
- `proto/trembo/ui.proto` — added `GENERATE_EXPLANATION = 29` to the `TremboSay` enum
- `src/shared/ExtensionMessage.ts` — added `TremboSayGenerateExplanation` type
- `src/shared/proto-conversions/trembo-message.ts` — added mapping for the new say type
- `src/core/controller/task/explainChanges.ts` — handler implementation
- `webview-ui/src/components/chat/ChatRow.tsx` — UI rendering

## Adding new global state keys

Adding a key to global state touches several places. Miss any step and you get silent failures.

Required steps:
1. Type definition in `src/shared/storage/state-keys.ts` — add to `GlobalState` or `Settings` interface.
2. Add any default value or transform in `src/shared/storage/state-keys.ts` if the key needs one.
3. Read and write the value through `StateManager` (`setGlobalState()` / `getGlobalStateKey()`) after initialization.

Persistent state is file-backed through `StateManager`. Do not add new runtime reads or writes against VS Code `ExtensionContext` storage — that storage is only a legacy migration source.

Settings plumbing gotcha: if a key is user-toggleable from settings, wire both controller update paths:
- `src/core/controller/state/updateSettings.ts` for webview `updateSetting(...)`
- `src/core/controller/state/updateSettingsCli.ts` for CLI/ACP settings updates

Miss one path and a toggle appears to change in one surface while the backend state stays unchanged.

Webview toggle gotcha: settings changes must also round-trip back in state payloads.
- Add the field to `UpdateSettingsRequest` in `proto/trembo/state.proto` (for webview update requests), then run `bun run protos`.
- Include the key in `Controller.getStateToPostToWebview()` (`src/core/controller/index.ts`).
- Ensure `ExtensionState` and webview defaults include the key (`src/shared/ExtensionMessage.ts`, `webview-ui/src/context/ExtensionStateContext.tsx`).

If this round-trip wiring is missing, the backend value can update but the toggle in the webview appears stuck or reverts.

## StateManager cache vs direct globalState access

StateManager keeps an in-memory cache populated during `StateManager.initialize()` from file-backed storage. For most state, use `controller.stateManager.setGlobalState()` / `getGlobalStateKey()`.

Exception: host migration code may read legacy VS Code storage before file-backed storage is initialized.

Example pattern:
```typescript
// Writing (normal pattern)
controller.stateManager.setGlobalState("myKey", value)

// Reading after initialization
const value = controller.stateManager.getGlobalStateKey("myKey")
```

Use `context.globalState` only in VS Code migration code that copies legacy ExtensionContext values into the shared file-backed stores.

## ChatRow cancelled / interrupted states

When a ChatRow shows a loading/in-progress state (spinner), you must handle what happens when the task is cancelled. This is non-obvious because cancellation does not update the message content — you infer it from context.

**The pattern:**
1. A message has a `status` field (e.g. `"generating"`, `"complete"`, `"error"`) stored in `message.text` as JSON.
2. When cancelled mid-operation, the status stays `"generating"` forever — nothing updates it.
3. To detect cancellation, check two conditions:
   - `!isLast` — if this message is no longer the last message, something else happened after it (interrupted).
   - `lastModifiedMessage?.ask === "resume_task" || "resume_completed_task"` — the task was just cancelled and is waiting to resume.

**Example from `generate_explanation`:**
```tsx
const wasCancelled =
    explanationInfo.status === "generating" &&
    (!isLast ||
        lastModifiedMessage?.ask === "resume_task" ||
        lastModifiedMessage?.ask === "resume_completed_task")
const isGenerating = explanationInfo.status === "generating" && !wasCancelled
```

**Why both checks?**
- `!isLast` catches: cancelled → resumed → did other stuff → this old message is stale.
- `lastModifiedMessage?.ask === "resume_task"` catches: just cancelled, hasn't resumed yet, this message is still technically "last".

**See also:** `BrowserSessionRow.tsx` uses a similar pattern with `isLastApiReqInterrupted` and `isLastMessageResume`.

**Backend side:** when streaming is cancelled, clean up properly (close tabs, clear comments, etc.) by checking `taskState.abort` after the streaming function returns.

## Debug harness: clear inherited VS Code / Electron env vars before launching

The debug harness (`apps/vscode/src/dev/debug-harness/server.ts`) launches a child VS Code via Playwright's `_electron.launch({ env: { ...process.env, ... } })`. If you run the harness from a process that was itself spawned by VS Code (the Trembo extension host, an integrated terminal, or an agent running inside VS Code), the parent's VS Code/Electron env vars leak into the child and break the launch.

The fatal one is **`ELECTRON_RUN_AS_NODE=1`**: it makes the child VS Code binary run as plain Node, so it rejects every VS Code CLI flag. Symptom:

```
.../Visual Studio Code.app/Contents/MacOS/Code: bad option: --extensionDevelopmentPath=...
Error: Process failed to launch!   (Playwright _electron.launch)
```

This is not the macOS Playwright flakiness mentioned in the harness README — it is env inheritance. Fix: strip the inherited vars before starting the harness:

```bash
env -u ELECTRON_RUN_AS_NODE -u ELECTRON_NO_ATTACH_CONSOLE \
    -u VSCODE_CLI -u VSCODE_CODE_CACHE_PATH -u VSCODE_CRASH_REPORTER_PROCESS_TYPE \
    -u VSCODE_CWD -u VSCODE_ESM_ENTRYPOINT -u VSCODE_HANDLES_UNCAUGHT_ERRORS \
    -u VSCODE_IPC_HOOK -u VSCODE_NLS_CONFIG -u VSCODE_PID -u VSCODE_L10N_BUNDLE_LOCATION \
    bun src/dev/debug-harness/server.ts --auto-launch --skip-build
```

Check your own env with `env | grep -iE 'electron|vscode_'` first; if `ELECTRON_RUN_AS_NODE=1` is present, scrub before launching.

Other harness notes confirmed in practice:
- The extension host is **ESM** (`VSCODE_ESM_ENTRYPOINT`), so `ext.evaluate` has no `require` and module-internal functions are not reachable as globals. To inspect internal builders (e.g. `buildBedrockProviderConfig`), set a breakpoint with `ext.set_breakpoint` and read locals via `ext.evaluate` with the paused `callFrameId` — do not try to `require()` the bundle.
- `web.evaluate` wraps the expression as a single returned expression; multi-statement snippets must be an IIFE `(() => { ...; return x; })()`, otherwise you get `SyntaxError: Unexpected token ';'`.
- Webview settings inputs are `vscode-text-field` web components with debounced React onChange. Setting `.value` + dispatching events via `web.evaluate` is unreliable for some fields; focus the inner shadow `input` then use real keystrokes (`ui.type` + `ui.press Tab`, or click the dropdown option) to make the value persist.
