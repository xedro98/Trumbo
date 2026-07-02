```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# CLI Agent

An interactive terminal chat agent with streaming output and a shell tool. You type messages, the agent replies as tokens arrive, and it can run shell commands on your behalf to answer.

## Getting started

Install dependencies and build the SDK workspace once:

```bash
bun install
bun run build:sdk
```

Set a provider API key. Trumbo is bring-your-own-key, so use a key from the model provider you configured:

```bash
export TRUMBO_API_KEY="trumbo_..."
```

Run the agent:

```bash
bun dev
```

You will get a `you:` prompt. Type any message and press Enter to see a streaming response. Tool calls and their results are printed inline as they happen.

## What it does

- Builds a conversational `Agent` with a `shell` tool defined via `createTool`.
- Streams `assistant-text-delta` events to stdout as the assistant responds.
- Logs tool calls and their results inline so you can watch the agent reason and act.
- Uses `agent.run()` for the first turn and `agent.continue()` for follow-ups so conversation context is preserved across turns.

## Concepts demonstrated

- `createTool` with zod schema validation for the tool arguments.
- Event subscription for streaming text and observing tool calls.
- Multi-turn conversation using `run()` followed by `continue()`.
- Shaping the agent with a `systemPrompt`.

## Notes

- For the smallest possible example, see [quickstart](../quickstart).
- For structured workflows with multiple tools, see [code-review-bot](../code-review-bot).
