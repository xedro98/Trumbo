#!/usr/bin/env node

// Wraps the marketplace publish flow (vsce + optional ovsx) so the .vsix gets packaged
// with the marketplace-flavored README instead of the GitHub-flavored README.
//
// Auth (pick one):
//   TRUMBO_VSCE_AUTH=azure-credential  → vsce publish --azure-credential (Entra ID / OIDC)
//   VSCE_PAT=...                       → legacy PAT publish (deprecated after 2026-12-01 for global PATs)
//
// Usage:
//   node scripts/publish-marketplace.mjs                  # release channel
//   node scripts/publish-marketplace.mjs --pre-release    # pre-release channel

import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { restore, swapIn } from "./marketplace-readme.mjs"

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

function resolveVsceCommand() {
	const binNames =
		process.platform === "win32" ? ["vsce.exe", "vsce.cmd", "vsce"] : ["vsce"]
	for (const root of [
		projectRoot,
		join(projectRoot, "..", ".."),
		join(projectRoot, ".."),
	]) {
		for (const binName of binNames) {
			const candidate = join(root, "node_modules", ".bin", binName)
			if (existsSync(candidate)) {
				return candidate
			}
		}
	}
	return "vsce"
}

const isPrerelease = process.argv.includes("--pre-release")

const result = swapIn()

let interrupted = false
const cleanupOnSignal = (exitCode) => () => {
	interrupted = true
	try {
		if (!result.skipped) {
			restore()
		}
	} catch (err) {
		console.error(`marketplace-readme: failed to restore on signal: ${err.message}`)
	}
	process.exit(exitCode)
}
process.on("SIGINT", cleanupOnSignal(130))
process.on("SIGTERM", cleanupOnSignal(143))

function resolveAuthMode() {
	const explicit = process.env.TRUMBO_VSCE_AUTH?.trim().toLowerCase()
	if (explicit === "azure-credential" || explicit === "azure") {
		return "azure-credential"
	}
	if (explicit === "pat" || explicit === "vsce_pat") {
		return "pat"
	}
	if (process.env.AZURE_CLIENT_ID && process.env.AZURE_TENANT_ID) {
		return "azure-credential"
	}
	if (process.env.VSCE_PAT) {
		return "pat"
	}
	return null
}

try {
	const authMode = resolveAuthMode()
	if (!authMode) {
		throw new Error(
			"No Marketplace auth configured. Set GitHub vars AZURE_CLIENT_ID + AZURE_TENANT_ID (OIDC), " +
				"or export VSCE_PAT (legacy PAT). See projects/vscode/docs/MARKETPLACE_PUBLISH.md.",
		)
	}

	const vsceArgs = [
		"publish",
		"--no-dependencies",
		"--no-yarn",
		"--allow-star-activation",
	]
	if (authMode === "azure-credential") {
		vsceArgs.push("--azure-credential")
		console.log("Publishing to VS Code Marketplace via Entra ID (--azure-credential)")
	} else {
		console.log("Publishing to VS Code Marketplace via VSCE_PAT (legacy)")
	}
	if (isPrerelease) {
		vsceArgs.push("--pre-release")
	}

	const publishEnv = { ...process.env }
	if (authMode === "pat") {
		publishEnv.VSCE_PAT = process.env.VSCE_PAT
	}

	execFileSync(resolveVsceCommand(), vsceArgs, {
		stdio: "inherit",
		env: publishEnv,
	})

	const ovsxToken = process.env.OVSX_PAT
	if (!ovsxToken) {
		console.warn("OVSX_PAT not set, skipping Open VSX Registry publish")
	} else {
		const ovsxArgs = ["ovsx", "publish", "--no-dependencies", "--pat", ovsxToken]
		if (isPrerelease) {
			ovsxArgs.push("--pre-release")
		}
		execFileSync("npx", ovsxArgs, { stdio: "inherit" })
	}
} finally {
	if (!interrupted && !result.skipped) {
		restore()
	}
}
