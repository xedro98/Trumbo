```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Trembo Core CLI Agent

An interactive terminal chat agent powered by the `TremboCore` runtime. It is similar in spirit to [`cli-agent`](../cli-agent), but instead of the stateless `Agent` class it uses stateful TremboCore sessions and the runtime's built-in tools — so you get Trembo's internal agent harness, persistence, and tool policies for free.

## Getting started

Install dependencies and build the SDK workspace once:

```bash
bun install
bun run build:sdk
```

Set a provider API key. Trembo is bring-your-own-key, so use a key from the model provider you configured:

```bash
export TREMBO_API_KEY="sk_..."
```

Run the agent:

```bash
bun dev
```

You will get a `you:` prompt. Type any message and press Enter to see a streaming response. Type `exit` to quit.

## Optional model configuration

The example defaults to Trembo's gateway provider and Claude Sonnet. To pick a different provider or model, export either (or both):

```bash
export TREMBO_PROVIDER_ID="trembo"
export TREMBO_MODEL_ID="anthropic/claude-sonnet-4.6"
```

## What it does

- Creates a local `TremboCore` runtime with `TremboCore.create()`.
- Starts one interactive session with `trembo.start()`.
- Sends each user turn with `trembo.send({ sessionId, prompt })`.
- Streams `agent_event` text to stdout as the assistant responds.
- Logs tool calls and tool results inline.
- Uses TremboCore's built-in tools instead of defining custom tools.
- Calls `trembo.stop()` and `trembo.dispose()` during shutdown.

## Concepts demonstrated

- Stateful sessions with `TremboCore`.
- Multi-turn conversation using a single `sessionId`.
- `CoreSessionEvent` subscription via `trembo.subscribe()`.
- Built-in runtime tools (`read_files`, `search_codebase`, `run_commands`, and so on).
- Basic tool policies: file reads and search are auto-approved; other tools request approval.

## Notes

- Use this example when you want the full TremboCore runtime with sessions, persistence, and built-in tools.
- For the smallest possible SDK example, see [quickstart](../quickstart).
- For the lightweight stateless runtime, see [cli-agent](../cli-agent).
