---
title: "Billing and Limits"
description: "Plans, credits, and per-product usage limits on the Trumbo Platform."
---
# Billing and Limits

Trumbo Platform subscriptions are scoped to a person or team. Products are gated by plan flags and numeric limits administered in **Admin → Billing**.

## Plans

Typical tiers (names and caps can change per deployment):

| Tier | Role |
|------|------|
| Pro | Individual productivity defaults |
| Max | Higher rate limits and team features |
| Ultra | Highest caps and advanced product flags |

There is no free tier for production platform products. Caps are request windows and product quotas, not open-ended per-token billing for subscription surfaces.

## Where to see usage

Open [platform.trumbo.dev/usage](https://platform.trumbo.dev/usage):

- **API rate limits:** 5-hour, daily, weekly chat completion windows
- **Platform limits:** Knowledge, Browser, Agents, Sandbox, Security, Automations
- **API credits:** pre-paid balance for standalone metered REST usage

Programmatically:

```bash
curl https://api.trumbo.dev/api/v1/users/me/plan \
  -H "Authorization: Bearer trumbo_YOUR_TOKEN" \
  -H "X-Org-Id: YOUR_ORG_ID"
```

## Product meters

| Product | Typical meters |
|---------|----------------|
| Knowledge | Documents, storage MB, daily searches |
| Browser Run | Monthly minutes, concurrent sessions |
| Cloud Agents | Monthly hours, concurrent agents |
| Sandbox | Monthly CPU-seconds, concurrent sandboxes |
| Security | Connected repos, monthly scan credits |
| Automations | Definition count, monthly runs |

Admin can toggle products per plan (KB, BR, AG, SB, SEC, AU) and edit numeric caps.

## Credits

Standalone Quartz / browser-style API usage can draw from **Trumbo Credits** purchased on `/billing`. Subscription product usage (agents, sandbox, automations, etc.) is generally covered by plan windows when enabled, not by burning credits on every call.

## Enforcement

All limits are enforced **server-side**. Client UIs and open-source CLIs cannot bypass gates.
