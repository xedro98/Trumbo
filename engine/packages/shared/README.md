```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# [experimental] @trumbo/shared

Package-level docs are centralized:

- Overview: [`packages/README.md`](../README.md)
- Architecture and interactions: [`ARCHITECTURE.md`](../../ARCHITECTURE.md)

`@trumbo/shared` owns the shared cross-package primitives (session common types and utilities) that the rest of the SDK builds on.

Node-only filesystem path resolvers live under the storage subpath export:

- `@trumbo/shared/storage`
- examples: `resolveTrumboDataDir`, `resolveDbDataDir`, `resolveSessionDataDir`, `resolveTeamDataDir`

It also exports cross-client logging contracts, including `BasicLogger`, so the runtime, SDK, and host applications can all share a single logger type.

Session config primitives are centralized here so hosts and runtimes can compose one base shape instead of redefining similar fields over and over:

- `AgentMode`
- `SessionPromptConfig`
- `SessionWorkspaceConfig`
- `SessionExecutionConfig` (includes the canonical `ToolPolicy` map shape)

It also exports the hook session context primitives used across agents, core, and the CLI:

- `HookSessionContext`
- `resolveHookSessionContext(...)`
- `resolveRootSessionId(...)`
- `resolveHookLogPath(...)`

It also exports cross-client runtime payload DTOs used by multiple hosts (`@trumbo/cli`, `@trumbo/code`) so request/response contracts are not duplicated outside transport wiring:

- chat runtime payloads (`ChatStartSessionRequest`, `ChatRunTurnRequest`, `ChatTurnResult`)
- provider runtime payloads (`ProviderActionRequest`, `ProviderCatalogResponse`, `ProviderOAuthLoginResponse`)
- Trumbo account action payloads (`TrumboAccountActionRequest`)
- provider action requests include provider catalog/model operations plus provider add/save operations for settings hosts
- provider action payloads now expose granular request/type contracts for reuse:
  `AddProviderActionRequest`, `SaveProviderSettingsActionRequest`,
  `ProviderCapability`, and `OAuthProviderId`

Chat runtime payload notes:

- `ChatStartSessionRequest` supports `initialMessages`, optional `toolPolicies`, optional `rules` for default system prompt assembly, and optional `logger` runtime config (`RuntimeLoggerConfig`) so hosts can pass serialized logger settings across transport boundaries.
- `RuntimeLoggerConfig.bindings` lets hosts attach stable context fields (for example `clientId`, `clientType`, `clientApp`) to all runtime log records.
