```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Multi-Agent War Room

A web app that spawns four specialist agents in parallel, streams each one's output to the browser in real time over SSE, then hands their findings to a synthesizer agent that produces a single unified decision brief. It is a compact demo of agent composition: many independent runs feeding one summarizing run.

![Agent War Room interface](assets/agent-war-room.png)

## Getting started

Install dependencies and build the SDK workspace once:

```bash
bun install
bun run build:sdk
```

Set a provider API key. Trembo is bring-your-own-key, so use a key from the model provider you configured:

```bash
export TREMBO_API_KEY="trembo_..."
```

Run the app:

```bash
bun dev
```

Open <http://localhost:3456>, enter a mission, and watch the agents work.

## What it does

1. You enter a mission in the browser.
2. The server spawns four `Agent` instances in parallel via `Promise.all`:
   - Architect — system design.
   - Security Analyst — audit.
   - Pragmatist — product lens.
   - Skeptic — red team.
3. Each agent streams `assistant-text-delta` events to the browser over SSE, rendered in its own card so you can watch all four think at once.
4. Once every specialist finishes, a synthesizer agent combines their findings into a unified decision brief, also streamed live.

## Concepts demonstrated

- Running multiple `Agent` instances concurrently with `Promise.all`.
- Per-agent `subscribe()` for independent event streams.
- Server-Sent Events (SSE) to stream agent output to a browser.
- Agent composition: feeding one agent's output as input to another.
- An inline HTML frontend served from the same Node.js server (single file, no build step).

## Notes

- For a simpler starting point, see [quickstart](../quickstart).
- For custom tools and a structured workflow, see [code-review-bot](../code-review-bot).
