---
title: "Trumbo SDK"
description: "TypeScript packages for embedding Trumbo's agent runtime in your own applications."
---
The Trumbo SDK is an open-source framework for building agentic applications — the same harness that powers the Trumbo IDE extensions and CLI. It uses a plugin architecture that makes customization straightforward and ships with the features you'd expect from an agent runtime: checkpoints, web fetch, MCPs, cron jobs, subagents, and more.

Use it to run agents from CI/CD pipelines, build automations for end-to-end workflows, or embed agents directly inside your products.

## Install

```bash
npm install @trumbo/sdk
```

`@trumbo/sdk` exports all SDK packages: `@trumbo/core` for the full agent harness, `@trumbo/agents` for the stateless agent loop, `@trumbo/llms` for control over the model gateway, and `@trumbo/shared` for common utilities.

Requires Node.js 22 or later.

## SDK Skill

If you use a coding agent (Claude Code, Codex, Trumbo, etc.), install the [Trumbo SDK skill](https://github.com/xedro98/trembo) to give your agent context on the SDK's APIs and best practices while you build.

```bash
npx skills add trumbo/sdk-skill
```

Prompt it to scaffold agents, create custom tools, wire up plugins, configure providers, and more.

## Your First Agent

```typescript
import { Agent } from "@trumbo/sdk"

const agent = new Agent({
  providerId: "anthropic",
  modelId: "claude-sonnet-4-6",
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxIterations: 1,
})

agent.subscribe((event) => {
  if (event.type === "assistant-text-delta") {
    process.stdout.write(event.text ?? "")
  }
})

const result = await agent.run("Explain what an SDK is in two sentences.")
```

::: tip
Here is a complete [quickstart example](https://github.com/xedro98/trembo/tree/main/projects/samples/quickstart). Clone it and run `bun dev` to try it.
:::

## Packages

| Package | Purpose |
|---------|---------|
| `@trumbo/sdk` | Public SDK surface (re-exports `@trumbo/core`) |
| `@trumbo/core` | Node runtime for sessions, built-in tools, persistence, hub support, automation |
| `@trumbo/agents` | Browser-compatible stateless agent execution loop |
| `@trumbo/llms` | Provider gateway and model catalogs |
| `@trumbo/shared` | Types, schemas, tool helpers, hooks, storage helpers |

See [Packages](architecture/overview) for package boundaries and exports.

## Next Steps

- **Examples** — Browse complete, runnable SDK examples.

  - **Plugins** — Extend Trumbo's functionality.

  - **Tools** — Add actions the model can call.

  - **Building an Agent** — Build a complete SDK agent from a tutorial.
