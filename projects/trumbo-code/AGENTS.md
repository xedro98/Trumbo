# AGENTS.md

## Task Completion Requirements

- `vp check` and `vp run typecheck` must pass before considering tasks completed.
  - If changing native mobile code, `vp run lint:mobile` must also pass.
- Use `vp test` for the built-in Vite+ test command and `vp run test` when you specifically need the `test` package script.

## Project Snapshot

Trumbo Code is a minimal web GUI for using coding agents like Codex and Claude.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Package Roles

- `apps/server`: Node.js WebSocket server. Wraps Codex app-server (JSON-RPC over stdio), serves the React web app, and manages provider sessions.
- `apps/web`: React/Vite UI. Owns session UX, conversation/event rendering, and client-side state. Connects to the server via WebSocket.
- `packages/contracts`: Shared effect/Schema schemas and TypeScript contracts for provider events, WebSocket protocol, and model/session types. Keep this package schema-only — no runtime logic.
- `packages/shared`: Shared runtime utilities consumed by both server and client applications. Uses explicit subpath exports (e.g. `@trumbo-code/shared/git`) — no barrel index.
- `packages/client-runtime`: Shared runtime package for sharing client code across web and mobile.

## Building & Shipping Desktop Apps

The desktop app is an Electron app (`apps/desktop`) bundled with the server
(`apps/server/dist`) and web client (`apps/server/dist/client`). Installers are
produced by `scripts/build-desktop-artifact.ts` via `vp run dist:desktop:artifact`.
Full reference: `docs/operations/desktop-builds.md`.

### Golden rules

1. **Never put `--` between the script and flags.** The Effect CLI treats `--`
   as end-of-options and silently drops every flag after it. Pass flags directly:
   `vp run dist:desktop:artifact --platform win --skip-build` (NOT `... -- --platform win`).
2. **The build script refuses cross-platform builds**
   (`UnsupportedCrossPlatformDesktopBuildError`). Match the host: Windows→win,
   macOS→mac, Linux→linux. From Windows, Linux builds run inside WSL Ubuntu.
3. **Reuse dist, don't rebuild.** Pass `--skip-build` to reuse existing
   `apps/desktop/dist-electron` + `apps/server/dist`. Rebuild first with
   `vp run build:desktop` only after code changes.
4. **Windows builds need the WSL node-pty prebuild** (`--wsl-prebuild`).
   node-pty ships no Linux prebuild; without it the WSL backend silently fails.
   Build it with `scripts/build-wsl-node-pty-local.sh` in WSL, then pass
   `--wsl-prebuild ./wsl-prebuild/pty.node`. A missing prebuild is a warning,
   not an error (Windows native backend still works).
5. **Unsigned builds trigger SmartScreen/Gatekeeper.** Signing needs
   `--signed` plus Azure Trusted Signing (Windows) or Apple CSC (macOS) env
   vars. See `scripts/setup-signing-env.sh` and `docs/operations/desktop-builds.md`.

### Quick commands (from the repo root)

```bash
# Build dist artifacts once (after code changes)
vp run build:desktop

# Windows x64 (local, with WSL backend)
vp run dist:desktop:artifact --platform win --target nsis --arch x64 --skip-build --wsl-prebuild ./wsl-prebuild/pty.node

# Linux x64 (from WSL Ubuntu; vp must be on WSL PATH)
vp run dist:desktop:artifact --platform linux --target AppImage --arch x64 --skip-build

# macOS (CI only — requires a Mac for sips/iconutil/signing)
# Trigger .github/workflows/build-macos.yml (standalone) or release.yml (full)
```

Artifacts land in `release/`. Outputs:
`Trumbo-Code-<version>-x64.exe`, `Trumbo-Code-<version>-x86_64.AppImage`,
`Trumbo-Code-<version>-arm64.dmg`.

### Shipping

- All apps live in the Trumbo monorepo: `https://github.com/xedro98/Trumbo`
  (this repo, `D:/Torch/cline-full`). The desktop app is at
  `projects/trumbo-code/` and is tracked directly by the parent repo (no
  nested `.git`).
- Push changes with `git push origin main` from the repo root
  (`D:/Torch/cline-full`).
- `wsl-prebuild/` and `.env*` are gitignored by the desktop app's own
  `.gitignore`; never commit them.
- The standalone `xedro98/trembo` and `xedro98/trumbo-code` repos are
  deprecated; the canonical source is now `xedro98/Trumbo`.

### CI workflows

- `release.yml` — full release: all platforms, signing, relay config, CLI
  publish. Trigger via tag push `v*.*.*`, `workflow_dispatch`, or the nightly
  cron. Requires repo secrets (Azure, Apple, Cloudflare, Clerk).
- `build-macos.yml` — standalone macOS DMG, no gates. Use when you just need
  a macOS artifact without the full release pipeline.

## Release & Deploy Runbook

This is the authoritative step-by-step for cutting a new Trumbo Code desktop
release and deploying the marketing site. Follow it in order. The agent
should be able to execute this autonomously when asked to "build, release,
deploy" or "cut a release".

