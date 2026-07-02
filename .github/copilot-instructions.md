# Copilot instructions for Trumbo

This is a VS Code extension. Read `.trumborules/general.md` for tribal knowledge and nuanced patterns.

## Architecture
- **Core** (`src/`): `extension.ts` → `WebviewProvider` → `Controller` (single source of truth) → `Task` (agent loop).
- **Webview** (`webview-ui/`): React/Vite app. State via `ExtensionStateContext.tsx`, synced through message passing.
- **Communication**: a protobuf-defined, gRPC-like protocol over VS Code message passing. Schemas in `proto/`.
- **MCP**: `src/services/mcp/McpHub.ts`.

## Build and test (critical — non-obvious commands)
- **Build**: `bun run compile` — NOT `bun run build`.
- **Watch**: `bun run watch` (extension + webview).
- **Protos**: `bun run protos` — run **immediately** after any `.proto` change. Generates into `src/shared/proto/`, `src/generated/`.
- **Tests**: `bun run test:unit`. After prompt/tool changes: `UPDATE_SNAPSHOTS=true bun run test:unit`.

## Protobuf RPC workflow (4 steps)
1. **Define** in `proto/trumbo/*.proto`. Naming: `PascalCaseService`, `camelCase` RPCs, `PascalCase` messages. Use `common.proto` shared types for simple data.
2. **Generate**: `bun run protos`.
3. **Backend handler**: `src/core/controller/<domain>/`.
4. **Frontend call**: `UiServiceClient.myMethod(Request.create({...}))`.
- Adding enums (e.g. `TrumboSay`) → also update `src/shared/proto-conversions/trumbo-message.ts`.

## Adding API providers (silent-failure risk)
Three proto-conversion updates are **required**, or the provider silently resets to Anthropic:
1. `proto/trumbo/models.proto` — add to the `ApiProvider` enum.
2. `convertApiProviderToProto()` in `src/shared/proto-conversions/models/api-configuration-conversion.ts`.
3. `convertProtoToApiProvider()` in the same file.

Also update: `src/shared/api.ts`, `src/shared/providers/providers.json`, `src/core/api/index.ts`, `webview-ui/.../providerUtils.ts`, `webview-ui/.../validate.ts`, `webview-ui/.../ApiOptions.tsx`.

For Responses API providers: add to `isNextGenModelProvider()` in `src/utils/model-utils.ts` and set `apiFormat: ApiFormat.OPENAI_RESPONSES` on models.

## Adding tools to the system prompt (5+ file chain)
1. Add an enum to `TrumboDefaultTool` in `src/shared/tools.ts`.
2. Create a definition in `src/core/prompts/system-prompt/tools/` (export `[GENERIC]` minimum).
3. Register in `src/core/prompts/system-prompt/tools/init.ts`.
4. Whitelist in `src/core/prompts/system-prompt/variants/*/config.ts` for each model family.
5. Handler in `src/core/task/tools/handlers/`, wired in `ToolExecutor.ts`.
6. If the tool has UI: add a `TrumboSay` enum in proto → `ExtensionMessage.ts` → `trumbo-message.ts` → `ChatRow.tsx`.
7. Regenerate snapshots: `UPDATE_SNAPSHOTS=true bun run test:unit`.

## Modifying the system prompt
Modular: `components/` (shared) + `variants/` (model-specific) + `templates/` (`{{PLACEHOLDER}}`). Variants override components via `componentOverrides` in `config.ts` or a custom `template.ts`. The XS variant is heavily condensed inline. Always regenerate snapshots after changes.

## Global state keys (silent-failure risk)
Adding a key requires updating the typed storage definitions in `src/shared/storage/state-keys.ts`; runtime reads and writes should go through `StateManager`, not VS Code `ExtensionContext` storage. Persistent state is file-backed, so it works across VS Code, CLI, and JetBrains hosts.

## Slash commands (3 places)
- `src/core/slash-commands/index.ts` — definitions.
- `src/core/prompts/commands.ts` — system prompt integration.
- `webview-ui/src/utils/slash-commands.ts` — webview autocomplete.

## Conventions
- **Paths**: always use `src/utils/path` helpers (`toPosixString`) for cross-platform compatibility.
- **Logging**: `src/shared/services/Logger.ts`.
- **Feature flags**: mirror the existing feature-flag patterns already in the codebase. Repo: https://github.com/xedro98/trembo.
