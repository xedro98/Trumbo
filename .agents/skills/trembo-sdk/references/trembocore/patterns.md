# TremboCore patterns

## Basic Session with Built-in Tools

```typescript
import { TremboCore } from "@trembo/sdk"

const trembo = await TremboCore.create({ clientName: "my-app" })

const session = await trembo.start({
  prompt: "Read package.json and summarize the dependencies",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY,
    cwd: process.cwd(),
    enableTools: true,
  },
})

console.log(session.result?.text)
await trembo.dispose()
```

## Streaming Session with UI Updates

```typescript
const trembo = await TremboCore.create({ clientName: "my-app" })

trembo.subscribe((event) => {
  switch (event.type) {
    case "chunk":
      if (event.payload.type === "text") {
        ui.appendText(event.payload.text)
      }
      break
    case "ended":
      ui.showComplete(event.payload.finishReason)
      break
  }
})

await trembo.start({
  prompt: "Refactor the auth module",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: "/path/to/project",
    enableTools: true,
  },
})
```

## Multi-Turn Session

```typescript
const trembo = await TremboCore.create({ clientName: "my-app" })

const session = await trembo.start({
  prompt: "Create a new Express server",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: "/path/to/project",
    enableTools: true,
  },
})

// Follow-up
const result = await trembo.send({
  sessionId: session.sessionId,
  prompt: "Now add a health check endpoint",
})

console.log(result?.text)
await trembo.dispose()
```

## Tiered Permission Model

Auto-approve reads, require approval for writes:

```typescript
const trembo = await TremboCore.create({
  clientName: "my-app",
  toolPolicies: {
    read_files: { autoApprove: true },
    search: { autoApprove: true },
    fetch_web: { autoApprove: true },
    bash: { autoApprove: false },
    editor: { autoApprove: false },
    apply_patch: { autoApprove: false },
  },
  capabilities: {
    requestToolApproval: async (request) => {
      const approved = await promptUser(
        `Allow ${request.toolName}?\n${JSON.stringify(request.input, null, 2)}`
      )
      return { approved }
    },
  },
})
```

## Custom Tools Alongside Built-ins

```typescript
import { TremboCore, createTool } from "@trembo/sdk"
import { z } from "zod"

const deployTool = createTool({
  name: "deploy",
  description: "Deploy the application to the specified environment.",
  inputSchema: z.object({
    environment: z.enum(["staging", "production"]),
  }),
  execute: async (input) => {
    const result = await runDeployment(input.environment)
    return { url: result.url, status: "deployed" }
  },
})

const trembo = await TremboCore.create({ clientName: "my-app" })

await trembo.start({
  prompt: "Deploy the app to staging",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: process.cwd(),
    enableTools: true,
    tools: [deployTool],
  },
})
```

## Session with Plugins

Load plugins inline with `extensions` and provide workspace context so plugins can access `ctx.workspaceInfo`:

```typescript
import { TremboCore } from "@trembo/sdk"
import myPlugin from "./my-plugin"

const trembo = await TremboCore.create({
  clientName: "my-app",
  backendMode: "local",
})

await trembo.start({
  prompt: "Do the thing my plugin enables",
  config: {
    providerId: "anthropic",
    modelId: "claude-sonnet-4-6",
    cwd: process.cwd(),
    enableTools: true,
    extensions: [myPlugin],
    extensionContext: {
      workspace: { rootPath: process.cwd(), cwd: process.cwd() },
    },
  },
})

await trembo.dispose()
```

For directory-based plugin packages, use `pluginPaths` instead:

```typescript
config: {
  pluginPaths: ["./my-trembo-plugin"],
  extensionContext: {
    workspace: { rootPath: process.cwd(), cwd: process.cwd() },
  },
}
```

See `../plugins/REFERENCE.md` for the full plugin authoring guide.

## Session Listing and Replay

```typescript
const trembo = await TremboCore.create({ clientName: "my-app" })

// List recent sessions
const sessions = await trembo.list(10)
for (const session of sessions) {
  console.log(`${session.id}: ${session.title}`)
}

// Read messages from a past session
const messages = await trembo.readMessages(sessions[0].id)
for (const msg of messages) {
  console.log(`[${msg.role}] ${msg.content}`)
}

// Check usage
const usage = await trembo.getAccumulatedUsage(sessions[0].id)
console.log(`Total tokens: ${usage.aggregateUsage.totalInputTokens + usage.aggregateUsage.totalOutputTokens}`)
```

## Graceful Shutdown

```typescript
const trembo = await TremboCore.create({ clientName: "my-app" })

process.on("SIGTERM", async () => {
  await trembo.dispose("SIGTERM received")
  process.exit(0)
})

// Run sessions...
```

## Stateless Worker Pattern

For request/response workloads (API endpoints, queue consumers):

```typescript
import { TremboCore } from "@trembo/sdk"

const trembo = await TremboCore.create({
  clientName: "worker",
  backendMode: "local",
})

async function handleRequest(prompt: string, workspace: string) {
  const session = await trembo.start({
    prompt,
    config: {
      providerId: "anthropic",
      modelId: "claude-sonnet-4-6",
      cwd: workspace,
      enableTools: true,
    },
  })

  return {
    text: session.result?.text,
    usage: session.result?.usage,
    sessionId: session.sessionId,
  }
}
```

## Hub-Backed Multi-Client

Multiple clients can attach to the same session:

```typescript
// Process 1: start session
const trembo = await TremboCore.create({
  clientName: "backend",
  backendMode: "hub",
})

const session = await trembo.start({
  prompt: "Long running refactor task",
  config: { ... },
})

// Process 2: attach and stream events
const viewer = await TremboCore.create({
  clientName: "dashboard",
  backendMode: "hub",
})

viewer.subscribe((event) => {
  dashboard.render(event)
}, { sessionId: session.sessionId })
```

## See Also

- `api.md` - Full API reference
- `gotchas.md` - Common pitfalls
- `../tools/REFERENCE.md` - Tool creation
- `../plugins/REFERENCE.md` - Plugin system
- `../scheduling/REFERENCE.md` - Scheduled agents
