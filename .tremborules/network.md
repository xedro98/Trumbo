# Networking and proxy support

Trembo runs in three host environments (VS Code, JetBrains, CLI) and must behave correctly across all of them, including behind corporate proxies. Follow these rules for every network call.

In extension code, do NOT use the global `fetch` or a default `axios` instance. (`shared/net.ts` is exempt — it sets up the fetch wrappers themselves.) In webview code, you SHOULD use the global `fetch`, because the browser/embedder handles proxies there.

Global `fetch` and a default `axios` do not pick up proxy configuration in every environment (notably JetBrains and CLI). You MUST use the utilities in `@/shared/net`, which handle proxy agent configuration. The webview relies on the embedder for proxies, so it is the exception.

## Guidelines

### 1. Using `fetch`

Instead of `fetch(...)`, import the proxy-aware wrapper:

```typescript
import { fetch } from '@/shared/net'

// Usage is identical to global fetch
const response = await fetch('https://api.example.com/data')
```

### 2. Using `axios`

When using `axios`, apply the settings from `getAxiosSettings()`:

```typescript
import axios from 'axios'
import { getAxiosSettings } from '@/shared/net'

const response = await axios.get('https://api.example.com/data', {
  headers: { 'Authorization': '...' },
  ...getAxiosSettings() // <--- CRITICAL: injects the proxy agent when needed
})
```

### 3. Third-party clients (OpenAI, Ollama, etc.)

Most API client libraries let you customize the `fetch` implementation. You MUST pass the proxy-aware `fetch` to these clients.

**Example (OpenAI):**
```typescript
import OpenAI from "openai"
import { fetch } from "@/shared/net"

this.client = new OpenAI({
  apiKey: '...',
  fetch, // <--- CRITICAL: pass our fetch wrapper
})
```

### 4. Tests

Use `mockFetchForTesting` to mock the underlying fetch implementation.

**Example (callback):**

```
import { mockFetchForTesting } from "@/shared/net"

...
  let mockFetch = ...
  mockFetchForTesting(mockFetch, () => {
    // This calls mockFetch
    fetch('https://foo.example').then(...)
  })
  // Original fetch is restored immediately when the call returns.
```

**Example (Promise):**

```
import { mockFetchForTesting } from "@/shared/net"

...
  let mockFetch = ...
  await mockFetchForTesting(mockFetch, async () => {
    await ...
    // This calls mockFetch
    await fetch('https://foo.example')
    ...
  })
  // Original fetch is restored when the Promise from the callback settles
```

## Verification

When adding a new network call or integration:
1. Confirm `@/shared/net.ts` is imported.
2. Ensure `fetch` or `getAxiosSettings` is being used.
3. Verify that third-party clients are configured to use the custom fetch.
