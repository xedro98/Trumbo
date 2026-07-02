<div align="center">
<pre>
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
</pre>
</div>

<h1 align="center">Trembo</h1>

<p align="center">An open-source, self-hostable AI coding agent for your terminal.<br/>Bring your own keys. No telemetry, no account, no upstream required.</p>

<div align="center">

[Docs](https://github.com/xedro98/trembo) • [Issues](https://github.com/xedro98/trembo/issues) • [Discussions](https://github.com/xedro98/trembo/discussions)

</div>

---

Trembo is a self-hostable AI coding agent. It reads your project, plans a change, edits files across your codebase, runs shell commands, browses the web, and reports back — all with you in the loop. It runs two ways from one engine:

- **CLI** — an interactive terminal app plus a headless JSON mode for CI/CD and scripting.
- **SDK** — a TypeScript API for building your own agents, tools, connectors, and scheduled automations.

Everything is bring-your-own-key: plug in Anthropic, OpenAI, Google, OpenRouter, Bedrock, Vertex, Azure, Ollama, LM Studio, or any OpenAI-compatible endpoint. Trembo never phones home — telemetry is disabled and there is no hosted backend to sign in to.

## What's in this repo

| Package | What it is | Path |
|---------|-----------|------|
| **CLI** | Terminal UI, headless mode, connectors, schedules. | [`apps/cli/`](./apps/cli) |
| **SDK** | Programmatic agent engine, tools, plugins, cron. | [`sdk/`](./sdk) |
| **Docs** | Published documentation pages. | [`docs/`](./docs) |

## Quick start

```bash
# Install the CLI
npm i -g trembo

# Run it in your project
cd my-project
trembo
```

Or, from source:

```bash
git clone https://github.com/xedro98/trembo.git
cd trembo
bun install
bun --conditions=development --cwd apps/cli dev
```

## It edits code across your project

Trembo maps your project structure, understands how files relate, and makes coordinated edits across them. It watches linter and compiler output as it works and fixes missing imports, type mismatches, and syntax errors before you see them. Every edit is a diff you can review, tweak, or revert; checkpoints let you undo the agent's work in one step.

## It runs your shell

Trembo runs commands in your terminal and reads the output live — install deps, run builds, execute tests, deploy. Long-running processes (dev servers, watchers) keep running in the background and Trembo reacts to new output, catching compile errors and test failures as they happen.

## Plan and Act

Switch between **Plan** mode (explore, ask questions, lay out a strategy) and **Act** mode (execute the plan). Every file edit and command can require your approval, or flip on auto-approve to let it run autonomously.

## Rules and skills

Drop project rules into `.tremborules/` — coding standards, architecture conventions, deployment runbooks, testing requirements. They're picked up automatically by the CLI. Skills let the model load specific rule sets on demand.

## Works with every model

| Provider | Models |
|----------|--------|
| Anthropic | Claude Opus, Sonnet, Haiku |
| OpenAI | GPT series |
| Google | Gemini series |
| OpenRouter | 200+ models from any provider |
| AWS Bedrock | Claude, Llama, and more |
| Azure / GCP Vertex | All hosted models |
| Cerebras / Groq | Fast inference |
| Ollama / LM Studio | Local models on your machine |
| Any OpenAI-compatible API | Self-hosted or third-party endpoints |

## Extend with plugins or MCP servers

Register tools and lifecycle hooks programmatically:

```typescript
import { Agent, createTool } from "@trembo/sdk"

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

…or connect [MCP servers](https://modelcontextprotocol.io) for databases, APIs, cloud infra, and external systems. Manage them from the CLI with `trembo mcp`.

## Multi-agent teams

A coordinator agent splits work into subtasks and delegates to specialist agents, each with its own tools and context. Team state persists across sessions.

```bash
trembo --team-name auth-sprint "Plan and implement user authentication with tests"
```

## Scheduled agents

Run agents on cron schedules for recurring work — daily PR summaries, weekly dependency checks, health reports. Schedules persist across restarts and run independently of any terminal.

```bash
trembo schedule create "PR summary" \
  --cron "0 9 * * MON-FRI" \
  --prompt "List all open PRs and their review status" \
  --workspace /path/to/repo
```

## Connect to Slack, Telegram, Discord, and more

Chat with your agent from Telegram, Slack, Discord, Google Chat, WhatsApp, or Linear. Each thread maps to an agent session with full context.

```bash
trembo connect telegram -k $BOT_TOKEN
trembo connect slack --bot-token $SLACK_TOKEN --signing-secret $SECRET --base-url $URL
```

## Headless CLI for CI/CD

Pipe input, get JSON out, chain commands, wire it into pipelines.

```bash
trembo "Run tests and fix any failures"
git diff origin/main | trembo "Review these changes for issues"
trembo --json "List all TODO comments" | jq -r 'select(.type == "agent_event" and .event.text) | .event.text'
```

## Contributing

Read the [Contributing Guide](CONTRIBUTING.md). Open an [issue](https://github.com/xedro98/trembo/issues) or start a [discussion](https://github.com/xedro98/trembo/discussions) if you want to help.

## License

[Apache 2.0 © 2026 Trembo Bot Inc.](./LICENSE)
