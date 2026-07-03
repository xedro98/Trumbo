```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo CLI

Run Trumbo in your terminal — an interactive chat for paired sessions, or a fully headless mode for CI/CD and scripting. The CLI shares its agent core with the [Trumbo SDK](https://github.com/xedro98/trembo/tree/main/sdk), so Plan/Act modes, MCP servers, checkpoints, rules, skills, and provider configuration all behave the same across surfaces.

[Docs](https://github.com/xedro98/trembo) • [Issues](https://github.com/xedro98/trembo/issues) • [Discussions](https://github.com/xedro98/trembo/discussions)

## Install

Trumbo ships as a self-contained compiled binary — no Node, Bun, or npm runtime is required to run it. Pick whichever method you prefer.

### npm / pnpm / bun

```sh
npm install -g @trumbodev/cli      # npm
pnpm add -g @trumbodev/cli         # pnpm
bun add -g @trumbodev/cli          # bun
yarn global add @trumbodev/cli     # yarn
```

The `@trumbodev/cli` package resolves the correct binary for your platform via `optionalDependencies`, so only your platform's variant is downloaded. Platform binaries are published for macOS, Linux, and Windows on `arm64` and `x64`.

### curl (macOS / Linux)

No package manager required — downloads the binary straight from the npm registry:

```sh
curl -fsSL https://raw.githubusercontent.com/xedro98/trembo/main/projects/console/script/install.sh | sh
```

Installs to `~/.trumbo/bin/trumbo` and prints PATH instructions. Override the destination or version:

```sh
curl -fsSL https://raw.githubusercontent.com/xedro98/trembo/main/projects/console/script/install.sh | sh -s -- --install-dir /usr/local/bin --version 3.0.34
```

### PowerShell (Windows)

```powershell
irm https://raw.githubusercontent.com/xedro98/trembo/main/projects/console/script/install.ps1 | iex
```

Installs to `%USERPROFILE%\.trumbo\bin\trumbo.exe` and adds it to your user PATH. Open a new terminal afterwards.

### Verify

```sh
trumbo --version
```

## Quick start

```sh
trumbo                                  # interactive TUI
trumbo "Audit this package and propose fixes"   # one-shot prompt
cat file.txt | trumbo "Summarize this"           # pipe input
```

See `trumbo --help` for the full flag reference.

## Use any provider

Trumbo is bring-your-own-key. Bring an API key from Anthropic, OpenAI, Google Gemini, OpenRouter, AWS Bedrock, GCP Vertex, Cerebras, Groq, or any OpenAI-compatible endpoint (including Ollama and LM Studio for local models).

```sh
trumbo auth --provider anthropic --apikey sk-... --modelid claude-sonnet-4-6
trumbo auth --provider openai-native --apikey sk-... --modelid gpt-5
trumbo auth --provider openai-compatible --apikey sk-... --baseurl https://api.example.com/v1
```

`trumbo auth` without a provider opens an interactive setup TUI. Hosted Trumbo account sign-in is disabled in this build; use your own provider keys.

## Modes

- **Interactive TUI** — `trumbo` or `trumbo -i`: full terminal UI with Plan/Act toggle, slash commands, file mentions, and live tool approvals.
- **One-shot** — `trumbo "your prompt"`: runs a single turn and exits.
- **JSON** — `trumbo --json "..."`: streams NDJSON events for piping into other tools.
- **Yolo** — `trumbo --yolo "..."`: skips approval prompts and exits when the turn finishes.
- **Zen** — `trumbo --zen "..."`: dispatches the task to the background hub daemon and exits immediately.

## Headless mode for CI/CD

```sh
trumbo --yolo "Run tests and fix any failures"
git diff origin/main | trumbo "Review these changes for issues"
trumbo --json "List all TODO comments" | jq -r 'select(.type == "agent_event" and .event.text) | .event.text'
```

## Features

- Streaming TUI built on [OpenTUI](https://github.com/sst/opentui) with markdown rendering, syntax-highlighted diffs, scrollable chat, and mouse support
- Plan/Act mode toggle
- Native MCP support for custom tools
- Checkpoints with `/undo` to rewind workspace state
- Sub-agent spawning and agent teams for parallel work
- Configurable thinking budgets per run
- Cron and event-driven schedules for recurring agent work
- Chat connectors for Telegram, Slack, Google Chat, WhatsApp, and Linear

## Usage

```sh
trumbo                                          # interactive mode
trumbo "Audit this package and propose fixes"   # one-shot
trumbo -i "Let's work on this together."        # interactive + starting prompt
trumbo -i -s "You are a pirate" "Tell me about the sea"   # custom system prompt
trumbo --auto-approve false "Inspect and modify this repo"  # require approval
trumbo --yolo --retries 5 "Refactor this package"           # yolo + retry limit
trumbo --retries 5 "Fix failing tests"                      # override mistake limit
trumbo --team-name my-team "Plan and implement the checklist"  # team workflow
trumbo -v "Explain quantum computing"           # verbose stats
trumbo -P openrouter -m google/gemini-3-pro -k sk-... "Set up a storybook"
trumbo -m anthropic/claude-opus-4-6 "Explain string theory"
trumbo --json "Summarize this repository"       # NDJSON output
```

### MCP servers

```sh
trumbo mcp                       # interactive wizard
trumbo mcp install fs -- npx -y @modelcontextprotocol/server-filesystem /tmp
trumbo mcp install ctx7 --transport http https://mcp.context7.com/mcp
trumbo mcp install events --transport sse https://example.com/sse
```

`mcp install` opens the wizard pre-filled; it requires a TTY. `mcp add` is an alias.

### Connectors

Bridge a chat surface into RPC-backed Trumbo sessions. Each conversation thread maps to a session with full context.

```sh
trumbo connect telegram -k 123456:ABCDEF...
trumbo connect slack --bot-token $SLACK_BOT_TOKEN --signing-secret $SLACK_SIGNING_SECRET --base-url https://your-domain.com
trumbo connect slack --bot-token $SLACK_BOT_TOKEN --app-token $SLACK_APP_TOKEN   # socket mode
trumbo connect gchat --base-url https://your-domain.com
trumbo connect whatsapp --base-url https://your-domain.com
trumbo connect linear --api-key $LINEAR_API_KEY --base-url https://your-domain.com
trumbo connect --stop            # stop all bridges + their sessions
trumbo connect --stop telegram   # stop one
```

In-chat slash commands: `/help`, `/start`, `/new`, `/clear`, `/whereami`, `/tools`, `/yolo`, `/cwd <path>`, `/schedule`, `/abort`, `/exit`. Run `trumbo connect <adapter> --help` for the full flag list.

### Schedules

```sh
trumbo schedule create "Daily code review" \
  --cron "0 9 * * MON-FRI" \
  --prompt "Review PRs opened yesterday and summarize issues." \
  --workspace /path/to/repo \
  --provider anthropic \
  --model anthropic/claude-sonnet-4-6 \
  --timeout 3600 \
  --tags automation,review

