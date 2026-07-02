```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# E2E Tests

End-to-end tests for the Trembo VS Code extension, driven by Playwright against a real VS Code instance. Each test simulates a user interacting with the extension the way a human would.

## Test Structure

The suite is built from a few cooperating pieces:

### Test Files

- **`auth.test.ts`** — API key setup, provider selection, and navigation into settings
- **`chat.test.ts`** — chat behavior: sending messages, switching modes (Plan/Act), slash commands, and @ mentions
- **`diff.test.ts`** — the diff editor for file modifications
- **`editor.test.ts`** — code actions, editor panel integration, and code selection features

### Test Infrastructure

- **`utils/helpers.ts`** — core test utilities and fixtures:
  - `e2e` — main test fixture for single-root workspace tests
  - `e2eMultiRoot` — test fixture for multi-root workspace tests
  - `E2ETestHelper` — helper class with utilities for VS Code interaction
- **`utils/common.ts`** — common utility functions for UI interactions
- **`utils/global.setup.ts`** — global test setup and cleanup
- **`utils/build.mjs`** — build script for test environment preparation

### Test Fixtures

- **`fixtures/workspace/`** — single-root workspace test files (HTML, TypeScript, etc.)
- **`fixtures/workspace_2/`** — additional workspace with Python provider files
- **`fixtures/multiroots.code-workspace`** — multi-root workspace configuration
- **`fixtures/server/`** — mock API server for testing Trembo's backend interactions

## Running Tests

### Basic Test Execution

Build the test environment and run the full E2E suite:

```bash
bun run test:e2e
```

Run the suite without rebuilding the environment (handy when only test files changed):

```bash
bun run e2e
```

### Debug Mode

Run E2E tests under Playwright's interactive debugger:

```bash
bun run test:e2e -- --debug
# Or run the tests only, without rebuilding
bun run e2e -- --debug
```

In debug mode, Playwright will:

- Open a browser window showing the VS Code instance
- Pause execution at the start of each test
- Let you step through test actions
- Provide a console for inspecting elements and state

### Additional Options

Run a specific test file:

```bash
bun run e2e -- auth.test.ts
```

Run tests matching a tag or pattern:

```bash
bun run e2e -- --grep "Chat"
```

Run tests in headed mode (visible browser):

```bash
bun run e2e -- --headed
```

## Writing Tests

### Basic Test Structure

Use the `e2e` fixture for single-root workspace tests:

```typescript
import { expect } from "@playwright/test"
import { e2e } from "./utils/helpers"

e2e("Test description", async ({ sidebar, helper, page }) => {
  // Sign in to Trembo
  await helper.signin(sidebar)

  // Test interactions
  const inputbox = sidebar.getByTestId("chat-input")
  await inputbox.fill("Hello, Trembo!")
  await sidebar.getByTestId("send-button").click()

  // Assertions
  await expect(sidebar.getByText("API Request...")).toBeVisible()
})
```

For multi-root workspace tests, use `e2eMultiRoot`:

```typescript
import { e2eMultiRoot } from "./utils/helpers"

e2eMultiRoot("[Multi-roots] Test description", async ({ sidebar, helper }) => {
  // Test implementation
})
```

### Available Fixtures

The test fixtures expose the following objects:

- **`sidebar`** — Playwright Frame object for the Trembo extension's sidebar
- **`helper`** — `E2ETestHelper` instance with utility methods
- **`page`** — Playwright Page object for the main VS Code window
- **`app`** — ElectronApplication instance for VS Code
- **`server`** — mock API server for backend testing

### Common Patterns

#### Authentication

```typescript
// Sign in with the test API key
await helper.signin(sidebar)
```

#### Chat Interactions

```typescript
const inputbox = sidebar.getByTestId("chat-input")
await inputbox.fill("Your message")
await sidebar.getByTestId("send-button").click()
```

#### Mode Switching

```typescript
const actButton = sidebar.getByRole("switch", { name: "Act" })
const planButton = sidebar.getByRole("switch", { name: "Plan" })
await actButton.click() // Switch to Plan mode
```

#### File Operations

```typescript
// Open the file explorer and select code
await openTab(page, "Explorer ")
await page.getByRole("treeitem", { name: "index.html" }).locator("a").click()
await addSelectedCodeToTremboWebview(page)
```

#### Settings Navigation

```typescript
await sidebar.getByText("settings").click()
await sidebar.getByTestId("tab-api-config").click()
```

### Using the Recorder with Debug Mode

The `--debug` flag turns on Playwright's interactive debugging features:

1. **Start a debugging session:**
   ```bash
   bun run test:e2e -- --debug
   ```

2. **Playwright opens:**
   - A VS Code window with the Trembo extension loaded
   - The Playwright Inspector for step-by-step debugging
   - Browser developer tools for element inspection

3. **Recording interactions:**
   - Use the "Record" button in the Playwright Inspector
   - Interact with the VS Code interface
   - Playwright generates test code as you go
   - Copy the generated code into your test files

4. **Debugging existing tests:**
   - Set breakpoints in your test code
   - Use "Step over" to execute line by line
   - Inspect element selectors and page state
   - Tweak selectors and retry actions

### Test Environment

The test environment includes:

- **VS Code configuration:**
  - Updates, workspace trust, and welcome screens disabled
  - Extension development mode with Trembo loaded
  - Temporary user data and extensions directories

- **Mock API server:**
  - Runs on `http://localhost:7777`
  - Serves mock responses for Trembo API calls
  - Supports authentication, chat completions, and user management

- **Test workspaces:**
  - Single-root workspace with HTML, TypeScript, and README files
  - Multi-root workspace with Python provider examples
  - Configurable through fixtures

### Best Practices

1. **Use semantic selectors:**
   ```typescript
   // Good — uses test IDs
   sidebar.getByTestId("chat-input")

   // Good — uses roles and accessible names
   sidebar.getByRole("button", { name: "Send" })

   // Avoid — brittle CSS selectors
   sidebar.locator(".chat-input-class")
   ```

2. **Wait for elements:**
   ```typescript
   await expect(sidebar.getByText("Loading...")).toBeVisible()
   await expect(sidebar.getByText("Complete")).toBeVisible()
   ```

3. **Clean up state:**
   ```typescript
   // Use helper functions for common cleanup
   await cleanChatView(page)
   ```

4. **Handle async operations:**
   ```typescript
   // Wait for API responses
   await expect(sidebar.getByText("API Request...")).toBeVisible()
   await expect(sidebar.getByText("Response received")).toBeVisible()
   ```

5. **Test both success and error cases:**
   ```typescript
   // Test the successful flow
   await helper.signin(sidebar)

   // Test error handling
   await expect(sidebar.getByText("API Request Failed")).toBeVisible()
   ```

### Debugging Tips

- Use `page.pause()` to halt execution and inspect the current state
- Add `console.log()` statements to track test progress
- Use the `--headed` flag to see the browser window during the run
- Check video recordings in `test-results/` for failed tests
- Use browser developer tools to inspect element selectors

### Environment Variables

- `TREMBO_E2E_TESTS_VERBOSE=true` — enable verbose logging
- `CI=true` — adjust timeouts and reporting for CI environments
- `GRPC_RECORDER_ENABLED=true` — enable gRPC recording for debugging
