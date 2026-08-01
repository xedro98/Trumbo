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

## [v3.8.0 / v0.0.33 / SDK v0.0.62] — 2026-08-01

Subscription spend controls, a server-backed free model tier, per-server MCP
timeouts, and new SDK session APIs.

### Added
- **Subscription spend caps**: plans can carry a monthly USD budget, enforced on
  the inference gateway before the upstream call — blocked requests return
  `SPEND_LIMIT_EXCEEDED` (429) with spend/limit/reset; the VS Code
  "Request Increase" card now persists a budget-increase request instead of
  failing; admins can set a per-plan budget.
- **Free model tier**: the hosted recommended-models endpoint now serves the
  `free` bucket, so the Free tier in the model pickers (VS Code, CLI, desktop)
  is populated from the platform — not just the offline fallback.
- **Buy credits (usage-based)**: secondary "Buy credits" actions in the VS Code
  plan-limit card + Account view, the CLI account dialog, and the desktop
  Subscription settings panel.
- **Per-server MCP timeouts**: the core MCP client honors each server's
  `timeout` (seconds) for initialize / tools/list / tools/call, matching the
  VS Code config; timeout-only config edits apply live without reconnecting.
- **SDK session APIs**: `TrumboCore.readLiveMessages()` (a resident session's
  in-memory transcript with persisted fallback) and `TrumboCore.forkSession()`
  (a new session seeded from a source's live transcript with fork lineage
  metadata).
- **Stdin-based shell scripting**: `getShellInvocation()` pipes scripts via
  stdin for PowerShell/bash so command text never traverses the OS argv; the
  bash executor uses it.

### Fixed
- SDK billing/subscription handoff URLs now point at `/billing` (were stale
  `/dashboard/...`).

### Platform
- New `POST /api/v1/users/me/budget/request` endpoint; spend-limit enforcement
  in `routes/chat.ts`; D1 migration 0065 (`budget_cents`/`budget_period` +
  `budget_increase_requests`).

## [v3.7.0 / v0.3.1 / SDK v0.0.62] — 2026-07-26

Trumbo Agent Apps + Trumbo Database — Vercel-like app deployment and managed
SQL/KV/R2/Vectorize on the Trumbo edge, sold as Agentic Cloud SKUs.

### Added
- **Agent Apps**: deploy static sites, Workers, and framework apps (Next/Remix/Astro/Vite) to `*.apps.trumbo.dev` with production + preview URLs, env vars/secrets, custom domains (Cloudflare for SaaS), per-app rate limits, deploy history + rollback, and a git webhook receiver that builds previews on push/PR.
- **Trumbo Database** (DBaaS): provision SQL (D1), KV, R2, Vectorize, Analytics, Hyperdrive, and Edge Config instances; migrations, backups + restore, branches, and app bindings.
- **MCP tools** (15): `app_*` and `database_*` agent tools on `api.trumbo.dev/v1/mcp`.
- **Platform UI**: `/apps` and `/databases` pages (stats + list + create).
- **CLI**: `trumbo apps` and `trumbo db` command groups.
- **Docs**: `book/platform/apps.mdx` + `book/platform/database.mdx`.

### Notes
- Platform Worker deployed to `api.trumbo.dev` / `platform.trumbo.dev`; D1 migrations 0060–0063 applied.
- Runtime prerequisites (CF API token secrets, Workers for Platforms entitlement, R2/queue bindings) are required for the CF-dependent paths; see deployment runbook.

## [v3.6.0 / v0.3.0 / SDK v0.0.60] — 2026-07-25

Security fixes, TUI upgrade, new providers, agent runtime improvements,
VS Code polish, and more. See `engine/CHANGELOG.md`,
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
