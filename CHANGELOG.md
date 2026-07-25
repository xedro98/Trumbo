<div align="center">
<pre>
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
</pre>
</div>

# Trumbo Changelog

All notable changes to the Trumbo monorepo are recorded here. This file was
restarted from scratch for the Trumbo brand — earlier history is not carried
over.

## [v3.6.0 / v0.3.0 / SDK v0.0.60] — 2026-07-25

Full parity roadmap: 47 work items across security, TUI, SDK runtime, provider
matrix, VS Code polish, and release. See `engine/CHANGELOG.md`,
`projects/console/CHANGELOG.md`, and `projects/vscode/CHANGELOG.md` for the
complete per-package details.

### Highlights
- **opentui 0.1.102 → 0.4.3** TUI framework upgrade (zero breaking changes)
- **Agentic compaction** is now the default strategy
- **4 CVE dep bumps**: axios 1.18.0, js-yaml 4.3.0, mermaid 11.16.0, protobufjs 7.6.5
- **New providers**: llama.cpp, Qwen Token Plan, OpenRouter OAuth, xAI OAuth + SuperGrok
- **New models**: Kimi K3, Kimi K3 Code, SuperGrok, SuperGrok Reasoning
- **Agent runtime**: `withRetry` helper, UUIDv7, AgentHarness (`injectMessage`), early-EOF detection, abortable retries, bash session metadata, `bash_execution_update` events, `get_available_thinking_levels` RPC, no-cache-write compaction
- **Provider quality**: DNS retry wrapper, Anthropic bearer token, constrained sampling, deferred Kimi tools, bracketed scoped model ids, deferred catalog refresh, HF llama search, llama download progress, native extension providers
- **VS Code**: compaction progress in webview, reclaim unobserved terminals, edit preview focus preservation, Windows shell mismatch fix + Git Bash detection, PWR sticky to command batch
- **CLI**: `trumbo hub status` includes version numbers, `TrumboInsufficientCreditsError` for 402 credit errors, BOM frontmatter fix

## [Unreleased]

### Added
- Trumbo brand: renamed packages, CLI binary (`trumbo`), config directory
  (`~/.trumbo`), environment variables (`TRUMBO_*`), and a new TRUMBO banner.
- Restructured monorepo layout: `sdk/` → `engine/`, `apps/` → `projects/`
  (`cli` → `console`, `examples` → `samples`, `hub`), `docs/` → `book/`,
  `evals/` → `bench/`.

### Fixed
- CLI BYOK provider routing now persists across restarts. A fresh run no longer
  pins a default provider before onboarding, and the deprecated OAuth pass
  options are hidden from the onboarding menu.
