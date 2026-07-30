"""Trumbo CLI agent adapter for Harbor / Terminal-Bench.

Extends Harbor's ClineCli adapter since Trumbo is a Cline fork with the same
CLI flags (-P, -k, -m, --json, --thinking, --max-consecutive-mistakes).

Key differences from Cline:
  - Binary: trumbo (not cline)
  - npm package: @trumbodev/cli (not cline)
  - Config dir: ~/.trumbo (not ~/.cline)
  - Auto-approve: --auto-approve true (not --yolo)
  - No -t timeout flag
  - No CLINE_WRITE_PROMPT_ARTIFACTS env var

Usage:
  harbor run -d terminal-bench/terminal-bench-2 \
    -a trumbo_agent:TrumboCli \
    -m anthropic/claude-sonnet-4-6 \
    --agent-kwarg cline-version=3.6.2 \
    -n 4
"""

import os
import shlex
from pathlib import Path
from typing import override

from harbor.agents.installed.cline.cline import ClineCli, ExecInput
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.name import AgentName


class TrumboCli(ClineCli):
    """Trumbo CLI agent for Harbor / Terminal-Bench."""

    SUPPORTS_ATIF: bool = True

    PROVIDER_API_KEY_ENVS = {
        "anthropic": "ANTHROPIC_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "google": "GOOGLE_API_KEY",
        "openai": "OPENAI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
        "trumbo": "TRUMBO_API_KEY",
        "xai": "XAI_API_KEY",
    }

    @staticmethod
    @override
    def name() -> str:
        return "trumbo-cli"

    @override
    def get_version_command(self) -> str | None:
        return ". ~/.nvm/nvm.sh 2>/dev/null; trumbo --version"

    def _build_npm_install_command(self, package_spec: str) -> str:
        """Install @trumbodev/cli from npm and verify with trumbo --version."""
        return (
            f"npm install -g --allow-scripts=@trumbodev/cli {package_spec} --force && "
            "sleep 0.5 && "
            "if trumbo --version; then "
            "echo 'Trumbo npm binary smoke test passed.'; "
            "else "
            'status="$?"; '
            'echo "Trumbo npm binary smoke test failed with exit ${status}."; '
            "exit ${status}; "
            "fi"
        )

    @override
    async def install(self, environment: BaseEnvironment) -> None:
        # 1. Install root prerequisites (same as Cline — apt-get for git/curl/unzip)
        await self._exec_with_setup_retries(
            environment,
            retry_label="install-root-prereqs",
            as_root=True,
            timeout_sec=None,
            command=(
                "if command -v git &> /dev/null && command -v curl &> /dev/null && command -v unzip &> /dev/null; then"
                "  echo 'git, curl, and unzip already installed, skipping apt-get...';"
                " else"
                "  echo 'Killing background apt processes to release lock...';"
                "  pkill -9 -x unattended-upgrades 2>/dev/null || true;"
                "  pkill -9 -x apt-get 2>/dev/null || true;"
                "  pkill -9 -x dpkg 2>/dev/null || true;"
                "  sleep 1;"
                "  rm -f /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend /var/cache/apt/archives/lock 2>/dev/null || true;"
                "  dpkg --configure -a 2>/dev/null || true;"
                "  echo 'Trying apt-get install without update first...';"
                "  if apt-get install -y curl ca-certificates git unzip 2>/dev/null; then"
                "    echo 'Install succeeded without update.';"
                "  else"
                "    echo 'Falling back to apt-get update + install...';"
                "    apt-get update && apt-get install -y curl ca-certificates git unzip;"
                "  fi;"
                " fi"
            ),
            env={"DEBIAN_FRONTEND": "noninteractive"},
        )

        install_parts: list[str] = []

        # 2. Install Node.js via nvm
        install_parts.append(
            "if command -v node &> /dev/null && node --version | grep -qE '^v2[2-9]|^v[3-9]'; then"
            "  echo 'Node.js already installed, skipping nvm setup...';"
            " else"
            "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash &&"
            '  export NVM_DIR="$HOME/.nvm" &&'
            '  [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" &&'
            "  nvm install 22 && nvm use 22 && nvm alias default 22;"
            " fi"
        )

        install_parts.append(
            'export NVM_DIR="$HOME/.nvm" && '
            '{ [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" || true; }'
        )

        # 3. Install Trumbo CLI from npm (or tarball if provided)
        if self._tarball_path:
            if not self._tarball_path.is_file():
                raise FileNotFoundError(
                    f"Trumbo CLI tarball not found: {self._tarball_path}"
                )
            remote_tarball_path = "/tmp/harbor-trumbo-cli.tgz"
            await environment.upload_file(self._tarball_path, remote_tarball_path)
            install_parts.append(
                f"npm install -g --allow-scripts=@trumbodev/cli --force -- {shlex.quote(remote_tarball_path)} && "
                "trumbo --version"
            )
        elif self._tarball_url:
            install_parts.append(
                f'npm install -g --allow-scripts=@trumbodev/cli --force -- "{self._tarball_url}" && '
                "trumbo --version"
            )
        elif self._cline_version:
            # cline_version kwarg is reused as the Trumbo version
            install_parts.append(
                self._build_npm_install_command(f"@trumbodev/cli@{self._cline_version}")
            )
        else:
            install_parts.append(
                self._build_npm_install_command("@trumbodev/cli@latest")
            )

        install_env: dict[str, str] = {}
        for token_env_var in ("GITHUB_TOKEN", "GH_TOKEN"):
            token_value = os.environ.get(token_env_var)
            if token_value:
                install_env[token_env_var] = token_value

        await self._exec_with_setup_retries(
            environment,
            retry_label="install-agent-runtime",
            command="set -e; " + " && ".join(install_parts),
            env=install_env or None,
        )

    @override
    def create_run_agent_commands(self, instruction: str) -> list[ExecInput]:
        raw_instruction = instruction.strip()
        if not raw_instruction:
            raise ValueError("Instruction is empty before invoking trumbo")

        prompt_arg = shlex.quote(raw_instruction)

        if not self.model_name or ":" not in self.model_name:
            raise ValueError(
                f"model_name must be in format 'provider:model-id', got: '{self.model_name}'"
            )

        provider, model = self.model_name.split(":", 1)
        api_key = self._resolve_api_key(provider)

        provider_mapping = {"vercel": "vercel-ai-gateway"}
        trumbo_provider = provider_mapping.get(provider, provider)

        env = {
            "PROVIDER": provider,
            "API_KEY": api_key,
            "MODELID": model,
        }

        # Setup: create Trumbo config dirs (skip onboarding)
        global_state_json = shlex.quote(
            '{"welcomeViewCompleted": true, "isNewUser": false}'
        )
        setup_command = (
            "mkdir -p /logs/agent ~/.trumbo/data && "
            f"echo {global_state_json} > ~/.trumbo/data/globalState.json"
        )

        # Register skills if provided
        if self.skills_dir:
            setup_command += (
                f" && mkdir -p ~/.trumbo/skills && "
                f"(cp -r {shlex.quote(str(self.skills_dir))}/* "
                f"~/.trumbo/skills/ 2>/dev/null || true)"
            )

        # Register MCP servers if provided
        if self.mcp_servers:
            import json
            servers: dict[str, dict[str, object]] = {}
            for server in self.mcp_servers:
                if server.transport == "stdio":
                    servers[server.name] = {
                        "command": server.command,
                        "args": server.args,
                        "disabled": False,
                    }
                elif server.transport == "streamable-http":
                    servers[server.name] = {
                        "url": server.url,
                        "type": "streamableHttp",
                        "disabled": False,
                    }
                else:
                    servers[server.name] = {"url": server.url, "disabled": False}
            config = json.dumps({"mcpServers": servers}, indent=2)
            escaped = shlex.quote(config)
            setup_command += (
                " && mkdir -p ~/.trumbo/data/settings && "
                f"echo {escaped} > ~/.trumbo/data/settings/trumbo_mcp_settings.json"
            )

        setup_config_cmd = ExecInput(command=setup_command, env=env)

        nvm_setup_command = (
            'export NVM_DIR="$HOME/.nvm"; '
            'if [ -s "$NVM_DIR/nvm.sh" ]; then '
            '. "$NVM_DIR/nvm.sh"; '
            "nvm use 22 >/dev/null 2>&1 || true; "
            "fi"
        )

        # Trumbo uses --auto-approve instead of --yolo (default is true).
        # No -t timeout flag (Trumbo doesn't have it).
        run_flags = [
            "-P",
            f"{trumbo_provider}",
            "-k",
            "$API_KEY",
            "-m",
            "$MODELID",
            "--json",
            "--auto-approve",
            "true",
        ]

        descriptor_flags = self.build_cli_flags()
        if descriptor_flags:
            run_flags.append(descriptor_flags)

        run_flags_str = " ".join(run_flags)

        run_trumbo_cmd = ExecInput(
            command=(
                f"{nvm_setup_command}; "
                f"set -o pipefail; "
                f"trumbo {run_flags_str} -- {prompt_arg} < /dev/null 2>&1 | "
                f"stdbuf -oL tee /logs/agent/trumbo.txt; "
                f"status=${{PIPESTATUS[0]}}; "
                f'echo "__TRUMBO_EXIT=${{status}}" | tee -a /logs/agent/trumbo.txt; '
                f'exit "${{status}}"'
            ),
            env=env,
        )

        return [setup_config_cmd, run_trumbo_cmd]

    @override
    def create_cleanup_commands(self) -> list[ExecInput]:
        # Trumbo stores sessions at ~/.trumbo/data/sessions/
        return [
            ExecInput(
                command=(
                    "if [ -d ~/.trumbo/data/sessions ]; then "
                    "mkdir -p /logs/agent/sessions && "
                    'LATEST_SESSION="$(ls -1td ~/.trumbo/data/sessions/*/ 2>/dev/null | head -n 1)" && '
                    'if [ -n "$LATEST_SESSION" ]; then cp -r "$LATEST_SESSION" /logs/agent/sessions/; fi; '
                    "fi"
                ),
            ),
        ]
