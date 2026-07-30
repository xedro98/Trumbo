---
title: "Chat Completions (Quartz API)"
description: "OpenAI-compatible chat completions against Trumbo Quartz and catalog models."
---
# Chat Completions (Quartz API)

Trumbo exposes an OpenAI-compatible Chat Completions API for Quartz and other catalog models.

## Base URL

```text
https://api.trumbo.dev/v1
```

OpenAI-compatible clients should set `baseURL` / `base_url` to that value (path includes `/chat/completions` and `/models`).

## Auth

```bash
Authorization: Bearer trumbo_YOUR_TOKEN
```

Create tokens at [platform.trumbo.dev/tokens](https://platform.trumbo.dev/tokens). Standalone usage may draw **API credits** depending on billing mode.

## List models

```bash
curl https://api.trumbo.dev/v1/models \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN"
```

Admins sync the public catalog from **Admin → Models → Sync Model Catalog**.

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

Streaming: set `"stream": true` and consume SSE chunks like the OpenAI client SDKs.

## Quartz variants

| Public id (examples) | Role |
|----------------------|------|
| Quartz 1.0 / default | Balanced flagship |
| Quartz Lite | Low latency |
| Quartz Hyper | Max reasoning depth (higher tiers) |

Routing is opaque to clients: you select a Quartz id; backing models are not disclosed in product responses.

## Rate limits

Subscription chat completions count against the 5-hour / daily / weekly windows shown on `/usage`. Exceeding a window returns a rate-limit error until reset.

## Related

- [Authentication](authentication)
- [Billing & Limits](billing-and-limits)
- Model Catalog UI: `https://platform.trumbo.dev/models`
