# Bun (tooling) and Node (runtime)

This repo uses **bun** for package management and task running, and **Node** as the execution runtime. Both statements are true at the same time, and confusing the two is the most common source of mistakes when editing scripts, configs, docs, or comments. Get the distinction straight before touching anything.

## Use bun for tooling

- `bun install` (never `npm install` / `npm ci`)
- `bun run <script>` (never `npm run <script>`)
- `bunx <bin>` (never `npx <bin>`)
- `bun <file>.ts` to run a TS entrypoint directly (no `ts-node` / `tsx`)
- `bun esbuild.mjs` to drive the build (esbuild/vite remain the bundlers)
- `bun run --parallel ...` for parallel tasks

The root `bun.lock` is the single lockfile for the entire workspace, including `projects/console` and `sdk`. There are no per-package npm lockfiles.

## Node is the runtime — do NOT rewrite these to bun

The build product runs on Node: the Trumbo CLI and the standalone `trumbo-core` are Node processes. The following are Node runtime/ABI references and are correct as-is:

| Reference | Why it is Node |
|-----------|----------------|
| esbuild `platform: "node"` / `target: "node..."` | The bundle targets the Node runtime (CLI, standalone core). |
| `TARGET_NODE_VERSION` (`scripts/package-standalone.mjs`) | Pins the Node ABI of the bundled standalone runtime. |
| `prebuild-install --target=<node version>` | Downloads native `.node` binaries for that Node ABI. |
| `NODE_PATH=... node trumbo-core.js` | The standalone core is launched by Node, not bun. |
| `node:` import specifiers (e.g. `node:fs`) | Node builtin module scheme; unrelated to tooling. |
| `process.versions.node`, `engines.node`, `@types/node` | Runtime version probe / declared runtime / its types. |

When a file legitimately uses both bun and node (e.g. `package-standalone.mjs` runs `bun install` but also `prebuild-install --target=<node>`), the `node` token is the runtime/ABI target, not tooling. If unsure, leave it.

## Tests

Unit suites run under `bun test` (test files import from `bun:test`).
