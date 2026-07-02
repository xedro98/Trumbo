# General tribal knowledge

This file captures the non-obvious patterns that separate a quick fix from hours of back-and-forth. It is high-signal by design: the things you'd only learn by reading many files, getting corrected, or watching something work differently than expected.

**When to add a note here:**
- You had to intervene, correct, or hand-hold the agent
- Something took several attempts to get working
- You discovered something that required reading many files to understand
- A change touched files you wouldn't have guessed
- Something behaved differently than expected
- A user explicitly asks to record a pattern

**Proactively suggest additions** when any of the above happen — don't wait to be asked.

**What not to add:** anything obvious from reading a few files, standard practices, or things a contributor can derive quickly. Keep this dense.

## Miscellaneous

- The whole repo uses **bun** for package management and task running. Emit `bun run X` / `bun install` / `bunx <bin>` / `bun file.ts` — never npm/npx. Node stays the *runtime* (the standalone trumbo-core runs on Node), so Node-runtime tokens are legitimate and must not be "fixed" to bun. See @.trumborules/bun-and-node.md for the full keep-list vs rewrite-list.
- Avoid provider-specific string matching and hardcoded provider branches when fixing provider/config plumbing. Prefer provider metadata, the shared catalog/defaults, explicit protocol/client capabilities, or centralized normalization utilities that branch on data shape rather than `providerId === "..."`. If a provider exception seems necessary, stop and explain why instead of adding ad-hoc string matching.
- Check `package.json` for available scripts before verifying builds (e.g. `bun run compile`, not `bun run build`).
- Contributors should not create changelog-entry files. Maintainers handle release versioning and changelog curation during the release process.
- When adding new feature flags, mirror the existing feature-flag patterns already in the codebase. The repo is at https://github.com/xedro98/trembo.
- Additional guidance on making network requests: @.trumborules/network.md

## Searching the codebase — avoiding build output

Several directories contain build output or generated code that produces noisy, unusable results with `search_files` / `grep`:

| Directory | What it is | Why it's a problem |
|-----------|-----------|-------------------|
| `dist/` | Compiled SDK package and CLI build output | Built output — searches hit compiled files instead of source |
| `node_modules/` | Dependencies | Huge, not project source |

### How to skip build output

**`search_files`** — Point at the relevant source dir (not the project root) and use `file_pattern`:
```
search_files(path="engine/packages/core/src", regex="myFunction", file_pattern="*.ts")
```
The `file_pattern` parameter is the strongest filter — e.g. `"*.ts"`, `"*.tsx"`, `"*.proto"`.

**`grep` directly** — Exclude build dirs and restrict to source extensions:
```bash
grep -rn "myFunction" engine/ projects/ --include="*.ts" --exclude-dir={dist,node_modules}
```
