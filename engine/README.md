```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo SDK

The Trumbo SDK is a TypeScript framework for building AI agents that do real work, not just generate text. An agent built on Trumbo can edit files, run shell commands, browse the web, call APIs, and use any custom tool you hand it. It is the same engine that powers the [Trumbo CLI and VS Code extension](https://github.com/xedro98/trembo), repackaged as a library you can embed in your own applications, bots, and automation pipelines.

```typescript
import { Agent } from "@trumbo/sdk"

const agent = new Agent({
  providerId: "trumbo",
  modelId: "openai/gpt-5.5",
  systemPrompt: "You are a helpful coding assistant.",
  tools: [],
})

const result = await agent.run("Create a REST API with Express and TypeScript")
console.log(result.text)
```

That is the entire loop. The agent streams its response, calls tools when you give it any, and returns control when the task is finished.

## Install

```bash
npm install @trumbo/sdk
```

## What You Can Build

Coding agents, Slack bots, scheduled automations, code-review pipelines, multi-agent teams, IDE integrations — anything that benefits from an LLM that can take actions, not just produce prose.

```typescript
// Slack bot: each thread gets its own agent with conversation memory
const agents = new Map<string, Agent>()

async function handleMessage(threadId: string, message: string) {
  let agent = agents.get(threadId)
  if (!agent) {
    agent = new Agent({
      providerId: "gemini",
      modelId: "gemini-3.1-pro-preview",
      systemPrompt: "You are a concise Slack assistant.",
      tools: [],
    })
    agents.set(threadId, agent)
  }

  const result = agent.hasRun
    ? await agent.continue(message)
    : await agent.run(message)

  return result.text
}
```

Full working examples live in [`examples/`](examples) and [`projects/samples/`](../projects/samples):

| Example | Description |
|---------|-------------|
| [Plugins](examples/plugins) | Custom tools with workspace-aware context, lifecycle hooks, and branch-level safety policies |
| [Subagent Orchestration](examples/plugins/agents-squad) | Spawn and manage background agents with presets, skills, and cross-agent handoffs |
| [Hooks](examples/hooks) | File-based and runtime hooks for logging, review gates, context injection, and lifecycle automation |
| [Cron Automations](examples/cron) | Recurring and event-driven automation specs for scheduled quality checks and PR workflows |
| [Desktop App](../projects/samples/desktop-app) | Tauri desktop shell with a Bun sidecar backend and Next.js UI |
| [VS Code Extension App](../projects/samples/vscode) | VS Code extension example that runs Trumbo sessions over the RPC runtime |

## Custom Tools

Tools are how agents reach into the world. Define a tool with a name, a description the model reads, a JSON Schema for its inputs, and a function that does the work:

```typescript
import { createTool } from "@trumbo/sdk"

const deploy = createTool({
  name: "deploy",
  description: "Deploy the app to staging or production.",
  inputSchema: {
    type: "object",
    properties: {
      environment: { type: "string", enum: ["staging", "production"] },
    },
    required: ["environment"],
  },
  execute: async (input) => {
    const result = await runDeployment(input.environment)
    return { url: result.url, status: "success" }
  },
})

const agent = new Agent({
  providerId: "moonshot",
  modelId: "kimi-k2.5",
  systemPrompt: "You are a deployment assistant.",
  tools: [deploy],
})
```

The agent decides when to call the tool from the description, observes the result, and folds it back into its response.

## Streaming Events

Every event during a run is observable in real time:

```typescript
const agent = new Agent({
  providerId: "anthropic",
  modelId: "claude-opus-4-7",
  systemPrompt: "You are a helpful assistant.",
  tools: [myTool],
  onEvent: (event) => {
    switch (event.type) {
      case "content_update":
        if (event.contentType === "text") process.stdout.write(event.text)
        break
      case "content_start":
        if (event.contentType === "tool") console.log(`\n[${event.toolName}]`)
        break
      case "usage":
        console.log(`\ntokens: ${event.inputTokens} in, ${event.outputTokens} out`)
        break
    }
  },
})
```

## Plugins

Package reusable capabilities as extensions. An extension can register tools, observe lifecycle events, and reshape agent behavior:

```typescript
const metrics: AgentPlugin = {
  name: "metrics",
  manifest: { capabilities: ["tools", "hooks"] },

  setup(api) {
    api.registerTool(myCustomTool)
  },

  hooks: {
    beforeRun() {
      console.time("agent")
    },

    beforeTool({ toolCall }) {
      console.log(`tool: ${toolCall.toolName}`)
    },

    afterRun({ result }) {
      console.timeEnd("agent")
      console.log(`${result.iterations} iterations, ${result.usage.outputTokens} tokens`)
    },
  },
}
```

## TrumboCore: Full Runtime

When you need session persistence, built-in tools, config discovery, and multi-process support, reach for `TrumboCore`:

```typescript
import { TrumboCore } from "@trumbo/sdk"

