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
| `@trumbodev/shared` | Cross-package shared primitives (path resolution, session common types, indexing helpers) | `@trumbodev/agents`, `@trumbodev/core`, apps | None |
| `@trumbodev/llms` | Model catalog + provider settings schema + handler creation SDK | `@trumbodev/agents`, `@trumbodev/core`, apps | None |
| `@trumbodev/agents` | Stateless agent runtime loop (tools, hooks, extensions, teams, streaming) | `@trumbodev/core`, apps | `@trumbodev/llms`, `@trumbodev/shared` |
| `@trumbodev/core` | Stateful runtime orchestration (runtime composition, session lifecycle/storage, local and hub runtime services, hub discovery and client helpers) | CLI/Desktop apps | `@trumbodev/agents`, `@trumbodev/llms`, `@trumbodev/shared` |

## How Packages Work Together

1. `@trumbodev/llms` defines model/provider capabilities and builds concrete handlers.
2. `@trumbodev/agents` runs the agent loop on top of those handlers and the tool-execution primitives.
3. `@trumbodev/core` composes runtime behavior with persistent sessions/storage and local or hub-backed runtime services.
4. `@trumbodev/core` hub services orchestrate scheduled runtime execution, execution history, and schedule command handling.
5. `@trumbodev/core/hub` exposes discovery, the detached hub daemon, and session-oriented client APIs (`HubSessionClient`, `HubUIClient`) when hosts need a shared daemon.
6. `@trumbodev/shared` provides the shared contracts and path/session primitives used across the stack.

## Practical Boundary Rules

- Put provider/model schema, cataloging, and handler wiring in `@trumbodev/llms`.
- Put loop/tool/hook/team execution behavior in `@trumbodev/agents`.
- Put persistence, session lifecycle, and runtime assembly in `@trumbodev/core`.
- Put scheduled execution and schedule persistence in `@trumbodev/core` hub services.
- Put hub discovery, attach flows, and session-oriented client adapters in `@trumbodev/core/hub`.
- Put cross-package utility types and path/session constants in `@trumbodev/shared`.
- Put remote-config schemas, materialization, telemetry normalization, and blob upload primitives in `@trumbodev/shared/remote-config`.

## Runtime Entry Points

- Node-oriented imports exist where packages expose a distinct Node alias.
- `@trumbodev/core` itself is now the Node/runtime-oriented entry point for host/session services.
- Browser entry points still exist in packages that intentionally publish a browser surface, but `@trumbodev/core` no longer does.

## Notes for Doc Consolidation

Nested package `README.md` and `ARCHITECTURE.md` files can be reduced or removed after references are updated to point here.
