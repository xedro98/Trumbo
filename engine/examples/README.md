```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo SDK Examples

Runnable, copy-pasteable examples for the Trumbo SDK. Trumbo is an open-source,
self-hostable AI coding agent: a CLI, a VS Code extension, and a TypeScript SDK.
You bring your own model keys, there is no hosted backend, and everything here
runs locally against your own providers.

Use these examples as starting points — copy a file, point it at your repo, swap
in your provider, and ship.

## Plugins, hooks, and automations

### [`./plugins/`](./plugins/)

A plugin is a single TypeScript file (or a small directory) that extends every
Trumbo agent surface — CLI, VS Code, Kanban, or anything built on the Core SDK.
Install from a local file, a directory, a git repo, an npm package, or a raw
GitHub URL:

```bash
trumbo plugin install https://github.com/xedro98/trembo/blob/main/engine/examples/plugins/weather-metrics.ts
trumbo -i "What's the weather like in Tokyo and Paris?"
```

What a plugin can do:

- Register custom tools the agent can call.
- Hook into the agent lifecycle (`beforeRun`, `beforeModel`, `afterTool`, …).
- Rewrite provider-bound messages (custom compaction, redaction).
- Emit automation events into the runtime.

The setup callback receives a host logger through its second argument. Use
`ctx.logger` for setup diagnostics and for logs emitted from inside tool calls:

```ts
setup(api, ctx) {
  ctx.logger?.log("my-plugin setup", {
    sessionId: ctx.session?.sessionId,
    workspaceRoot: ctx.workspaceInfo?.rootPath,
  });

  try {
    // Register tools or do other setup work here.
  } catch (error) {
    if (ctx.logger?.error) {
      ctx.logger.error("my-plugin setup failed", { error });
    } else {
      ctx.logger?.log("my-plugin setup failed", { error, severity: "error" });
    }
    throw error;
  }
}
```

`ctx.logger` is scoped to the current session. For work that outlives the
session (detached background processes, long-running jobs), persist status to
plugin-owned storage or push completion back through the host event channel
instead of holding on to the captured logger.

Standalone examples in that directory: `weather-metrics.ts` (tool + lifecycle
metrics), `mac-notify.ts` (macOS Notification Center), `custom-compaction.ts`
(context compaction), `automation-events.ts` (plugin event emission),
`background-terminal.ts` (detached shell jobs with completion steering).

### [`./plugins/typescript-lsp/`](./plugins/typescript-lsp)

A plugin that gives the agent a `goto_definition` tool backed by the TypeScript
Language Service. It resolves through imports, re-exports, and type aliases —
far more precise than grep.

- Registers a tool via `createTool()` and `AgentExtension`.
- Reuses the target project's own `typescript` from `node_modules`.
- Caches the language service across calls in the same session.
- Zero extra dependencies.

```bash
trumbo plugin install https://github.com/xedro98/trembo/blob/main/engine/examples/plugins/typescript-lsp/index.ts
trumbo -i "Find where createTool is defined"
```

### [`./plugins/agents-squad/`](./plugins/agents-squad)

A portable subagent plugin that adds background agent orchestration to the CLI
and SDK. Start subagents from the main session, each with its own provider,
model, and system prompt; load bundled or custom agent presets and skills; pass
notes between subagents through a shared handoff store.

Bundled agents:

- **Anvil** — surgical implementation.
- **Inquisitor** — adversarial review.
- **Oracle** — opinionated planning.
- **Phantom** — fast codebase recon.

Bundled skills: API design, code review, debugging, documentation, migration,
refactoring, test generation.

```bash
trumbo plugin install ./examples/plugins/agents-squad
trumbo -i "Use subagents to inspect this repository and report back."
```

Once loaded, the agent can call `start_subagent`, `message_subagent`,
`get_subagent`, `list_agent_presets`, `list_skills`, and the handoff tools.

## Cron and hooks

### [`./cron/`](./cron)

File-based automation specs for `~/.trumbo/cron/`. Two flavors:

- **Recurring** (`.cron.md`) — run on a cron schedule.
- **Event-driven** (`.event.md`) — run when a normalized event lands.

Recurring examples ship defaults for continuous quality work:
`changelog-generator`, `dependency-check`, `test-coverage-report`,
`performance-baseline`, `type-check-strict`, `code-style-audit`,
`dead-code-finder`, `documentation-check`, `weekly-metrics-summary`.

Event-driven examples cover PR workflows: `pr-review`, `pr-changelog-check`,
`pr-test-coverage`, plus `local-manual-test` and `local-plugin-event` for
testing the event pipeline without external services.

```bash
mkdir -p ~/.trumbo/cron
cp examples/cron/changelog-generator.cron.md ~/.trumbo/cron/
mkdir -p ~/.trumbo/cron/events
cp examples/cron/events/pr-changelog-check.event.md ~/.trumbo/cron/events/
```

See [cron/README.md](./cron/README.md) for the full field reference and usage
patterns.

### [`./hooks/`](./hooks)

Lifecycle hooks written in bash, Python, or TypeScript that intercept agent
actions at well-defined points. Use them to log tool calls, block destructive
operations, require review on critical files, inject context, or track session
lifecycle events (`TaskStart`, `TaskComplete`, `SessionShutdown`).

Hooks live in `.trumbo/hooks/` and are named after the event they handle:

```bash
mkdir -p ~/.trumbo/hooks

