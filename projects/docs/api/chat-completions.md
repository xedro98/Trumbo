---
title: "Chat Completions"
description: "OpenAI-compatible POST /chat/completions for Trumbo Quartz and catalog models at api.trumbo.dev/v1."
---
# Chat Completions

The Chat Completions endpoint turns a conversation into a model response. It mirrors the [OpenAI Chat Completions](https://platform.openai.com/docs/api-reference/chat/create) contract, so existing clients work with minimal changes.

Base URL: `https://api.trumbo.dev/v1`

For platform context, see [Platform Chat Completions](../platform/chat-completions).

## Endpoint

```text
POST https://api.trumbo.dev/v1/chat/completions
```

List models:

```text
GET https://api.trumbo.dev/v1/models
```

## Request headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer trumbo_YOUR_TOKEN` |
| `Content-Type` | Yes | `application/json` |
| `X-Org-Id` | No | Team org id when the token spans multiple workspaces |

## Request body

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | Yes | | Model id, e.g. `quartz-1.0`. See [Models](models). |
| `messages` | array | Yes | | Conversation messages with `role` and `content`. |
| `stream` | boolean | No | varies | Return SSE chunks when `true`. |
| `tools` | array | No | | Tool definitions in OpenAI function-calling format. |
| `temperature` | number | No | Model default | Sampling temperature (0.0 to 2.0). |

### Message format

Each entry in `messages` looks like:

```json
{
  "role": "user",
  "content": "Your message here"
}
```

**Roles:**

| Role | Purpose |
|------|---------|
| `system` | Sets behavior and persona. Place first when used. |
| `user` | Human input. |
| `assistant` | Prior model responses for multi-turn context. |
| `tool` | Tool results after function calls. |

### Multi-turn conversation

```json
{
  "model": "quartz-1.0",
  "messages": [
    {"role": "system", "content": "You are a helpful coding assistant."},
    {"role": "user", "content": "What is a closure in JavaScript?"},
    {"role": "assistant", "content": "A closure is a function that..."},
    {"role": "user", "content": "Can you show me an example?"}
  ]
}
```

## Create completion

```bash
curl -X POST https://api.trumbo.dev/v1/chat/completions \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "quartz-1.0",
    "messages": [
      {"role": "user", "content": "Explain Automations in one sentence."}
    ],
    "stream": false
  }'
```

OpenAI-compatible clients should set `baseURL` / `base_url` to `https://api.trumbo.dev/v1`.

## Streaming response

With `"stream": true`, the reply arrives as [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events):

```text
data: {"id":"gen-abc123","choices":[{"delta":{"role":"assistant"},"index":0}],"model":"quartz-1.0"}

data: {"id":"gen-abc123","choices":[{"delta":{"content":"The capital"},"index":0}],"model":"quartz-1.0"}

data: {"id":"gen-abc123","choices":[{"delta":{"content":" of France is Paris."},"index":0,"finish_reason":"stop"}],"model":"quartz-1.0","usage":{"prompt_tokens":14,"completion_tokens":8&#125;&#125;

data: [DONE]
```

| Field | Description |
|-------|-------------|
| `id` | Generation id, consistent across chunks |
| `choices[0].delta.content` | New text in this chunk |
| `choices[0].delta.reasoning` | Reasoning content (reasoning models) |
| `choices[0].finish_reason` | `stop` when complete, `tool_calls` for tools, `error` on failure |
| `usage` | Token counts (often in the final chunk) |

## Non-streaming response

With `"stream": false`:

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

## Tool calling

Define tools the model can invoke:

```json
{
  "model": "quartz-1.0",
  "messages": [
    {"role": "user", "content": "What's the weather in San Francisco?"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City and state, e.g. San Francisco, CA"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

When the model calls a tool, the response includes `tool_calls`. Continue the conversation by returning a `tool` message with the result. See [SDK Examples](sdk-examples#tool-calling-in-python).

## Reasoning models

Quartz Hyper and other reasoning routes may stream thinking before the main answer:

```json
{"choices":[{"delta":{"reasoning":"Let me think about this step by step..."&#125;&#125;]}
```

Reasoning tokens surface in `delta.reasoning`. Some responses also include `delta.reasoning_details` for encrypted reasoning blocks.

## Rate limits

Subscription chat completions count against the 5-hour, daily, and weekly windows on [platform.trumbo.dev/usage](https://platform.trumbo.dev/usage). Exceeding a window returns a rate-limit error until reset. See [Billing & Limits](../platform/billing-and-limits) and [Errors](errors).

## Related

- **Models** — Quartz variants and catalog model ids.

  - **Errors** — Handle errors and implement retry logic.

  - **SDK Examples** — Python, Node.js, and curl snippets.

  - **Authentication** — Tokens, scopes, and org headers.
