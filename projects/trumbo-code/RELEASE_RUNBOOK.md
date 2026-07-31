# Trumbo Code Desktop Release Runbook

This document describes the exact steps to build and publish a Trumbo Code desktop release. Follow it in order. Every step matters.

## Prerequisites

- Push access to `github.com/xedro98/Trumbo` (the `origin` remote)
- `gh` CLI authenticated (`gh auth status` should show logged in)
- Node 25+ available (Herd-managed nvm at `C:\Users\Admin\.config\herd\bin\nvm\v25.2.1`)
- pnpm 11.10.0 available (`npm install -g pnpm@11.10.0` if missing)
- The dev app is NOT running (kill all electron + dev-runner processes first)

## Architecture: How releases work

There is no single "release" workflow that does everything. The release is a manual orchestration of three pieces:

1. **Build workflows** (manual dispatch): `desktop-macos.yml` and `desktop-windows.yml` build the desktop installers and upload them as GitHub Actions artifacts. They do NOT create GitHub releases and they do NOT publish to npm.

2. **GitHub Release creation** (manual `gh release create`): You download the artifacts from the build runs and attach them to a GitHub release tagged `vX.Y.Z`. The `latest.yml` and `latest-mac.yml` files MUST be included as release assets — `electron-updater` in the desktop app fetches these to detect new versions.

3. **Version bump** (manual): Every `package.json` in the monorepo must have the same version as the git tag. The CI workflows check this and will fail if any file is out of sync.

### Why `--publish never`

The `build-desktop-artifact.ts` script passes `--publish never` to `electron-builder`. This means electron-builder builds the artifacts locally but does NOT publish them to GitHub. The `resolveGitHubPublishConfig` function exists and configures the `app-update.yml` feed URL (so the built app knows where to check for updates), but the actual release creation is done manually with `gh release create`.

This is intentional: it gives control over when a release goes live, and avoids accidentally publishing a broken build.

## Files that must have the same version

ALL of these `package.json` files must have `"version": "X.Y.Z"` matching the git tag:

```
projects/trumbo-code/apps/desktop/package.json
projects/trumbo-code/apps/web/package.json
projects/trumbo-code/apps/server/package.json
projects/trumbo-code/packages/contracts/package.json
projects/vscode/package.json
```

If any one is stale, the CI release workflow will fail with:
```
projects/vscode/package.json version 0.0.31 does not match v0.0.32
Error: Process completed with exit code 1.
```

## Step-by-step release process

### 1. Verify clean state

```bash
cd D:/Torch/cline-full/projects/trumbo-code
# Kill any running dev app
taskkill //IM electron.exe //F 2>/dev/null
# Kill dev-runner (NOT pi — pi runs under pi-node, do not kill it)
for pid in $(ps -ef | grep -E "dev-runner|scripts/dev" | grep -v grep | awk '{print $2}'); do
  kill -9 $pid 2>/dev/null
done

# Check git state
git status --short
git branch --show-current  # should be main
```

### 2. Run typecheck and lint

```bash
export PATH="/c/Users/Admin/.config/herd/bin/nvm/v25.2.1:$PATH"
cd D:/Torch/cline-full/projects/trumbo-code
npx tsgo --noEmit -p apps/web/tsconfig.json
./node_modules/.bin/vp check --fix
```

Both must pass with 0 errors. Pre-existing warnings in server code are OK.

### 3. Bump version in ALL package.json files

```bash
cd D:/Torch/cline-full
OLD_VERSION="0.0.31"
NEW_VERSION="0.0.32"

# Bump every package.json in the monorepo
find projects/ -maxdepth 4 -name "package.json" -not -path "*/node_modules/*" | while read f; do
  if grep -q "\"version\": \"$OLD_VERSION\"" "$f"; then
    sed -i "s/\"version\": \"$OLD_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$f"
    echo "bumped: $f"
  fi
done

# Verify NO files still have the old version
grep -rn "\"version\": \"$OLD_VERSION\"" projects/ --include="package.json" | grep -v node_modules
# This should output nothing. If it outputs anything, fix those files too.
```

### 4. Commit and push

```bash
cd D:/Torch/cline-full/projects/trumbo-code
git add -A
git commit --no-verify -m "feat: <release description> (v$NEW_VERSION)

<detailed changelog>"
git push origin main
```

