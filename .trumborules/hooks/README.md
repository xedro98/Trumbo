# Trumbo hooks

## Overview

Trumbo hooks let you run custom scripts at specific points in the agentic workflow. Hooks can live in either:
- **Global hooks directory**: `~/Documents/Trumbo/Hooks/` (applies to all workspaces)
- **Workspace hooks directory**: `.trumborules/hooks/` (applies to the workspace the repo belongs to)

Hooks run automatically when enabled.

## Enabling hooks

1. Open Trumbo settings in VS Code
2. Go to the Feature Settings section
3. Check "Enable Hooks"
4. Hook files must be executable (on Unix/Linux/macOS: `chmod +x hookname`)

## Available hooks

### TaskStart
- **When**: a NEW task is started (not when resuming)
- **Purpose**: initialize task context, validate task requirements, set up the environment
- **Global location**: `~/Documents/Trumbo/Hooks/TaskStart`
- **Workspace location**: `.trumborules/hooks/TaskStart`

### TaskResume
- **When**: an EXISTING task is resumed (after the user clicks resume)
- **Purpose**: validate resumed task state, restore context, check for changes since the last run
- **Global location**: `~/Documents/Trumbo/Hooks/TaskResume`
- **Workspace location**: `.trumborules/hooks/TaskResume`

### TaskCancel
- **When**: a task is cancelled or a hook is aborted by the user (only when there is active work or work was started)
- **Purpose**: clean up resources, log cancellation, save state
- **Global location**: `~/Documents/Trumbo/Hooks/TaskCancel`
- **Workspace location**: `.trumborules/hooks/TaskCancel`
- **Note**: this hook is NOT cancellable

### TaskComplete (coming soon)
- **When**: a task is marked as complete
- **Purpose**: log completion status, perform final cleanup, generate reports
- **Global location**: `~/Documents/Trumbo/Hooks/TaskComplete`
- **Workspace location**: `.trumborules/hooks/TaskComplete`

### UserPromptSubmit
- **When**: the user submits a prompt/message (initial task, resume, or feedback)
- **Purpose**: validate user input, preprocess prompts, add context to user messages
- **Global location**: `~/Documents/Trumbo/Hooks/UserPromptSubmit`
- **Workspace location**: `.trumborules/hooks/UserPromptSubmit`

### PreToolUse
- **When**: BEFORE a tool executes
- **Purpose**: validate parameters, block execution, or add context
- **Global location**: `~/Documents/Trumbo/Hooks/PreToolUse`
- **Workspace location**: `.trumborules/hooks/PreToolUse`

### PostToolUse
- **When**: AFTER a tool completes
- **Purpose**: observe results, track patterns, or add context
- **Global location**: `~/Documents/Trumbo/Hooks/PostToolUse`
- **Workspace location**: `.trumborules/hooks/PostToolUse`

### PreCompact (coming soon)
- **When**: BEFORE the conversation context is compacted/truncated
- **Purpose**: observe compaction events, log context management, track token usage
- **Global location**: `~/Documents/Trumbo/Hooks/PreCompact`
- **Workspace location**: `.trumborules/hooks/PreCompact`

## Cross-platform hook format

Trumbo uses a git-style approach for hooks that works consistently across platforms:

### Hook files (all platforms)
- **No file extensions**: hooks are named exactly `PreToolUse` or `PostToolUse` (no `.bat`, `.cmd`, `.sh`, etc.)
- **Shebang required**: the first line must be a shebang (e.g. `#!/usr/bin/env bash` or `#!/usr/bin/env node`)
- **Executable on Unix**: on Unix/Linux/macOS, hooks must be executable: `chmod +x PreToolUse`
- **Windows**: not currently supported

### How it works

Like git hooks, Trumbo executes hook files through a shell that interprets the shebang line:
- On Unix/Linux/macOS: native shell execution with shebang support

This means:
- The same hook script works on every supported platform
- Write once, run anywhere
- Use any scripting language (bash, node, python, etc.)

### Creating hooks

**On Unix/Linux/macOS:**
```bash
# Create the hook file
nano ~/Documents/Trumbo/Hooks/PreToolUse

# Make it executable
chmod +x ~/Documents/Trumbo/Hooks/PreToolUse
```

## Context injection timing

**Important**: context injected by hooks affects **future AI decisions**, not the current tool execution.

### Why this matters

When a hook runs:
1. The AI has already decided which tool to use and with what parameters
2. The hook cannot modify those parameters
3. Context from the hook is added to the conversation
4. The AI sees this context in the **next API request** and can adjust future decisions

### PreToolUse hook flow
```
1. AI decides: "I'll use write_to_file with these parameters"
2. PreToolUse hook runs → can block or add context
3. If allowed, the tool executes with the original parameters
4. Context is added to the conversation
5. The next API request includes this context
6. AI adjusts future decisions based on the context
```

