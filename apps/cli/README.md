```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Trembo CLI

Run Trembo in your terminal — an interactive chat for paired sessions, or a fully headless mode for CI/CD and scripting. The CLI shares its agent core with the [Trembo VS Code extension](https://github.com/xedro98/trembo/tree/main/apps/vscode) and the [Trembo SDK](https://github.com/xedro98/trembo/tree/main/sdk), so Plan/Act modes, MCP servers, checkpoints, rules, skills, and provider configuration all behave the same across surfaces.

[Docs](https://github.com/xedro98/trembo) • [Issues](https://github.com/xedro98/trembo/issues) • [Discussions](https://github.com/xedro98/trembo/discussions)

## Install

```sh
npm install -g trembo
```

Platform binaries are published for macOS, Linux, and Windows on `arm64` and `x64`. The `trembo` package resolves the correct binary for your platform via optional dependencies, so no Node or Bun runtime is required at install time.

## Quick start

```sh
trembo                                  # interactive TUI
trembo "Audit this package and propose fixes"   # one-shot prompt
cat file.txt | trembo "Summarize this"           # pipe input
```

See `trembo --help` for the full flag reference.

## Use any provider

Trembo is bring-your-own-key. Bring an API key from Anthropic, OpenAI, Google Gemini, OpenRouter, AWS Bedrock, GCP Vertex, Cerebras, Groq, or any OpenAI-compatible endpoint (including Ollama and LM Studio for local models).

```sh
trembo auth --provider anthropic --apikey sk-... --modelid claude-sonnet-4-6
trembo auth --provider openai-native --apikey sk-... --modelid gpt-5
trembo auth --provider openai-compatible --apikey sk-... --baseurl https://api.example.com/v1
```

`trembo auth` without a provider opens an interactive setup TUI. Hosted Trembo account sign-in is disabled in this build; use your own provider keys.

## Modes

- **Interactive TUI** — `trembo` or `trembo -i`: full terminal UI with Plan/Act toggle, slash commands, file mentions, and live tool approvals.
- **One-shot** — `trembo "your prompt"`: runs a single turn and exits.
- **JSON** — `trembo --json "..."`: streams NDJSON events for piping into other tools.
- **Yolo** — `trembo --yolo "..."`: skips approval prompts and exits when the turn finishes.
- **Zen** — `trembo --zen "..."`: dispatches the task to the background hub daemon and exits immediately.

## Headless mode for CI/CD

```sh
trembo --yolo "Run tests and fix any failures"
git diff origin/main | trembo "Review these changes for issues"
trembo --json "List all TODO comments" | jq -r 'select(.type == "agent_event" and .event.text) | .event.text'
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
trembo                                          # interactive mode
trembo "Audit this package and propose fixes"   # one-shot
trembo -i "Let's work on this together."        # interactive + starting prompt
trembo -i -s "You are a pirate" "Tell me about the sea"   # custom system prompt
trembo --auto-approve false "Inspect and modify this repo"  # require approval
trembo --yolo --retries 5 "Refactor this package"           # yolo + retry limit
trembo --retries 5 "Fix failing tests"                      # override mistake limit
trembo --team-name my-team "Plan and implement the checklist"  # team workflow
trembo -v "Explain quantum computing"           # verbose stats
trembo -P openrouter -m google/gemini-3-pro -k sk-... "Set up a storybook"
trembo -m anthropic/claude-opus-4-6 "Explain string theory"
trembo --json "Summarize this repository"       # NDJSON output
```

### MCP servers

```sh
trembo mcp                       # interactive wizard
trembo mcp install fs -- npx -y @modelcontextprotocol/server-filesystem /tmp
trembo mcp install ctx7 --transport http https://mcp.context7.com/mcp
trembo mcp install events --transport sse https://example.com/sse
```

`mcp install` opens the wizard pre-filled; it requires a TTY. `mcp add` is an alias.

### Connectors

Bridge a chat surface into RPC-backed Trembo sessions. Each conversation thread maps to a session with full context.

```sh
trembo connect telegram -k 123456:ABCDEF...
trembo connect slack --bot-token $SLACK_BOT_TOKEN --signing-secret $SLACK_SIGNING_SECRET --base-url https://your-domain.com
trembo connect slack --bot-token $SLACK_BOT_TOKEN --app-token $SLACK_APP_TOKEN   # socket mode
trembo connect gchat --base-url https://your-domain.com
trembo connect whatsapp --base-url https://your-domain.com
trembo connect linear --api-key $LINEAR_API_KEY --base-url https://your-domain.com
trembo connect --stop            # stop all bridges + their sessions
trembo connect --stop telegram   # stop one
```

In-chat slash commands: `/help`, `/start`, `/new`, `/clear`, `/whereami`, `/tools`, `/yolo`, `/cwd <path>`, `/schedule`, `/abort`, `/exit`. Run `trembo connect <adapter> --help` for the full flag list.

### Schedules

```sh
trembo schedule create "Daily code review" \
  --cron "0 9 * * MON-FRI" \
  --prompt "Review PRs opened yesterday and summarize issues." \
  --workspace /path/to/repo \
  --provider anthropic \
  --model anthropic/claude-sonnet-4-6 \
  --timeout 3600 \
  --tags automation,review

