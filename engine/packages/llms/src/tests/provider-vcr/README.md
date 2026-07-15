```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Provider VCR fixtures

These cassettes exercise the real provider adapters in `@trumbodev/llms` without requiring credentials during normal test runs.

Run playback from `engine/`:

```sh
bun -F @trumbodev/llms test:vcr
```

Refresh the cassettes from local provider credentials:

```sh
LLMS_PROVIDER_VCR_RECORD=1 bun -F @trumbodev/llms test:vcr
```

Refresh one cassette by provider id or cassette name:

```sh
LLMS_PROVIDER_VCR_RECORD=1 LLMS_PROVIDER_VCR_TARGET=trumbo bun -F @trumbodev/llms test:vcr
```

Record mode prefers the normal Trumbo CLI provider settings path. To use another file, set `LLMS_PROVIDER_VCR_SETTINGS_PATH=/path/to/providers.json`. `ANTHROPIC_API_KEY` and `TRUMBO_API_KEY` can be used without a settings file, but ChatGPT OAuth needs saved `openai-codex` provider settings. For local Trumbo API recording, also set `TRUMBO_ENVIRONMENT=local`.

After recording, the test normalizes dynamic response fields such as response IDs, encrypted reasoning payloads, prompt cache keys, and safety identifiers.
