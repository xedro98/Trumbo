```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# [experimental] @trumbodev/core

`@trumbodev/core` is the stateful orchestration layer of the Trumbo SDK. It wires the agent runtime, provider settings, storage, default tools, and session lifecycle together into a host-ready runtime.

## What You Get

- session lifecycle and orchestration primitives
- provider settings and account services
- default runtime tools and MCP integration
- storage-backed session and team state helpers
- host-facing Node helpers through `@trumbodev/core`

## Installation

```bash
npm install @trumbodev/core
```

## Entry Points

- `@trumbodev/core`: core contracts, shared utilities, and Node/server helpers for building hosts and runtimes

## Typical Usage

Most host apps should start with `@trumbodev/core`.

```ts
import { TrumboCore } from "@trumbodev/core";

const trumbo = await TrumboCore.create({});

const result = await trumbo.start({
	config: {
		providerId: "anthropic",
		modelId: "claude-sonnet-4-6",
		apiKey: process.env.ANTHROPIC_API_KEY ?? "",
		cwd: process.cwd(),
		mode: "act",
		enableTools: true,
		enableSpawnAgent: false,
		enableAgentTeams: false,
		systemPrompt: "You are a concise assistant.",
	},
	prompt: "Summarize this project.",
	interactive: false,
});

console.log(result.result?.text);
await trumbo.dispose();
```

## Session Bootstrap

`TrumboCore.create(...)` also accepts `prepare(input)`.

Use it when a host needs to prepare workspace-scoped runtime state before each session starts, then apply watcher/extensions/telemetry inputs through explicit `localRuntime` bootstrap fields without widening the shared host contract.

## Main APIs

### Runtime and Sessions

Use `@trumbodev/core` for host-facing runtime assembly:

- `TrumboCore.create(...)`
- `createRuntimeHost(...)`
- `LocalRuntimeHost`
- `HubRuntimeHost` and `RemoteRuntimeHost`
- `DefaultRuntimeBuilder`

`TrumboCore` is the app-facing session API. The lower-level `RuntimeHost` boundary uses runtime-primitive names such as `startSession` and `runTurn` so transport adapters stay distinct from product methods like `start` and `send`. Service-style operations such as pending prompt edits, accumulated usage lookup, and active-session model switching are exposed through `TrumboCore` when the selected transport supports them, rather than being part of the minimal host primitive vocabulary.

### Default Tools

`@trumbodev/core` owns the built-in host tools and executors:

- `createBuiltinTools(...)`
- `createDefaultTools(...)`
- `createDefaultExecutors(...)`

### Storage and Settings

The package also exports storage and settings helpers such as:

- `ProviderSettingsManager`
- `CoreSettingsService` and `createCoreSettingsService`
- MCP settings helpers such as `setMcpServerDisabled`
- `SqliteTeamStore`
- SQLite-backed local session stores and artifacts through `@trumbodev/core`

## Related Packages

- `@trumbodev/agents`: stateless agent loop and tool primitives
- `@trumbodev/llms`: provider/model configuration and handlers

## More Examples

- Repo examples: [engine/examples](https://github.com/xedro98/trembo/tree/main/engine/examples), [projects/samples](https://github.com/xedro98/trembo/tree/main/projects/samples)
- Workspace overview: [README.md](https://github.com/xedro98/trembo/blob/main/engine/README.md)
- Architecture reference: [ARCHITECTURE.md](https://github.com/xedro98/trembo/blob/main/engine/ARCHITECTURE.md)
