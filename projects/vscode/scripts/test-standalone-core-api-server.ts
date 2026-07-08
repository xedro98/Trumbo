#!/usr/bin/env bun

/**
 * Simple Trumbo gRPC Server
 *
 * This script provides a minimal way to run the Trumbo core gRPC service
 * without requiring the full installation, while automatically mocking all external services. Simply run:
 *
 *   # One-time setup (generates protobuf files)
 *	 bun run compile-standalone
 *   bun run test:sca-server
 *
 * The following components are started automatically:
 *   1. HostBridge test server
 *   2. TrumboApiServerMock (mock implementation of the Trumbo API)
 *   3. SDK WorkOS device-auth flow, with WorkOS fetches mocked by testing-platform-workos-fetch-mock.cjs
 *
 * Environment Variables for Customization:
 *   PROJECT_ROOT - Override project root directory (default: parent of scripts dir)
 *   TRUMBO_DIST_DIR - Override distribution directory (default: PROJECT_ROOT/dist-standalone)
 *   TRUMBO_CORE_FILE - Override core file name (default: trumbo-core.js)
 *   PROTOBUS_PORT - gRPC server port (default: 26040)
 *   HOSTBRIDGE_PORT - HostBridge server port (default: 26041)
 *   WORKSPACE_DIR - Working directory (default: current directory)
 *   E2E_TEST - Enable legacy mock auth mode (default: false)
 *   TRUMBO_ENVIRONMENT - Environment setting (default: local)
 *
 * Ideal for local development, testing, or lightweight E2E scenarios.
 */

import * as fs from "node:fs"
import { mkdtempSync, rmSync } from "node:fs"
import * as os from "node:os"
import { ChildProcess, execSync, spawn } from "child_process"
import * as path from "path"
import { TrumboApiServerMock } from "../src/test/e2e/fixtures/server/index"

const PROTOBUS_PORT = process.env.PROTOBUS_PORT || "26040"
const HOSTBRIDGE_PORT = process.env.HOSTBRIDGE_PORT || "26041"
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || process.cwd()
const E2E_TEST = process.env.E2E_TEST || "false"
const TRUMBO_ENVIRONMENT = process.env.TRUMBO_ENVIRONMENT || "local"
const USE_C8 = process.env.USE_C8 === "true"

// Locate the standalone build directory and core file with flexible path resolution
const projectRoot = process.env.PROJECT_ROOT || path.resolve(__dirname, "..")
const distDir = process.env.TRUMBO_DIST_DIR || path.join(projectRoot, "dist-standalone")
const trumboCoreFile = process.env.TRUMBO_CORE_FILE || "trumbo-core.js"
const coreFile = path.join(distDir, trumboCoreFile)

const childProcesses: ChildProcess[] = []

