---
title: "Getting Started"
description: "Create an API token and make your first request to the Trumbo API in under a minute."
---
# Getting Started

This guide takes you from zero to your first successful API call in a few short steps.

## Prerequisites

- A Trumbo account at [platform.trumbo.dev](https://platform.trumbo.dev)
- An active subscription (Pro, Max, or Ultra). There is no free tier for production platform products.
- `curl` or any HTTP client (Python, Node.js, and so on)

## Create an API token

### Sign in to the dashboard

Open [platform.trumbo.dev](https://platform.trumbo.dev) and sign in.
  

  
### Open Tokens

Go to [platform.trumbo.dev/tokens](https://platform.trumbo.dev/tokens).
  

  
### Create and copy

Create a token with the scopes you need and copy it immediately. Tokens are shown only once at creation time. They look like `trumbo_...`.
  

Default scopes for new tokens include `browser:run`, `sandbox:run`, and `agents:run`. Add or remove scopes based on which products you will call.

::: warning
Treat your token like a password. Never commit it to version control or share it in plain text.
:::

## Make your first request

List available Quartz and catalog models:

```bash
curl https://api.trumbo.dev/v1/models \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN"
```

Then send a chat completion:

```bash
curl -X POST https://api.trumbo.dev/v1/chat/completions \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "quartz-1.0",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "stream": false
  }'
```

## Verify the response

A successful call returns JSON shaped like this:

```json
{
  "id": "gen-abc123",
  "model": "quartz-1.0",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris."
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 8
  }
}
```

The model reply lives in `choices[0].message.content`. Token counts appear under `usage`.

## Try streaming

Set `"stream": true` to receive the answer as Server-Sent Events:

```bash
curl -X POST https://api.trumbo.dev/v1/chat/completions \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "quartz-1.0",
    "messages": [
      {"role": "user", "content": "Write a haiku about programming."}
    ],
    "stream": true
  }'
```

Each chunk arrives on its own `data:` line. The stream terminates with `data: [DONE]`.

## Call a platform product

Product REST APIs live under `/api/v1/{product}`. Example: list Cloud Agents:

```bash
curl https://api.trumbo.dev/api/v1/agents \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN" \
  -H "X-Org-Id: YOUR_ORG_ID"
```

Omit `X-Org-Id` for personal workspaces. Team workspaces require it when your token can access multiple orgs. See [Authentication](authentication).

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `401 Unauthorized` | Confirm the token is correct and sent as `Authorization: Bearer trumbo_...` |
| `403 Forbidden` | Token lacks the scope for this product, or org header is missing |
| `429 Too Many Requests` | Rate window exceeded. Check [platform.trumbo.dev/usage](https://platform.trumbo.dev/usage) |
| Empty response | Ensure `messages` is a non-empty array with at least one user message |
| Connection timeout | Confirm your network can reach `api.trumbo.dev` |

## Next steps

- **Authentication** — Scopes, org headers, device auth, and MCP credentials.

  - **Chat Completions** — Full Quartz endpoint reference with streaming and tools.

  - **Models** — Quartz variants and catalog model ids.

  - **Code Examples** — Python, Node.js, curl, CLI, and product REST snippets.
