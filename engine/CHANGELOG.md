```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo SDK Changelog

## 0.0.61

### Fixed
- `fetchLiveProviderModels`, `fetchModelsDevProviderModels`, and `fetchTrumboRecommendedModelsPayload` now apply a per-request `AbortSignal.timeout` (default 5s, configurable via a new optional `timeoutMs` argument; pass `0` or a negative value to disable). The raw `fetch` had no default timeout, so an unreachable catalog endpoint (e.g. `models.dev` or the Trumbo recommended-models API) blocked session bootstrap for ~60s and exceeded the 30s `session.create` client timeout. Failures are still swallowed and fall back to the bundled/generated catalog. Build-time catalog generators pass a 60s timeout so CI generation isn't cut short.

## 0.0.60

### Added
- `TrumboInsufficientCreditsError` (with `isTrumboInsufficientCreditsError`, `isTrumboInsufficientCreditsMessage`, `extractTrumboInsufficientCreditsMessage` helpers) recognizes HTTP 402 insufficient-credits responses from the Trumbo gateway; recovery action is to add credits at the billing dashboard
- `uuidV7()` and `isUuidV7()` time-ordered UUID generator in `@trumbodev/shared` (RFC 9562); wired into the Codex provider for per-instance request IDs
- `withRetry()` abortable retry helper in `@trumbodev/shared` with exponential backoff and abort-signal awareness
- AgentHarness: `injectMessage` on `AgentToolContext` lets tools inject messages into the agent's live conversation, enabling sub-agent orchestration and context injection
- `get_available_thinking_levels` RPC method returns the reasoning effort levels the SDK supports
- `bash_execution_update` events: the bash executor now emits incremental stdout/stderr chunks via `context.emitUpdate` so RPC/headless consumers get live output
- Session metadata (`TRUMBO_SESSION_ID`, `TRUMBO_CONVERSATION_ID`, `TRUMBO_AGENT_ID`, `TRUMBO_RUN_ID`) is now injected into the bash tool's environment so scripts can self-identify their session
- `ANTHROPIC_BEARER_TOKEN` env support: Anthropic-compatible providers authenticate via `Authorization: Bearer` when the env var is set
- `wrapFetchForDnsRetry` fetch wrapper retries transient DNS resolution failures (ENOTFOUND, EAI_AGAIN) with exponential backoff
- `llama-cpp` built-in provider for local llama.cpp server inference
- `qwen-token-plan` built-in provider for Alibaba Qwen subscription token-plan coding models
- Kimi K3 and Kimi K3 Code model catalog entries under the `moonshot` provider
- SuperGrok and SuperGrok Reasoning model catalog entries under the `xai` provider
- `deferKimiToolsMiddleware` trims verbose tool descriptions for Kimi/Moonshot models to reduce per-request token overhead
- Bracketed scoped model ids (e.g. `[org/model]`) are now resolved as literals, bypassing catalog alias resolution
- Constrained sampling: `constrained` field on `GatewayStreamRequest` for json_schema/regex/grammar directives, with a provider-option rule that composes `responseFormat` for OpenAI-compatible providers
- `disableCacheWrite` directive on `ProviderConfig` and `GatewayStreamRequest`: one-shot requests (compaction/branch summaries) opt out of prompt-cache writes so they don't pollute the cache
- `searchHuggingFaceModels()` utility for live Hugging Face Hub model discovery, integrated into the TUI model picker for llama model search
- `downloadModelFile()` streaming downloader with progress events (`DownloadProgress`) for local model downloads, plus a TUI progress dialog component
- `AgentExtensionProvider` expanded with `providerRegistration` so extensions can declare native LLM providers with a manifest + factory
- OpenRouter OAuth: device-code auth handler (`loginOpenRouterOAuth`) + `oauth` capability on the provider
- xAI OAuth: device-code auth handler (`loginXaiOAuth`) + `oauth` capability on the provider
- Compaction progress messages in the VS Code webview during the summarizer LLM call and transcript rebuild
- `reclaimUnobservedTerminals()` disposes fallback terminals that lost tracking via `no_shell_integration`
- Git Bash detection in the Windows shell resolver (`getWindowsShellFromVSCode`)
- Shell-mismatch warning log in `VscodeTerminalManager` when a terminal's effective shell differs from the configured profile
- "Proceed While Running" is now sticky to the command batch: clicking PWR on one command in a `run_commands` call applies to all sibling commands
- `DEFAULT_COMPACTION_STRATEGY` exported constant; agentic compaction is now the default strategy

### Changed
- Agentic compaction is the default when no strategy is explicitly set (was `basic`)
- Interactive TUI startup no longer blocks on the live models.dev catalog refresh (`loadLatestOnInit: false`); the bundled catalog + model picker async fetch handle the rest
- `TRUMBO_SDK_VERSION` bumped to 0.0.60 to match the shared package version
- `trumbo hub status` now includes `versions: { cli, sdk, hub }` in its JSON output
- Compaction summary model calls now retry on transient failures (up to 2 retries with exponential backoff)
- Provider `model.stream()` calls now retry on pre-stream transient failures (DNS, connection refused) with abort-signal awareness
- Early EOF detection: if a model stream closes without a `finish` event, the run is surfaced as an error instead of silently treated as a normal stop
- Edit preview (`DiffEditRow`) now uses stable index-based keys for diff lines so streaming updates preserve focus instead of unmounting/remounting lines
- opentui upgraded from 0.1.102 to 0.4.3 (zero breaking changes in the TUI code)

### Security
- Bump `axios` to 1.18.0 (multiple CVEs resolved)
- Bump `js-yaml` to 4.3.0 (CVE resolved)
- Bump `mermaid` to 11.16.0 (CVE resolved)
- Bump `protobufjs` to 7.6.5 (CVE resolved)

### Fixed
- `parseMarkdownFrontmatter` now strips a leading UTF-8 BOM (U+FEFF) so BOM-prefixed rules/skill files parse their frontmatter correctly
- Corrected `repository.url` in all SDK packages from `xedro98/trembo` to `xedro98/Trumbo` so npm provenance verification passes

## 0.0.60

- Bump `@trumbodev/llms` package version (catalog and provider updates accumulated since 0.0.59)

## 0.0.59

- Rename SDK package scope from `@trumbo` to `@trumbodev` across all published packages
- Add the Trumbo Quartz model family (`quartz-1.0`, `quartz-1.0-lite`, `quartz-1.0-hyper`) with bundled model facts and picker entries
- Add a fuzzy diff matching engine with NFKC Unicode normalization and line-ending preservation for the editor and apply-patch tools

## 0.0.58

- Add versioned client-identity headers (`X-CLIENT-VERSION`) to Trumbo and TrumboPass provider requests so the gateway can route and feature-flag by SDK version
- Add `user_id` as a telemetry identity attribute on every event when a user is signed in, independent of the machine distinct id
- Add a typed `TrumboPassLimitError` (with `isTrumboPassLimitError`, `isTrumboPassLimitMessage`, `extractTrumboPassLimitMessage` helpers) that recognizes subscription plan-cap 429 responses; recovery action is to upgrade the plan (Trumbo has no usage-based billing tier)
- `read_files` now coalesces pathless line-range entries emitted by weaker models back onto the preceding file path instead of rejecting the whole call
- Remove retired TrumboPass GLM 5.1 references from recommended-models tests and fixtures (GLM 5.2 is the active default)
- Fix a performance issue where listing sessions could hang the extension host: manifest reads now run concurrently via async I/O instead of a serial readFileSync loop

## 0.0.57

- Split production endpoints: `api.trumbo.dev` for programmatic API and MCP, `platform.trumbo.dev` for browser app and device-code verification
- Update platform MCP URL resolution and environment tests for the new API host

## 0.0.55

- Auto-register the platform Knowledge MCP server (`trumbo-platform`) so signed-in Trumbo users get the `search_knowledge` tool without manual MCP setup
- Sync Knowledge MCP credentials and org scope before agent sessions when using the Trumbo or TrumboPass provider
- Harden platform MCP settings updates with managed-server guards, org id validation, and safe MCP URL checks

## 0.0.54

- Improve basic compaction token budgeting so context compaction is more accurate
- Preserve error detail and fetch error cause information so failures surface clearer messages
- Preserve failed run error messages instead of dropping them
- Derive model info in the provider/model runtime path for more reliable provider/model handling
- Add TrumboPass subscription support to the account service

## 0.0.53

- Show when request cost is covered by the user's Trumbo subscription
- List TrumboPass features in the not-subscribed message
- Added shared marketplace uninstall support
- Shared marketplace install logic through core
- Surfaced plugin-bundled skills
- Capped MCP tool names at 64 characters for OpenAI-compatible providers
- Updated coupon code

## 0.0.52

- Added checkpoints support to the agent runtime
- Added SAP AI Core provider support: stabilized provider setup, bundled provider auth, forwarded provider options to the gateway, aligned provider config, kept model filtering in clients, and added OCA legacy reasoning-effort handling
- Routed LiteLLM model fetches through the SDK and stopped unrelated models from being injected into the LiteLLM model list
- Preserved OpenRouter reasoning-disable semantics and included the session id for OpenRouter prompt caching
- Updated the TrumboPass model list live, restored TrumboPass models in onboarding, fixed TrumboPass error mapping, and scoped the TrumboPass URL to the CLI
- Threaded proxy/CA-aware fetch into the SDK inference path
- Persisted Bedrock settings to providers.json
- Repaired exposed provider auth routing and restored provider-request capture wiring lost in the SDK migration
- Added a connector configure path and moved the shared connector catalog into the shared package
- Normalized JSON-like tool inputs by schema and avoided a nullable editor `old_text` schema
- Batched outdated-read rewrites in `MessageBuilder` to preserve provider prefix caches
- Prevented an "ERROR: EMPTY CONTENT" message from appearing when an error occurs
- Added non-interactive command guidance to the agent
- Published SDK sourcemaps
- Refreshed the generated model catalog

## 0.0.51

- Fixed Z.ai model metadata not resolving correctly when using Z.ai models through the Trumbo provider; aliases now map to the right model metadata and user overrides are preserved

## 0.0.50

- Truncate every tool result by default (including MCP and custom tool output), with tightened `MessageBuilder` limits and tunable `TRUMBO_MESSAGE_BUILDER_*` env overrides, to keep provider requests within budget
- Cap assistant text in provider messages and count `tool_use` input toward the request budget; protect binary carrier blocks (not just images) from truncation
- Resolve tool names from `tool_result` when the paired `tool_use` is gone
- Add TrumboPass provider support (built-in provider, error handling, format compatibility)
- Apply auto-approve toggles immediately in the agent runtime
- Harden parallel tool-call guidance in the system prompt and tool definitions
- Refresh the generated model catalog

## 0.0.49

- Reverted TrumboPass recommended-models support, removing the `trumboPass` field from the recommended models data

## 0.0.48

- Added TrumboPass support and TrumboPass models
- Added MCP server support to plugins
- Updated the recommended/fixed model list
- Encouraged parallel tool calls for faster task execution
- Capped tool output ingestion for bash commands and file reads to keep large output within context limits
- Added a bounded media budget for provider requests, plus generic provider-request capture
- Allowed ranged reads on large files
- Fixed apply_patch to fail when a hunk is skipped instead of silently dropping it
- Fixed run_commands to return captured stdout on failure and to coalesce split heredocs
- Fixed search tools to treat zero results as a successful result
- Fixed search output cap and bash executor follow-up issues
- Fixed disabled-reasoning handling for StepFun flash
- Fixed the Hugging Face URL
- Fixed Trumbo OAuth token formatting in provider config

## 0.0.47

- Added support for overriding the API base URL
- Enforced a production singleton Trumbo Hub so only one hub daemon runs, and a stale hub is respawned after an upgrade
- Allowed plugin chat commands to submit prompts to the agent
- Fixed truncation of structured tool operation result strings so oversized tool output stays within limits
- Stopped echoing the full command text in run_commands tool results

## 0.0.46

- Added support for configured agents as subagent tools
- Centralized OAuth management into the SDK
- Added Vertex GCP settings configuration
- Fixed the Azure Foundry API version for the CLI
- Fixed an error caused by disabled reasoning on Fable 5

## 0.0.45

- Added support for the Claude Fable 5 model
- Fixed MiniMax M3 thinking controls so they route correctly across gateways

## 0.0.44

- Added support for Vertex AI Application Default Credentials (ADC) with tool use
- Added a global auto-update setting for CLI startup updates
- Fixed empty message content replay for Bedrock
- Cleaned up the OpenAI Codex model list

## 0.0.43

- Added the Trumbo Hub web app for managing and monitoring agent sessions
- Added plugin uninstall support
- Added skills bundled with plugins, including grouping plugin skills in settings and rule contributions from sandboxed plugins
- Added support for global AGENTS rules
- Added Slack socket mode support and bound Discord sessions to individual message authors
- Synced the Fireworks AI model registry and updated the model catalog to current platform offerings
- Routed custom registered handlers through the agent runtime
- Added a TRUMBO_PLUGIN_IMPORT_TIMEOUT_MS environment override for plugin import timeouts
- Allowed a baseUrl field for Anthropic vendor-type providers
- Fixed SAP AI Core to use the AI SDK community provider
- Fixed the hub daemon to stay alive on runtime abort
- Fixed read-files tool input validation to use a union schema
- Fixed discovery of symlinked SDK skill directories
- Improved Trumbo provider migration
- Fixed OTEL variable bundling
- Added telemetry for run_commands timeouts

## 0.0.42

- Supports Bedrock bearer API keys, direct IAM credentials, AWS profiles, and the default AWS SDK credential chain
- Routes Z.AI GLM thinking through provider metadata while preserving generic thinking suppression for non-GLM Z.AI custom models
