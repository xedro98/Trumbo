```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# `projects/samples/vscode` (`@trumbodev/vscode`)

A VS Code extension that opens a chat webview and runs Trumbo sessions over the RPC runtime. It is a minimal, end-to-end example of embedding Trumbo in an editor: spawn an owner-scoped RPC sidecar, drive chat turns from the extension, and stream runtime events into the webview.

## What it does

- Opens a webview panel via the `Trumbo: Open Chat in Editor` command.
- Ensures a compatible owner-scoped RPC sidecar by running `trumbo rpc ensure --json`.
- Starts, sends, and aborts chat turns through RPC runtime methods (`StartRuntimeSession`, `SendRuntimeSession`, `AbortRuntimeSession`).
- Streams runtime events into the webview so assistant output appears incrementally.

## Requirements

- `trumbo` is already installed and resolvable on your `PATH`.
- A provider and model are configured in your Trumbo provider settings (Trumbo is bring-your-own-key, so point it at whatever provider key you want to use).

## Development

```bash
# Build the extension bundle
bun -F @trumbodev/vscode build

# Typecheck
bun -F @trumbodev/vscode typecheck
```

To run it locally in VS Code:

1. Build the extension: `bun -F @trumbodev/vscode build`.
2. Open `projects/samples/vscode` in VS Code.
3. Press `F5` to launch the Extension Development Host.
4. Run the command `Trumbo: Open Chat in Editor`.
