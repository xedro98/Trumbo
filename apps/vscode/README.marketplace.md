```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Trembo

[Source on GitHub](https://github.com/xedro98/trembo/tree/main/apps/vscode) • [Docs](https://github.com/xedro98/trembo) • [Issues](https://github.com/xedro98/trembo/issues)

Trembo is an open-source, self-hostable AI coding agent that works in your **CLI** and your **editor**. It handles complex software-development tasks step by step: creating and editing files, exploring large projects, using the browser, and executing terminal commands — all with you in the loop. Bring your own model and keys; there's no hosted backend and no telemetry.

1. Enter your task (add images to turn mockups into working apps or fix bugs from screenshots).
2. Trembo analyzes your file structure and source-code ASTs, runs regex searches, and reads the files it needs — carefully managing context so it can help in large projects without blowing the context window.
3. Once it has what it needs, Trembo can:
    - Create and edit files, watching linter/compiler errors and fixing missing imports and syntax issues as it goes.
    - Run commands in your terminal and react to their output (e.g. dev-server errors after an edit).
    - For web work, launch a headless browser, click, type, scroll, and capture screenshots + console logs to fix runtime and visual bugs.
4. When the task is done, Trembo presents the result with a one-click command to open or run it.

> [!TIP]
> Open Trembo in the sidebar to use it side-by-side with your file explorer and watch how it changes your workspace.

---

### Use any API and model

Trembo supports OpenRouter, Anthropic, OpenAI, Google Gemini, AWS Bedrock, Azure, GCP Vertex, Cerebras, and Groq. You can configure any OpenAI-compatible API, or run a local model through LM Studio or Ollama. With OpenRouter, the extension fetches the latest model list so new models are available as soon as they ship. Token usage and API cost are tracked for the whole task loop and per request.

### Run commands in your terminal

Thanks to [VS Code's shell integration API](https://code.visualstudio.com/updates/v1_93#_terminal-shell-integration-api), Trembo runs commands directly in your terminal and reads the output — installing packages, running builds, executing tests, deploying, managing databases. For long-running processes like dev servers, use **Proceed While Running** to let Trembo keep working while the command runs in the background; it gets notified of new output and reacts to issues as they appear.

### Create and edit files

Trembo edits files directly in your editor and shows every change as a diff. Edit or revert its changes right in the diff view, or give feedback in chat until it's right. It also watches linter/compiler errors so it can fix issues on its own. All changes are recorded in the file's Timeline for easy tracking and rollback.

### Use the browser

Trembo can launch a browser, click elements, type text, and scroll, capturing screenshots and console logs at each step — for interactive debugging, end-to-end testing, and general web use. Ask it to "test the app": it runs `npm run dev`, opens your local dev server in a browser, and runs through a series of checks.

### "add a tool that..."

Through the [Model Context Protocol](https://modelcontextprotocol.io), Trembo extends itself with custom tools. Use [community-made servers](https://github.com/modelcontextprotocol/servers) or ask Trembo to "add a tool" and it will build and install a new MCP server tailored to your workflow, which then becomes part of its toolkit for future tasks.

- "add a tool that fetches Jira tickets" — pull ticket acceptance criteria and put Trembo to work
- "add a tool that manages AWS EC2 instances" — check metrics and scale up or down
- "add a tool that pulls the latest PagerDuty incidents" — fetch details and ask Trembo to fix bugs

### Add context

- **`@url`** — fetch a URL and convert it to markdown (handy for fresh docs)
- **`@problems`** — add workspace errors and warnings from the Problems panel
- **`@file`** — add a file's contents without spending a request on a read (type to search)
- **`@folder`** — add a whole folder's files at once

### Checkpoints: compare and restore

As Trembo works, the extension snapshots your workspace at each step. Use **Compare** to diff a snapshot against your current workspace, and **Restore** to roll back. For a local web server, use **Restore Workspace Only** to quickly try different versions, then **Restore Task and Workspace** when you find the one to keep building from.

## Contributing

Start with the [Contributing Guide](https://github.com/xedro98/trembo/blob/main/CONTRIBUTING.md), and use [Discussions](https://github.com/xedro98/trembo/discussions) to talk with other contributors.

## License

[Apache 2.0 © 2026 Trembo Bot Inc.](https://github.com/xedro98/trembo/blob/main/LICENSE)
