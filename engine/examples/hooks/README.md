```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Hook Examples

Examples for file-based hooks and runtime hooks in Trumbo.

## Hook terminology

Use these terms consistently:

- **Runtime hooks** — typed, in-process plugin/agent lifecycle callbacks such
  as `beforeRun`, `beforeModel`, and `afterTool`.
- **File hooks** — external scripts discovered from hook config directories and
  run with a serialized JSON payload on stdin.
- **Hook events** — the serialized payload names file hooks receive, such as
  `agent_end`, `tool_call`, and `prompt_submit`.

File hooks are an adapter on top of the runtime hook layer. Core discovers hook
files, maps their event names onto runtime hook callbacks, then runs the
matching script with a JSON payload on stdin.

## File hooks vs runtime hooks

| File hook file name | File hook event | Runtime hook backing it |
| ------------------- | --------------- | ----------------------- |
| `TaskStart` | `agent_start` | `beforeRun` |
| `TaskResume` | `agent_resume` | `beforeRun` with resume context |
| `UserPromptSubmit` | `prompt_submit` | `beforeRun` plus submitted prompt context |
| `PreToolUse` | `tool_call` | `beforeTool` |
| `PostToolUse` | `tool_result` | `afterTool` |
| `TaskComplete` | `agent_end` | `afterRun` when completed |
| `TaskError` | `agent_error` | `afterRun` when failed |
| `TaskCancel` | `agent_abort` | `afterRun` or session shutdown with an abort/cancel reason |
| `SessionShutdown` | `session_shutdown` | session cleanup / runtime shutdown |
| `PreCompact` | not wired for file hooks today | none |

Reach for **file hooks** when you want a workspace- or user-configured shell or
Python script. Reach for **runtime hooks** when you're writing a plugin and need
typed, in-process access to runtime state, or want to influence model and tool
execution directly.

`beforeRun` and `afterRun` wrap a single runtime `run()` or `continue()` call —
in an interactive session, that's one user turn. `afterRun` fires for completed,
aborted, and failed runs; check `result.status` if you only care about
successful completions.

For file hooks, successful task completion maps to the `agent_end` event. For a
plugin, use `afterRun` and check `result.status === "completed"`.

## Examples in this directory

### Bash

#### `PreToolUse.sh`

Log every tool call and its inputs. Handy for auditing what the agent is about
to do.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse.sh .trumbo/hooks/
chmod +x .trumbo/hooks/PreToolUse.sh
trumbo -i "do something"  # tool calls get logged to stderr
```

#### `PostToolUse.sh`

Inspect tool results and add supplementary context.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PostToolUse.sh .trumbo/hooks/
chmod +x .trumbo/hooks/PostToolUse.sh
trumbo -i "do something"  # tool results logged and enriched
```

#### `PreToolUse_BlockDestructive.sh`

Block destructive operations such as force pushes or bulk deletes.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse_BlockDestructive.sh .trumbo/hooks/PreToolUse.sh
chmod +x .trumbo/hooks/PreToolUse.sh
trumbo -i "clean up the repo"  # destructive ops get blocked
```

#### `PreToolUse_RequireReview.sh`

Require a human review before certain operations (writes to critical files).

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse_RequireReview.sh .trumbo/hooks/PreToolUse.sh
chmod +x .trumbo/hooks/PreToolUse.sh
trumbo -i "update dependencies"  # critical-file writes pause for review
```

#### `PreToolUse_InjectFileContext.sh`

Pull related file context into the agent's next turn before a tool runs —
related tests, lock files, environment context.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse_InjectFileContext.sh .trumbo/hooks/PreToolUse.sh
chmod +x .trumbo/hooks/PreToolUse.sh
trumbo -i "review the configuration"  # related files mentioned automatically
```

#### `TaskStart.sh`, `TaskComplete.sh`, `SessionShutdown.sh`

Track agent session lifecycle events — start, end, shutdown.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/TaskStart.sh .trumbo/hooks/
cp examples/hooks/TaskComplete.sh .trumbo/hooks/
cp examples/hooks/SessionShutdown.sh .trumbo/hooks/
chmod +x .trumbo/hooks/Task*.sh .trumbo/hooks/SessionShutdown.sh
trumbo -i "do something"  # session lifecycle gets logged
```

### Python

#### `PreToolUse.py`

A Python hook to log and filter tool calls.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse.py .trumbo/hooks/
chmod +x .trumbo/hooks/PreToolUse.py
trumbo -i "do something"  # Python hook logs tool calls
```

#### `PostToolUse.py`