trembo schedule list
trembo schedule get <schedule-id>
trembo schedule trigger <schedule-id>
trembo schedule history <schedule-id> --limit 20
trembo schedule export <schedule-id> > daily-review.yaml
trembo schedule import ./daily-review.yaml
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
| `--data-dir <path>` | Use isolated local state at `<path>` instead of `~/.trembo` (enables sandbox mode) |
| `--auto-approve [true\|false]` | Set tool auto-approval for all tools |
| `-y, --yolo` | Skip approvals, enable `submit_and_exit`, disable spawn/team tools by default |
| `-z, --zen` | Dispatch to the background hub and exit immediately |
| `--team-name <name>` | Override the runtime team state name |
| `-h, --help` | Show help and exit |
| `-v, --verbose` | Show verbose runtime diagnostics |
| `-V, --version` | Show version and exit |

`--json` is non-interactive and requires a prompt argument or piped stdin. `--key` takes precedence over environment variables.

## Top-level commands

- `trembo config` — open the interactive config view
- `trembo history|h` — list session history or manage saved sessions
- `trembo version` — show CLI version
- `trembo update` — check for CLI updates
- `trembo auth <provider>` — authenticate or seed provider credentials
- `trembo connect <adapter>` — run a chat connector bridge
- `trembo connect --stop [adapter]` — stop connector bridges and their sessions
- `trembo schedule <command>` — create and manage scheduled runs
- `trembo doctor` — inspect local CLI health and stale processes
- `trembo doctor fix` — kill stale local RPC listeners and old CLI processes
- `trembo doctor log` — open the CLI runtime log file
- `trembo hook` — handle a hook payload from stdin
- `trembo hub` — manage the local hub daemon

## Zen mode

`--zen` (`-z`) runs a task in the background hub daemon and exits the CLI immediately — for long-running tasks you want to fire off and walk away from.

```sh
trembo --zen "Refactor the authentication module and add unit tests"
```

- The CLI starts (or reuses) the local hub daemon, submits the task, then exits. It does not stream output or stay attached.
- Because there's no human in the loop once the CLI exits, zen sessions run with full tool auto-approval (same as `--yolo`); `spawn`/`team` tools are disabled by default.
- If the Trembo menubar app is running, it surfaces a system notification when the task completes. Otherwise use `trembo history` later to inspect the result.
- `--zen` is incompatible with `--data-dir` and `--tui`.

## Tool approval

Tool calls are auto-approved by default. Require review with `--auto-approve false`:

```sh
trembo --auto-approve false "Inspect and modify this repository"
```

In TTY mode the CLI prompts:

```text
Approve tool "<tool_name>" with input <preview>? [y/N]
```

`y`/`yes` approves; anything else rejects. If stdin/stdout is not a TTY, required-approval calls are denied. Desktop-integrated approval is also supported via `TREMBO_TOOL_APPROVAL_MODE=desktop` and `TREMBO_TOOL_APPROVAL_DIR=<path>` (file-based IPC).

## Environment variables

- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `AI_GATEWAY_API_KEY`, `V0_API_KEY` — provider API keys
- `TREMBO_DATA_DIR` — base data directory for sessions/settings/teams/hooks
- `TREMBO_SANDBOX` — set to `1` to force sandbox mode
- `TREMBO_SANDBOX_DATA_DIR` — override sandbox state directory
- `TREMBO_TEAM_DATA_DIR` — override team persistence directory
- `TREMBO_BUILD_ENV` — runtime build mode for SDK-owned subprocess launches
- `TREMBO_DEBUG_HOST` / `TREMBO_DEBUG_PORT_BASE` — development inspector wiring
- `TREMBO_TOOL_APPROVAL_MODE` / `TREMBO_TOOL_APPROVAL_DIR` — desktop approval IPC
- `TREMBO_LOG_ENABLED` / `TREMBO_LOG_LEVEL` / `TREMBO_LOG_PATH` / `TREMBO_LOG_NAME` — runtime logging

`--key` takes precedence over environment variables.

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup, monorepo structure, and TUI architecture, and [DISTRIBUTION.md](./DISTRIBUTION.md) for packaging and distribution.

## License

[Apache 2.0 © Trembo Bot Inc.](https://github.com/xedro98/trembo/blob/main/LICENSE)
