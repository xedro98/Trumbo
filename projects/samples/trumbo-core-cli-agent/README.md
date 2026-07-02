```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo Core CLI Agent

An interactive terminal chat agent powered by the `TrumboCore` runtime. It is similar in spirit to [`cli-agent`](../cli-agent), but instead of the stateless `Agent` class it uses stateful TrumboCore sessions and the runtime's built-in tools — so you get Trumbo's internal agent harness, persistence, and tool policies for free.

## Getting started

Install dependencies and build the SDK workspace once:

```bash
bun install
bun run build:sdk
```

Set a provider API key. Trumbo is bring-your-own-key, so use a key from the model provider you configured:

```bash
export TRUMBO_API_KEY="sk_..."
```

Run the agent:

```bash
bun dev
```

You will get a `you:` prompt. Type any message and press Enter to see a streaming response. Type `exit` to quit.

## Optional model configuration

The example defaults to Trumbo's gateway provider and Claude Sonnet. To pick a different provider or model, export either (or both):

```bash
export TRUMBO_PROVIDER_ID="trumbo"
export TRUMBO_MODEL_ID="anthropic/claude-sonnet-4.6"
```

## What it does

- Creates a local `TrumboCore` runtime with `TrumboCore.create()`.
- Starts one interactive session with `trumbo.start()`.
- Sends each user turn with `trumbo.send({ sessionId, prompt })`.
- Streams `agent_event` text to stdout as the assistant responds.
- Logs tool calls and tool results inline.
- Uses TrumboCore's built-in tools instead of defining custom tools.
- Calls `trumbo.stop()` and `trumbo.dispose()` during shutdown.

## Concepts demonstrated

- Stateful sessions with `TrumboCore`.
- Multi-turn conversation using a single `sessionId`.
- `CoreSessionEvent` subscription via `trumbo.subscribe()`.
- Built-in runtime tools (`read_files`, `search_codebase`, `run_commands`, and so on).
- Basic tool policies: file reads and search are auto-approved; other tools request approval.

## Notes

- Use this example when you want the full TrumboCore runtime with sessions, persistence, and built-in tools.
- For the smallest possible SDK example, see [quickstart](../quickstart).
- For the lightweight stateless runtime, see [cli-agent](../cli-agent).
