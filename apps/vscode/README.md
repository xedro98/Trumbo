```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Trembo — VS Code extension

The Trembo VS Code extension puts the Trembo coding agent inside your editor: it reads your project, plans a change, edits files (shown as reviewable diffs), runs terminal commands, browses the web, and reports back — all with human-in-the-loop approvals. It shares its agent engine with the [Trembo CLI](https://github.com/xedro98/trembo/tree/main/apps/cli) and the [Trembo SDK](https://github.com/xedro98/trembo/tree/main/sdk).

Bring your own keys (Anthropic, OpenAI, Google, OpenRouter, Bedrock, Vertex, Azure, Ollama, LM Studio, or any OpenAI-compatible endpoint). There is no hosted backend and no telemetry.

## Prerequisites

- [Node.js](https://nodejs.org) 22+
- [Bun](https://bun.sh)
- `protoc` (Protocol Buffer compiler) — only if you change `.proto` files

## Setup

From the repo root:

```bash
bun install
cd sdk && bun run build && cd ..          # build the SDK (required before first run)
```

Then, for the extension:

```bash
cd apps/vscode
bun run install:all                       # extension + webview-ui deps
bun run protos                            # generate Protocol Buffer files (first build only)
```

If the build's problem diagnostics look wrong, install the [esbuild problem matchers](https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers) extension.

## Run and debug

- Press `F5` (or **Run → Start Debugging**) to open a new VS Code window with the extension loaded.
- Terminal workflow: `bun run dev` (generates protos + watch mode) or `bun run watch` (if protos are already generated).

## Test

```bash
cd apps/vscode
bun run test          # unit tests
bun run test:e2e      # Playwright E2E tests
```

E2E tests live in `src/test/e2e/` — see [`src/test/e2e/README.md`](./src/test/e2e/README.md). On Linux, extension tests need the system libraries listed in the root [CONTRIBUTING.md](https://github.com/xedro98/trembo/blob/main/CONTRIBUTING.md).

## Lint and format

```bash
bun run lint
bun run format:fix
```

## Project layout

- `src/` — extension host code (controller, core, services, integrations, hosts)
- `webview-ui/` — the React webview (chat, settings, marketplace, onboarding)
- `walkthrough/` — first-run walkthrough step content
- `assets/icons/` — icon assets (including the `trembo-bot` icon font)

## Contributing

Read the root [Contributing Guide](https://github.com/xedro98/trembo/blob/main/CONTRIBUTING.md). Open [issues](https://github.com/xedro98/trembo/issues) or [discussions](https://github.com/xedro98/trembo/discussions) for anything else.

## License

[Apache 2.0 © Trembo Bot Inc.](https://github.com/xedro98/trembo/blob/main/LICENSE)