A Python post-tool-use hook for result enrichment.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PostToolUse.py .trumbo/hooks/
chmod +x .trumbo/hooks/PostToolUse.py
trumbo -i "do something"  # Python hook enriches tool results
```

#### `PreToolUse_InjectContext.py`

Python context injection with file analysis — test files, config files, lock
files, Node version, git branch.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse_InjectContext.py .trumbo/hooks/PreToolUse.py
chmod +x .trumbo/hooks/PreToolUse.py
trumbo -i "add a new feature"  # related files and environment injected
```

### TypeScript

#### `PreToolUse.ts`

A TypeScript hook for advanced tool-call filtering and logging.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse.ts .trumbo/hooks/
chmod +x .trumbo/hooks/PreToolUse.ts
trumbo -i "do something"  # TypeScript hook runs via bun
```

#### `PostToolUse.ts`

A TypeScript hook for post-execution actions.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PostToolUse.ts .trumbo/hooks/
chmod +x .trumbo/hooks/PostToolUse.ts
trumbo -i "do something"  # TypeScript hook runs via bun
```

#### `PreToolUse_ModifyInput.ts`

Rewrite tool inputs before execution — normalize paths, add defaults, sanitize.

```bash
mkdir -p .trumbo/hooks
cp examples/hooks/PreToolUse_ModifyInput.ts .trumbo/hooks/PreToolUse.ts
chmod +x .trumbo/hooks/PreToolUse.ts
trumbo -i "install dependencies"  # npm install gets --save-exact added automatically
```

## Getting started

### 1. Copy a hook into your project

File hooks live in `.trumbo/hooks/` and are named after the event they handle:

```bash
mkdir -p .trumbo/hooks

# Copy a PreToolUse example (pick a language)
cp examples/hooks/PreToolUse.sh .trumbo/hooks/PreToolUse.sh      # Bash
cp examples/hooks/PreToolUse.py .trumbo/hooks/PreToolUse.py      # Python
cp examples/hooks/PreToolUse.ts .trumbo/hooks/PreToolUse.ts      # TypeScript

# Copy a PostToolUse example
cp examples/hooks/PostToolUse.sh .trumbo/hooks/PostToolUse.sh    # Bash
cp examples/hooks/PostToolUse.py .trumbo/hooks/PostToolUse.py    # Python
cp examples/hooks/PostToolUse.ts .trumbo/hooks/PostToolUse.ts    # TypeScript
```

### 2. Make it executable

```bash
chmod +x .trumbo/hooks/PreToolUse.*
chmod +x .trumbo/hooks/PostToolUse.*
```

### 3. Test it

```bash
trumbo -i "test prompt"
# Or load hooks from a custom directory:
trumbo --hooks-dir ./my-hooks -i "test prompt"
```

## Hook input/output format

Every hook receives a JSON event on stdin and must return JSON on stdout.

### Input

**PreToolUse event:**

```json
{
  "hookName": "tool_call",
  "trumboVersion": "1.0.0",
  "timestamp": "2026-01-15T10:30:00Z",
  "taskId": "conv-123",
  "workspaceRoots": ["/path/to/repo"],
  "userId": "user",
  "iteration": 1,
  "tool_call": {
    "id": "call-456",
    "name": "read_files",
    "input": {"filePath": "/path/to/file.ts"}
  }
}
```

**PostToolUse event:**

```json
{
  "hookName": "tool_result",
  "trumboVersion": "1.0.0",
  "timestamp": "2026-01-15T10:30:00Z",
  "tool_result": {
    "id": "call-456",
    "name": "read_files",
    "input": {"filePath": "/path/to/file.ts"},
    "output": "file contents here",
    "error": null,
    "durationMs": 45
  }
}
```

**TaskStart and other lifecycle events:**

```json
{
  "hookName": "agent_start",
  "trumboVersion": "1.0.0",
  "timestamp": "2026-01-15T10:30:00Z",
  "taskId": "conv-123",
  "workspaceRoots": ["/path/to/repo"],
  "userId": "user"
}
```

### Output

Print a JSON object to stdout. An empty `{}` means "do nothing."

Available fields:

| Field | Type | Effect | Event(s) |
|-------|------|--------|----------|
| `cancel` | boolean | Cancels the pending tool call | `PreToolUse` |
| `review` | boolean | Pauses and prompts for user review | `PreToolUse` |
| `context` | string | Injects context into the agent's next turn | `PreToolUse`, `PostToolUse` |
| `errorMessage` | string | Surfaces an error to the agent | `PreToolUse` |
| `overrideInput` | object | Replaces tool input before execution | `PreToolUse` |

## Common patterns

### Log and proceed (bash)

```bash
#!/usr/bin/env bash
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_call.name')
echo "Action: $tool" >&2
echo '{}'
```

### Inject context into the next turn

```bash
#!/usr/bin/env bash
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_call.name')
if [ "$tool" = "run_commands" ]; then
  branch=$(git branch --show-current 2>/dev/null)
  echo "{\"context\": \"Current branch: $branch\"}"
else
  echo '{}'
fi
```