### PostToolUse hook flow
```
1. The tool completes execution
2. PostToolUse hook runs → observes the results
3. The hook adds context about the outcome
4. Context is added to the conversation
5. The next API request includes this context
6. AI can learn from the results
```

## Hook input / output

### Input (via stdin as JSON)

All hooks receive:
```json
{
  "trumboVersion": "string",
  "hookName": "TaskStart" | "TaskResume" | "TaskCancel" | "TaskComplete" | "UserPromptSubmit" | "PreToolUse" | "PostToolUse" | "PreCompact",
  "timestamp": "string",
  "taskId": "string",
  "workspaceRoots": ["string"],
  "userId": "string",
  "taskStart": {  // Only for TaskStart
    "taskMetadata": {
      "taskId": "string",
      "ulid": "string",
      "initialTask": "string"
    }
  },
  "taskResume": {  // Only for TaskResume
    "taskMetadata": {
      "taskId": "string",
      "ulid": "string"
    },
    "previousState": {
      "lastMessageTs": "string",
      "messageCount": "string",
      "conversationHistoryDeleted": "string"
    }
  },
  "taskCancel": {  // Only for TaskCancel
    "taskMetadata": {
      "taskId": "string",
      "ulid": "string",
      "completionStatus": "string"
    }
  },
  "taskComplete": {  // Only for TaskComplete
    "taskMetadata": {
      "taskId": "string",
      "ulid": "string"
    }
  },
  "userPromptSubmit": {  // Only for UserPromptSubmit
    "prompt": "string",
    "attachments": ["string"]
  },
  "preToolUse": {  // Only for PreToolUse
    "toolName": "string",
    "parameters": {}
  },
  "postToolUse": {  // Only for PostToolUse
    "toolName": "string",
    "parameters": {},
    "result": "string",
    "success": boolean,
    "executionTimeMs": number
  },
  "preCompact": {  // Only for PreCompact
    "contextSize": number,
    "messagesToCompact": number,
    "compactionStrategy": "string"
  }
}
```

### Output (via stdout as JSON)

All hooks must return:
```json
{
  "cancel": boolean,                   // Required: false to continue, true to block execution
  "contextModification": "string",     // Optional: context for future AI decisions
  "errorMessage": "string"             // Optional: error details if blocking
}
```

**Note**: the `cancel` field works as follows:
- `false` (or omitted): allow execution to continue
- `true`: block execution and show the error message to the user

## Hook execution limits

- **Timeout**: hooks must complete within 30 seconds (configurable via `HOOK_EXECUTION_TIMEOUT_MS`)
- **Context size**: context modifications are capped at 50KB (configurable via `MAX_CONTEXT_MODIFICATION_SIZE`)
- **Error handling**: expected errors (file not found, permission denied, not a directory) are handled silently; unexpected filesystem errors are propagated

## Common use cases

### 1. Validation — block invalid operations

```bash
#!/usr/bin/env bash
input=$(cat)
tool_name=$(echo "$input" | jq -r '.preToolUse.toolName')
path=$(echo "$input" | jq -r '.preToolUse.parameters.path // ""')

if [[ "$tool_name" == "write_to_file" && "$path" == *.js ]]; then
  cat <<EOF
{
  "cancel": true,
  "errorMessage": "Cannot create .js files in TypeScript project",
  "contextModification": "Use .ts/.tsx extensions only"
}
EOF
  exit 0
fi

echo '{"cancel": false}'
```

### 2. Context building — learn from operations

```bash
#!/usr/bin/env bash
input=$(cat)
tool_name=$(echo "$input" | jq -r '.postToolUse.toolName')
success=$(echo "$input" | jq -r '.postToolUse.success')
path=$(echo "$input" | jq -r '.postToolUse.parameters.path // ""')

if [[ "$tool_name" == "write_to_file" && "$success" == "true" ]]; then
  cat <<EOF
{
  "cancel": false,
  "contextModification": "Created '$path'. Maintain consistency with this file's patterns in future operations."
}
EOF
else
  echo '{"cancel": false}'
fi
```

### 3. Performance monitoring

```bash
#!/usr/bin/env bash
input=$(cat)
execution_time=$(echo "$input" | jq -r '.postToolUse.executionTimeMs')
tool_name=$(echo "$input" | jq -r '.postToolUse.toolName')

if [[ "$execution_time" -gt 5000 ]]; then
  cat <<EOF
{
  "cancel": false,
  "contextModification": "Tool '$tool_name' took ${execution_time}ms. Consider optimizing future similar operations."
}
EOF
else
  echo '{"cancel": false}'
fi
```

### 4. Logging and telemetry

