```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Packages Overview

This directory is the single source of truth for package-level responsibilities.

- High-level package roles: this file (`packages/README.md`)
- Package interaction and runtime flows: [`ARCHITECTURE.md`](../ARCHITECTURE.md)

## Package Responsibilities

| Package | Primary responsibility | Typical consumers | Internal deps |
| --- | --- | --- | --- |
| `@trumbo/shared` | Cross-package shared primitives (path resolution, session common types, indexing helpers) | `@trumbo/agents`, `@trumbo/core`, apps | None |
| `@trumbo/llms` | Model catalog + provider settings schema + handler creation SDK | `@trumbo/agents`, `@trumbo/core`, apps | None |
| `@trumbo/agents` | Stateless agent runtime loop (tools, hooks, extensions, teams, streaming) | `@trumbo/core`, apps | `@trumbo/llms`, `@trumbo/shared` |
| `@trumbo/core` | Stateful runtime orchestration (runtime composition, session lifecycle/storage, local and hub runtime services, hub discovery and client helpers) | CLI/Desktop apps | `@trumbo/agents`, `@trumbo/llms`, `@trumbo/shared` |

## How Packages Work Together

1. `@trumbo/llms` defines model/provider capabilities and builds concrete handlers.
2. `@trumbo/agents` runs the agent loop on top of those handlers and the tool-execution primitives.
3. `@trumbo/core` composes runtime behavior with persistent sessions/storage and local or hub-backed runtime services.
4. `@trumbo/core` hub services orchestrate scheduled runtime execution, execution history, and schedule command handling.
5. `@trumbo/core/hub` exposes discovery, the detached hub daemon, and session-oriented client APIs (`HubSessionClient`, `HubUIClient`) when hosts need a shared daemon.
6. `@trumbo/shared` provides the shared contracts and path/session primitives used across the stack.

## Practical Boundary Rules

- Put provider/model schema, cataloging, and handler wiring in `@trumbo/llms`.
- Put loop/tool/hook/team execution behavior in `@trumbo/agents`.
- Put persistence, session lifecycle, and runtime assembly in `@trumbo/core`.
- Put scheduled execution and schedule persistence in `@trumbo/core` hub services.
- Put hub discovery, attach flows, and session-oriented client adapters in `@trumbo/core/hub`.
- Put cross-package utility types and path/session constants in `@trumbo/shared`.
- Put remote-config schemas, materialization, telemetry normalization, and blob upload primitives in `@trumbo/shared/remote-config`.

## Runtime Entry Points

- Node-oriented imports exist where packages expose a distinct Node alias.
- `@trumbo/core` itself is now the Node/runtime-oriented entry point for host/session services.
- Browser entry points still exist in packages that intentionally publish a browser surface, but `@trumbo/core` no longer does.

## Notes for Doc Consolidation

Nested package `README.md` and `ARCHITECTURE.md` files can be reduced or removed after references are updated to point here.
