<div align="center">
<pre>
+++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++++++++++++++++++++++++++++++++
+++++                                  ++++++
+++++                                  ++++++
+++++    +++++++++++++++++++++++++++++++++++++++++++++
+++++    +++++++++++++++++++++++++++++++++++++++++++++
+++++    +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++                                 ++++++
+++++    ++++++                                 ++++++
+++++    ++++++   +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++   +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++   +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++   ++++++                                  +++++
+++++    ++++++   ++++++                                  +++++
+++++    ++++++   ++++++     +++++++                      +++++
+++++++++++++++   ++++++    +++++++++                     +++++
+++++++++++++++   ++++++    ++++++++++                    +++++
+++++++++++++++   ++++++    ++++++++++                    +++++
         ++++++   ++++++     ++++++++                     +++++
         ++++++   ++++++                                  +++++
         +++++++++++++++                                  +++++
         +++++++++++++++                                  +++++
         +++++++++++++++                                 ++++++
                  ++++++                                 ++++++
                  ++++++                                +++++++
                  +++++++++++++++                      +++++++
                  +++++++++++++++                     +++++++
                  +++++++++++++++                    ++++++++
                            +++++                 +++++++++
                            +++++              ++++++++++
                            +++++++++++++++++++++++++++
                            ++++++++++++++++++++++++
                            ++++++++++++++++++++
</pre>

<h1>Trumbo</h1>

<p>An open-source AI coding agent for your terminal.<br>Bring your own keys or sign in with Trumbo. Interactive TUI, headless JSON, RPC embedding, and a full TypeScript SDK.</p>

<br>

