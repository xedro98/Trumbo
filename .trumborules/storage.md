# Storage architecture

Global settings, secrets, and workspace state live in **file-backed JSON stores** under `~/.trumbo/data/`. This is the shared storage layer used by VS Code, CLI, and JetBrains.

## Key abstractions

### `StorageContext` (src/shared/storage/storage-context.ts)
The entry point. Created via `createStorageContext()` and passed to `StateManager.initialize()`. Holds three `TrumboFileStorage` instances:
- `globalState` → `~/.trumbo/data/globalState.json`
- `secrets` → `~/.trumbo/data/secrets.json` (mode 0o600)
- `workspaceState` → `~/.trumbo/data/workspaces/<hash>/workspaceState.json`

### `TrumboFileStorage` (src/shared/storage/TrumboFileStorage.ts)
A synchronous JSON key-value store backed by a single file. Supports `get()`, `set()`, `setBatch()`, `delete()`. Writes are atomic (write-then-rename).

### `StateManager` (src/core/storage/StateManager.ts)
An in-memory cache on top of `StorageContext`. All runtime reads hit the cache; writes update the cache immediately and debounce-flush to disk.

## Do NOT use VS Code's ExtensionContext for storage

**Do not** read from or write to `context.globalState`, `context.workspaceState`, or `context.secrets` for persistent data. These are VS Code-specific and are not available on CLI or JetBrains.

Instead, use:
```typescript
// Reading state
StateManager.get().getGlobalStateKey("myKey")
StateManager.get().getSecretKey("mySecretKey")
StateManager.get().getWorkspaceStateKey("myWsKey")

// Writing state
StateManager.get().setGlobalState("myKey", value)
StateManager.get().setSecret("mySecretKey", value)
StateManager.get().setWorkspaceState("myWsKey", value)
```

Remember that data may be read by a different client than the one that wrote it. A value written by Trumbo in JetBrains may be read by Trumbo CLI.

## VS Code migration (src/hosts/vscode/vscode-to-file-migration.ts)

On VS Code startup, a migration copies data from VS Code's `ExtensionContext` storage into the file-backed stores. It runs in `src/common.ts` before `StateManager.initialize()`.

- **Sentinel**: `__vscodeMigrationVersion` key in global state and workspace state — prevents re-migration.
- **Merge strategy**: file store wins. Existing values are never overwritten.
- **Safe downgrade**: VS Code storage is NOT cleared, so older extension versions still work.

## Adding new storage keys

1. Add to `src/shared/storage/state-keys.ts` (follow existing patterns).
2. Read and write via `StateManager` (NOT via `context.globalState`).
3. If adding a secret, add it to the `SecretKeys` array in `state-keys.ts`.

## File layout

```
~/.trumbo/
  data/
    globalState.json          # Global settings & state
    secrets.json              # API keys (mode 0o600)
    tasks/
      taskHistory.json        # Task history (separate file)
    workspaces/
      <hash>/
        workspaceState.json   # Per-workspace toggles
```
