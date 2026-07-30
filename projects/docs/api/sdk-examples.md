---
title: "Code Examples"
description: "Use the Trumbo API from Python, Node.js, curl, the CLI, and platform product REST endpoints."
---
# Code Examples

The Trumbo API is OpenAI-compatible for Quartz chat completions. Platform products use REST under `/api/v1/{product}`. Point clients at `https://api.trumbo.dev` and supply a Bearer token from [platform.trumbo.dev/tokens](https://platform.trumbo.dev/tokens).

## curl

### List models

```bash
curl https://api.trumbo.dev/v1/models \
  -H "Authorization: Bearer $TRUMBO_API_TOKEN"
```

### Non-streaming chat

```bash
curl -X POST https://api.trumbo.dev/v1/chat/completions \
  -H "Authorization: Bearer $TRUMBO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "quartz-1.0",
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "stream": false
  }'
```

### Streaming chat

```bash
curl -X POST https://api.trumbo.dev/v1/chat/completions \
  -H "Authorization: Bearer $TRUMBO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "quartz-1.0",
    "messages": [{"role": "user", "content": "Write a short poem about code."}],
    "stream": true
  }'
```

### Cloud Agents

```bash
curl -X POST https://api.trumbo.dev/api/v1/agents \
  -H "Authorization: Bearer $TRUMBO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: YOUR_ORG_ID" \
  -d '{"name":"Triage bot","model":"quartz-1.0","prompt":"Say hello"}'
```

See [Cloud Agents](../platform/cloud-agents) for the full REST table.

## Python

### OpenAI SDK

The [OpenAI Python SDK](https://github.com/openai/openai-python) works once you set `base_url`:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.trumbo.dev/v1",
    api_key="trumbo_YOUR_TOKEN",
)

response = client.chat.completions.create(
    model="quartz-1.0",
    messages=[{"role": "user", "content": "Explain recursion in one sentence."}],
)
print(response.choices[0].message.content)
```

### Streaming in Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.trumbo.dev/v1",
    api_key="trumbo_YOUR_TOKEN",
)

stream = client.chat.completions.create(
    model="quartz-1.0",
    messages=[{"role": "user", "content": "Write a function to reverse a string in Python."}],
    stream=True,
)

for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
print()
```

### Tool calling in Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.trumbo.dev/v1",
    api_key="trumbo_YOUR_TOKEN",
)

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name"}
                },
                "required": ["location"],
            },
        },
    }
]

response = client.chat.completions.create(
    model="quartz-1.0",
    messages=[{"role": "user", "content": "What's the weather in Tokyo?"}],
    tools=tools,
)

choice = response.choices[0]
if choice.message.tool_calls:
    tool_call = choice.message.tool_calls[0]
    print(f"Tool: {tool_call.function.name}")
    print(f"Args: {tool_call.function.arguments}")
```

### Using requests

```python
import requests

response = requests.post(
    "https://api.trumbo.dev/v1/chat/completions",
    headers={
        "Authorization": "Bearer trumbo_YOUR_TOKEN",
        "Content-Type": "application/json",
    },
    json={
        "model": "quartz-1.0",
        "messages": [{"role": "user", "content": "Hello!"}],
        "stream": False,
    },
)

data = response.json()
print(data["choices"][0]["message"]["content"])
```

### Sandbox exec

```python
import requests

response = requests.post(
    "https://api.trumbo.dev/api/v1/sandbox/SANDBOX_ID/exec",
    headers={
        "Authorization": "Bearer trumbo_YOUR_TOKEN",
        "Content-Type": "application/json",
    },
    json={"command": "uname -a", "timeout": 60000},
)
print(response.json())
```

See [Sandbox](../platform/sandbox) for the full REST table.

## Node.js / TypeScript

### OpenAI SDK

```typescript
import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://api.trumbo.dev/v1",
  apiKey: "trumbo_YOUR_TOKEN",
})

const response = await client.chat.completions.create({
  model: "quartz-1.0",
  messages: [{ role: "user", content: "Explain async/await in one sentence." }],
})
console.log(response.choices[0].message.content)
```

### Streaming in Node.js

```typescript
import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://api.trumbo.dev/v1",
  apiKey: "trumbo_YOUR_TOKEN",
})

const stream = await client.chat.completions.create({
  model: "quartz-1.0",
  messages: [{ role: "user", content: "Write a haiku about TypeScript." }],
  stream: true,
})

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content
  if (content) {
    process.stdout.write(content)
  }
}
console.log()
```

### Using fetch

```typescript
const response = await fetch("https://api.trumbo.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer trumbo_YOUR_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "quartz-1.0",
    messages: [{ role: "user", content: "Hello!" }],
    stream: false,
  }),
})

const data = await response.json()
console.log(data.choices[0].message.content)
```

## Trumbo CLI

The [Trumbo CLI](../cli/cli-reference) handles device auth, streaming, and tool execution.

### Setup

```bash
# Install
npm install -g trumbo

# Interactive sign-in (device code)
trumbo auth
```

### Run tasks

```bash
# Simple prompt
trumbo "Explain what a REST API is."

# Pipe input
cat README.md | trumbo "Summarize this document."

# YOLO mode for automation
trumbo -y "Run tests and fix failures."
```

See the [CLI Reference](../cli/cli-reference) for the full command catalog.

## VS Code extension

The Trumbo VS Code extension uses device-code auth against `https://platform.trumbo.dev` and calls the same APIs automatically.

1. Open the Trumbo panel in VS Code
2. Sign in when prompted
3. Start chatting or assign a task

For setup, see [Installing Trumbo](../getting-started/installing-trumbo) and [Authorizing with Trumbo](../getting-started/authorizing-with-trumbo).

## Hosted MCP

Connect MCP clients to `https://api.trumbo.dev/v1/mcp` for product tools (agents, sandbox, browser, security, knowledge, automations). See [Hosted MCP](../platform/mcp) for the tool list.

## Related

- **Chat Completions** — Full Quartz endpoint reference.

  - **Authentication** — Tokens, scopes, and org headers.

  - **Models** — Quartz variants and catalog ids.

  - **Platform Overview** — All product REST bases and dashboard links.
