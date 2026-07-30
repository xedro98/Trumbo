---
title: "Platform Overview"
description: "Trumbo Platform products, dashboards, APIs, and MCP on platform.trumbo.dev and api.trumbo.dev."
---
# Platform Overview

The Trumbo Platform is the hosted product surface at [platform.trumbo.dev](https://platform.trumbo.dev). It includes subscription billing, usage meters, Cloud Agents, Sandbox, Browser Run, Security, Knowledge, Automations, Quartz chat completions, and a hosted MCP server.

## Domains

| Host | Purpose |
|------|---------|
| `https://platform.trumbo.dev` | Dashboard, auth (browser cookies), billing, product UIs |
| `https://api.trumbo.dev` | Programmatic REST API and MCP for CLI / VS Code / integrations |
| `https://docs.trumbo.dev` | This documentation site |

## Products

| Product | Dashboard | REST base | Docs |
|---------|-----------|-----------|------|
| Quartz chat completions | Model Catalog | `/v1/chat/completions` | [Chat Completions](chat-completions) |
| Cloud Agents | `/agents/api`, `/agents` | `/api/v1/agents` | [Cloud Agents](cloud-agents) |
| Sandbox | `/sandbox` | `/api/v1/sandbox` | [Sandbox](sandbox) |
| Browser Run | `/browser` | `/api/v1/browser` | [Browser Run](browser-run) |
| Security | `/security` | `/api/v1/security`, `/api/v1/repos` | [Security](security) |
| Knowledge | `/knowledge` | `/api/v1/knowledge` | [Knowledge](knowledge) |
| Automations | `/workflows` | `/api/v1/workflows` | [Automations](automations) |
| Usage & billing | `/usage`, `/billing` | `/api/v1/users/me/plan` | [Billing & Limits](billing-and-limits) |
| Hosted MCP | — | `https://api.trumbo.dev/v1/mcp` | [Hosted MCP](mcp) |

## Authentication

- **Dashboard:** sign in at platform.trumbo.dev (session cookies).
- **API / MCP:** create a scoped API token at `/tokens`, or use device-code auth from the CLI / VS Code extension.

See [Authentication](authentication).

## Quick start (API)

```bash
curl https://api.trumbo.dev/v1/models \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN"
```

Most product endpoints also accept `X-Org-Id` when you work in a team workspace.

## How products relate

Automations can orchestrate the other products in one durable run:

```text
wait → parallel(webhook | sandbox | security_scan) → retry(webhook) → invoke_agent → webhook
```

See [Automations](automations) for a full walkthrough.
