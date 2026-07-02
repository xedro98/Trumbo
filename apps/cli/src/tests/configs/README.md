```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Test Fixture Configs

Each subdirectory here is a **Trembo config directory** that one or more test suites point at. Tests select a config via `tremboEnv("<name>")` in `tests/e2e/cli/helpers/env.ts`.

## Available fixtures

| Directory | Purpose |
|-----------|---------|
| `default/` | Minimal config used for local, non-live CLI TUI tests. |
| `unauthenticated/` | Explicitly empty config (no provider, no API keys). |

## Adding a new fixture

1. Create `configs/<name>/data/globalState.json` with the desired state.
2. Create `configs/<name>/data/settings/trembo_mcp_settings.json` (can be `{ "mcpServers": {} }`).
3. Reference it in tests with `tremboEnv("<name>")`.

## Secrets

API keys and secrets must never be committed. If you create authenticated fixtures locally, keep `data/secrets.json` untracked or fill it with mock data.