### 0. Prerequisites (check once before starting)

- **Node 24+** is required (the repo targets Node 24; system Node 22 will
  fail on `.ts` scripts). The vite-plus runtime ships a bundled Node at
  `C:/Users/Admin/.vite-plus/js_runtime/node/24.18.1/node.exe` — use that
  binary explicitly for `scripts/*.ts` if the system `node` is older.
- **`gh` CLI** must be authenticated: `gh auth status` should show logged in
  to `github.com` as `xedro98`.
- **Git** on `main`, clean working tree (or staged changes ready to commit).
- **Disk space**: the desktop artifact build needs ~5GB temp + ~350MB output.
  On this machine, `D:` has limited headroom — use `E:` (400GB free) for
  `TMPDIR`/`TEMP`/`TMP` and `TRUMBO_CODE_DESKTOP_OUTPUT_DIR`.
- **Env vars** for the build:
  - `TRUMBO_CODE_DESKTOP_UPDATE_REPOSITORY=xedro98/Trumbo` — so
    electron-builder writes the GitHub update feed into `app-update.yml`
    inside the packaged app. Without this, auto-update has no feed and the
    update pill never fires.
  - `TMPDIR` / `TEMP` / `TMP` — point at a drive with enough space (E:).
  - `TRUMBO_CODE_DESKTOP_OUTPUT_DIR` — where artifacts land (E:).
  - `TRUMBO_CODE_DESKTOP_SKIP_BUILD=false` (default) for a full clean build.
  - `TRUMBO_CODE_DESKTOP_WSL_PREBUILD` — path to a prebuilt Linux `pty.node`
    if you want the WSL backend to work in the packaged app. Optional for
    Windows-only testing (missing = warning, not error).

### 1. Version bump

All four packages must stay in sync (the app shows a version-skew warning if
they diverge):

```bash
cd projects/trumbo-code
for f in apps/desktop/package.json apps/server/package.json apps/web/package.json packages/contracts/package.json; do
  sed -i 's/"version": "<OLD>"/"version": "<NEW>"/' "$f"
done
```

Verify: `grep '"version"' apps/desktop/package.json apps/server/package.json apps/web/package.json packages/contracts/package.json` — all four must match.

### 2. Build the desktop artifact

From `projects/trumbo-code`, using the vite-plus Node 24 binary:

```bash
NODE24="/c/Users/Admin/.vite-plus/js_runtime/node/24.18.1/node.exe"

TMPDIR="E:/trumbo-build-temp" TEMP="E:/trumbo-build-temp" TMP="E:/trumbo-build-temp" \
TRUMBO_CODE_DESKTOP_OUTPUT_DIR="E:/trumbo-release" \
TRUMBO_CODE_DESKTOP_UPDATE_REPOSITORY="xedro98/Trumbo" \
"$NODE24" scripts/build-desktop-artifact.ts --platform win --target nsis --arch x64
```

This runs the full pipeline: `vp run build:desktop` (web + server + desktop
Electron bundles) → stages a production install → `electron-builder --win
--x64 --publish never` → artifacts in `E:/trumbo-release/`.

**Golden rules** (from the section above still apply):

- Never put `--` between the script and flags.
- Match the host platform (Windows→win, macOS→mac, Linux→linux).
- Pass `--skip-build` only if you already ran `vp run build:desktop` and want
  to re-package without rebuilding.
- macOS builds require a Mac (CI only). Linux builds require WSL Ubuntu.

Artifacts produced (Windows):

- `Trumbo-Code-<version>-x64.exe` (the NSIS installer, ~317MB)
- `Trumbo-Code-<version>-x64.exe.blockmap` (differential update support)
- `latest.yml` (electron-updater manifest — version, sha512, files, releaseDate)

### 3. Commit & push

From the repo root (`D:/Torch/cline-full`):

```bash
git add -A
git commit -m "feat: v<VERSION> — <short summary>" --no-verify
git push origin main
```

Use `--no-verify` if the pre-commit `vp check --fix` hook is slow or fails on
unrelated formatting. The CI workflow runs the full check anyway.

### 4. Create the GitHub release

The release **must** include `latest.yml` as an asset — that's what
`electron-updater` fetches to discover new versions. Without it, installed
apps won't see the update.

```bash
cd D:/Torch/cline-full
gh release create v<VERSION> \
  --title "Trumbo Code <VERSION>" \
  --notes "<markdown release notes>" \
  --target main \
  "E:/trumbo-release/Trumbo-Code-<version>-x64.exe" \
  "E:/trumbo-release/Trumbo-Code-<version>-x64.exe.blockmap" \
  "E:/trumbo-release/latest.yml"
```

For macOS/Linux artifacts built in CI, download them from the CI run and
attach to the same release, or let the `release.yml` workflow publish them
directly.

The release is public at `https://github.com/xedro98/Trumbo/releases/tag/v<VERSION>`.

### 5. Deploy the marketing site

From `projects/marketing`:

```bash
cd D:/Torch/cline-full/projects/marketing
bun run deploy
```

