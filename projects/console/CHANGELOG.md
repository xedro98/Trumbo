```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo CLI Changelog



## 3.4.0

Wiring follow-ups + MCP token expiry fix.

### New features
- **Pre-execution diff preview**: the approval dialog now shows a red/green diff of proposed file changes before you approve an edit. Computed in-memory (no write) for `editor`/`edit`/`write` tools.
- **TUI view contributions**: plugin-contributed footer views (from the `tui` capability + `registerView` API) now render below the status bar in the chat view. A descriptor interpreter (`plugin-views.tsx`) translates serializable render descriptors to React elements.
- **`/reload` is real**: clears the theme cache, refreshes skills/rules/workflows from disk, and re-syncs the platform MCP token.
- **Sticky column in the editor**: the editor now preserves your visual column when moving up/down across lines of different length (Emacs-style `preferredCol` behavior). Cleared on character input.

### Bug fixes
- **MCP token never expires**: the `trumbo-platform` MCP server's bearer token is now refreshed and rewritten to `trumbo_mcp_settings.json` at startup, on model change, on account change, and on `/reload`. Previously the token was written once at sign-in with a 1-hour expiry and never refreshed, causing the MCP server to show an OAuth error after 1 hour.

## 3.3.1

Fix: compiled CLI binary now correctly resolves to the production environment.

- `isBunSourceCliDev()` excluded compiled Bun binaries whose `bun.main` contains the original source path under the Bun virtual filesystem (`/~BUN/root/...`). Without this fix, the compiled binary resolved to the "local" environment (localhost:8787), causing `trumbo auth trumbo` to fail with "Unable to connect" and the `trumbo-platform` MCP server to show an OAuth error.
- `isPublishedCliBinary()` now matches `.trumbo.exe` (the dot-prefixed beside-wrapper cache name) in addition to `trumbo.exe`.

## 3.3.0

v3.3.0 — 15 new features across 3 tiers.

### Tier 1 — wiring (already-built modules now live)
- `--mode rpc` JSONL stdin/stdout embedding mode wired into the CLI entry point (enables orchestrator-style multi-client usage)
- 51-token theme system wired into the renderer with hot-reload (`~/.trumbo/themes/*.json`, `TRUMBO_THEME` env override)
- Project trust enforced at startup — `--trust always|never|ask`, `--approve`/`--no-approve` flags, `/trust` slash command (gates project-local skills/rules/workflows loading)
- Scoped-model cycling via `Ctrl+M` + `/scoped-models` command (cycles models from `~/.trumbo/scoped-models.json`)
- Prompt-template expansion: `/templatename args` expands `$1`/`$@` macros from `~/.trumbo/prompts/*.md`
- Cross-provider thinking handoff: `prepareForProviderSwitch` converts thinking blocks to portable `<thinking>` text tags when switching models mid-session
- CSI 2026 synchronized-output utilities built + tested (deferred to OpenTUI upstream for per-frame wiring)

### Tier 2 — session/tools/agent
- Session tree entry types: `BranchSummaryEntry` + `LabelEntry` (bookmark) support added to the session tree model; `getActivePath` filters label entries from the model context
- Branch summary injection: switching leaves in `/tree` injects a summary of the abandoned branch so context is preserved
- Fuzzy-match edit engine: the `editor` tool now falls back to Levenshtein similarity (0.66 threshold) when exact match fails, preserving unchanged lines
- `diffPreview` field added to `ToolApprovalRequest` for future pre-execution diff display in approval dialogs
- `OutputAccumulator` class + `TruncationResult` type with `Use offset=N to continue` continuation notices
- Agent loop hooks: `transformContext`, `prepareNextTurn`, `shouldStopAfterTurn` added to `AgentRuntimeHooks` for RAG injection, turn-boundary message injection, and clean stop control

### Tier 3 — editor + extensions
- Emacs kill-ring: `Ctrl+K`/`Ctrl+U` kill to line end/start, `Ctrl+Y` yank, `Meta+Y` yank-pop in the TUI editor
- Extension hooks expanded from 16 to 30 events (observation-only); `before_provider_request` payload guarded as `readonly` to keep provider/billing server-authoritative
- TUI view contribution capability added (`tui` capability, `registerView` API, `TuiViewContribution` type, `views` registry slot)

### Bug fixes
- RPC mode now exits cleanly after `exit` request (explicit `process.exit(0)` after server closes — previously the hub daemon kept the process alive)

## 3.2.1

Fix: `trumbo` launcher no longer runs a stale cached binary after an npm update.

- The launcher now version-checks its local binary cache: a cached binary is only used when a version marker written by `postinstall` matches the installed wrapper version. If an npm update landed without running `postinstall` (e.g., npm `allow-scripts` gating), the stale cache is skipped and the freshly-installed npm platform binary is used instead.
- `postinstall` writes `version.txt` (local cache) and `.trumbo.version` (beside-wrapper cache) markers so the launcher can detect stale caches.
- `postinstall` is now silent on success for cleaner npm install output.

## 3.2.0

The chat UI is redesigned into a modern, avatar-driven messenger experience.

- New chat layout: every message uses a unified avatar + content shell with a two-level hierarchy — labeled turns (You / Trumbo) at the left edge, indented events (tools, thinking, status) nested under the active turn
- Avatars throughout: `*` for Trumbo (animates while streaming), `●` for you, per-tool letter glyphs, `~` for thinking, with distinct role colors (user blue, assistant green, reasoning magenta, tools amber)
- Distinct message shapes: your messages render as rounded bordered bubbles; Trumbo's responses render as accent-rail markdown cards
- Persistent branded header bar showing mode, model, and workspace/branch above a sparkle rule, with balanced spacing
- Compact "Ask Trumbo" input with a centered prompt glyph and adaptive theme-aware background
- Empty-state splash now shows the Trumbo ASCII logo (sourced from `ascii-art.txt`) centered in the chat area before the first message
- Magical touches: sparkle brand mark, per-tool status icons (`+`/`x`/`!`), and a centered turn-end summary divider
- All decorative glyphs switched to Windows-terminal-safe characters so avatars and icons never render as broken boxes

## 3.0.59

- fix: CLI no longer crashes when switching Plan/Act mode, changing model, or toggling compaction during an active run
- fix: mode and model change failures show a TUI toast instead of triggering a fatal unhandled rejection exit
- fix: session reconfigs (model, account, compaction, policy refresh) are serialized and deferred until the current turn finishes
- fix: pending Plan/Act switches from Tab or `switch_to_act_mode` now apply correctly after abort or turn completion
- fix: GLM 5.2 routes effort through `reasoning_effort` instead of sending unsupported `effort` / `reasoningSummary` fields

## 3.0.58

Platform companion release: sandbox delete fix, MCP API token auth, expanded API token scopes

## 3.0.57

- Trumbo Cloud Agents: create, manage, and chat with persistent cloud agents via `agent_*` MCP tools (auto-discovered when you sign in)
- Cloud agents run on the platform with Think harness: workspace tools, MCP, browser, scheduling, and Slack/email/webhook/voice channels
- Trumbo Sandbox: remote Linux VM code execution via `sandbox_*` MCP tools (exec, run-code, files, tunnels)
- Both Cloud Agents and Sandbox are also available as REST APIs at `/api/v1/agents` and `/api/v1/sandbox`
- Server-side billing: agent-hours + concurrent agents, sandbox CPU-seconds + concurrent sandboxes (tier-gated, exploit-proof)
- `/me/plan` now exposes agents + sandbox usage blocks
- Channel connectors: Slack (Events API webhook), email, generic webhook, voice (Ultra only)
- Tier-gated channels: Pro = webhook only, Max/Premium = + Slack + Email, Ultra = + Voice

## 3.0.56

- Interactive cloud browser sessions: `browser_session_launch`, `navigate`, `click`, `type`, `scroll`, `screenshot`, `close`, `handoff`, and `wait` MCP tools are now available automatically when you sign in with Trumbo
- Stateful browser sessions run on Trumbo Browser Run (Cloudflare) with a live CDP connection per session, keepalive pings, and human-in-the-loop Live View URLs for logins/MFA/CAPTCHA
- Concurrent-session and monthly-minute limits are enforced server-side per tier (no client bypass)
- fix: MCP tool results with image content (screenshots, PDFs) are no longer silently dropped before reaching the model; `mimeType` is now normalized to `mediaType` so the AI SDK formatter passes images through
- fix: dead browser sessions now release their concurrent slot automatically (alarm cleanup + failed-reconnect detection) so capacity never leaks
- fix: session billing settles actual browser-ms against the launch reservation (was double-counting the estimate)

## 3.0.55

- Default API and MCP traffic to `api.trumbo.dev`; browser links and device approval stay on `platform.trumbo.dev`
- chore(sdk): bump workspace packages to v0.0.57

## 3.0.54

- chore(sdk): bump workspace packages to v0.0.56
- fix: hub stop, SDK path bugs, checkpoints, and CLI runtime hardening
- fix(release): install vscode webview deps and allow confirmed SDK publish
- fix(release): unblock SDK tests and VSCode publish workflow

## 3.0.53

- Knowledge base search (`search_knowledge`) is now wired automatically when you sign in with Trumbo; no manual MCP server setup required
- Platform MCP settings refresh on sign-in, org switch, token refresh, and logout so Knowledge stays scoped to your active org

## 3.0.52

- Removed the disabled "Sign in with TrumboPass" menu entry — it was redundant with "Sign in with Trumbo" which already covers both free and TrumboPass accounts. The onboarding menu is now: Sign in with Trumbo, Sign in with ChatGPT, Bring your own provider.

## 3.0.51

- **New feature:** "Sign in with Trumbo" is now the first option on the first-start onboarding menu (alongside "Sign in with ChatGPT" and "Bring your own provider"). Uses the existing Trumbo device-code OAuth flow against `platform.trumbo.dev` — no new auth backend needed. After sign-in, routes to the featured Trumbo model picker.

## 3.0.50

- **Hotfix:** v3.0.49 had a SyntaxError (`Identifier 'result' has already been declared`) because `var result` inside the Windows block conflicted with `const result` at the end of the function due to hoisting. Renamed to `winResult`.

## 3.0.49

- **Critical fix (Windows):** characters were being dropped while typing in the TUI. The root cause was the Node.js wrapper (`bin/trumbo`) using async `spawn` to launch the compiled Bun binary — Node.js's libuv stdin handle on the shared ConPTY console was intercepting input events. Fixed by using `spawnSync` with a temporary `.cmd` intermediary, which completely blocks Node.js during the TUI session (no event loop, no stdin polling) and lets `cmd.exe` properly pass console handles to the binary. This mimics running the binary via a direct `.cmd` launcher, which works correctly.

## 3.0.48

- **Critical fix:** characters were being dropped while typing (e.g. "Hi there" showed as "hre"). The per-keystroke `sanitizeTerminalInputText` + `setText()` call in `emitContentChange` was overwriting the textarea's internal state mid-typing. Removed it — with mouse disabled on Windows, the key-level filter (`shouldBlockTerminalInputKey`) is sufficient, and pastes are already sanitized separately.

## 3.0.47

- **Critical fix:** keyboard input was broken — the input filter was too aggressive and blocked arrow keys, function keys, Delete, Home, End, and any key whose raw sequence contained an escape character. The filter now only blocks actual mouse/SGR fragments.
- Added a terminal mouse-mode reset on startup to clear stale mouse reporting from a previously crashed trumbo process.

## 3.0.46

- Fixed `trumbo update` launching duplicate parallel installs (startup auto-update no longer runs for the update command).
- Windows updates now use `npm install -g @trumbodev/cli@<version>` with postinstall scripts enabled instead of `npm update`, which was hanging or fighting over locked binaries.

## 3.0.45

- Fixed Windows PowerShell injecting garbage into the prompt when clicking anywhere in the terminal. Mouse reporting is now fully disabled on Windows (not just movement), and mangled SGR click sequences are stripped from input as a fallback.

## 3.0.44

- Fixed Windows npm install/update failures caused by locked `trumbo.exe` inside `node_modules`. Postinstall now copies the platform binary to a stable cache outside `node_modules` (`%LOCALAPPDATA%\\Trumbo\\bin` on Windows), and the `trumbo` launcher prefers that cache on every run.
- Fixed the TUI input box filling with random escape codes on Windows (e.g. `[555;56;25m`). Mouse-movement reporting is disabled on Windows, and leaked terminal control sequences are filtered before they reach the prompt.

## 3.0.41

- The CLI now connects to the deployed Trumbo web app by default. The production environment points at `https://platform.trumbo.dev` (was an unconfigured placeholder), so auth, account, billing, plan, and chat-completion endpoints hit the live backend out of the box. Override with `TRUMBO_API_BASE_URL` / `TRUMBO_APP_URL`, or run against `wrangler dev` with `TRUMBO_ENVIRONMENT=local`.
- Billing/subscription + rate-limit UX in the CLI: the welcome line, status bar, and account dialog now show your plan and 5h/daily/weekly rate-limit usage instead of credits. 429 rate-limit errors render a friendly upgrade prompt linking to the billing page. The Trumbo provider is rebranded to "Trumbo" (was "Trumbo Usage-Billing").
- Web-facing URLs (billing page, credits dashboard, TrumboPass subscription/promo links) now resolve from the active environment instead of a hardcoded placeholder, so they always match the deployed app.
- npm publish script: `--provenance` is now applied only inside GitHub Actions (Trusted Publishing), so local dry-runs don't fail on the provenance requirement. CI behavior is unchanged.

## 3.0.40

- Re-enabled CLI startup auto-update for npm/pnpm/yarn/bun global installs. On launch, Trumbo checks the npm registry for a newer `@trumbodev/cli` and installs it in the background when available. Respects `TRUMBO_NO_AUTO_UPDATE=1` and the global `autoUpdateEnabled` setting; manual `trumbo update` is unchanged.

## 3.0.39

- Fixed CLI startup from Windows drive roots (e.g. `D:\`) where `path.basename` is empty and workspace manifest validation failed with a silent TUI exit or a Zod `hint` error. Drive roots now get a fallback hint like `D:`.
- Fixed Windows npm global installs launching the compiled binary via async `spawn` (instead of `spawnSync`) so interactive mode keeps a real console TTY for OpenTUI.
- Added `bin/trumbo.cmd` in the published wrapper package as a direct platform-binary launcher on Windows.
- Made the CI Slack release notification step optional when `SLACK_RELEASE_BOT_TOKEN` is not configured.

## 3.0.38

- Renamed the published wrapper package from `trumbo` to `@trumbodev/cli`. npm blocks the unscoped name `trumbo` as too similar to the existing `turbo` package, so the install package is now `@trumbodev/cli`. The `trumbo` **command** is unchanged (it is set by the `bin` field, independent of the package name). Install with `npm install -g @trumbodev/cli`. Updated the self-update command, the binary launcher's reinstall hint, the publish script, and all install docs accordingly. Platform packages (`@trumbodev/cli-*`) are unaffected. Supersedes the unpublished 3.0.37 tag, whose wrapper publish failed with `E403 ... Package name too similar to existing package turbo`.

## 3.0.37

- Switched npm publishing from a long-lived `NPM_TOKEN` to **Trusted Publishing** (GitHub OIDC): the publish step now runs `npm publish --provenance` with `id-token: write` and no token. Requires a trusted publisher configured per package on npm (repo `xedro98/Trumbo`, workflow `.github/workflows/cli-publish.yml`). Supersedes the unpublished 3.0.36 tag, whose publish failed with a 2FA-required 403 because the supplied token was not an Automation/2FA-bypass token.

## 3.0.36

- Fixed the npm publish path and the CI "Verify build output" step to strip the new `@trumbodev/` scope when locating built platform packages in `dist/` (the previous `@trumbo/` strip left the path scoped, so the verify step could not find the `dist/cli-*` manifests and the publish step targeted the wrong directory). Supersedes the unpublished 3.0.35 tag.

## 3.0.35

- Published under the `@trumbodev` npm scope: platform binaries are now `@trumbodev/cli-*` (the `@trumbo` scope was unavailable on npm). The `trumbo` wrapper package name is unaffected.
- Includes all 3.0.34 changes: curl/PowerShell installers, self-contained publish pipeline (no SDK coupling), CI workflow fixes, and metadata corrections.

## 3.0.34

- Fixed the TrumboPass upgrade notice appearing immediately after completing onboarding.
- Improved the wording of the TrumboPass onboarding step.
- Streamlined the Trumbo provider picker by merging the subscription and usage/billing options into one and removing the credits link.
- Added standalone curl (POSIX `install.sh`) and PowerShell (`install.ps1`) installers that download the platform binary from the npm registry — no Node, Bun, or npm required.
- Documented npm/pnpm/bun/yarn/curl/PowerShell install methods in the README and DISTRIBUTION guide.
- Fixed the `cli-publish` and `sdk-publish` workflow repo guard so releases run on `xedro98/Trumbo`.
- Decoupled the `trumbo` wrapper package from the SDK packages: the published CLI is a self-contained compiled binary, so global installs no longer pull unused `@trumbo/*` packages and CLI publishing no longer requires the SDK to be published first.
- Corrected the package `repository`/`homepage`/`bugs` URLs to `xedro98/Trumbo`.

## 3.0.33

- Show a TrumboPass subscription URL as a fallback during onboarding so you can still subscribe if the subscription screen can't open automatically
- Hide the TrumboPass promo for users who already have a TrumboPass subscription
- Use an adaptive plan accent color for TrumboPass prompts so they fit the active theme

## 3.0.32

- Improved the TrumboPass onboarding experience
- Added an intermediate step before going to TrumboPass model selection
- Made the TrumboPass subscription screen selectable
- Promoted TrumboPass in the startup notice
- Used "TrumboPass" as one word consistently and refined the provider UI copy
- More accurate context compaction and clearer error messages (from SDK v0.0.54)

## 3.0.31

- Show when request cost is covered by your Trumbo subscription
- Prompt to switch to TrumboPass when you run out of credits, and list TrumboPass features in the not-subscribed message
- Added an option to open the subscription page from the TrumboPass options
- Added marketplace uninstall support and surfaced plugin-bundled skills
- Require quoted prompts for one-shot mode
- Capped MCP tool names at 64 characters for OpenAI-compatible providers
- Updated coupon code

## 3.0.30

- Added a token count to the status bar, shown alongside cost
- Added organization-specific error messages
- Added SAP AI Core provider support
- Refreshed the model catalog with the latest provider models
- Preserved OpenRouter reasoning-disable behavior and improved OpenRouter prompt caching
- Routed LiteLLM model fetches through the SDK and stopped unrelated models from appearing in the LiteLLM model list
- Updated TrumboPass models live, restored TrumboPass models in onboarding, and improved TrumboPass error messages
- Threaded proxy/CA-aware networking into the inference path
- Persisted Bedrock settings to providers.json
- Normalized JSON-like tool inputs by schema for more reliable tool calls
- Fixed an "ERROR: EMPTY CONTENT" message that could appear when an error occurred
- Fixed a packaging issue (createRequire) that could break the CLI at runtime

## 3.0.29

- Costs are now hidden for Trumbo free models
- Fixed Z.ai model metadata resolution for Z.ai models accessed through the Trumbo provider
- Reverted the model-name-only display change from v3.0.28; the model picker, selector, and status bar return to their previous display behavior

## 3.0.28

- Added a TrumboPass onboarding flow with selectable TrumboPass models, plus improved TrumboPass error handling
- Added hub primitive catalogs and refreshed the hub dashboard design with a dedicated customizations breakout
- Auto-approve toggles now apply immediately when changed
- Feature flags now resolve using your user ID on startup
- Fixed Trumbo model display names so they resolve by model name
- Truncate large tool results by default (including MCP and custom tool output) to keep requests within context budget
- Hardened parallel tool-call guidance for faster, more reliable multi-tool execution

## 3.0.27

- Added a `trumbo skill` command to install and manage skills, matching `trumbo plugin install` and `trumbo mcp` (installs default to the Trumbo agent directory)
- Added a prefilled MCP install wizard command for quicker MCP server setup
- Improved error handling and messaging when plugin MCP OAuth authorization fails
- The CLI now rejects unknown commands and unquoted multi-word input with a clear error instead of silently treating bad arguments as a prompt

## 3.0.26

- Reverted the expandable model picker sections and TrumboPass models, restoring the previous model-selection UI

## 3.0.25

- Added TrumboPass support, with selectable TrumboPass models in the model picker
- Made model picker sections expandable
- Added MCP server support to plugins, including authorizing plugin MCP OAuth during install
- Encouraged parallel tool calls for faster task execution
- Capped tool output for bash commands and file reads to keep large output within context limits
- Allowed ranged reads on large files
- Fixed apply_patch to fail when a hunk is skipped
- Fixed run_commands to return captured stdout on failure and handle split heredocs
- Fixed search tools to treat zero results as success
- Fixed disabled-reasoning handling for StepFun flash
- Fixed history resume rendering isolation
- Fixed the Hugging Face URL
- Fixed Trumbo OAuth token formatting in provider config

## 3.0.24

- Plugin commands can now submit prompts to the agent
- Added support for overriding the API base URL
- Open the verification URL automatically when starting device authentication
- Enforced a single shared Trumbo Hub, so a stale hub is respawned after an upgrade
- Suppressed flickering console windows on Windows
- Fixed truncation of structured tool operation result strings so oversized tool output stays within limits
- Stopped echoing the full command text in run_commands tool results

## 3.0.23

- Fixed Vertex AI GCP settings configuration
- Fixed the Azure Foundry API version
- Added support for configured agents as subagent tools
- Centralized OAuth management into the SDK
- Fixed an error caused by disabled reasoning on Fable 5

## 3.0.22

- Added support for the Claude Fable 5 model
- Fixed MiniMax M3 thinking controls so they route correctly across gateways

## 3.0.21

- Added a global auto-update setting that controls automatic updates on CLI startup
- Added a Trumbo credits refill link
- Fixed scrolling for inline ask-question responses
- Fixed connector thread session routing and stale hub session handling
- Added support for Vertex AI Application Default Credentials (ADC) with tool use
- Fixed empty message content replay for Bedrock
- Cleaned up the OpenAI Codex model list

## 3.0.20

- Installed plugin wrappers are now named from their source (npm package name, git repo, remote filename, official slug, or local directory) instead of an opaque hash, making installed plugins easier to identify.

## 3.0.19

- Fixed CLI auto-update to use `npm update` so updates apply reliably, while preserving the installed release channel (e.g. nightly).

## 3.0.18

- Fix Slack channel mentions so replies post in the original message's thread.
- Fix the abort indicator to clear immediately when a task is cancelled.
- Sync the Fireworks AI model registry and refresh the bundled model catalog with current platform offerings.
- Bump the bundled SDK to v0.0.43, which forces a running Trumbo Hub to restart so it picks up the latest SDK code.

## 3.0.17

- Fix a regression introduced in 3.0.15 where the interactive CLI could get stuck after stopping and restarting Trumbo Hub and then pressing Escape to cancel a request. The CLI now detects stale or missing sessions, recovers any pending messages, and starts a fresh session instead of failing with "session not found".
- Fix Ctrl+C and Hub shutdown races that surfaced as "hook dispatch failed" and WebSocket connection errors from late hook events racing against Hub shutdown.
- Fix the Hub daemon being shut down prematurely when a runtime request was aborted, so the daemon now stays alive.
- Improve the Telegram connector with a new `--allowed-user-id` flag to restrict which Telegram users are authorized to interact with the agent.

## 3.0.16

- Install official Trumbo plugins by slug off the new github.com/trumbo/plugins collection.
- Uninstall plugins using `trumbo plugin uninstall <plugin>` or in the TUI.
- Plugins can now bundle skills, and plugin skills are grouped together in settings.
- Add Slack socket mode support.
- Allow a custom base URL for Anthropic vendor-type providers.
- Fix OAuth token migration for users signed in through the old extension.
- Use a union schema for read-files tool input validation.
- Add a `TRUMBO_PLUGIN_IMPORT_TIMEOUT_MS` env override to control the plugin import timeout.

## 3.0.15

- Add Trumbo Hub, a web app for monitoring connected clients, viewing and driving sessions, streaming assistant output, and restarting the local hub, with local, LAN, and tunnel usage gated by a room secret.
- Support global AGENTS rules so agent rules can be applied across all sessions, not just per-project.
- Let plugins contribute static or dynamic rule content when installed in the sandbox.
- Bind Discord sessions to individual message authors so different Discord users no longer share chat state in a thread.
- Support participant mute targets in Discord: resolve `/mute` and `/unmute` from user mentions or raw user IDs to mute a specific participant in a thread.
- Make OAuth URLs clickable in the TUI.
- Refresh the bundled model catalog, adding Claude Opus 4.8, Moonshot Kimi K2.6, and Qwen3.7 Max (with cache support).
- Discover SDK skill directories that are symlinked, including handling circular symlinks.
- Steer active connector sessions across turn keys by matching on session ID, so replies continue the existing session instead of starting a duplicate.
- Stop the Discord connector after repeated identical errors (per thread, within a time window) to prevent error messages from flooding a channel.
- Fix Discord connector registration and reply fallback handling.
- Fix SAP AI Core to use the AI SDK community provider.
- Log ACP output as diagnostics instead of errors so normal output no longer appears as errors.

## 3.0.14

- Fix OTEL telemetry variable bundling so telemetry is correctly enabled in compiled CLI builds: guard against environments where `process.env` is undefined and remove optional chaining so bundlers can inline the values at build time.

## 3.0.13

- Show a loading dialog while resuming a session from history so the TUI no longer appears frozen during the load.
- Speed up the `/clear` command by deferring new session creation until you send the next prompt, so clearing no longer blocks on spinning up an empty session.

## 3.0.12

- Show a loading dialog while the config screen switches provider or model so the transition no longer looks frozen.
- Render the ask question tool prompt inline with the conversation so the question and suggested answers stay attached to the assistant turn that asked them, instead of appearing in a separate modal.
- Allow manual `trumbo update` runs to install the latest published version immediately, bypassing the release age gate that delays automatic updates.
- Refresh the bundled SDK to 0.0.42, updating the model catalog.

## 3.0.11

- Fix a regression in the ChatGPT OAuth provider where requests failed with `max_output_tokens not supported`, by restoring the full output token budget instead of applying an implicit cap.
- Hide the `Space toggle` hint in the config footer when the highlighted row is not toggleable (rules, agents, hooks).
- Authenticate Vertex Gemini through Google auth when `gcp.projectId` is configured, and surface the full Vertex model list instead of only Claude models.
- Include tool names in tool result content blocks so message logs and session history consistently track which tool produced each result.

## 3.0.10

- Install plugins from `file://` URLs in addition to npm and git sources.
- Show Ollama API key note in TUI settings so users know when to provide an API key.
- Keep interactive sessions alive when idle or awaiting approval instead of treating them as ended, and stop reading message files for every session when `hydrate: false`.
- Add Poolside as a provider.
- Add Gemini 3.5 Flash to the Gemini provider model list.
- Auto-detect Telegram bot username from the bot token so the Telegram connector no longer requires it to be configured separately.
- Notify connectors when a scheduled execution fails, not just when it succeeds.
- Bake OTEL telemetry variables into the CLI at build time so telemetry works in nightly and production builds.
- Preserve model output token limits from the SDK model catalog so context window math matches the upstream provider.
- Soften the visual treatment of rejected tool calls in the TUI.
- Hide the skills tool from the system prompt when skills are disabled, and refresh slash commands after toggling a skill.
- Restore AWS Bedrock profile-based auth during legacy config migration so profiles set via `awsAuthentication: "profile"` are preserved without `awsUseProfile`.
- Cache global settings reads keyed by file mtime so repeated reads skip the JSON parse and zod validation on the hot path.

## 3.0.9

- Speed up CLI startup with plugins by loading sandboxed plugins concurrently and caching plugin tool descriptors per plugin, provider, and model.
- Speed up plugin and tool config toggles by updating the TUI optimistically and persisting changes without reloading the full config or reimporting plugins.
- Restore fuzzy ranking for the @-mention file picker so the most relevant files appear first.
- Keep the interactive CLI session alive after cancelling a task instead of tearing the session down.
- Accept dash-prefixed prompts when passed after `--`, so prompts starting with `-` are no longer parsed as flags.
- Recover from hub abort cleanup failures so a cancel that hits an error no longer crashes the runtime host.
- Route GLM thinking through provider metadata so thinking-enabled GLM models behave correctly through the gateway.

## 3.0.8

- Use Telegram numeric participant ids so renamed users stay linked to the same participant in the Telegram connector.
- Keep failed plugins visible in the config UI with their load/setup phase and error details so broken plugin definitions are easier to diagnose.
- Move the Create Session Fork shortcut from Opt+F to Opt+R so terminal word-right navigation works again.
- Fix AWS Bedrock region and profile detection in the CLI onboarding, and surface bearer-token and additional Bedrock config fields in the provider config screens.
- Fix inflated token usage counts caused by AgentRuntime.execute() not resetting usage between calls, which the local runtime host was then double-counting on top of the session baseline.

## 3.0.7

- Skip the ChatGPT OAuth model refresh on session startup so the CLI launches without the extra network round-trip.
- Align the ChatGPT OAuth model catalog with the Codex provider list so the available models match the subscription tier.

## 3.0.6

- Fix ChatGPT provider model list to include the codex variants and the gpt-5.2, gpt-5.4, and gpt-5.4-mini subscription models.

## 3.0.5

- Show plugin-provided tools and slash commands in the CLI settings dialog by hydrating them through the sandbox.
- Preserve hydrated plugin tools and config reload options when toggling settings, so they no longer disappear after a toggle.

## 3.0.4

- Improve light theme TUI colors so chat, status bar, tool output, and syntax highlighting render with better contrast on light terminals.
- Fix plugin tools failing in the production npm build by bundling the SDK deps plugins import at runtime.

## 3.0.3

- Add `--worktree` flag that auto-creates a fresh git worktree under `~/.trumbo/worktrees/` and runs the task there. Works with `--taskId` and `--continue` so you can resume a task in an isolated worktree to try a different approach.
- Show session status in the CLI history view and refresh status rows in place while the standalone history TUI is open.
- Restore the OpenAI compatible provider in the auth flow and preserve stored model metadata when configuring or migrating OpenAI-compatible providers.
- Fix dropped macOS screenshots when pasting them into the TUI or asking the agent to read them: paths containing U+202F (narrow no-break space) and other Unicode variants now resolve to the real file instead of failing with ENOENT.
- Accept bearer token auth for AWS Bedrock and map AWS profiles correctly when configuring the Bedrock gateway.
- Honor `--thinking none` for Ollama models that ship with reasoning enabled by default.
- Recover from detached hub event errors instead of crashing the session.
- Refine the shared system prompt with clearer guidance on tool output formatting, unsupported file reads, long-running shell commands, and final verification before completing a task.

## 3.0.2

- Fix token count display showing inflated numbers in the TUI.

## 3.0.1

- Fix CLI release cleanup scripts so they work correctly on Windows.
- Fix the kanban migration notice wording in the TUI.

## 3.0.0

Introducing our new Trumbo CLI built on our new SDK and comes with a snappy new TUI.

Install:

```sh
npm install -g trumbo
```

For nightly builds:

```sh
npm install -g trumbo@nightly
```

## 0.0.13

- Detect prompt-cache support from cache write pricing so providers with write-only caching are represented correctly in the model catalog
- Dual-publish `@trumbobot/cli` mirror wrapper so existing users who installed via `npm i -g @trumbobot/cli` continue receiving updates
- Fix response truncation for OpenAI Codex model responses

## 0.0.12

- Fix markdown rendering in the published binary: headers, inline code, blockquotes, bold, italic, and lists now render with proper syntax highlighting (tables were the only element working before)
- Add keyboard shortcuts for scrolling through the chat transcript (Page Up/Down, Home/End)
- Preserve typed input when selecting slash command skills instead of clearing the prompt
- Fix `--thinking none` being ignored when persisted reasoning settings existed, which caused DeepSeek API errors
- Fix terminal cleanup on exit so the summary prints cleanly
- Fix onboarding provider model resolution
- Hide ChatGPT subscription provider usage costs
- Handle file index prewarm timeouts gracefully instead of hanging

## 0.0.11

- Add `/skills` slash command for browsing and toggling available skills interactively
- System prompts from AI SDK are now passed via the dedicated `system` option instead of being embedded in message history
- Context compaction can now be triggered manually and runs more reliably
- Disable the search tool in yolo mode so the model uses bash for searching instead
- Fix `submit_and_exit` completion policy not being wired through to the runtime
- Fix resumed sessions losing tool results when an abort interrupted tool execution mid-turn
- Fix interactive sessions becoming unusable after aborting a running turn
- Fix strict JSON schema mode rejecting valid tool schemas with unions, optional fields, and nullable types
- Fix stray log output appearing over the TUI when the log file fallback wrote directly to the stderr file descriptor, bypassing the TUI's stdio capture
- Refresh the built-in model catalog with the latest available models and pricing

## 0.0.10

- Improve local provider onboarding: setting up Ollama, LM Studio, or other local providers now prompts for the endpoint URL directly, supports typing a model ID manually when the provider returns no models, and correctly discovers models from your saved endpoint
- Ctrl+C no longer cancels a running turn -- it now clears the input field or exits the CLI, matching standard terminal behavior. Use Escape to cancel a running turn instead
- Thinking level chosen in the model picker now persists across CLI restarts instead of resetting to off
- The context bar now shows visible progress as tokens are used, instead of appearing empty on some terminal themes
- The status bar token count now shows actual context window usage instead of over-counting across multiple model calls in a turn
- Resuming a saved session now correctly displays the accumulated cost
- Sessions are now saved to disk after each assistant response, so conversation progress survives crashes or unexpected exits
- Auto-compaction now runs inline during model requests, keeping long conversations within the context window automatically
- The home screen robot now follows the cursor while you type
- Hub websocket connections now automatically reconnect after going idle, so sessions no longer silently lose their connection to the hub daemon
- MCP stdio servers on Windows no longer spawn visible console windows
- Tool input schemas containing `allOf` clauses are now handled correctly instead of being rejected
- Login now uses device auth exclusively
- Fix chat input and chat view text losing its indent on wrapped lines

## 0.0.9

- Fix stray text appearing over the TUI when background operations (like hub restart messages) write directly to stdout/stderr during interactive sessions
- Fix hub connection recovery: when a newer CLI instance restarts the shared hub daemon, already-running CLI sessions now automatically reconnect to the new hub endpoint instead of failing with transport errors

## 0.0.8

- Fix crash when pressing Escape to cancel a running turn
- Add plugin and SDK tool toggles to the settings panel
- Add `@trumbo/sdk` as a user-facing alias for `@trumbo/core`
- Improve hub recovery with better error handling, logging, and recovery timeouts
- Show session summary (ID, model, cost, resume command) on exit
- Fix OAuth browser-launch failure
- Fix compact no-op being reported indistinctly
- Fix CLI history resume being non-transactional (could leave blank UI or corrupt session on disk)
- Fix cross-client session history not loading Code/VS Code sessions, and fix interactive turn status showing stale state
- Fix configuration file paths for hooks and rules (now resolve from `~/.trumbo/hooks` and `~/.trumbo/rules`)
- Fix Telegram connector: honor `--no-tools` flag, lock tool-disabled mode across state changes, post replies as raw text to avoid markdown parse failures, add `/help` and `/start` commands
- Clean up CLI program description and compact slash command descriptions
- Clean up CLI flags

## 0.0.7

- Fix graceful recovery when the model returns malformed tool call inputs, preventing crashes mid-conversation
- Add settings toggles for core skills (enable/disable individual skills from the settings panel)
- Secure the local hub daemon with a discovery auth token, preventing unauthorized local access
- Fix auto-approve tool policies being incorrectly reset after session restore
- Fix npm wrapper detection for auto updates, so self-update works when the CLI is invoked through npm/npx shims
- Improve fork session UX with clearer prompts and smoother flow
- Fix manual thinking budget not being applied when using Anthropic models directly
- Improve account onboarding flow with better error messages and step sequencing
- Add enable/disable controls for individual tools and plugins
- Fix abort handling so the public run promise resolves correctly when a run is cancelled
- Fix markdown token styling in chat output
- Fix chat auto-scrolling to bottom on message submit
- Fix hub tool capabilities being routed to the wrong session
- Revert loading extension-created sessions from history (was causing issues)

## 0.0.6

- Add checkpoint restore: press Esc twice or type `/undo` to rewind to a previous checkpoint, with options to restore chat only or chat + workspace
- Fix clipboard: fall back to system clipboard (pbcopy, PowerShell, wl-copy, xclip) when OSC 52 fails, fixing copy for longer text selections
- Fix prompt focus: restore focus to the prompt input after dialogs close, preventing the input from becoming unresponsive after using `/settings`

## 0.0.5

- The input field has been completely redesigned -- the old bordered box is replaced with a clean chevron-prompt style that adapts its background color to any terminal theme using perceptual OKLAB color math. Light terminals are fully supported now.
- Pasting 5+ lines into the input shows a compact preview marker instead of flooding the textarea. The full content is still submitted.
- Arrow-key history navigation respects cursor position so you don't lose your place when scrolling through previous prompts.
- The TUI renders immediately instead of blocking while the hub daemon boots. Hub readiness and session hydration happen in the background.
- Listing previous sessions no longer hydrates every full session, making `trumbo history` and the history picker snappy even with hundreds of sessions.
- Updating the CLI no longer leaves you connected to a stale hub daemon. Incompatible versions are detected and replaced automatically, eliminating the "Unsupported hub schedule command" class of errors.
- Schedules can now trigger on external events (webhooks, GitHub events, plugin-emitted signals) in addition to cron intervals, with deduplication, filtering, and retry policies.
- Plugins can register automation event types that feed into the scheduling system, enabling custom triggers from any source.
- Resuming a session automatically picks up any in-flight team runs without needing to remember or pass `--team-name`.
- `providers.json` (which stores API keys and OAuth tokens) is now written with 0600 permissions, preventing other processes on the machine from reading it.
- Models that emit `command` or `cmd` instead of `commands` (or `paths` instead of `path`) no longer fail. Common aliases are normalized before execution.

## 0.0.4

- Fix compiled binary spawning infinite hub daemon recursion loop

## 0.0.3

- Rewritten TUI from Ink to OpenTUI with streaming markdown, syntax-highlighted diffs, scrollable chat, and mouse support
- Dialog system for model picker, tool approval, settings browser, session history, and onboarding
- Interactive setup wizards: `trumbo connect`, `trumbo schedule`, `trumbo mcp`
- Plan/Act mode toggle with system prompt and tool rebuilding on switch
- Input autocomplete for slash commands and file mentions
- Message queuing and steer messages during running turns
- Platform-specific compiled binaries for macOS, Linux, and Windows (arm64 and x64)
- npm trusted publishing via GitHub Actions OIDC
