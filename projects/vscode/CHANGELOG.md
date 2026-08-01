# Changelog

All notable changes to the Trumbo VS Code extension are documented here.

## [0.0.33] - 2026-08-01

Subscription UX parity (ClinePass-style) + core engine MCP timeout support.

### Added
- **Buy credits (usage-based)** secondary action in the plan-limit error card
  and the Account view — the prepaid-credits top-up path alongside plan upgrade.
- Bundles SDK 0.0.62: per-server MCP `timeout` is now honored by the core
  engine client for initialize / tools/list / tools/call within this extension,
  matching the UI's Request Timeout setting.

### Fixed
- The free-model tier stays populated from the hosted catalog (server-side
  `free` bucket) so the picker's Free tab reflects platform availability.

## [0.3.2] - 2026-07-30

Desktop app folded into the Trumbo monorepo. Version bump to stay in sync with the CLI 3.7.1 release.

## [0.3.1] - 2026-07-26

Companion release for the Trumbo Agent Apps + Trumbo Database platform launch. No extension behavior changes; version bump only.

## [0.3.0] - 2026-07-25

Compaction progress, terminal lifecycle, edit preview focus, Windows shell fix, and PWR batch stickiness.

### Added
- Compaction progress messages in the webview during the summarizer LLM call and transcript rebuild ("Compacting conversation...", "Applying compacted transcript...")
- `reclaimUnobservedTerminals()` disposes fallback terminals that lost tracking via `no_shell_integration` but were never disposed
- Git Bash detection in the Windows shell resolver (`getWindowsShellFromVSCode`) so Git Bash profiles resolve correctly
- Shell-mismatch warning log in `VscodeTerminalManager` when a terminal's effective shell differs from the configured profile
- "Proceed While Running" is now sticky to the command batch: clicking PWR on one command in a `run_commands` call applies to all sibling commands (shared ref via WeakMap keyed by `AgentToolContext`)

### Fixed
- Edit preview (`DiffEditRow`) now uses stable index-based keys for diff lines so streaming updates preserve keyboard focus instead of unmounting/remounting lines
- Windows shell mismatch: terminals with a different shell than the configured profile are now logged with a warning instead of silently skipped

### Changed
- SDK dependency bumped to `@trumbodev/core@0.0.60` (agentic compaction default, `withRetry`, `TrumboInsufficientCreditsError`, DNS retry, constrained sampling, and all other SDK 0.0.60 features)

## [0.1.3] - 2026-07-09

- Default production API and MCP to `api.trumbo.dev`; platform dashboard links remain on `platform.trumbo.dev`
- Treat `api.trumbo.dev` as the hosted production API in chat and config

## [0.1.0] - 2026-07-07

Initial public release.

- Trumbo Agent chat in the right secondary sidebar, with editor tab and left sidebar options
- Platform sign-in against `platform.trumbo.dev`
- Plan/Act modes, MCP tools, diff review, checkpoints, and terminal command execution
- Branded Trumbo UI with updated logo, settings, and account flows
