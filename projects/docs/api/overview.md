---
title: "Trumbo API"
description: "Programmatic access to Trumbo Quartz chat completions, platform products, and hosted MCP on api.trumbo.dev."
---
# Trumbo API

The Trumbo API is the programmatic surface for [platform.trumbo.dev](https://platform.trumbo.dev). Use it from scripts, CI, custom apps, the CLI, and the VS Code extension.

## Domains

| Host | Purpose |
|------|---------|
| `https://platform.trumbo.dev` | Dashboard, billing, tokens at `/tokens`, product UIs |
| `https://api.trumbo.dev` | REST API and hosted MCP |
| `https://docs.trumbo.dev` | This documentation site |

## API surfaces

Trumbo exposes two complementary REST layouts on `api.trumbo.dev`:

| Surface | Base URL | Examples |
|---------|----------|----------|
| **Quartz (OpenAI-compatible)** | `https://api.trumbo.dev/v1` | `POST /chat/completions`, `GET /models` |
| **Platform products** | `https://api.trumbo.dev/api/v1/{product}` | Agents, Sandbox, Browser, Security, Knowledge, Workflows, Users |
| **Hosted MCP** | `https://api.trumbo.dev/v1/mcp` | Product tools for agents, sandbox, browser, and more |

- **Getting Started** — Create a token and make your first request in under a minute.

  - **Authentication** — Bearer tokens, scopes, org headers, and device auth.

  - **Chat Completions** — OpenAI-compatible Quartz endpoint reference.

  - **Code Examples** — Python, Node.js, curl, CLI, and product REST examples.

## Platform products

| Product | REST base | Platform docs |
|---------|-----------|-----------------|
| Quartz chat completions | `/v1/chat/completions` | [Chat Completions](../platform/chat-completions) |
| Cloud Agents | `/api/v1/agents` | [Cloud Agents](../platform/cloud-agents) |
| Sandbox | `/api/v1/sandbox` | [Sandbox](../platform/sandbox) |
| Browser Run | `/api/v1/browser` | [Browser Run](../platform/browser-run) |
| Security | `/api/v1/security`, `/api/v1/repos` | [Security](../platform/security) |
| Knowledge | `/api/v1/knowledge` | [Knowledge](../platform/knowledge) |
| Automations | `/api/v1/workflows` | [Automations](../platform/automations) |
| Usage and billing | `/api/v1/users/me/plan` | [Billing & Limits](../platform/billing-and-limits) |
| Hosted MCP | `/v1/mcp` | [Hosted MCP](../platform/mcp) |

See the full [Platform Overview](../platform/overview) for how products fit together.

## Quick start

```bash
curl https://api.trumbo.dev/v1/models \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN"
```

Create tokens at [platform.trumbo.dev/tokens](https://platform.trumbo.dev/tokens). Team workspaces may also require `X-Org-Id`.

## Explore the reference

- **Models** — Quartz variants, catalog models, and how to list available ids.

  - **Errors** — HTTP codes, rate limits, mid-stream errors, and retry guidance.

  - **Platform Overview** — Dashboard routes, product matrix, and MCP tool groups.
