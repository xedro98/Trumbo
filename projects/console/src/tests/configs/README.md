```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Test Fixture Configs

Each subdirectory here is a **Trumbo config directory** that one or more test suites point at. Tests select a config via `trumboEnv("<name>")` in `tests/e2e/cli/helpers/env.ts`.

## Available fixtures

| Directory | Purpose |
|-----------|---------|
| `default/` | Minimal config used for local, non-live CLI TUI tests. |
| `unauthenticated/` | Explicitly empty config (no provider, no API keys). |

## Adding a new fixture

1. Create `configs/<name>/data/globalState.json` with the desired state.
2. Create `configs/<name>/data/settings/trumbo_mcp_settings.json` (can be `{ "mcpServers": {} }`).
3. Reference it in tests with `trumboEnv("<name>")`.

## Secrets

API keys and secrets must never be committed. If you create authenticated fixtures locally, keep `data/secrets.json` untracked or fill it with mock data.
