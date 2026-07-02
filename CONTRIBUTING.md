<div align="center">
<pre>
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
</pre>
</div>

# Contributing to Trembo

Thanks for your interest in Trembo. This guide covers how to report issues, set up the project, and submit pull requests. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs

Before opening a new issue, [search existing ones](https://github.com/xedro98/trembo/issues) to avoid duplicates. When you're ready, [open a new issue](https://github.com/xedro98/trembo/issues/new/choose) and fill in the template.

> **Security:** If you find a security vulnerability, do **not** open a public issue. Report it privately via [GitHub Security Advisories](https://github.com/xedro98/trembo/security/advisories/new). See [SECURITY.md](SECURITY.md).

## Before you build a feature

All non-trivial changes start with a GitHub issue:

1. Check the [Discussions](https://github.com/xedro98/trembo/discussions) for similar ideas.
2. If your idea is new, open a feature request.
3. Wait for a maintainer to ack it before implementing.
4. Open a PR once it's approved.

PRs that change behavior without an approved issue may be closed.

## Finding something to work on

Look for issues labeled [`good first issue`](https://github.com/xedro98/trembo/labels/good%20first%20issue) or [`help wanted`](https://github.com/xedro98/trembo/labels/help%20wanted). Docs improvements are always welcome — browse [`docs/`](./docs) and send a PR.

## Development setup

### Prerequisites

- [Node.js](https://nodejs.org) 22+
- [Bun](https://bun.sh)
- [Git LFS](https://git-lfs.com) (the repo stores binary assets via LFS)
- `protoc` (Protocol Buffer compiler) — only needed if you change `.proto` files

### Clone and install

```bash
git clone https://github.com/xedro98/trembo.git
cd trembo
bun install
```

### Build the SDK (required before first run)

```bash
cd sdk && bun run build && cd ..
```

### Run the CLI

```bash
bun --conditions=development --cwd apps/cli dev
```

### Run the VS Code extension

```bash
cd apps/vscode
bun run install:all
bun run protos        # generate Protocol Buffer files (first build only)
# Press F5, or:
bun run dev           # protos + watch mode
```

If build problems look wrong in the problems panel, install the [esbuild problem matchers](https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers) extension.

### Linux: system libraries for extension tests

VS Code extension tests on Linux need these packages:

```bash
sudo apt update
sudo apt install -y \
  dbus libasound2 libatk-bridge2.0-0 libatk1.0-0 libdrm2 libgbm1 \
  libgtk-3-0 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxfixes3 \
  libxkbfile1 libxrandr2 xvfb
```

## Submitting a pull request

1. Keep PRs focused — one feature or fix each. Split larger work into stacked PRs.
2. Format and lint: `bun run format:fix` and `bun run lint`.
3. Test: `bun test` (and `cd apps/vscode && bun run test` for the extension).
4. Rebase on the latest `main` and make sure the branch builds.
5. Write a clear PR description: what changed, how to test it, any breaking changes, screenshots for UI work.
6. Reference the issue (`Closes #123`).

### E2E tests (VS Code)

```bash
cd apps/vscode
bun run test:e2e              # build + run all E2E tests
bun run e2e                   # run without rebuilding
bun run test:e2e -- --debug   # Playwright Inspector
```

Tests live in `src/test/e2e/`. See [`src/test/e2e/README.md`](./apps/vscode/src/test/e2e/README.md).

## Commit style

Use conventional commits — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` — and reference issues by number.

## Versioning

Maintainers handle releases and the changelog. You don't need to write changeset files for normal PRs.

## License

By submitting a PR, you agree your contributions are licensed under the project's [Apache 2.0](LICENSE) license.