### Modify tool input before execution

```bash
#!/usr/bin/env bash
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_call.name')
file=$(echo "$input" | jq -r '.tool_call.input.filePath')

if [ "$tool" = "read_files" ] && [[ $file == ~/* ]]; then
  normalized="${file/#\~/$HOME}"
  echo "{\"overrideInput\": {\"filePath\": \"$normalized\"}}"
else
  echo '{}'
fi
```

### Block specific tools or commands

```bash
#!/usr/bin/env bash
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_call.name')
cmd=$(echo "$input" | jq -r '.tool_call.input.command // empty')

if [ "$tool" = "run_commands" ] && [[ $cmd =~ git\ push\ --force ]]; then
  echo '{"cancel": true, "errorMessage": "Force push is blocked."}'
else
  echo '{}'
fi
```

### Require review for sensitive files

```bash
#!/usr/bin/env bash
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_call.name')
file=$(echo "$input" | jq -r '.tool_call.input.filePath // empty')

if ([ "$tool" = "editor" ] || [ "$tool" = "write_file" ]) && \
   [[ $file =~ (package\.json|\.env|secrets|tsconfig) ]]; then
  echo '{"review": true, "context": "This will modify a critical file"}'
else
  echo '{}'
fi
```

### Python: parse and manipulate JSON

```python
#!/usr/bin/env python3
import sys
import json

event = json.load(sys.stdin)
tool_name = event.get("tool_call", {}).get("name", "")
tool_input = event.get("tool_call", {}).get("input", {})

if tool_name == "read_files":
    file_path = tool_input.get("filePath", "")
    if file_path.endswith(".test.ts"):
        print(json.dumps({"context": "This is a test file"}))
    else:
        print(json.dumps({}))
else:
    print(json.dumps({}))
```

### TypeScript: type-safe hook with async operations

```typescript
#!/usr/bin/env bun
interface HookEvent {
  tool_call: { name: string; input: Record<string, unknown> };
}

const event: HookEvent = JSON.parse(await Bun.stdin.text());
const toolName = event.tool_call.name;

if (toolName === "run_commands") {
  const branch = await getGitBranch();
  console.log(JSON.stringify({ context: `Branch: ${branch}` }));
} else {
  console.log(JSON.stringify({}));
}

async function getGitBranch(): Promise<string> {
  return "main";
}
```

## Debugging hooks

### Print hook invocations

```bash
trumbo --verbose "your prompt"
```

### Test a hook manually

```bash
echo '{"tool_call": {"name": "read_files", "input": {"filePath": "test.ts"}}}' | .trumbo/hooks/PreToolUse.sh
```

### Inspect hook output

```bash
.trumbo/hooks/PreToolUse.sh < input.json | jq .
```

## Runtime hooks: custom compaction

File hooks observe lifecycle events. For heavier work like message compaction,
use a TypeScript runtime hook plugin instead:

```bash
trumbo plugin install https://github.com/xedro98/trembo/blob/main/engine/examples/hooks/custom-compaction-hook.example.ts --cwd .

trumbo -i "Search the codebase for dispatcher usage, then summarize it"
```

This example uses `hooks.beforeModel` to estimate request size and replace older
middle history with a summary message before the provider request goes out.

### Runtime hook vs message-builder compaction

| Example | Extension point | Message shape | Best for |
| ------- | --------------- | ------------- | -------- |
| `custom-compaction-hook.example.ts` (in `.trumbo/plugins/`) | `hooks.beforeModel` runtime hook | Agent runtime request messages with runtime parts such as `tool-call`, `tool-result`, `reasoning`, `image`, and `file` | Cases that need runtime-hook context, the current runtime snapshot, or direct request mutation |
| `plugins/custom-compaction.ts` | `api.registerMessageBuilder()` | SDK/provider-bound `Message[]` after runtime messages are converted for model delivery | Most reusable, plugin-owned message rewrites and compaction policies |

Prefer `registerMessageBuilder()` for normal plugin-owned provider-message
rewrites — it runs in the core message pipeline before the built-in
provider-safety builder. Reach for `beforeModel` only when the compaction logic
needs runtime hook context or has to inspect the exact runtime request object.

## Tips

- **Hooks are disabled in `--yolo` mode** — use `--act` or `--plan` to enable
  them.
- **Log to stderr, return JSON on stdout** — stdout is reserved for the JSON
  result.
- **Keep hooks fast** — they run before every tool call, so latency adds up.
- **Test with `jq`** — JSON parsing is finicky; `jq` makes extraction safe.
- **Run multiple hooks** — different event files can coexist in
  `.trumbo/hooks/`.
- **Load from custom dirs** — `--hooks-dir ./ci/hooks` loads hooks from
  elsewhere.