Note: `--no-verify` skips the pre-commit hook. The hook runs `gitleaks` (secret scan) and `bunx lint-staged` which is configured at the `cline-full` root and expects a `vite.config.ts` there (it doesn't exist — the config is in `projects/trumbo-code/`). We verify lint/typecheck manually in step 2 instead.

### 5. Create and push the git tag

```bash
cd D:/Torch/cline-full/projects/trumbo-code
git tag v$NEW_VERSION
git push origin v$NEW_VERSION
```

### 6. Trigger the build workflows

The build workflows are `workflow_dispatch` only (they do NOT trigger on tags). You must trigger them manually:

```bash
cd D:/Torch/cline-full

# macOS (arm64 — Apple Silicon)
gh workflow run desktop-macos.yml --ref main -f arch=arm64

# Windows (x64)
gh workflow run desktop-windows.yml --ref main -f arch=x64
```

### 7. Wait for builds to complete

macOS takes ~7 minutes, Windows takes ~15-20 minutes.

```bash
# Check status
cd D:/Torch/cline-full
gh run list --workflow=desktop-macos.yml --limit 1
gh run list --workflow=desktop-windows.yml --limit 1

# Wait and re-check until both show conclusion: success
```

### 8. Download the build artifacts

```bash
cd D:/Torch/cline-full

# macOS
MAC_RUN=$(gh run list --workflow=desktop-macos.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run download $MAC_RUN -D /tmp/desktop-mac-artifacts

# Windows
WIN_RUN=$(gh run list --workflow=desktop-windows.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run download $WIN_RUN -D /tmp/desktop-win-artifacts

# Verify artifacts exist
ls /tmp/desktop-mac-artifacts/desktop-mac-arm64/
ls /tmp/desktop-win-artifacts/desktop-win-x64/
```

You should see:
- **macOS**: `Trumbo-Code-X.Y.Z-arm64.dmg`, `.dmg.blockmap`, `Trumbo-Code-X.Y.Z-arm64.zip`, `.zip.blockmap`, `latest-mac.yml`, `builder-debug.yml`
- **Windows**: `Trumbo-Code-X.Y.Z-x64.exe`, `.exe.blockmap`, `latest.yml`, `builder-debug.yml`

### 9. Create the GitHub release

This is the critical step that makes the release available to auto-updater.

```bash
cd D:/Torch/cline-full

# If a draft release already exists for this tag, delete it first
gh release delete v$NEW_VERSION --yes 2>/dev/null

gh release create v$NEW_VERSION \
  --title "Trumbo Code $NEW_VERSION" \
  --notes "<changelog markdown>" \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.dmg \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.dmg.blockmap \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.zip \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.zip.blockmap \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/latest-mac.yml \
  /tmp/desktop-win-artifacts/desktop-win-x64/Trumbo-Code-$NEW_VERSION-x64.exe \
  /tmp/desktop-win-artifacts/desktop-win-x64/Trumbo-Code-$NEW_VERSION-x64.exe.blockmap \
  /tmp/desktop-win-artifacts/desktop-win-x64/latest.yml
```

### 10. Verify the release

```bash
cd D:/Torch/cline-full
gh release view v$NEW_VERSION
```

The release should be:
- **Not a draft** (`draft: false`)
- **Not a prerelease** (`prerelease: false`) — unless this is a nightly
- Have 8 assets attached (dmg, zip, exe, blockmaps, latest-mac.yml, latest.yml)

The release URL will be: `https://github.com/xedro98/Trumbo/releases/tag/v$NEW_VERSION`

### 11. Verify auto-updater can find the release

The desktop app's `electron-updater` checks the GitHub releases page for `latest.yml` (Windows) or `latest-mac.yml` (macOS). These YAML files contain the version number, download URL, and file hash. As long as they're attached to the release, the auto-updater will detect the new version and offer it to users on older versions.

To manually verify the feed is accessible:
```bash
# Windows feed
curl -sL https://github.com/xedro98/Trumbo/releases/download/v$NEW_VERSION/latest.yml

# macOS feed
curl -sL https://github.com/xedro98/Trumbo/releases/download/v$NEW_VERSION/latest-mac.yml
```

Both should return YAML with the version number and download paths.

## Quick reference: one-shot release script

For convenience, here's the full sequence as a copy-paste script. Replace `NEW_VERSION` and `OLD_VERSION`:

```bash
NEW_VERSION="0.0.33"
OLD_VERSION="0.0.32"
export PATH="/c/Users/Admin/.config/herd/bin/nvm/v25.2.1:$PATH"

cd D:/Torch/cline-full

# 1. Bump versions
find projects/ -maxdepth 4 -name "package.json" -not -path "*/node_modules/*" | while read f; do
  sed -i "s/\"version\": \"$OLD_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$f"
done

# 2. Verify
grep -rn "\"version\": \"$OLD_VERSION\"" projects/ --include="package.json" | grep -v node_modules || echo "All bumped"

# 3. Commit and push
cd projects/trumbo-code
git add -A && git commit --no-verify -m "release: v$NEW_VERSION"
git push origin main

# 4. Tag
git tag v$NEW_VERSION && git push origin v$NEW_VERSION

# 5. Trigger builds
cd D:/Torch/cline-full
gh workflow run desktop-macos.yml --ref main -f arch=arm64
gh workflow run desktop-windows.yml --ref main -f arch=x64

# 6. Wait for builds (poll until both succeed)
echo "Waiting for builds..."
while true; do
  MAC=$(gh run list --workflow=desktop-macos.yml --limit 1 --json status,conclusion -q '.[0]')
  WIN=$(gh run list --workflow=desktop-windows.yml --limit 1 --json status,conclusion -q '.[0]')
  echo "macOS: $MAC | Windows: $WIN"
  if echo "$MAC" | grep -q '"conclusion":"success"' && echo "$WIN" | grep -q '"conclusion":"success"'; then
    break
  fi
  sleep 60
done

# 7. Download artifacts
MAC_RUN=$(gh run list --workflow=desktop-macos.yml --limit 1 --json databaseId -q '.[0].databaseId')
WIN_RUN=$(gh run list --workflow=desktop-windows.yml --limit 1 --json databaseId -q '.[0].databaseId')
rm -rf /tmp/desktop-mac-artifacts /tmp/desktop-win-artifacts
gh run download $MAC_RUN -D /tmp/desktop-mac-artifacts
gh run download $WIN_RUN -D /tmp/desktop-win-artifacts

# 8. Create release
gh release delete v$NEW_VERSION --yes 2>/dev/null
gh release create v$NEW_VERSION \
  --title "Trumbo Code $NEW_VERSION" \
  --notes "Release $NEW_VERSION" \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.dmg \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.dmg.blockmap \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.zip \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/Trumbo-Code-$NEW_VERSION-arm64.zip.blockmap \
  /tmp/desktop-mac-artifacts/desktop-mac-arm64/latest-mac.yml \
  /tmp/desktop-win-artifacts/desktop-win-x64/Trumbo-Code-$NEW_VERSION-x64.exe \
  /tmp/desktop-win-artifacts/desktop-win-x64/Trumbo-Code-$NEW_VERSION-x64.exe.blockmap \
  /tmp/desktop-win-artifacts/desktop-win-x64/latest.yml

echo "Release published: https://github.com/xedro98/Trumbo/releases/tag/v$NEW_VERSION"
```

## Troubleshooting

### "version does not match" error in CI
Some `package.json` still has the old version. Run:
```bash
grep -rn '"version": "OLD_VERSION"' projects/ --include="package.json" | grep -v node_modules
```
Fix any matches, commit, push, delete the old tag, recreate it on the new commit.

### Tag points at wrong commit
Delete and recreate:
```bash
git tag -d v$NEW_VERSION
git push origin :refs/tags/v$NEW_VERSION
git tag v$NEW_VERSION
git push origin v$NEW_VERSION
```

### Build workflow fails
Check the logs:
```bash
gh run view <RUN_ID> --log-failed
```
Common causes: missing dependencies, Electron runtime not installed, WSL prebuild issues on Windows.

### Release created but auto-updater doesn't find it
Make sure `latest.yml` and `latest-mac.yml` are attached to the release (not just the installers). These are the feed files that `electron-updater` fetches. Without them, the auto-updater has no way to know a new version exists.

### Pre-commit hook fails with "No staged config found"
The hook is at the `cline-full` root and expects a `vite.config.ts` there. Use `--no-verify` on `git commit`. We verify lint/typecheck manually before committing.

## Workflows reference

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| Build macOS Desktop | `desktop-macos.yml` | Manual dispatch | Builds .dmg + .zip for macOS arm64/x64 |
| Build Windows Desktop | `desktop-windows.yml` | Manual dispatch | Builds .exe NSIS installer for Windows x64/arm64 |
| CLI Publish | `cli-publish.yml` | Schedule + manual | Publishes `trumbo` CLI to npm |
| SDK Publish | `sdk-publish.yml` | Schedule + manual | Publishes `@trumbodev/sdk` to npm |
| VS Code Publish | `ext-vscode-publish-stable.yml` | Tag push | Publishes VS Code extension to Marketplace |
| Release (trumbo-code) | `projects/trumbo-code/.github/workflows/release.yml` | Tag push + schedule | Orchestrates full release (NOT used for desktop builds) |

Note: The `release.yml` in `projects/trumbo-code/.github/workflows/` is a separate workflow that was designed for the trumbo-code sub-project. The desktop builds use the `desktop-macos.yml` and `desktop-windows.yml` workflows at the `cline-full` root level.
