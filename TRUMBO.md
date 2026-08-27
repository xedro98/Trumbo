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

> **Windows note:** the **release** build works on Windows (verified — it
> finished in ~13 min on this box and the resulting binary runs). The **debug**
> build may crash rustc 1.94 with `STATUS_STACK_BUFFER_OVERRUN` while
> codegenning large dependency crates (an unrelated host toolchain issue from
> the debug profile's `codegen-units = 128`); use `--release`.

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
---
## Synced from upstream

This fork is continuously synced with [xai-org/grok-build](https://github.com/xai-org/grok-build).

- **Baseline (fork point):** internal grok-build rev `3e620a76` (upstream commit `afbc0fb`, 2026-08-07).
- **Last synced:** upstream `77cd7eb` ("Synced from monorepo", 2026-08-25); `SOURCE_REV` = `28439e8a8712c363321cf6ff0c2d70cd058d2a7d`.

The port was done as a real 3-way merge (merge base `afbc0fb`), so **all** upstream changes since the fork are carried in while Trumbo branding/providers stay intact. Highlights of what came in with the 08-25 sync:

- **Worktrees & git safety:** new `xai-fast-worktree` git safety layer (working-tree reachability, ref guards, reclaimed-worktree reflog), `worktree gc` with process-scan and dry-run preview, NFS-related copy handling.
- **Config:** layered config via `xai-grok-config` + env overlay (`TRUMBO_CONFIG` / `TRUMBO_CONFIG_PATH`), managed/requirements sync, toolset/web-search allowlists.
- **Home dir** extracted to `xai-grok-home` (single source of truth for `~/.trumbo`, still migrates a legacy `~/.grok`), and `xai-grok-shell-terminal` extracted.
- **Agent/session:** status line config, scheduler liveness, session checkpoint store, publish/recovery, foreign-session support, `xai-chat-state` compaction + image budget.
- **Protocol:** `xai-tool-protocol` `bot_relay`, frames/methods expansion, error-code handling; `xai-tty-utils` child-wait / process-resource scope robustness.
- **TUI:** textarea split into `editor`/editor-keys, richer dashboard/session picker, usage modal fields, consent & cancel-latency handling, bidi rendering, subagent lifecycle.
- **Updater:** channel-aware reinstall hints targeting `@trumbodev/trumbo` (npm) and `xedro98/Trumbo` (GitHub releases).

Docs: the `grok` command name and internal `xai-grok-*`/protocol identifiers are kept verbatim for compatibility; the user-facing product brand, provider, model family, and home/config paths are Trumbo.
---
## Release history

### v1.1.1 (2026-08-27)

Corrective release fixing the self-updater and its packaging:

- Updater npm channel repointed from `@trumbodev/cli` to `@trumbodev/trumbo`: `trumbo update` previously cross-targeted the separate TypeScript desktop CLI (@trumbodev/cli, v3.9.3), reported a bogus "Updating Grok 1.1.0 -> 3.9.3", and told users to reinstall the wrong package. It now targets the Rust TUI's own npm package and reports itself current.
- Windows npm-based self-update fixed: the updater spawned bare npm, but on Windows npm ships as npm.cmd (CreateProcess only resolves .exe), so the install step failed with "program not found". It now resolves npm.cmd on Windows.
- Republished to npm as @trumbodev/trumbo@1.1.1 (meta) + @trumbodev/trumbo-win32-x64@1.1.1 (native binary) and mirrored as the v1.1.1 GitHub release with the Windows asset.

Tag: v1.1.1 (GitHub release targets xedro98/Trumbo; npm package @trumbodev/trumbo).

### v1.1.0 (2026-08-27)

Feature release on top of the 08-25 upstream sync (see "Synced from upstream" above). Crate version bumped `1.0.10` -> `1.1.0` (`xai-grok-pager`, `xai-grok-pager-bin`, `xai-grok-shell`, `xai-grok-version`).

Signed release build used `GROK_VERSION=1.1.0`; stamping via `xai-grok-pager-bin/build.rs` (`VERSION_WITH_COMMIT`) and runtime `xai_grok_version::full_version()`. Binary: `target/release/xai-grok-pager` -> `trumbo 1.1.0 (<commit12>) [alpha|stable]`.

Full `cargo build -p xai-grok-pager-bin --release` is green on Windows (protoc at `D:/Torch/protoc-win/bin`, rustup toolchain per `rust-toolchain.toml`). Compile fixes landed during this release:

- `config.rs`: alias `cli_chat_proxy_base_url`/`xai_api_base_url` defaults to the in-scope `CLI_CHAT_PROXY_BASE_URL_DEFAULT` const (`.to_string()`).
- `app.rs`: drop the now-removed `migrate_devbox_auth_if_legacy` call.
- `mcp_doctor.rs`: remove the dead `try_discover_managed_servers` (upstream removed its managed-config API); live path is `merge_managed_mcp_servers_sourced`.
- `persistence.rs`: rebranded to Trumbo, kept upstream's full writeback/session code.
- `auto_update.rs` + `auto_update_tests.rs`: re-taken from upstream (restores `InstallPhaseError`/`wrap_download_err`/`corrected_arch`/`running_under_rosetta_on_apple_silicon`) and rebranded to `@trumbodev/trumbo` (npm) and `xedro98/Trumbo --pattern 'trumbo-*'` (GitHub Releases).
- `cli.rs`/`trace_cmd.rs`: use `xai_grok_version::full_version()` instead of compile-time `env!("VERSION_WITH_COMMIT")` (the lib crate has no build.rs).
- `input.rs`: init `ActiveModal::SessionPicker::generation`/`detail_seq`.
- `pager-bin/main.rs`: cover `Command::Trumbo(_)` in `process_identity`.

Tag: `v1.1.0` (GitHub release page targets `xedro98/Trumbo`; npm package `@trumbodev/trumbo`).
