# Trumbo CLI

The Trumbo terminal agent — a fast, flicker-free native TUI (Rust) for plans,
subagents, and parallel work. Install once, run `trumbo` on macOS, Linux, and
Windows.

**[Homepage](https://trumbo.dev)** | **[Docs](https://docs.trumbo.dev)**

## Install

```bash
npm install -g @trumbodev/cli
```

The package installs prebuilt native binaries for your platform
(`optionalDependencies`) — no Rust toolchain needed:

```bash
trumbo --version
```

## Get Started

```bash
# Launch the interactive TUI
trumbo

# Run a single task headlessly
trumbo -p "Explain this codebase"
```

On first launch, Trumbo opens your browser to authenticate (device flow). For CI
or headless environments set `TRUMBO_TOKEN` (or the legacy `XAI_API_KEY`).

## Update

```bash
trumbo update
```

Or re-install the latest via npm:

```bash
npm install -g @trumbodev/cli@latest
```

## Supported Platforms

| Platform  | Architecture           |
|-----------|------------------------|
| macOS     | Apple Silicon (arm64)  |
| Linux     | x86_64, arm64           |
| Windows   | x86_64                  |

## Auth / provider

- Default API base: `https://api.trumbo.dev/api/v1` (`TRUMBO_API_BASE_URL` overrides)
- Models: `quartz-1.0` (default), `quartz-1.0-lite`, `quartz-1.0-hyper`
- `trumbo login` — device-code auth; `trumbo trumbo` — auth + subscription status

## Documentation

Full docs (configuration, MCP servers, models, headless `agent` mode, plugins,
sessions, worktrees): see the [Trumbo docs](https://docs.trumbo.dev).