# Bash
cp examples/hooks/PreToolUse.sh ~/.trumbo/hooks/
chmod +x ~/.trumbo/hooks/PreToolUse.sh

# Python
cp examples/hooks/PreToolUse.py ~/.trumbo/hooks/PreToolUse.py
chmod +x ~/.trumbo/hooks/PreToolUse.py

# TypeScript (runs via bun)
cp examples/hooks/PreToolUse.ts ~/.trumbo/hooks/PreToolUse.ts
chmod +x ~/.trumbo/hooks/PreToolUse.ts

trumbo -i "do something"  # hooks fire automatically
```

## Quick start for the SDK

To use the SDK in your own Node app, outside this monorepo:

```bash
npm add @trumbodev/core
```

Reach for `@trumbodev/agents` or `@trumbodev/llms` only when you want lower-level
control over the agent loop or model transport. For RPC client helpers, import
from `@trumbodev/core` to stay on the app-facing surface.

Current SDK layering:

- `@trumbodev/core` owns config discovery and watchers, runtime plugin loading, and
  the context pipeline (compaction runs here, during turn preparation, before
  model calls).
- Most app integrations should stay on `@trumbodev/core` unless they intentionally
  need lower-level agent or model control.

## Learning path

**Building plugins?**

- Start with [`./plugins/`](./plugins/) for tool and event patterns.
- Move to [`./plugins/typescript-lsp/`](./plugins/typescript-lsp) for language
  service integration.
- See [`./plugins/agents-squad/`](./plugins/agents-squad) for multi-agent
  orchestration.

**Building integrations?**

- Review [`./cron/`](./cron) for scheduled and event-driven workflows.
- Browse [`desktop-app/`](../../projects/samples/desktop-app),
  [`vscode/`](../../projects/samples/vscode), and
  [`menubar/`](../../projects/samples/menubar) for app integration patterns.

**Controlling agent behavior?**

- Explore [`./hooks/`](./hooks) to intercept and modify tool execution, log
  actions, or enforce policy.

## Documentation

- [Trumbo SDK README](../packages/README.md)
- [Architecture guide](../ARCHITECTURE.md)
- [Individual package docs](../packages/)

## Requirements

- **Node.js 22+** for package compatibility.
- **A model API key** — set `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or the
  provider-specific key your setup uses. Trumbo is bring-your-own-key; there is
  no hosted backend to sign in to.
- **Bun** (optional) for running TypeScript examples directly. Install from
  [bun.sh](https://bun.sh).