This runs `vite build && wrangler deploy` and pushes to Cloudflare Workers.
Domains: `trumbo.dev` + `www.trumbo.dev`. Takes ~20s. Returns a Version ID
on success.

### 6. Verify

- **Release**: `gh release view v<VERSION>` — confirm assets include
  `latest.yml` + the installer.
- **Auto-update**: an installed older build should show the update pill in
  the topbar within ~15s of launch (it checks the GitHub Releases
  `latest.yml`).
- **Marketing**: `curl -sI https://trumbo.dev` returns 200.
- **App**: launch the new installer, confirm the version in the avatar menu
  or settings matches.

### Auto-update system (how it works)

The full auto-update pipeline is already built — no code changes needed for a
standard release:

1. **Electron main** (`apps/desktop/src/updates/DesktopUpdates.ts`):
   `electron-updater` checks GitHub Releases on startup (15s delay) + polls
   every 4 min. `autoDownload=false` — user clicks the pill to download, then
   install. On install: stops all backends, destroys windows,
   `quitAndInstall({ isSilent: true, isForceRunAfter: true })`.
2. **Feed config**: `resources/app-update.yml` (packaged) or
   `dev-app-update.yml` (dev) tells `electron-updater` where to look:
   `provider: github, owner: xedro98, repo: Trumbo`. electron-builder writes
   this during packaging when `TRUMBO_CODE_DESKTOP_UPDATE_REPOSITORY` is set.
3. **Renderer**: `state/desktopUpdate.ts` subscribes to
   `desktopBridge.onUpdateState`; `SidebarUpdatePill.tsx` shows the pill
   with download/install buttons + release-notes tooltip.
4. **Channels**: `latest` (stable) and `nightly` (prereleases). Nightly
   versions match `/-nightly\.\d{8}\.\d+$/` and enable `allowPrerelease` +
   `allowDowngrade` + `fullChangelog`.
5. **Disabled in dev** (`isDevelopment || !isPackaged`) unless mock updates
   are configured (`--mock-updates` + `start:mock-update-server`).

### Common pitfalls

- **ENOSPC during build**: the electron-builder packaging step writes several
  GB to temp. Always set `TMPDIR`/`TEMP`/`TMP` to a drive with >=5GB free.
- **Missing `latest.yml` in the release**: installed apps won't see the
  update. Always upload it as a release asset.
- **Version skew**: if `apps/web` or `packages/contracts` lag
  `apps/server`/`apps/desktop`, the app shows "Client and server versions
  differ". Keep all four in sync.
- **No `app-update.yml` in the packaged app**: if
  `TRUMBO_CODE_DESKTOP_UPDATE_REPOSITORY` (or `GITHUB_REPOSITORY` in CI) isn't
  set, electron-builder skips the publish config and the feed file is
  missing — auto-update silently does nothing. Always set the env var.
- **Cross-platform build refused**: the script throws
  `UnsupportedCrossPlatformDesktopBuildError`. Build on the matching host.
- **Stale Electron single-instance lock** (dev): if `dev:desktop` crash-loops
  on Windows, kill ALL `Electron.exe` processes (`taskkill //F //IM
Electron.exe`), remove `C:/Users/Admin/AppData/Roaming/trumbo-dev/lockfile`,
  and remove `~/.trumbo-code/dev/server-runtime.json` before relaunching.
- **Pre-commit hook failures**: `--no-verify` skips the `vp check --fix`
  hook. Use it if the hook flags unrelated formatting issues; CI will run the
  full check anyway.

### Identity / signing prerequisites (one-time)

- Legal entity: Maxfense, Inc. (Delaware, File #7070030, incorporated 2022-10-06).
- Azure Trusted Signing needs a D-U-N-S (D&B) or LEI (GLEIF) for identity
  validation — 3-7 business days. Maxfense has no LEI on GLEIF; check D&B for
  an existing D-U-N-S or request one at dnb.com/duns-number/get-a-duns.

## Reference Repos

- Open-source Codex repo: https://github.com/openai/codex
- Codex-Monitor (Tauri, feature-complete, strong reference implementation): https://github.com/Dimillian/CodexMonitor

Use these as implementation references when designing protocol handling, UX flows, and operational safeguards.

## Vendored Repositories

This project vendors external repositories under `.repos/` as read-only reference material for coding
agents.

- Prefer examples and patterns from the vendored source code over generated guesses or web search results.
- Do not edit files under `.repos/` unless explicitly asked.
- Do not import from `.repos/`; application code must continue importing from normal package dependencies.
- Manage vendored subtrees with `bun run sync:repos`; use `bun run sync:repos --repo <id>` to sync one
  configured repository.
- When updating a dependency with a configured vendored subtree, sync that subtree in the same change so
  `.repos/` matches the installed dependency version.
- When writing Effect code, read `.repos/effect-smol/LLMS.md` first and inspect `.repos/effect-smol/` for
  examples of idiomatic usage, tests, module structure, and API design.
- When writing relay infrastructure code with Alchemy, inspect `.repos/alchemy-effect/` for examples of
  idiomatic usage, tests, module structure, and API design.