```bash
#!/usr/bin/env bash
input=$(cat)

# Log to file
echo "$input" >> ~/.trumbo/hook-logs/tool-usage.jsonl

# Allow execution
echo '{"cancel": false}'
```

## Global vs workspace hooks

Trumbo supports two levels of hooks:

### Global hooks
- **Location**: `~/Documents/Trumbo/Hooks/` (macOS/Linux)
- **Scope**: all workspaces and projects
- **Use case**: organization-wide policies, personal preferences, universal validations
- **Priority**: order not guaranteed when combined with workspace hooks

### Workspace hooks
- **Location**: `.trumborules/hooks/` in each workspace root
- **Scope**: only the specific workspace
- **Use case**: project-specific rules, team conventions, repository requirements
- **Priority**: order not guaranteed when combined with global hooks

### Hook execution

When multiple hooks exist (global and/or workspace):
- All hooks for a given step run **concurrently** using `Promise.all`
- **Execution order is not guaranteed** — hooks run in parallel
- If ALL hooks allow execution (`cancel: false`), the tool proceeds
- If ANY hook blocks (`cancel: true`), execution is blocked

**Result combination:**
- `cancel`: if ANY hook returns `true`, execution is blocked
- `contextModification`: all context strings are concatenated with double newlines (`\n\n`)
- `errorMessage`: all error messages are concatenated with single newlines (`\n`)

### Setting up global hooks

1. The global hooks directory is created automatically at:
   - macOS/Linux: `~/Documents/Trumbo/Hooks/`

2. Add your hook script:
   ```bash
   # Unix/Linux/macOS
   nano ~/Documents/Trumbo/Hooks/PreToolUse
   chmod +x ~/Documents/Trumbo/Hooks/PreToolUse
   ```

3. Enable hooks in Trumbo settings.

### Example: global + workspace hooks

**Global hook** (applies to all projects):
```bash
#!/usr/bin/env bash
# ~/Documents/Trumbo/Hooks/PreToolUse
# Universal rule: never delete package.json
input=$(cat)
tool_name=$(echo "$input" | jq -r '.preToolUse.toolName')
path=$(echo "$input" | jq -r '.preToolUse.parameters.path // ""')

if [[ "$tool_name" == "write_to_file" && "$path" == *"package.json"* ]]; then
  echo '{"cancel": true, "errorMessage": "Global policy: Cannot modify package.json"}'
  exit 0
fi

echo '{"cancel": false}'
```

**Workspace hook** (applies to a specific project):
```bash
#!/usr/bin/env bash
# .trumborules/hooks/PreToolUse
# Project rule: TypeScript files only
input=$(cat)
tool_name=$(echo "$input" | jq -r '.preToolUse.toolName')
path=$(echo "$input" | jq -r '.preToolUse.parameters.path // ""')

if [[ "$tool_name" == "write_to_file" && "$path" == *.js ]]; then
  echo '{"cancel": true, "errorMessage": "Project rule: Use .ts files only"}'
  exit 0
fi

echo '{"cancel": false}'
```

**All hooks must allow execution for the tool to proceed.** Hooks may execute concurrently.

## Multi-root workspaces

With multiple workspace roots, you can place hooks in each root's `.trumborules/hooks/` directory. All hooks (global and workspace) may execute concurrently. Their results are combined:

- **cancel**: if ANY hook returns `true`, execution is blocked
- **contextModification**: all context modifications are concatenated
- **errorMessage**: all error messages are concatenated

**Note:** no execution order is guaranteed between hooks from different directories.

## Troubleshooting

### Hook not running
- Ensure "Enable Hooks" is checked in settings
- Verify the hook file is executable (`chmod +x hookname`)
- Check the hook file for syntax errors
- Look for errors in VS Code's Output panel (Trumbo channel)

### Hook timing out
- Reduce the complexity of the hook script
- Avoid expensive operations (network calls, heavy computation)
- Move complex logic to a background process

### Context not affecting behavior
- Remember: context affects FUTURE decisions, not the current tool
- Make context modifications clear and actionable
- Check that context isn't being truncated (50KB limit)

## Security considerations

- Hooks run with the same permissions as VS Code
- Be cautious with hooks from untrusted sources
- Review hook scripts before enabling them
- Consider `.gitignore` to avoid committing sensitive hook logic
- Hooks can access all workspace files and environment variables

## Best practices

1. **Keep hooks fast** — aim for <100ms execution time
2. **Make context actionable** — be specific about what the AI should do
3. **Use structured prefixes** — help the AI categorize context
4. **Handle errors gracefully** — always return valid JSON
5. **Log for debugging** — keep logs of hook executions for troubleshooting
6. **Test incrementally** — start with simple hooks and add complexity
7. **Document your hooks** — add comments explaining the purpose and logic
