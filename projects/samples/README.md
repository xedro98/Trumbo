```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo SDK Examples

Working, runnable projects that teach you the Trumbo SDK from the ground up. Each example is a self-contained app you can clone, install, and run in a few minutes. They are ordered by difficulty, so start at the top if you are new and work your way down.

## SDK Skill for coding agents

If you drive a coding agent (Claude Code, Codex, Trumbo itself, anything that supports the `skills` format), give it first-class context on the Trumbo SDK by installing the Trumbo SDK skill:

```bash
npx skills add trumbo/sdk-skill
```

With the skill loaded, you can ask your agent to scaffold agents, build custom tools, wire up plugins, configure providers, and so on. The skill ships the SDK's APIs and conventions so the agent does not have to guess. See the Trumbo repository for details: <https://github.com/xedro98/trembo>.

## Getting started

Every example lives in its own directory under `projects/samples/` and ships its own `package.json` and README. To run any of them:

```bash
cd projects/samples/<example-name>
bun install
bun run build:sdk
export TRUMBO_API_KEY="trumbo_..."
bun dev
```

Trumbo is bring-your-own-key with no hosted backend, so set `TRUMBO_API_KEY` to a key issued by whichever model provider you want to use. You need Node.js 22 or newer.

## Examples

### Beginner

| Example | Description | Concepts |
|---------|-------------|----------|
| [quickstart](./quickstart) | Send one prompt, stream the response. ~15 lines of code. | `Agent`, `subscribe`, `run()` |
| [cli-agent](./cli-agent) | Interactive terminal chat with a shell tool. | `createTool`, multi-turn `run()`/`continue()`, streaming |
| [trumbo-core-cli-agent](./trumbo-core-cli-agent) | Interactive terminal chat powered by TrumboCore. | `TrumboCore.create()`, `trumbo.start()`, `trumbo.send()`, built-in tools, streaming |

### Intermediate

| Example | Description | Concepts |
|---------|-------------|----------|
| [code-review-bot](./code-review-bot) | AI code reviewer that reads git diffs and produces structured comments. | Multiple tools, `completesRun` lifecycle, `systemPrompt`, zod schemas |
| [multi-agent](./multi-agent) | Web app that fans out to three specialist agents in parallel, streams results via SSE, then synthesizes a unified answer. | Concurrent agents, `Promise.all`, per-agent `subscribe()`, SSE streaming, agent composition |

### Advanced

| Example | Description | Concepts |
|---------|-------------|----------|
| [desktop-app](./desktop-app) | Full Tauri + Next.js desktop app for running and inspecting chat sessions. | Sidecar runtime, websocket transport, session persistence |
| [menubar](./menubar) | macOS menu bar app with Tauri. | Native app integration, compact UI |
| [vscode](./vscode) | VS Code extension with chat panel. | Extension API, webview, workspace context |

## SDK packages

When you build your own app, install the public SDK package:

```bash
npm add @trumbodev/sdk
```

`@trumbodev/sdk` re-exports everything from `@trumbodev/core`. Reach for `@trumbodev/agents` or `@trumbodev/llms` only when you need lower-level control over the agent runtime or the model gateway directly.

## Learn more

- [SDK package docs](../../engine/packages/README.md)
- [Architecture guide](../../ARCHITECTURE.md)
- [Plugin examples](../../engine/examples/plugins) — extend the Trumbo SDK and CLI with custom tools and event hooks
- [Hook examples](../../engine/examples/hooks) — lifecycle hooks for logging, blocking, and injection for Trumbo SDK and CLI
