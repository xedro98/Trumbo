# Trumbo

Meet Trumbo, an autonomous AI coding agent for Visual Studio Code. Trumbo plans, edits files, runs terminal commands, uses the browser, and ships code with your permission at every step.

Built by [Maxfense, Inc](https://trumbo.dev).

---

## What Trumbo can do

- **Plan and execute multi-step tasks.** Give Trumbo a goal. It breaks the work down, explores your codebase, and implements changes file by file.
- **Edit files with diff review.** Every edit shows up as a VS Code diff. Approve, reject, or ask for changes before anything lands.
- **Run terminal commands.** Trumbo executes shell commands in your integrated terminal and reacts to output, compile errors, and test failures.
- **Browse the web.** For frontend work, Trumbo launches a headless browser, clicks, types, scrolls, and captures screenshots plus console logs to fix runtime and visual bugs.
- **Extend itself with MCP tools.** Ask Trumbo to "add a tool" and it creates and installs a custom Model Context Protocol server tailored to your workflow.
- **Checkpoints.** Snapshots of your workspace are taken at each step so you can compare and restore to any point.

---

## Get started

1. Install Trumbo from the Marketplace.
2. Open the Trumbo panel from the activity bar (right secondary sidebar by default).
3. Sign in with your Trumbo account, or bring your own API key (OpenRouter, Anthropic, OpenAI, Google, AWS Bedrock, Azure, GCP Vertex, Cerebras, Groq, or any OpenAI-compatible endpoint).
4. Describe what you want and let Trumbo work.

---

## Use any model

Trumbo supports OpenRouter, Anthropic, OpenAI, Google Gemini, AWS Bedrock, Azure, GCP Vertex, Cerebras, Groq, and any OpenAI-compatible API. Local models through LM Studio or Ollama work too. Token usage and cost are tracked per request and per task.

---

## Context you can add

- `@file` adds a file's contents without wasting a read-file approval
- `@folder` pulls in an entire folder at once
- `@url` fetches a URL and converts it to markdown
- `@problems` adds workspace errors and warnings from the Problems panel

---

## Modes

- **Plan mode.** Read-only exploration. Trumbo investigates, reads, and proposes a plan without touching files.
- **Act mode.** Trumbo implements the plan, editing files and running commands with your approval.

---

## Privacy

Trumbo sends prompts to the model provider you configure. No telemetry is sent to third parties. Settings and session data stay on your machine.

---

## Links

- [Documentation](https://docs.trumbo.dev)
- [Repository](https://github.com/xedro98/Trumbo)
- [Feature requests](https://github.com/xedro98/Trumbo/discussions)
- [Report an issue](https://github.com/xedro98/Trumbo/issues)

---

## License

[Apache 2.0 (c) 2026 Maxfense, Inc.](./LICENSE)
