```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Hook Template for New Fixtures

This directory is the starting point for new hook fixtures. When you need a new fixture, copy from this template and tailor it to your scenario.

## Files in This Template

- `HookName` — hook script template (an executable Node.js script)
- `README.md` — this file

## How to Create a New Fixture

### Step 1: Choose the Scenario Type

Decide what your hook fixture should test:

- `success` — returns success immediately
- `blocking` — blocks tool execution
- `context-injection` — adds context information
- `error` — exits with an error code

### Step 2: Create the Directory Structure

```bash
# Example for a new PreToolUse validation fixture
mkdir -p src/core/hooks/__tests__/fixtures/hooks/pretooluse/validation/

# Copy template file
cp src/core/hooks/__tests__/fixtures/template/HookName src/core/hooks/__tests__/fixtures/hooks/pretooluse/validation/PreToolUse

# Make executable
chmod +x src/core/hooks/__tests__/fixtures/hooks/pretooluse/validation/PreToolUse
```

### Step 3: Customize the Hook Script

Edit the new fixture file to implement your specific logic:

```javascript
#!/usr/bin/env node

const input = JSON.parse(require('fs').readFileSync(0, 'utf-8'));

// Extract relevant data
const { toolName, parameters } = input.preToolUse;

let shouldContinue = true;
let contextModification = "";
let errorMessage = "";

// Your custom logic here
if (!parameters || !parameters.path) {
  shouldContinue = false;
  errorMessage = "ERROR: Tool requires a 'path' parameter";
} else {
  contextModification = "VALIDATION: Basic input validation passed";
}

// Return standardized output
console.log(JSON.stringify({
  shouldContinue,
  contextModification,
  errorMessage
}));
```

### Step 4: Update Documentation

Add your new fixture to `fixtures/README.md` with:

- Fixture path
- What it returns
- What it's used for testing
- Any special behavior notes

## Best Practices

### Keep Fixtures Focused

- Test one specific scenario per fixture
- Use simple, easy-to-follow logic
- Document complex behavior with comments

### Platform Compatibility

- Write portable Node.js code
- These fixtures run via an embedded shell (like git hooks)
- Avoid platform-specific logic

### Naming Conventions

- Use UPPERCASE for context type prefixes (e.g. `WORKSPACE_RULES:`, `FILE_OPERATIONS:`)
- Pick names that describe what the fixture tests
- Follow the naming patterns already used by existing fixtures

## Examples from Existing Fixtures

See the existing fixtures for real-world examples:

- `../hooks/pretooluse/success/` — a simple success case
- `../hooks/pretooluse/blocking/` — how to block execution
- `../hooks/pretooluse/context-injection/` — how to inject context
- `../hooks/pretooluse/error/` — how to return errors
