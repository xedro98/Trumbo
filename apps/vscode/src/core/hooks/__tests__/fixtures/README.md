```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Hook Test Fixtures

This directory ships ready-made hook scripts for exercising the Trembo hooks system. Each fixture targets a single, well-defined scenario so tests stay small and predictable.

## Directory Structure

```
fixtures/
├── hooks/
│   ├── pretooluse/       # PreToolUse hook fixtures
│   │   ├── success/      # Returns success immediately
│   │   ├── blocking/     # Blocks tool execution
│   │   ├── context-injection/  # Adds context with type prefix
│   │   └── error/        # Exits with error code
│   ├── posttooluse/      # PostToolUse hook fixtures
│   │   ├── success/      # Returns success immediately
│   │   └── error/        # Exits with error code
│   └── template/         # Template for new hooks
└── inputs/               # Sample input data (future)
```

## Using Fixtures in Tests

### With loadFixture()

The `loadFixture()` helper copies a fixture into your test environment:

```typescript
import { loadFixture } from '../test-utils'

it("should work with real hook", async () => {
  const { getEnv } = setupHookTests()

  await loadFixture("hooks/pretooluse/success", getEnv().tempDir)

  const factory = new HookFactory()
  const runner = await factory.create("PreToolUse")
  const result = await runner.run(buildPreToolUseInput({ toolName: "test_tool" }))

  result.cancel.should.be.false()
})
```

### Direct File Copy

If you need finer control, you can also copy the fixture files by hand.

## Available Fixtures

### PreToolUse Hooks

#### `hooks/pretooluse/success`
- **Returns**: `{ cancel: false, contextModification: "PreToolUse hook executed successfully", errorMessage: "" }`
- **Use for**: happy-path scenarios

#### `hooks/pretooluse/blocking`
- **Returns**: `{ cancel: true, contextModification: "", errorMessage: "Tool execution blocked by hook" }`
- **Use for**: verifying that tool execution can be blocked

#### `hooks/pretooluse/context-injection`
- **Returns**: `{ cancel: false, contextModification: "WORKSPACE_RULES: Tool [toolName] requires review", errorMessage: "" }`
- **Use for**: context injection with type prefixes
- **Note**: dynamically includes the tool name from the input

#### `hooks/pretooluse/error`
- **Behavior**: prints an error to stderr and exits with code 1
- **Use for**: error-handling paths

### PostToolUse Hooks

#### `hooks/posttooluse/success`
- **Returns**: `{ cancel: false, contextModification: "PostToolUse hook executed successfully", errorMessage: "" }`
- **Use for**: confirming PostToolUse runs

#### `hooks/posttooluse/error`
- **Behavior**: prints an error to stderr and exits with code 1
- **Use for**: error handling in PostToolUse

### UserPromptSubmit Hooks

#### `hooks/userpromptsubmit/success`
- **Returns**: `{ cancel: false, contextModification: "Prompt approved", errorMessage: "" }`
- **Use for**: successful prompt submission

#### `hooks/userpromptsubmit/blocking`
- **Returns**: `{ cancel: true, contextModification: "", errorMessage: "Prompt violates policy" }`
- **Use for**: blocking a prompt submission

#### `hooks/userpromptsubmit/context-injection`
- **Returns**: `{ cancel: false, contextModification: "CONTEXT_INJECTION: User is in plan mode", errorMessage: "" }`
- **Use for**: injecting context into the task request

#### `hooks/userpromptsubmit/multiline`
- **Returns**: `{ cancel: false, contextModification: "Line count: N", errorMessage: "" }`
- **Use for**: multiline prompt handling
- **Note**: dynamically counts newlines in the prompt

#### `hooks/userpromptsubmit/large-prompt`
- **Returns**: `{ cancel: false, contextModification: "Prompt size: N", errorMessage: "" }`
- **Use for**: large prompt handling
- **Note**: dynamically reports the prompt's character count

#### `hooks/userpromptsubmit/special-chars`
- **Returns**: `{ cancel: false, contextModification: "Special chars preserved" | "Missing special chars", errorMessage: "" }`
- **Use for**: special character preservation
- **Note**: checks for `@`, `#`, and `$`

#### `hooks/userpromptsubmit/empty-prompt`
- **Returns**: `{ cancel: false, contextModification: "Prompt length: 0", errorMessage: "" }`
- **Use for**: empty prompt handling
- **Note**: safely handles undefined or empty prompts

#### `hooks/userpromptsubmit/malformed-json`
- **Behavior**: outputs invalid JSON (`"not valid json"`)
- **Use for**: malformed JSON error handling

#### `hooks/userpromptsubmit/error`
- **Behavior**: prints an error to stderr and exits with code 1
- **Use for**: error handling in UserPromptSubmit

### TaskStart Hooks

#### `hooks/taskstart/success`
- **Returns**: `{ cancel: false, contextModification: "TaskStart hook executed successfully", errorMessage: "" }`
- **Use for**: the TaskStart success path, letting the task proceed

#### `hooks/taskstart/blocking`
- **Returns**: `{ cancel: true, contextModification: "", errorMessage: "Task execution blocked by hook" }`
- **Use for**: blocking a task at start (e.g. policy enforcement)

#### `hooks/taskstart/error`
- **Behavior**: prints an error to stderr and exits with code 1
- **Use for**: error handling in TaskStart hooks

## Platform Considerations

Hooks run cross-platform, but the runtime differs by OS:

- **Linux/macOS**: executable hook files run directly via shebang and the executable bit
- **Windows**: hooks execute through PowerShell; tests may use a small PowerShell bridge script that pipes stdin into a Node companion file

### Creating New Fixtures

1. Create a new directory under the appropriate hook type
2. Add the hook script with shebang `#!/usr/bin/env node`
3. Make executable: `chmod +x HookName`
4. Update this README with the new fixture

### Example: Creating a new fixture

```bash
# Create directory
mkdir -p src/core/hooks/__tests__/fixtures/hooks/pretooluse/my-new-scenario

# Create hook script
cat > src/core/hooks/__tests__/fixtures/hooks/pretooluse/my-new-scenario/PreToolUse << 'EOF'
#!/usr/bin/env node
const input = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log(JSON.stringify({
  cancel: false,
  contextModification: "My custom context",
  errorMessage: ""
}));
EOF

# Make executable
chmod +x src/core/hooks/__tests__/fixtures/hooks/pretooluse/my-new-scenario/PreToolUse
```

## Maintenance

- Keep fixtures simple and focused on a single scenario
- Fixtures are Node.js scripts that work across platforms
- Update this README whenever you add a new fixture
- Remove obsolete fixtures and update any references to them
