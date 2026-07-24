---
title: "Installing Trumbo"
description: "Choose your installation path: CLI or SDK"
---
## Choose Your Install Path

- [CLI](#cli) — terminal workflows
- [SDK](#sdk) — build with `@trumbo/sdk`

## CLI

Pick this if you want Trumbo in terminal workflows, both interactive and automated.

Trumbo ships as a self-contained binary. The global `trumbo` command is the same regardless of install method.

### Package managers (Node.js required)

```bash
npm install -g @trumbodev/cli      # npm
pnpm add -g @trumbodev/cli         # pnpm
bun add -g @trumbodev/cli          # bun
```

npm global installs auto-update on startup when a newer version is published.

### curl (macOS / Linux / Git Bash)

No Node.js required. Installs to `~/.trumbo/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.sh | sh
```

### PowerShell (Windows)

No Node.js required. Installs to `%USERPROFILE%\.trumbo\bin`:

```powershell
irm https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.ps1 | iex
```

### Authenticate

```bash
    trumbo auth trumbo
```
  

  
### Run Trumbo

```bash
    trumbo
# or
    trumbo "your task"
```
  

More details: [CLI Installation & Setup](../usage/cli-overview)

## Upgrading

Trumbo checks for new versions on startup and can self-update. To upgrade manually:

```bash
npm install -g @trumbodev/cli@latest
```

### Windows

Close any running Trumbo sessions before upgrading. npm can't replace `trumbo.exe` while it's running, which can leave a stale binary cached in `%LOCALAPPDATA%\Trumbo\bin`.

As of CLI v3.2.1, the `trumbo` launcher version-checks its cached binary and automatically falls back to the freshly-installed npm binary if the cache is stale, so a stale cache can no longer shadow a new install.

If you hit `EBUSY` or `EPERM` errors, stop Trumbo and reinstall:

```powershell
Get-Process trumbo -ErrorAction SilentlyContinue | Stop-Process -Force
npm install -g @trumbodev/cli@latest --allow-scripts=@trumbodev/cli
```

### About `allow-scripts` warnings

npm 11 gates install scripts (like Trumbo's binary-cache postinstall) behind `allow-scripts`. If your config restricts scripts, pass `--allow-scripts=@trumbodev/cli` so Trumbo's postinstall runs and caches the binary outside `node_modules` for smoother Windows upgrades:

```bash
npm install -g @trumbodev/cli --allow-scripts=@trumbodev/cli
```

`npm warn allow-scripts` lines for other global packages on your machine are harmless.

## SDK

Pick this if you're building your own app or agent on top of Trumbo.

### Create project

```bash
    mkdir my-agent && cd my-agent
    npm init -y
```
  

  
### Install SDK

```bash
    npm install @trumbo/sdk
```
  

  
### Build and run

Browse the SDK examples to run your first agent.
  

Start here: [SDK Examples](../sdk/examples)

## Need Help?

- [Troubleshooting](../troubleshooting/networking-and-proxies)
- [GitHub Discussions](https://github.com/xedro98/trembo/discussions)