trumbo schedule list
trumbo schedule get <schedule-id>
trumbo schedule trigger <schedule-id>
trumbo schedule history <schedule-id> --limit 20
trumbo schedule export <schedule-id> > daily-review.yaml
trumbo schedule import ./daily-review.yaml
```

Schedules can route results back to chat surfaces with `--delivery-adapter`, `--delivery-bot`, and `--delivery-thread`.

## Options

| Flag | Description |
|------|-------------|
| `-s, --system <prompt>` | Override the system prompt |
| `-P, --provider <id>` | Provider id |
| `-m, --model <id>` | Model id (default: `anthropic/claude-sonnet-4.6`) |
| `-k, --key <api-key>` | API key override for this run |
| `-p, --plan` | Run in plan mode (default is act mode) |
| `-i, --tui` | Interactive TUI multi-turn mode |
| `-t, --timeout <seconds>` | Optional run timeout in seconds |
| `-c, --cwd <path>` | Working directory for tools |
| `--config <path>` | Configuration directory (CLI home resolution) |
| `--hooks-dir <path>` | Additional hooks directory for runtime hook injection |
| `--acp` | ACP (Agent Client Protocol) mode |
| `--thinking [none\|low\|medium\|high\|xhigh]` | Model thinking level. Defaults to `medium` when the flag is provided without a level; off when omitted. |
| `--compaction <agentic\|basic\|off>` | Context compaction mode (default: `basic`). |
| `--retries <count>` | Max consecutive mistakes before halting (default: `3`) |
| `--json` | Output NDJSON instead of styled text |
| `--data-dir <path>` | Use isolated local state at `<path>` instead of `~/.trumbo` (enables sandbox mode) |
| `--auto-approve [true\|false]` | Set tool auto-approval for all tools |
| `-y, --yolo` | Skip approvals, enable `submit_and_exit`, disable spawn/team tools by default |
| `-z, --zen` | Dispatch to the background hub and exit immediately |
| `--team-name <name>` | Override the runtime team state name |
| `-h, --help` | Show help and exit |
| `-v, --verbose` | Show verbose runtime diagnostics |
| `-V, --version` | Show version and exit |

`--json` is non-interactive and requires a prompt argument or piped stdin. `--key` takes precedence over environment variables.

## Top-level commands

- `trumbo config` — open the interactive config view
- `trumbo history|h` — list session history or manage saved sessions
- `trumbo version` — show CLI version
- `trumbo update` — check for CLI updates
- `trumbo auth <provider>` — authenticate or seed provider credentials
- `trumbo connect <adapter>` — run a chat connector bridge
- `trumbo connect --stop [adapter]` — stop connector bridges and their sessions
- `trumbo schedule <command>` — create and manage scheduled runs
- `trumbo doctor` — inspect local CLI health and stale processes
- `trumbo doctor fix` — kill stale local RPC listeners and old CLI processes
- `trumbo doctor log` — open the CLI runtime log file
- `trumbo hook` — handle a hook payload from stdin
- `trumbo hub` — manage the local hub daemon

## Zen mode

`--zen` (`-z`) runs a task in the background hub daemon and exits the CLI immediately — for long-running tasks you want to fire off and walk away from.

```sh
trumbo --zen "Refactor the authentication module and add unit tests"
```

- The CLI starts (or reuses) the local hub daemon, submits the task, then exits. It does not stream output or stay attached.
- Because there's no human in the loop once the CLI exits, zen sessions run with full tool auto-approval (same as `--yolo`); `spawn`/`team` tools are disabled by default.
- If the Trumbo menubar app is running, it surfaces a system notification when the task completes. Otherwise use `trumbo history` later to inspect the result.
- `--zen` is incompatible with `--data-dir` and `--tui`.

## Tool approval

Tool calls are auto-approved by default. Require review with `--auto-approve false`:

```sh
trumbo --auto-approve false "Inspect and modify this repository"
```

In TTY mode the CLI prompts:

```text
Approve tool "<tool_name>" with input <preview>? [y/N]
```

`y`/`yes` approves; anything else rejects. If stdin/stdout is not a TTY, required-approval calls are denied. Desktop-integrated approval is also supported via `TRUMBO_TOOL_APPROVAL_MODE=desktop` and `TRUMBO_TOOL_APPROVAL_DIR=<path>` (file-based IPC).

## Environment variables

- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `AI_GATEWAY_API_KEY`, `V0_API_KEY` — provider API keys
- `TRUMBO_DATA_DIR` — base data directory for sessions/settings/teams/hooks
- `TRUMBO_SANDBOX` — set to `1` to force sandbox mode
- `TRUMBO_SANDBOX_DATA_DIR` — override sandbox state directory
- `TRUMBO_TEAM_DATA_DIR` — override team persistence directory
- `TRUMBO_BUILD_ENV` — runtime build mode for SDK-owned subprocess launches
- `TRUMBO_DEBUG_HOST` / `TRUMBO_DEBUG_PORT_BASE` — development inspector wiring
- `TRUMBO_TOOL_APPROVAL_MODE` / `TRUMBO_TOOL_APPROVAL_DIR` — desktop approval IPC
- `TRUMBO_LOG_ENABLED` / `TRUMBO_LOG_LEVEL` / `TRUMBO_LOG_PATH` / `TRUMBO_LOG_NAME` — runtime logging

`--key` takes precedence over environment variables.

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup, monorepo structure, and TUI architecture, and [DISTRIBUTION.md](./DISTRIBUTION.md) for packaging and distribution.

## License

[Apache 2.0 © Trumbo Bot Inc.](https://github.com/xedro98/trembo/blob/main/LICENSE)