async function main(): Promise<void> {
	console.log("Starting Simple Trumbo gRPC Server...")
	console.log(`Project Root: ${projectRoot}`)
	console.log(`Workspace: ${WORKSPACE_DIR}`)
	console.log(`ProtoBus Port: ${PROTOBUS_PORT}`)
	console.log(`HostBridge Port: ${HOSTBRIDGE_PORT}`)

	console.log(`Looking for standalone build at: ${coreFile}`)

	if (!fs.existsSync(coreFile)) {
		console.error(`Standalone build not found at: ${coreFile}`)
		console.error("Available environment variables for customization:")
		console.error("  PROJECT_ROOT - Override project root directory")
		console.error("  TRUMBO_DIST_DIR - Override distribution directory")
		console.error("  TRUMBO_CORE_FILE - Override core file name")
		console.error("")
		console.error("To build the standalone version, run: bun run compile-standalone")
		process.exit(1)
	}

	try {
		await TrumboApiServerMock.startGlobalServer()
		console.log("Trumbo API Server started in-process")
	} catch (error) {
		console.error("Failed to start Trumbo API Server:", error)
		process.exit(1)
	}

	const extensionsDir = path.join(distDir, "vsce-extension")
	const userDataDir = mkdtempSync(path.join(os.tmpdir(), "vsce"))
	const trumboTestWorkspace = mkdtempSync(path.join(os.tmpdir(), "trumbo-test-workspace-"))

	console.log("Starting HostBridge test server...")
	const hostbridge: ChildProcess = spawn("bun", [path.join(__dirname, "test-hostbridge-server.ts")], {
		stdio: "inherit",
		env: {
			...process.env,
			TEST_HOSTBRIDGE_WORKSPACE_DIR: trumboTestWorkspace,
			HOST_BRIDGE_ADDRESS: `127.0.0.1:${HOSTBRIDGE_PORT}`,
		},
	})
	childProcesses.push(hostbridge)

	console.log(`Temp user data dir: ${userDataDir}`)
	console.log(`Temp extensions dir: ${extensionsDir}`)
	// Extract standalone.zip if needed
	const standaloneZipPath = path.join(distDir, "standalone.zip")
	if (!fs.existsSync(standaloneZipPath)) {
		console.error(`standalone.zip not found at: ${standaloneZipPath}`)
		process.exit(1)
	}

	console.log("Extracting standalone.zip to extensions directory...")
	try {
		if (!fs.existsSync(extensionsDir)) {
			execSync(`unzip -o -q "${standaloneZipPath}" -d "${extensionsDir}"`, { stdio: "inherit" })
		}
		console.log(`Successfully extracted standalone.zip to: ${extensionsDir}`)
	} catch (error) {
		console.error("Failed to extract standalone.zip:", error)
		process.exit(1)
	}

	const covDir = path.join(projectRoot, `coverage/coverage-core-${PROTOBUS_PORT}`)

	const workosFetchMockPath = path.join(projectRoot, "scripts", "testing-platform-workos-fetch-mock.cjs")
	const baseArgs = ["--enable-source-maps", "--require", workosFetchMockPath, path.join(distDir, "trumbo-core.js")]

	const c8Bin = path.join(projectRoot, "node_modules", ".bin", process.platform === "win32" ? "c8.cmd" : "c8")
	const spawnCommand = USE_C8 ? c8Bin : "node"
	const spawnArgs = USE_C8 ? ["--report-dir", covDir, "node", ...baseArgs] : baseArgs

	console.log(`Starting Trumbo Core Service... (useC8=${USE_C8})`)

	const coreService: ChildProcess = spawn(spawnCommand, spawnArgs, {
		cwd: projectRoot,
		env: {
			...process.env,
			NODE_PATH: "./node_modules",
			DEV_WORKSPACE_FOLDER: WORKSPACE_DIR,
			PROTOBUS_ADDRESS: `127.0.0.1:${PROTOBUS_PORT}`,
			HOST_BRIDGE_ADDRESS: `localhost:${HOSTBRIDGE_PORT}`,
			E2E_TEST,
			TRUMBO_ENVIRONMENT,
			TRUMBO_DIR: userDataDir,
			INSTALL_DIR: extensionsDir,
		},
		stdio: "inherit",
	})
	childProcesses.push(coreService)

	const shutdown = async () => {
		console.log("\nShutting down services...")

		while (childProcesses.length > 0) {
			const child = childProcesses.pop()
			if (child && !child.killed) child.kill("SIGINT")
		}

		await TrumboApiServerMock.stopGlobalServer()

		try {
			rmSync(userDataDir, { recursive: true, force: true })
			rmSync(trumboTestWorkspace, { recursive: true, force: true })
			console.log("Cleaned up temporary directories")
		} catch (err) {
			console.warn("Failed to cleanup temp directories:", err)
		}

		process.exit(0)
	}

	process.on("SIGINT", shutdown)
	process.on("SIGTERM", shutdown)

	coreService.on("exit", (code) => {
		console.log(`Core service exited with code ${code}`)
		shutdown()
	})
	hostbridge.on("exit", (code) => {
		console.log(`HostBridge exited with code ${code}`)
		shutdown()
	})

	console.log(`Trumbo gRPC Server is running on 127.0.0.1:${PROTOBUS_PORT}`)
	console.log("Press Ctrl+C to stop")
}

if (require.main === module) {
	main().catch((err) => {
		console.error("Failed to start simple Trumbo server:", err)
		process.exit(1)
	})
}
