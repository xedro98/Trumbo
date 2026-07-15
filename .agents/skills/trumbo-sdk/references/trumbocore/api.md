# TrumboCore API reference

## Creating TrumboCore

```typescript
import { TrumboCore } from "@trumbodev/sdk"

const trumbo = await TrumboCore.create(options: TrumboCoreOptions)
```

### TrumboCoreOptions

```typescript
interface TrumboCoreOptions {
  clientName: string                     // identifies your app
  distinctId?: string                    // user/instance identifier
  backendMode?: "auto" | "local" | "hub" | "remote"
  hub?: HubOptions
  remote?: RemoteOptions
  capabilities?: RuntimeCapabilities
  toolPolicies?: Record<string, ToolPolicy>
  automation?: boolean | TrumboCoreAutomationOptions
  fetch?: typeof fetch
}
```

### RuntimeCapabilities

```typescript
interface RuntimeCapabilities {
  requestToolApproval?: (request: ToolApprovalRequest) => Promise<ToolApprovalResult>
  // ... other capability callbacks
}
```

## Starting Sessions

### start(input)

```typescript
const session = await trumbo.start(input: TrumboCoreStartInput)
```

Returns a `StartSessionResult`:

```typescript
interface StartSessionResult {
  sessionId: string
  manifest: SessionManifest
  manifestPath: string
  messagesPath: string
  result?: AgentResult
}
```

### TrumboCoreStartInput

```typescript
interface TrumboCoreStartInput {
  prompt: string
  config: CoreSessionConfig
  source?: string
  interactive?: boolean
  sessionMetadata?: Record<string, unknown>
  initialMessages?: AgentMessage[]
  toolPolicies?: Record<string, ToolPolicy>
  capabilities?: RuntimeCapabilities
}
```

### CoreSessionConfig

```typescript
interface CoreSessionConfig {
  cwd?: string                          // working directory
  providerId: string                    // LLM provider
  modelId: string                       // model identifier
  apiKey?: string                       // provider API key
  systemPrompt?: string                 // custom system prompt
  tools?: readonly AgentTool[]          // additional custom tools
  enableTools?: boolean                 // enable built-in tools
  hooks?: Partial<AgentRuntimeHooks>    // runtime hooks
  extensions?: AgentPlugin[]            // plugins loaded inline
  pluginPaths?: string[]                // paths to plugin packages
  extensionLoading?: "isolated" | "direct"
  extensionContext?: {                  // context passed to plugin setup()
    workspace?: { rootPath: string; cwd: string }
  }
  checkpointConfig?: CoreCheckpointConfig
  compactionConfig?: CoreCompactionConfig
  telemetry?: ITelemetryService
  logger?: BasicLogger
  enableSpawnAgent?: boolean            // enable sub-agent spawning
  enableAgentTeams?: boolean            // enable team coordination
  teamName?: string                     // team identifier
}
```

`extensions` passes plugin objects directly. `pluginPaths` points to directories with `package.json` containing a `trumbo.plugins` field. Set `extensionContext.workspace` so plugins receive `ctx.workspaceInfo` in their `setup()` call -- without it, `ctx.workspaceInfo` is undefined.

## Follow-Up Messages

### send({ sessionId, prompt })

Send a follow-up message to an existing session:

```typescript
const result = await trumbo.send({
  sessionId: session.sessionId,
  prompt: "Now add authentication",
})
```

Returns `AgentResult | undefined`.

## Event Subscription

### subscribe(listener, options?)

```typescript
const unsubscribe = trumbo.subscribe(
  (event: CoreSessionEvent) => {
    // handle events
  },
  { sessionId: "optional-filter" }
)
```

### CoreSessionEvent

```typescript
type CoreSessionEvent =
  | { type: "chunk"; payload: SessionChunkEvent }
  | { type: "agent_event"; payload: { sessionId: string, event: AgentEvent } }
  | { type: "ended"; payload: SessionEndedEvent }
  | { type: "team_progress"; payload: SessionTeamProgressEvent }
  | { type: "status"; payload: { sessionId: string, status: string } }
  | { type: "hook"; payload: SessionToolEvent }
```

## Session Management

### list(limit?, options?)

```typescript
const sessions: SessionRecord[] = await trumbo.list(50)
```

### get(sessionId)

```typescript
const session: SessionRecord = await trumbo.get(sessionId)
```

### readMessages(sessionId)

```typescript
const messages: AgentMessage[] = await trumbo.readMessages(sessionId)
```

### getAccumulatedUsage(sessionId)

```typescript
const usage = await trumbo.getAccumulatedUsage(sessionId)
// usage.usage - root agent only
// usage.aggregateUsage - root + subagents/teammates
```

### update(sessionId, updates)

```typescript
await trumbo.update(sessionId, { title: "New title" })
```

### abort(sessionId, reason?)

```typescript
await trumbo.abort(sessionId, "User cancelled")
```

### stop(sessionId)

```typescript
await trumbo.stop(sessionId)
```

### delete(sessionId)

```typescript
await trumbo.delete(sessionId)
```

### restore(input)

Restore a session from a checkpoint:

```typescript
await trumbo.restore({ sessionId, checkpointId })
```

### dispose(reason?)

Clean up all resources. Always call this when done:

```typescript
await trumbo.dispose("Shutting down")
```

## AgentResult

Returned by session operations:

```typescript
interface AgentResult {
  text: string
  usage: LegacyAgentUsage
  messages: MessageWithMetadata[]
  toolCalls: ToolCallRecord[]
  iterations: number
  finishReason: "completed" | "max_iterations" | "aborted" | "mistake_limit" | "error"
  model: { id: string; provider: string; info?: ModelInfo }
  startedAt: Date
  endedAt: Date
  durationMs: number
}
```

## Tool Policies

Control tool access at the session level:

```typescript
const session = await trumbo.start({
  prompt: "Review the code",
  config: { ... },
  toolPolicies: {
    read_files: { autoApprove: true },
    bash: { autoApprove: false },
    editor: { enabled: false },
  },
})
```

### ToolPolicy

```typescript
interface ToolPolicy {
  enabled?: boolean       // false = tool is hidden from the model
  autoApprove?: boolean   // false = requires approval callback
}
```

## Interactive Approval

```typescript
const trumbo = await TrumboCore.create({
  clientName: "my-app",
  capabilities: {
    requestToolApproval: async (request) => {
      console.log(`Tool: ${request.toolName}, Input: ${JSON.stringify(request.input)}`)
      const approved = await askUser(`Allow ${request.toolName}?`)
      return { approved }
    },
  },
})
```

## Automation API

When `automation` is enabled in `TrumboCore.create()`:

```typescript
const trumbo = await TrumboCore.create({
  clientName: "my-app",
  automation: true,
})

// Access automation methods
trumbo.automation.start()
trumbo.automation.stop()
trumbo.automation.reconcile(specs)
trumbo.automation.ingestEvent(event)
trumbo.automation.listEvents()
trumbo.automation.listSpecs()
trumbo.automation.listRuns()
```

## Settings API

```typescript
// Read settings
const settings = await trumbo.settings.list()

// Toggle tools, plugins, MCP servers
await trumbo.settings.toggle({ type: "tool", name: "bash", enabled: true })
```

## See Also

- `REFERENCE.md` - Overview and quick start
- `patterns.md` - Common patterns
- `gotchas.md` - Pitfalls
- `../tools/REFERENCE.md` - Tool creation
- `../plugins/REFERENCE.md` - Plugin system
