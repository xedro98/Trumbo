# Trumbo protobuf development guide

This guide covers how to add new gRPC endpoints for communication between the webview (frontend) and the extension host (backend).

## Overview

Trumbo uses [Protobuf](https://protobuf.dev/) to define a strongly-typed API, giving the webview and extension host efficient, type-safe communication. All definitions live in the `/proto` directory. The compiler and plugins ship as project dependencies, so no manual installation is needed.

## Key concepts and best practices

- **File structure**: each feature domain gets its own `.proto` file (e.g. `account.proto`, `task.proto`).
- **Message design**:
  - For simple, single-value data, reuse the shared types in `proto/common.proto` (e.g. `StringRequest`, `Empty`, `Int64Request`) for consistency.
  - For complex data structures, define custom messages in the feature's `.proto` file (see `task.proto` for examples like `NewTaskRequest`).
- **Naming conventions**:
  - Services: `PascalCaseService` (e.g. `AccountService`).
  - RPCs: `camelCase` (e.g. `accountEmailIdentified`).
  - Messages: `PascalCase` (e.g. `StringRequest`).
- **Streaming**: for server-to-client streaming, use the `stream` keyword on the response type. See `subscribeToAuthCallback` in `account.proto` for an example.

---

## 4-step development workflow

Here is how to add a new RPC, using `scrollToSettings` as the example.

### 1. Define the RPC in a `.proto` file

Add your service method to the appropriate file in the `proto/` directory.

**File: `proto/ui.proto`**
```proto
service UiService {
  // ... other RPCs
  // Scrolls to a specific settings section in the settings view
  rpc scrollToSettings(StringRequest) returns (KeyValuePair);
}
```
Here we reuse the common `StringRequest` and `KeyValuePair` types.

### 2. Compile definitions

After editing a `.proto` file, regenerate the TypeScript code. From the project root:
```bash
bun run protos
```
This compiles all `.proto` files and emits generated code into `src/generated/` and `src/shared/`. Do not edit generated files by hand.

### 3. Implement the backend handler

Create the RPC implementation in the backend. Handlers live in `src/core/controller/[service-name]/`.

**File: `src/core/controller/ui/scrollToSettings.ts`**
```typescript
import { Controller } from ".."
import { StringRequest, KeyValuePair } from "../../../shared/proto/common"

/**
 * Executes a scroll to settings action
 * @param controller The controller instance
 * @param request The request containing the ID of the settings section to scroll to
 * @returns KeyValuePair with action and value fields for the UI to process
 */
export async function scrollToSettings(controller: Controller, request: StringRequest): Promise<KeyValuePair> {
	return KeyValuePair.create({
		key: "scrollToSettings",
		value: request.value || "",
	})
}
```

### 4. Call the RPC from the webview

Call the new RPC from a React component in `webview-ui/`. The generated client makes this simple.

**File: `webview-ui/src/components/browser/BrowserSettingsMenu.tsx`** (example)
```tsx
import { UiServiceClient } from "../../../services/grpc"
import { StringRequest } from "../../../../shared/proto/common"

// ... inside a React component
const handleMenuClick = async () => {
    try {
        await UiServiceClient.scrollToSettings(StringRequest.create({ value: "browser" }))
    } catch (error) {
        console.error("Error scrolling to browser settings:", error)
    }
}
```
