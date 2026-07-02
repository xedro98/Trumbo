```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Quickstart

The smallest Trumbo SDK example we could write. It creates a single `Agent`, sends one prompt, and streams the assistant response straight to stdout. If you want to see the SDK do something end-to-end in under fifteen lines, start here.

## Getting started

Use Node.js 22 or newer.

Install dependencies and build the SDK workspace once:

```bash
bun install
bun run build:sdk
```

Hand the agent a provider API key. Trumbo is bring-your-own-key, so this is a key from whichever model provider you configured:

```bash
export TRUMBO_API_KEY="trumbo_..."
```

Run the example:

```bash
bun dev
```

## What it does

1. Creates an `Agent` configured with a provider and model.
2. Subscribes to `assistant-text-delta` events so each token is printed as it arrives.
3. Calls `agent.run()` with a single prompt.
4. Prints token usage once the run finishes.

## Notes

- For an interactive terminal chat with a shell tool, see [cli-agent](../cli-agent).
- For custom tools and a structured review workflow, see [code-review-bot](../code-review-bot).
