# Trumbo Agentic Cloud — Deploy & Database: Full End-to-End Roadmap

**Status:** Draft for approval · **Last updated:** July 26, 2026 · **Owner:** Platform engineering (`projects/web`, `engine/apps`)

> Implementation-grade end-to-end plan for **Trumbo Agent Apps** (Vercel-like deploy) and **Trumbo Database** (Database as a Service), built on Cloudflare and sold as Trumbo SKUs under **Agentic Cloud**.
>
> Relationship to other docs:
> - [`cloudflare-agent-apps-roadmap.md`](./cloudflare-agent-apps-roadmap.md) — SKU strategy + high-level product map (read first).
> - [`cloudflare-resell-roadmap.md`](./cloudflare-resell-roadmap.md) — Cloudflare catalog + reseller SKU strategy.
> - [`cloudflare-technical-roadmap.md`](./cloudflare-technical-roadmap.md) — Near-term engineering priorities under the $10k credits runway.
>
> This doc goes deeper on execution: domain model, full REST API, CLI command tree, MCP tool specs, complete D1 catalog DDL, DBaaS offerings and bindings, build adapters, dispatch worker design, custom-domain flow, security, billing enforcement, observability, agent-driven deploy, and a phased task breakdown with owners and exit criteria.

**Golden rule (copy):** Never mention Cloudflare, Workers for Platforms, D1, R2, or Hyperdrive in customer-facing copy. All surfaces are Trumbo-branded. Customers buy Trumbo units, never Cloudflare units.

---

## 1. Executive summary

Trumbo already ships **Compute** (Cloud Agents, Sandbox, Browser Run, Automations) and **agent-facing Database** facades (Memory, Store, Artifacts, Knowledge). The next platform layer adds two customer-facing products:

1. **Trumbo Agent Apps** — deploy customer code (static sites, Workers/API routes, full-stack frameworks) with global CDN, HTTPS, preview URLs, custom domains, env vars, and git-triggered builds.
2. **Trumbo Database** — provision isolated, managed databases (SQL + key-value + object storage + queues + vectors) that apps bind to, with connection strings, migrations, backups, and per-preview branches.

Both run on Cloudflare infrastructure (Workers for Platforms, Cloudflare for SaaS, D1, KV, R2, Queues, Durable Objects, Vectorize, Hyperdrive, Workers Builds) but are **100% Trumbo-branded**. Auth, quotas, billing, and all UX live on `platform.trumbo.dev` / `api.trumbo.dev`. Default URLs: `{app}.{org}.apps.trumbo.dev` (production) and `{deploy-id}.{app}.{org}.apps.trumbo.dev` (preview).

Agent Apps is a **product layer on top of existing Sandbox + R2 + Workers**, not a new cloud. Trumbo Database is a **separate managed SKU** that deployed apps bind to and that agents can provision from chat.

---

## 2. Goals & non-goals

### Goals
- A customer can go from `trumbo apps deploy` to a live HTTPS URL in **< 60 s** for static/Worker apps (MVP).
- One org can host many apps with per-app isolation, env vars, and optional custom domains.
- A managed SQL database can be created in seconds and bound to an app so the app reads/writes it with zero config.
- An agent (Cloud Agent or in-IDE Trumbo) can scaffold, build, and deploy an app end-to-end from a chat prompt.
- All usage is metered to the org and billed through existing credits/subscription.

### Non-goals (out of scope, at least initially)
- Full Vercel feature parity day one (ISR, image optimization, edge config parity, cron UI, etc.).
- Running customer Node servers long-lived (apps are Workers/static; Node runtime needs are served by Sandbox/Containers, a different product).
- Multi-cloud portability tooling.
- Customer-owned Cloudflare accounts / "bring your own Cloudflare."
- A general-purpose hosted Postgres with replica SLAs on day one (D1 first; Hyperdrive/Postgres tier later).

---

## 3. Product map (Agentic Cloud)

```text
Agentic Cloud
├── Compute (shipped)
│   ├── Cloud Agents
│   ├── Sandbox
│   ├── Browser Run
│   └── Automations
├── Deploy (this roadmap)
│   └── Trumbo Agent Apps
└── Data
    ├── Agent Database (shipped — agent runtime)
    │   ├── Memory
    │   ├── Store
    │   └── Artifacts
    ├── Knowledge (shipped — RAG)
    └── Trumbo Database (this roadmap — DBaaS for apps & agents)
```

| Product | Audience | Backend | Status |
| --- | --- | --- | --- |
| Memory / Store / Artifacts | Trumbo Agent (session state, KV, blobs) | Platform D1 + R2 | Shipped |
| Knowledge | Trumbo Agent (RAG) | AI Search + R2 | Shipped |
| **Trumbo Agent Apps** | Customer apps (human traffic) | Workers for Platforms + Static Assets + R2 | Planned |
| **Trumbo Database** | Customer apps + agents | Per-tenant D1 (+ KV/R2/Queues/Vectorize/Hyperdrive) | Planned |

Memory/Store stay **agent runtime** primitives (not exposed to customer app traffic). Trumbo Database is **durable data for applications**.

<!-- APPEND_HERE -->