[![npm version](https://img.shields.io/npm/v/@trumbodev/cli?label=%40trumbodev%2Fcli&color=2BBF77)](https://www.npmjs.com/package/@trumbodev/cli)
[![License](https://img.shields.io/badge/license-Apache%202.0-2BBF77)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/xedro98/Trumbo?color=2BBF77)](https://github.com/xedro98/Trumbo)
[![Last commit](https://img.shields.io/github/last-commit/xedro98/Trumbo?color=2BBF77)](https://github.com/xedro98/Trumbo)
[![Bun](https://img.shields.io/badge/runtime-Bun-2BBF77)](https://bun.sh)

<br>

[Docs](https://platform.trumbo.dev/docs) &nbsp;&middot;&nbsp; [Install](#quick-start) &nbsp;&middot;&nbsp; [Issues](https://github.com/xedro98/Trumbo/issues) &nbsp;&middot;&nbsp; [Discussions](https://github.com/xedro98/Trumbo/discussions) &nbsp;&middot;&nbsp; [npm](https://www.npmjs.com/package/@trumbodev/cli) &nbsp;&middot;&nbsp; [Changelog](./projects/console/CHANGELOG.md)

</div>

---

## What is Trumbo

Trumbo is a full-stack AI coding agent. It reads your project, plans changes, edits files across your codebase, runs shell commands, browses the web, and reports back, all with you in the loop. It runs four ways from one engine:

- **Interactive TUI** — a terminal chat interface with Plan/Act modes, slash commands, file mentions, avatars, live tool approvals, session trees, themes, and more.
- **Headless / JSON** — pipe a prompt, get styled text or NDJSON events for CI/CD and scripting.
- **RPC mode** — JSONL over stdin/stdout for embedding Trumbo in editors, orchestrators, and other tools.
- **SDK** — a TypeScript API (`@trumbo/sdk`) for building your own agents, tools, connectors, and scheduled automations.

Bring your own API keys (Anthropic, OpenAI, Google, OpenRouter, Bedrock, Vertex, Azure, Cerebras, Groq, Ollama, LM Studio, or any OpenAI-compatible endpoint), or sign in with a Trumbo account for hosted model access and cloud agent tools.

## What's in this repo

| Package | What it is | Path |
|---------|-----------|------|
| **CLI** | Terminal UI, headless mode, RPC mode, connectors, schedules, install scripts. | [`projects/console/`](./projects/console) |
| **SDK** | Programmatic agent engine: shared contracts, LLM providers, agent loop, session lifecycle, tools, plugins, cron, hub daemon. | [`engine/`](./engine) |
| **Docs** | Published documentation (served at `platform.trumbo.dev/docs`). | [`book/`](./book) |
| **VS Code** | Trumbo extension for VS Code. | [`projects/vscode/`](./projects/vscode) |
| **Hub** | Trumbo Hub dashboard (session management, team coordination). | [`projects/hub/`](./projects/hub) |

## Quick start

Install the CLI. The published binary is self-contained (Bun embedded), so no Node, Bun, or npm runtime is needed to run it.

```bash
# npm / pnpm / bun
npm i -g @trumbodev/cli
pnpm add -g @trumbodev/cli
bun add -g @trumbodev/cli

# curl (macOS / Linux) — no package manager required
curl -fsSL https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.sh | sh

# PowerShell (Windows)
irm https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.ps1 | iex
```

Then run it in your project:

```bash
cd my-project
trumbo                    # interactive TUI
trumbo "fix the tests"    # one-shot prompt
trumbo --json "list TODOs" | jq ...   # headless JSON mode
trumbo --mode rpc         # RPC embedding mode
```

Or run from source:

```bash
git clone https://github.com/xedro98/Trumbo.git
cd Trumbo
bun install
bun --conditions=development --cwd projects/console dev
```

## Interactive TUI

The terminal interface is built on [OpenTUI](https://github.com/sst/opentui) + React with:

- **Avatar-driven chat** — `*` for Trumbo (animates while streaming), `●` for you, per-tool letter glyphs, with distinct role colors (user blue, assistant green, reasoning magenta, tools amber).
- **Message bubbles** — your messages render as rounded bordered bubbles; Trumbo's responses render as accent-rail markdown cards. A two-level hierarchy: labeled turns at the left edge, indented events (tools, thinking, status) nested under the active turn.
- **Branded header bar** — shows `* TRUMBO`, the current mode (`● Act` / `● Plan`), model name, and workspace/branch above a sparkle rule.
- **Session tree** — conversations are stored as a tree (not a flat list). Use `/tree` to navigate to any previous point, switch branches, and continue from there. All branches live in a single session file. Filter by message type, label entries as bookmarks.
- **Plan / Act modes** — Tab to toggle. Plan mode explores and strategizes; Act mode executes.
- **Slash commands** — 22+ built-in commands: `/tree`, `/fork`, `/clone`, `/name`, `/compact`, `/model`, `/undo`, `/trust`, `/scoped-models`, `/reload`, `/hotkeys`, `/changelog`, and more. Plus plugin- and skill-registered commands.
- **Prompt templates** — create reusable prompt macros in `~/.trumbo/prompts/*.md` with `$1`, `$@` positional arguments. Invoke with `/templatename args`.
- **Scoped model cycling** — define a subset of models in `~/.trumbo/scoped-models.json` and cycle through them with `Ctrl+M`.
- **Themes** — 51-token theme system with 5 built-in themes (dark, light, dracula, nord, solarized). Add your own in `~/.trumbo/themes/*.json`. Hot-reloads when you edit theme files.
- **Keybindings** — customize via `~/.trumbo/keybindings.json`. Emacs-style defaults.
- **Emacs kill-ring** — `Ctrl+K` / `Ctrl+U` kill to line end/start, `Ctrl+Y` yank, `Meta+Y` yank-pop. Sticky column preserves your visual column on vertical moves.
- **Steering + follow-up queue** — press Enter while the agent is working to queue a steering message (delivered after the current tool batch). Alt+Enter for a follow-up (delivered after the agent finishes).
- **Checkpoints** — `/undo` rewinds chat and workspace state via git-stash-based checkpoints.
- **Empty-state splash** — shows the Trumbo ASCII logo centered in the chat area before the first message.
- **Project trust** — the CLI asks before loading project-local extensions, skills, and config from `.trumbo/`. Use `/trust` or `--trust always` to save the decision.

## Session management

Sessions auto-save to `~/.trumbo/` organized by working directory.

```bash
trumbo -c                  # continue most recent session
trumbo -r                  # browse and select from past sessions
trumbo --no-session        # ephemeral mode (don't save)
trumbo --name "my task"    # set session display name at startup
trumbo --fork <id>         # fork a session into a new one
```

### Session tree

Sessions are stored as JSONL files with a tree structure. Each entry has an `id` and `parentId`, enabling in-place branching without creating new files.

- `/tree` — navigate to any previous point, switch branches, continue from there. Filter modes: default, no-tools, user-only, labeled-only, all.
- `/fork` — create a new session file from a previous user message.
- `/clone` — duplicate the current active branch into a new session.
- **Branch summaries** — when switching branches, a summary of the abandoned branch is injected so context is preserved.
- **Labels** — bookmark entries in the tree for quick navigation.

### Compaction

Long sessions can exhaust context windows. Compaction summarizes older messages while keeping recent ones.

- **Manual**: `/compact` or `/compact <focus area>`
- **Automatic**: triggers on context overflow or when approaching the limit.
- **Strategies**: basic (truncation) or agentic (LLM-generated summaries).
- **Split-turn compaction**: oversized tool results are truncated mid-turn without losing the conversation flow.

## Agent engine

### Agent loop

The agent loop is stateless and streaming-first:

- **Two-queue steering** — steering messages (delivered before the next assistant response) and follow-up messages (delivered after the agent would stop).
- **Parallel tool execution** — tools with `executionMode: "parallel"` run concurrently; file mutations are serialized per-file via a mutation queue.
- **Retry handling** — retries are kept out of the core loop (provider-level + session auto-retry with auth-error detection).
- **Truncated tool call safety** — when `stopReason === "length"`, all tool calls in the message are failed instead of executing with truncated arguments.

### Agent hooks

The `AgentRuntimeHooks` interface provides 10 callbacks for extending the agent loop:

| Hook | When | Can do |
|------|------|--------|
| `beforeRun` | Before the run starts | Stop the run |
| `afterRun` | After the run completes | Observe |
| `beforeModel` | Before each LLM call | Replace messages/tools/options, stop |
| `afterModel` | After each LLM call | Stop |
| `beforeTool` | Before each tool executes | Skip, mutate input, override policy, stop |
| `afterTool` | After each tool executes | Mutate result, stop |
| `transformContext` | Before the LLM call (after beforeModel) | Transform system prompt + messages (RAG, filtering, long-term memory) |
| `prepareNextTurn` | At the turn boundary (after tools, before next iteration) | Inject messages for the next turn |
| `shouldStopAfterTurn` | After each turn completes | Clean stop at the turn boundary |
| `onEvent` | Every runtime event | Observe |

### Cross-provider thinking handoff

When switching models mid-session, thinking/reasoning blocks from the previous provider may not be understood by the new provider. Trumbo automatically converts thinking blocks to portable `<thinking>` text tags so the context is preserved across providers.

### Subprocess hook events

30 lifecycle events are available for file-based and subprocess hooks:

`agent_start`, `agent_resume`, `agent_abort`, `agent_end`, `agent_error`, `agent_settled`, `tool_call`, `tool_result`, `prompt_submit`, `pre_compact`, `session_before_compact`, `session_shutdown`, `before_provider_request` (read-only), `iteration_end`, `user_bash`, `context_inject`, `message_start`, `message_end`, `turn_start`, `turn_end`, `context_transform`, `session_branch`, `model_switch`, `skill_invoked`, `command_run`, `session_fork`, `session_clone`, `checkpoint_created`, `checkpoint_restored`, `compaction_completed`.

> **Security**: The `before_provider_request` payload is `readonly`. Extensions can observe but not modify provider requests, keeping billing and auth server-authoritative.

## Tools

### Built-in tools

| Tool | Description |
|------|-------------|
| `read_files` | Read file contents with line ranges |
| `run_commands` | Execute shell commands with live output |
| `editor` / `edit` / `write` | Edit files with fuzzy-match fallback (Levenshtein 0.66 threshold), pre-execution diff preview in approval dialog |
| `apply_patch` | Apply multi-file unified patches |
| `search_codebase` | Search across the codebase |
| `fetch_web_content` | Fetch and extract web page content |
| `skills` | Load skills on-demand |
| `ask_question` | Ask the user a structured question |
| `spawn_agent` | Spawn a sub-agent with a custom system prompt |

### Edit engine

The `editor` tool uses a fuzzy-match fallback: if the exact `old_str` isn't found, it searches for the most similar region using Levenshtein distance (0.66 threshold) and replaces it, preserving unchanged lines. A note is appended to the result when fuzzy matching was used.

### Output truncation

Tool output is truncated with a bounded-memory `OutputAccumulator` (head + rolling tail + temp-file spill). The truncation notice includes `Use offset=N to continue reading the elided middle`, giving the model an actionable continuation cursor.

### Pre-execution diff preview

When approval is required for an edit, the approval dialog shows a red/green diff of the proposed changes before the file is written. Computed in-memory (no write) by reading the current file content and applying the edit.

## Multi-agent teams

A coordinator agent splits work into subtasks and delegates to specialist agents, each with its own tools and context. 17+ team tools (`team_spawn_teammate`, `team_run_task`, `team_await_runs`, `team_broadcast`, `team_create_outcome`, etc.) manage the team lifecycle. Team state persists across sessions.

```bash
trumbo --team-name auth-sprint "Plan and implement user authentication with tests"
```

## Scheduled agents

Run agents on cron schedules for recurring work. Schedules persist across restarts and run independently of any terminal.

```bash
trumbo schedule create "PR summary" \
  --cron "0 9 * * MON-FRI" \
  --prompt "List all open PRs and their review status" \
  --workspace /path/to/repo

trumbo schedule list
trumbo schedule trigger <id>
trumbo schedule history <id>
```

## Chat connectors

Chat with your agent from Telegram, Slack, Discord, Google Chat, WhatsApp, or Linear. Each thread maps to an agent session with full context.

```bash
trumbo connect telegram -k $BOT_TOKEN
trumbo connect slack --bot-token $SLACK_TOKEN --signing-secret $SECRET --base-url $URL
trumbo connect discord --bot-token $BOT_TOKEN
trumbo connect --stop            # stop all bridges
```

## Hub daemon

The hub daemon is a shared WebSocket session server that manages multiple agent sessions. It enables the dashboard, background zen mode, and connector bridges.

```bash
trumbo hub ensure    # start if not running
trumbo hub status    # check status
trumbo hub stop      # stop the daemon
trumbo dashboard     # open the hub dashboard
```

## RPC mode

Embed Trumbo in other tools via newline-delimited JSON over stdin/stdout.

```bash
echo '{"type":"start","config":{"providerId":"anthropic","modelId":"claude-sonnet-4"}}' | trumbo --mode rpc
```

Requests: `start`, `send`, `abort`, `stop`, `get`, `list`, `readMessages`, `getTree`, `switchLeaf`, `delete`, `exit`. Events are streamed as they happen. See the [RPC protocol docs](https://platform.trumbo.dev/docs/getting-started/installing-trumbo) for details.

## Works with every model

| Provider | Models |
|----------|--------|
| Anthropic | Claude Opus, Sonnet, Haiku |
| OpenAI | GPT series, Codex |
| Google | Gemini series |
| OpenRouter | 200+ models from any provider |
| AWS Bedrock | Claude, Llama, and more |
| Azure / GCP Vertex | All hosted models |
| Cerebras / Groq | Fast inference |
| Ollama / LM Studio | Local models on your machine |
| Any OpenAI-compatible API | Self-hosted or third-party endpoints |
| Trumbo (sign in) | Hosted models with cloud agent tools |

```bash
trumbo auth --provider anthropic --apikey sk-... --modelid claude-sonnet-4
trumbo auth trumbo    # sign in with Trumbo account (device code flow)
```

## Extension system

### Plugins

Register tools, commands, rules, message builders, providers, MCP servers, and TUI views programmatically:

```typescript
import { Agent, createTool } from "@trumbo/sdk"

const deployTool = createTool({
  name: "deploy",
  description: "Deploy the current branch to staging.",
  inputSchema: { type: "object", properties: { env: { type: "string" } }, required: ["env"] },
  execute: async (input) => {
    // your deployment logic
  },
})

const agent = new Agent({ tools: [deployTool] })
```

Plugins can run in-process (jiti-loaded TypeScript) or in a subprocess sandbox. The `tui` capability lets plugins contribute footer/header/widget views to the TUI via `api.registerView()`.

### Skills

Skills are capability packages following the [Agent Skills standard](https://agentskills.io). Place `SKILL.md` files in:

- `~/.trumbo/skills/` (global)
- `~/.agents/skills/` (cross-harness standard)
- `~/.claude/skills/` (Claude compatibility)
- `~/.codex/skills/` (Codex compatibility)
- `.trumbo/skills/` (project-local, trust-gated)

Invoke with `/skill:name` or let the agent load them automatically.

### MCP servers

Connect [MCP servers](https://modelcontextprotocol.io) for databases, APIs, cloud infra, and external systems. Manage from the CLI:

```bash
trumbo mcp install fs -- npx -y @modelcontextprotocol/server-filesystem /tmp
trumbo mcp install ctx7 --transport http https://mcp.context7.com/mcp
```

When you sign in with a Trumbo account, the `trumbo-platform` MCP server is auto-configured with cloud agent tools (`agent_create`, `agent_list`, `agent_send`, etc.) and knowledge search. The bearer token is automatically refreshed at startup, on model change, and on `/reload` so it never expires while you're signed in.

### Rules and context files

Drop project rules into `.trumbo/` or `AGENTS.md` / `CLAUDE.md` — coding standards, architecture conventions, deployment runbooks, testing requirements. They're picked up automatically. Context files are loaded from:

- `~/.trumbo/AGENTS.md` (global)
- Parent directories (walking up from cwd)
- Current directory

### Project trust

Before loading project-local extensions, skills, and config, the CLI checks whether you trust the workspace. Trust decisions are stored in `~/.trumbo/trust.json`.

```bash
trumbo --trust always    # trust this workspace
trumbo --trust never     # don't trust
trumbo --trust ask       # prompt (default)
```

## Headless CLI for CI/CD

Pipe input, get JSON out, chain commands, wire into pipelines.

```bash
trumbo "Run tests and fix any failures"
git diff origin/main | trumbo "Review these changes for issues"
trumbo --json "List all TODO comments" | jq -r 'select(.type == "agent_event" and .event.text) | .event.text'
trumbo --yolo "Refactor this package"    # skip approvals
trumbo --zen "Background task"           # dispatch to hub daemon, exit immediately
```

## Upgrading

```bash
npm install -g @trumbodev/cli@latest
```

On Windows, close any running Trumbo sessions before upgrading. If you hit `EBUSY` or `EPERM`:

```powershell
Get-Process trumbo -ErrorAction SilentlyContinue | Stop-Process -Force
npm install -g @trumbodev/cli@latest --allow-scripts=@trumbodev/cli
```

The `--allow-scripts=@trumbodev/cli` flag lets the postinstall cache the binary outside `node_modules` for smoother Windows upgrades. The launcher version-checks its cache on every start, so a stale cached binary can never shadow a fresh npm install.

See the [upgrade guide](https://platform.trumbo.dev/docs/getting-started/installing-trumbo#upgrading) for full details.

## SDK

```typescript
import { TrumboCore } from "@trumbo/sdk"

const trumbo = await TrumboCore.create({
  hub: { cwd: process.cwd(), clientType: "my-app", displayName: "My App" },
})

const { sessionId } = await trumbo.start({
  config: { providerId: "anthropic", modelId: "claude-sonnet-4" },
})

await trumbo.send(sessionId, { prompt: "Explain this codebase" })
```

The SDK exposes session lifecycle, tree navigation (`trumbo.tree`), tool orchestration, hooks, plugins, and the hub daemon. See the [SDK docs](https://platform.trumbo.dev/docs) for the full API.

## Contributing

Read the [Contributing Guide](./engine/CONTRIBUTING.md). Open an [issue](https://github.com/xedro98/Trumbo/issues) or start a [discussion](https://github.com/xedro98/Trumbo/discussions) if you want to help.

## License

[Apache 2.0](./LICENSE)
