# Trumbo Build (grok-build + Trumbo provider)

This is a fork of [xai-org/grok-build](https://github.com/xai-org/grok-build) —
the Grok Build TUI/agent — with the xAI auth + provider replaced by **Trumbo**.

The TUI/UI is **unchanged** (the full Grok Build TUI). What changed is the
backend: you authenticate with Trumbo, the subscription/rate-limit gate is
enforced from your Trumbo plan, and the agent talks to Trumbo's
OpenAI-compatible endpoint with the **Quartz** model family.

## What was changed

| Area | Change |
|---|---|
| Auth | `grok trumbo login` → Trumbo Better Auth device flow (`POST /api/auth/device/code` + polling `/api/auth/device/token`, client `trumbo-cli`). Token stored in grok's `auth.json` (`xai::api_key` scope) so the existing BYOK path sends `Authorization: Bearer <token>`. |
| Entitlement | New token → `GET /api/v1/users/me/plan`; blocked unless the account has an active subscription and is within its `fiveHour`/`daily`/`weekly` rate-limit windows. `grok trumbo status` shows it. |
| Endpoint | API base defaults to `https://api.trumbo.dev/api/v1` (`TRUMBO_API_BASE_URL` override; `TRUMBO_ENVIRONMENT=local` → `http://localhost:8787`). `GROK_XAI_API_BASE_URL` still overrides. |
| Models | Default catalog replaced with `quartz-1.0` (default, 256k), `quartz-1.0-lite` (128k), `quartz-1.0-hyper` (1M) — `chat_completions` (OpenAI-compatible) backend. |
| API key fallback | `read_xai_api_key_env` falls back to the stored Trumbo token (and `TRUMBO_TOKEN`), so the TUI's `xai.api_key` auth method resolves without env vars. |
| Windows build | Removed `-C target-feature=+crt-static` from `.cargo/config.toml` (causes rustc `STATUS_STACK_BUFFER_OVERRUN` on this host) and patched `xai-proto-build` to invoke `protoc` cross-platform (temp dependency file, `NUL` descriptor device). |

## Build

```sh
# Pre-reqs on PATH: Rust 1.94 (rustup from rust-toolchain.toml), dotslash,
# and protoc (e.g. D:/Torch/protoc-win/bin). Set PROTOC if not on PATH.
export PATH="$HOME/.cargo/bin:/d/Torch/protoc-win/bin:$PATH"
export PROTOC="/d/Torch/protoc-win/bin/protoc.exe"

cargo build -p xai-grok-pager-bin --release   # target/release/xai-grok-pager
```

> **Windows note:** `cargo check -p xai-grok-pager-bin` passes, but the full
> link produces `STATUS_STACK_BUFFER_OVERRUN` in rustc 1.94 while codegenning
> huge dependency crates (`aws-sdk-s3`, `reqwest`, `tonic`, `write-fonts`) on
> this machine — a host toolchain issue independent of these changes. Build on
> Linux/macOS (or in WSL/Docker) where grok-build is tested/supported.

## Usage

```sh
grok trumbo login     # device auth → opens browser → enforces subscription
grok trumbo status    # signed-in + plan / blocked reason
grok trumbo logout    # clear the stored token
grok                  # launch the TUI (welcome → model quartz-1.0)
```

The TUI's login screen is bypassed once a Trumbo token is stored (the token is
resolved via the `xai::api_key` scope), so you land directly in the 
Grok-style welcome and can chat against Trumbo.
