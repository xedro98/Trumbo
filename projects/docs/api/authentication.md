---
title: "Authentication"
description: "How to authenticate with the Trumbo API using Bearer tokens, scopes, org headers, and device auth."
---
# Authentication

Every Trumbo API call must carry a Bearer token in the `Authorization` header. Dashboard sessions use cookies; CLI and VS Code typically use device-code OAuth.

## API tokens

### Open Tokens

Go to [platform.trumbo.dev/tokens](https://platform.trumbo.dev/tokens).
  

  
### Choose scopes

Select scopes for the products you need: agents, sandbox, browser, security, knowledge, workflows, and chat completions.
  

  
### Create and copy

Create the token and copy it immediately. It is shown only once and looks like `trumbo_...`.
  

Default scopes for new tokens:

- `browser:run`
- `sandbox:run`
- `agents:run`

Send the token on every request:

```bash
curl https://api.trumbo.dev/v1/models \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN"
```

Product REST example:

```bash
curl https://api.trumbo.dev/api/v1/agents \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN"
```

## Organization scope

Team workspaces require an org header when the token or session can access multiple orgs:

```bash
-H "X-Org-Id: YOUR_ORG_ID"
```

The dashboard sets this automatically from the active workspace switcher. Find your org id in team settings on [platform.trumbo.dev](https://platform.trumbo.dev).

## Device auth (CLI / VS Code)

The CLI and VS Code extension use RFC 8628 device-code grant against `https://platform.trumbo.dev`. After you approve in the browser, they store a session and call the same APIs without manual token handling.

```bash
# Interactive sign-in (CLI)
trumbo auth
```

See the [CLI Reference](../cli/cli-reference#trumbo-auth) for every auth option.

## MCP auth

Connect an MCP client to:

```text
https://api.trumbo.dev/v1/mcp
```

Use a device-auth session or a compatible Bearer token. Metered API keys meant only for chat or browser REST may be rejected by MCP; prefer a logged-in CLI session or an agents-scoped token as documented for your client. See [Hosted MCP](../platform/mcp).

## Security best practices

**Do:**

- Store tokens in environment variables or a secrets manager
- Use different tokens for development and production
- Prefer least-privilege scopes
- Rotate tokens if they leak
- Delete tokens you no longer use

**Do not:**

- Commit tokens to version control
- Share tokens in chat or email
- Embed tokens in client-side code (browsers, mobile apps)
- Log tokens in application output

### Using environment variables

```bash
export TRUMBO_API_TOKEN="trumbo_your_token_here"

curl -X POST https://api.trumbo.dev/v1/chat/completions \
  -H "Authorization: Bearer $TRUMBO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model": "quartz-1.0", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Using a .env file

```bash
# .env (add to .gitignore)
TRUMBO_API_TOKEN=trumbo_your_token_here
```

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.trumbo.dev/v1",
    api_key=os.environ["TRUMBO_API_TOKEN"],
)
```

::: tip
All plan gates and rate limits are enforced server-side. Open-source clients cannot bypass subscription or quota checks.
:::

## Related

- **Getting Started** — Create your first token and make a request.

  - **Platform Authentication** — Full platform auth guide including Automations webhook rules.

  - **Billing & Limits** — Plans, usage windows, and API credits.

  - **Hosted MCP** — MCP endpoint and tool groups.
