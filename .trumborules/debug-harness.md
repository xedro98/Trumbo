# Debug harness

An HTTP-controlled debugger for the VS Code extension, implemented at `src/dev/debug-harness/server.ts`.

## Quick start

```bash
# Build the extension first if needed (protos + esbuild):
bun run protos && IS_DEV=true bun esbuild.mjs

# Launch (skip-build if already built):
bun src/dev/debug-harness/server.ts --skip-build --auto-launch

# In another terminal:
curl localhost:19229/api -d '{"method":"status"}'
```

## Data isolation

The debugee runs with `TRUMBO_DIR=~/.trumbo2` by default, separate from your real `~/.trumbo`. This prevents the debugee's logout from logging out the debugger, and vice versa. Override with `--trumbo-dir /tmp/test-dir`. Check with `status()` → `trumboDir`.

## Browser capture and OAuth

The debugee runs with `TRUMBO_CAPTURE_BROWSER=1`, which intercepts `openExternal()` in `src/utils/env.ts`. URLs are captured instead of opening a real browser:

- Logged to `$TRUMBO_DIR/data/debug-captured-urls.jsonl`
- POSTed in real time to `/captured-url` on the harness server
- Queryable via `oauth.captured_urls`

### OAuth API

- **`oauth.captured_urls`** `{clear?}` — URLs the debugee tried to open
- **`oauth.read_stored_token`** — check auth token presence in secrets.json
- **`oauth.simulate_callback`** `{path, code?, state?, provider?, token?}` — build a vscode:// callback URI
- **`oauth.read_captured_urls_file`** — read on-disk JSONL of captured URLs

### OAuth testing flow

For **Trumbo OAuth** (SDK local callback): the SDK starts a local HTTP server and the auth URL is captured. To complete it, open the captured URL in a real browser (it redirects back to the SDK's callback server), or extract the callback port and `curl http://127.0.0.1:PORT/callback?code=...`.

For **MCP/Provider OAuth** (vscode:// URI): the redirect goes to a vscode:// URI. `oauth.simulate_callback` only *builds* the URI — it does not deliver it, and the ESM extension host can't `require()` the handler. To actually deliver the callback, call the debug-only hook via `ext.evaluate` (with `awaitPromise: true`):
`globalThis.__trumboHandleUri("vscode://trumbo-bot.trumbo/...?code=...&state=...")`.
It runs the same `SharedUriHandler.handleUri` as VS Code's real URI handler and exists only when `TRUMBO_CAPTURE_BROWSER` is set (the harness always sets it; never ships in prod). For end-to-end MCP OAuth, get a real `code` from the local MCP OAuth test server (`bun run dev:mcp-oauth-test-server`).

## Navigating views — use commands, not clicks

Don't try to find or click small sidebar icons. Use VS Code commands via the command palette.
Registered in `src/registry.ts`:

| Command | View |
|---------|------|
| `trumbo.accountButtonClicked` | Account / sign-in |
| `trumbo.historyButtonClicked` | Task history |
| `trumbo.settingsButtonClicked` | Settings |
| `trumbo.mcpButtonClicked` | MCP servers |
| `trumbo.plusButtonClicked` | New task (chat) |
| `trumbo.worktreesButtonClicked` | Worktrees |

```bash
curl localhost:19229/api -d '{"method":"ui.command_palette","params":{"command":"trumbo.accountButtonClicked"}}'
```

## Key commands

All via `POST localhost:19229/api` with `{"method":"...", "params":{...}}`:

- **`launch`** / **`shutdown`** — lifecycle
- **`ui.screenshot`** — screenshot to `/tmp/trumbo-debug/`; returns `{path}` — **use `read_file` on the path to examine it, do NOT `open` the file** (Preview.app covers the VS Code window)
- **`ui.open_sidebar`** — open the Trumbo sidebar
- **`ext.set_breakpoint`** `{file, line, condition?}` — breakpoint by source file (sourcemap-resolved)
- **`ext.evaluate`** `{expression, callFrameId?}` — eval in the extension host
- **`ext.resume`** / **`ext.step_over`** / **`ext.step_into`** — stepping
- **`ext.call_stack`** — inspect when paused
- **`web.evaluate`** `{expression}` — eval in the webview
- **`web.post_message`** `{message}` — send postMessage to the extension host via the exposed vsCodeApi
- **`wait_for_pause`** `{timeout?}` — block until a breakpoint is hit
- **`ui.locator`** `{role?, testId?, text?, frame?}` — Playwright locator (auto-retries on a stale sidebar frame)
- **`ui.react_input`** `{text, selector?, clear?, submit?}` — set a React textarea value via `execCommand('insertText')`; works reliably across multiple tasks
- **`ui.send_message`** `{text, images?, files?, responseType?}` — send a chat message bypassing the textarea entirely (via gRPC postMessage)
- **`ui.command_palette`** `{command}` — run a VS Code command

## Typical session

```bash
# 1. Launch
curl localhost:19229/api -d '{"method":"launch","params":{"skipBuild":true}}'

# 2. Open sidebar + dismiss overlays (ALWAYS do this first)
curl localhost:19229/api -d '{"method":"ui.open_sidebar"}'
curl localhost:19229/api -d '{"method":"web.evaluate","params":{"expression":"document.querySelectorAll(\".sr-only\").forEach(el => el.parentElement?.click())"}}'

# 3. Navigate to a view
curl localhost:19229/api -d '{"method":"ui.command_palette","params":{"command":"trumbo.accountButtonClicked"}}'

# 4. Check captured OAuth URLs if testing auth
curl localhost:19229/api -d '{"method":"oauth.captured_urls"}'

# 5. Verify
curl localhost:19229/api -d '{"method":"ui.screenshot"}'
```

## Caveats

- **Dismiss promotional overlays FIRST**: on fresh launches, full-screen promo overlays block the sidebar. Dismiss them immediately after `ui.open_sidebar`, before any other interaction or screenshot. You may need to run it twice:
  ```bash
  curl localhost:19229/api -d '{"method": "ui.open_sidebar"}'
  curl localhost:19229/api -d '{"method": "web.evaluate", "params": {"expression": "document.querySelectorAll(\".sr-only\").forEach(el => el.parentElement?.click())"}}'
  ```
- **Screenshots — don't open the file**: `ui.screenshot` and `ui.sidebar_screenshot` save PNGs to `/tmp/trumbo-debug/` and return the `{path}`. Use `read_file` on that path to examine them. Running `open <path>` launches Preview.app on macOS, which covers the VS Code window.
- **Scripts count = 0 after launch**: CDP connects after the extension host starts, so scripts parsed during startup aren't tracked. Breakpoints still work via sourcemap resolution.
- **Port 9230**: extension host inspector. If another VS Code instance uses this port, the harness fails to connect. Kill other debug instances first.
- **macOS only** for now (Playwright Electron launch behavior).
- **Webview CDP**: `connect_webview` may fail depending on the Electron version. `web.evaluate` still works via Playwright's `frame.evaluate()` fallback.
- **Sourcemap paths**: esbuild outputs relative paths like `../src/extension.ts` in the sourcemap. The resolver handles this, but if a file isn't found, use `ext.source_files` to see the exact paths.
- **OAuth with fake codes**: browser capture intercepts the URL but does not provide a valid auth code. For real OAuth testing, open the captured URL in a browser. For unit testing, mock the token exchange.

See `src/dev/debug-harness/README.md` for the full API reference.
