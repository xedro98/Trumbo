```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# `apps/examples/vscode` (`@trembo/vscode`)

A VS Code extension that opens a chat webview and runs Trembo sessions over the RPC runtime. It is a minimal, end-to-end example of embedding Trembo in an editor: spawn an owner-scoped RPC sidecar, drive chat turns from the extension, and stream runtime events into the webview.

## What it does

- Opens a webview panel via the `Trembo: Open Chat in Editor` command.
- Ensures a compatible owner-scoped RPC sidecar by running `trembo rpc ensure --json`.
- Starts, sends, and aborts chat turns through RPC runtime methods (`StartRuntimeSession`, `SendRuntimeSession`, `AbortRuntimeSession`).
- Streams runtime events into the webview so assistant output appears incrementally.

## Requirements

- `trembo` is already installed and resolvable on your `PATH`.
- A provider and model are configured in your Trembo provider settings (Trembo is bring-your-own-key, so point it at whatever provider key you want to use).

## Development

```bash
# Build the extension bundle
bun -F @trembo/vscode build

# Typecheck
bun -F @trembo/vscode typecheck
```

To run it locally in VS Code:

1. Build the extension: `bun -F @trembo/vscode build`.
2. Open `apps/examples/vscode` in VS Code.
3. Press `F5` to launch the Extension Development Host.
4. Run the command `Trembo: Open Chat in Editor`.
