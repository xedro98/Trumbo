# Trumbo CLI Changelog

## 3.9.0 — 2026-08-10

First npm release of the **native Rust Trumbo CLI** (`@trumbodev/cli`) —
a fast, flicker-free terminal agent for Windows, macOS, and Linux.

### Added
- **Interactive TUI**: full-screen terminal UI with plans, subagents, and
  parallel work; shows the ASCII Trumbo mark on every console host.
- **Headless agent**: `trumbo agent` (stdio / leader / serve) for scripting and
  CI; `trumbo -p "<task>"` one-shot runs.
- **Auth & subscription**: `trumbo login` (device-code OAuth), `trumbo trumbo`
  (auth + subscription/rate-limit status), `trumbo logout`. Token stored in the
  standard config; `TRUMBO_TOKEN` / `XAI_API_KEY` env fallbacks.
- **Models**: `quartz-1.0` (default, 256k), `quartz-1.0-lite` (128k),
  `quartz-1.0-hyper` (1M) via `trumbo models`.
- **Extensibility**: `trumbo mcp`, `trumbo plugin`, `trumbo memory`,
  `trumbo sessions`, `trumbo worktree`, `trumbo completions`.
- **Operations**: `trumbo doctor`, `trumbo update`, `trumbo version`,
  `trumbo inspect`, `trumbo du`, `trumbo leader`, `trumbo share`/`export`,
  `trumbo trace`.
- **Distributed via npm**: `npm install -g @trumbodev/cli` installs prebuilt
  binaries for macOS (arm64/x64), Linux (x64/arm64), and Windows (x64).

### Known limitations
- Platform-only subcommands (`apps`, `databases`, `program`, `schedule`,
  `security`, `team`, `skill`, `kanban`, `hook`, `history`, `connect`) are not
  yet ported to the native CLI; they remain available in the sandboxed web
  console / source CLI.
- The binary's internal user-data home remains `~/.grok` (the upstream grok
  layout) while `GROK_HOME` env is respected; a rename to `~/.trumbo` is
  planned as a follow-up.
