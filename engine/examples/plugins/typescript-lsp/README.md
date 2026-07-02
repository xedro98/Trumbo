```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# TypeScript LSP Plugin

A plugin that gives the agent a `goto_definition` tool backed by the TypeScript
Language Service API. Instead of grep or text search, it resolves symbols the
way your IDE does — through imports, re-exports, type aliases, and declaration
merging.

Code entrypoint: [index.ts](./index.ts)

## What it does

The agent gets a single tool: `goto_definition(file, line)`. It finds every
identifier on that line and resolves where each one is actually defined. Given
an import line like:

```ts
import { disposeAll, initVcr } from "@trumbo/shared"
```

it resolves both symbols through the workspace package alias to their source
files:

```
disposeAll -> packages/shared/src/dispose.ts:19
initVcr    -> packages/shared/src/vcr.ts:699
```

## Why this matters

This is the kind of plugin that makes agents dramatically better at navigating
large codebases. Text search can find a symbol name, but it can't tell
definitions from references, re-exports, or shadowed variables. The TypeScript
Language Service handles all of that for you.

The same pattern extends to anything your team works with: wrap internal APIs,
deployment systems, feature flags, incident management, CI pipelines, or any
other internal surface behind a plugin. A Trumbo plugin is just a TypeScript
file — no MCP server to host and maintain.

## Use it with the CLI

```bash
trumbo plugin install https://github.com/xedro98/trembo/blob/main/engine/examples/plugins/typescript-lsp/index.ts
trumbo -i "Find where createTool is defined"
```

The plugin resolves `typescript` from the target project's own `node_modules` at
runtime, so it uses the same TS version the project compiles with. No extra
dependencies needed.

## Run the demo directly

```bash
ANTHROPIC_API_KEY=sk-... bun run examples/plugins/typescript-lsp/index.ts
```

## How it works

The plugin registers a single tool via `createTool()` in its `setup()` method:

```ts
const plugin: AgentPlugin = {
  name: "typescript-lsp",
  manifest: {
    capabilities: ["tools"],
  },

  setup(api) {
    api.registerTool(
      createTool({
        name: "goto_definition",
        description: "Find where TypeScript/JavaScript symbols on a given line are defined...",
        inputSchema: {
          type: "object",
          properties: {
            file: { type: "string", description: "Absolute path to the file." },
            line: { type: "integer", description: "Line number (1-based)." },
          },
          required: ["file", "line"],
        },
        async execute(input) {
          // 1. Walk up from the file to find tsconfig.json
          // 2. Create (or reuse cached) TypeScript Language Service
          // 3. Scan the AST for identifiers on the target line
          // 4. Resolve each identifier's definition via the Language Service
          // 5. Filter out self-references and return locations
        },
      }),
    );
  },
};
```

Under the hood:

1. `findTsConfig()` walks up parent directories from the target file to the
   nearest `tsconfig.json`.
2. `loadTypeScript()` uses `createRequire()` to resolve `typescript` from the
   project's own `node_modules`.
3. `createLanguageService()` stands up a full TypeScript Language Service with
   the project's compiler options.
4. The service is cached, so later calls in the same session reuse it.
5. `getIdentifierOffsetsOnLine()` scans the AST for every identifier on the
   requested line.
6. Each identifier is resolved via `service.getDefinitionAtPosition()`, which
   follows imports, re-exports, type aliases, and the rest.

Then pass it to the SDK:

```ts
const host = await TrumboCore.create({ backendMode: "local" });
await host.start({
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    cwd: process.cwd(),
    enableTools: true,
    systemPrompt: "You are a helpful assistant.",
    extensions: [plugin],
  },
  prompt: "Find where createTool is defined",
  interactive: false,
});
```
