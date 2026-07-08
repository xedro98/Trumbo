#!/usr/bin/env node

// Cross-platform wrapper around scripts/proto-lint.sh.
//
// The proto lint check is written in bash (buf lint + buf format + a grep
// check on RPC names). On systems where bash is not usable (e.g. Windows
// without a working WSL, where a relay shim exists but fails at runtime), we
// skip gracefully with exit 0 so the build/package pipeline is not blocked.
// CI (which has a real bash) still runs the real check.
import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const scriptPath = resolve(__dirname, "proto-lint.sh")

// Probe whether bash is actually usable, not merely present as a failing shim.
const probe = spawnSync("bash", ["-c", "echo __BASH_OK__"], {
	shell: false,
	encoding: "utf8",
})
const bashUsable =
	!probe.error &&
	probe.status === 0 &&
	typeof probe.stdout === "string" &&
	probe.stdout.includes("__BASH_OK__")

if (!bashUsable) {
	console.warn(
		"[proto-lint] bash is not usable on this PATH — skipping proto lint. CI runs this check; install a working bash (Git Bash / WSL) to run it locally.",
	)
	process.exit(0)
}

const result = spawnSync("bash", [scriptPath], { stdio: "inherit", shell: false })
if (result.error) {
	console.error("[proto-lint] Failed to spawn bash:", result.error)
	process.exit(1)
}
process.exit(result.status ?? 1)