const trumbo = await TrumboCore.create({ clientName: "my-app" })

const session = await trumbo.start({
  prompt: "Set up CI with GitHub Actions",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY,
    cwd: "/path/to/project",
    enableTools: true,
  },
})

console.log(session.result?.text)
```

`TrumboCore` arms the agent with built-in tools (`bash`, `editor`, `read_files`, `apply_patch`, `search`, `fetch_web`), persists sessions to SQLite, discovers config from `.trumbo/` directories, and can connect to an RPC sidecar for scheduled agents and cross-process session management.

## Packages

The SDK is a layered stack. Use as much or as little as you need:

| Package | What it does |
|---------|-------------|
| `@trumbo/sdk` | Everything you need — install this one |
| `@trumbo/core` | Sessions, persistence, built-in tools, config discovery, RPC |
| `@trumbo/agents` | Stateless agent loop with tool execution and streaming |
| `@trumbo/llms` | LLM provider gateway (Anthropic, OpenAI, Google, Bedrock, Mistral, and more) |
| `@trumbo/shared` | Types, tool creation helpers, hook engine |

`@trumbo/sdk` is an alias for `@trumbo/core` that re-exports from every package, so a single install gives you the full API. The individual packages are there if you want a smaller dependency footprint.

## CLI

The Trumbo CLI gives you terminal access to the full SDK:

```bash
# Interactive agent
trumbo

# Single prompt
trumbo "Refactor the auth module to use JWT"

# Schedule an agent to run daily
trumbo schedule create "PR summary" --cron "0 9 * * MON-FRI" --prompt "Summarize open PRs"

# Connect a Telegram bot created with @BotFather
trumbo connect telegram -k "$TELEGRAM_BOT_TOKEN"
# Then send /help or /start to the bot in Telegram
```

For Telegram-specific connector behavior, see [`projects/console/src/connectors/adapters/telegram.md`](../projects/console/src/connectors/adapters/telegram.md).

## Providers

Works with every major LLM provider out of the box:

| Provider | Models |
|----------|--------|
| Anthropic | Claude Opus 4.7, Sonnet 4.6, Haiku 4.5 |
| OpenAI | GPT-5.5, GPT-5.3 Codex |
| Google | Gemini 3.1 Pro Preview, Gemini 3 Flash Preview |
| AWS Bedrock | Claude, Llama |
| Mistral | Mistral Large, Codestral |
| Any OpenAI-compatible | vLLM, Together, Fireworks, Groq, etc. |

## Documentation

The SDK ships its own docs alongside the source. Start here:

- [SDK overview](./README.md) and [architecture](./ARCHITECTURE.md) — what the packages do and how they fit together
- [Contributing guide](./CONTRIBUTING.md) — workspace setup, development workflow, and publishing
- [Development reference](./AGENTS.md) — package boundaries and change routing for active development
- [Packages overview](./packages/README.md) — per-package responsibilities and entry points

For the project root, issues, and discussions, see [https://github.com/xedro98/trembo](https://github.com/xedro98/trembo).

## Contributing

Contributions are welcome. Read the [Contributing Guide](CONTRIBUTING.md) for workspace setup and release workflow, and open issues or discussions at [https://github.com/xedro98/trembo/issues](https://github.com/xedro98/trembo/issues).

## License

[Apache 2.0 © 2026 Trumbo Bot Inc.](../LICENSE)
