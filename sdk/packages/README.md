```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Packages Overview

This directory is the single source of truth for package-level responsibilities.

- High-level package roles: this file (`packages/README.md`)
- Package interaction and runtime flows: [`ARCHITECTURE.md`](../ARCHITECTURE.md)

## Package Responsibilities

| Package | Primary responsibility | Typical consumers | Internal deps |
| --- | --- | --- | --- |
| `@trembo/shared` | Cross-package shared primitives (path resolution, session common types, indexing helpers) | `@trembo/agents`, `@trembo/core`, apps | None |
| `@trembo/llms` | Model catalog + provider settings schema + handler creation SDK | `@trembo/agents`, `@trembo/core`, apps | None |
| `@trembo/agents` | Stateless agent runtime loop (tools, hooks, extensions, teams, streaming) | `@trembo/core`, apps | `@trembo/llms`, `@trembo/shared` |
| `@trembo/core` | Stateful runtime orchestration (runtime composition, session lifecycle/storage, local and hub runtime services, hub discovery and client helpers) | CLI/Desktop apps | `@trembo/agents`, `@trembo/llms`, `@trembo/shared` |

## How Packages Work Together

1. `@trembo/llms` defines model/provider capabilities and builds concrete handlers.
2. `@trembo/agents` runs the agent loop on top of those handlers and the tool-execution primitives.
3. `@trembo/core` composes runtime behavior with persistent sessions/storage and local or hub-backed runtime services.
4. `@trembo/core` hub services orchestrate scheduled runtime execution, execution history, and schedule command handling.
5. `@trembo/core/hub` exposes discovery, the detached hub daemon, and session-oriented client APIs (`HubSessionClient`, `HubUIClient`) when hosts need a shared daemon.
6. `@trembo/shared` provides the shared contracts and path/session primitives used across the stack.

## Practical Boundary Rules

- Put provider/model schema, cataloging, and handler wiring in `@trembo/llms`.
- Put loop/tool/hook/team execution behavior in `@trembo/agents`.
- Put persistence, session lifecycle, and runtime assembly in `@trembo/core`.
- Put scheduled execution and schedule persistence in `@trembo/core` hub services.
- Put hub discovery, attach flows, and session-oriented client adapters in `@trembo/core/hub`.
- Put cross-package utility types and path/session constants in `@trembo/shared`.
- Put remote-config schemas, materialization, telemetry normalization, and blob upload primitives in `@trembo/shared/remote-config`.

## Runtime Entry Points

- Node-oriented imports exist where packages expose a distinct Node alias.
- `@trembo/core` itself is now the Node/runtime-oriented entry point for host/session services.
- Browser entry points still exist in packages that intentionally publish a browser surface, but `@trembo/core` no longer does.

## Notes for Doc Consolidation

Nested package `README.md` and `ARCHITECTURE.md` files can be reduced or removed after references are updated to point here.
