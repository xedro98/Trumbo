#!/usr/bin/env node

// Post-install script for Trumbo CLI.
//
// Copies the platform binary to a stable location outside node_modules so
// Windows npm upgrades/uninstalls do not break on locked trumbo.exe files.

import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	copyBinaryToLocalCache,
	localRuntimeBinaryPath,
	platformBinaryFileName,
	platformPackageName,
	readLocalRuntimeBinaryPath,
} from "./local-binary-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// The wrapper version this postinstall is bundling for. Written alongside the
// cached binaries so the bin/trumbo resolver can refuse stale caches when an
// npm update landed without running this script (allow-scripts gating).
function wrapperVersion() {
	for (const candidate of [
		path.join(__dirname, "package.json"),
		path.join(__dirname, "..", "package.json"),
	]) {
		try {
			const pkg = JSON.parse(fs.readFileSync(candidate, "utf8"));
			if (typeof pkg.version === "string" && pkg.version) {
				return pkg.version;
			}
		} catch {
			// try next candidate
		}
	}
	return "";
}

function writeVersionMarker(markerPath, version) {
	if (!version) return;
	try {
		fs.mkdirSync(path.dirname(markerPath), { recursive: true });
		fs.writeFileSync(markerPath, version, "utf8");
	} catch {
		// best-effort — the resolver falls back to the npm binary if missing.
	}
}

function resolvePlatformBinary(packageName) {
	const binaryName = platformBinaryFileName();
	const packageJsonPath = require.resolve(`${packageName}/package.json`);
	const packageDir = path.dirname(packageJsonPath);
	const binaryPath = path.join(packageDir, "bin", binaryName);
	if (!fs.existsSync(binaryPath)) {
		throw new Error(`Binary not found at ${binaryPath}`);
	}
	return binaryPath;
}

function binDirectory() {
	return path.basename(__dirname) === "script"
		? path.join(__dirname, "..", "bin")
		: path.join(__dirname, "bin");
}

function cacheBinaryBesideWrapper(binaryPath) {
	const binDir = binDirectory();
	const targetName = os.platform() === "win32" ? ".trumbo.exe" : ".trumbo";
	const target = path.join(binDir, targetName);

	if (!fs.existsSync(binDir)) {
		fs.mkdirSync(binDir, { recursive: true });
	}

	if (fs.existsSync(target)) {
		try {
			fs.unlinkSync(target);
		} catch {
			return;
		}
	}

	try {
		fs.linkSync(binaryPath, target);
	} catch {
		try {
			fs.copyFileSync(binaryPath, target);
		} catch {
			// Wrapper-local cache is optional on Windows.
		}
	}

	if (os.platform() !== "win32") {
		fs.chmodSync(target, 0o755);
	}
}

function windowsInstallHelp(packageName) {
	const cached = readLocalRuntimeBinaryPath();
	if (cached) {
		// Silent on success — the wrapper will resolve this cached binary.
		return;
	}

	console.error(
		[
			"",
			`${packageName} was not installed.`,
			"Close any running Trumbo processes, then reinstall with:",
			"  npm install -g --force @trumbodev/cli --allow-scripts=@trumbodev/cli",
			"",
			"Or install the platform package directly:",
			`  npm install -g ${packageName}`,
		].join("\n"),
	);
}

function main() {
	const packageName = platformPackageName();
	const version = wrapperVersion();

	let binaryPath;
	try {
		binaryPath = resolvePlatformBinary(packageName);
	} catch (_error) {
		if (os.platform() === "win32") {
			windowsInstallHelp(packageName);
		}
		return;
	}

	copyBinaryToLocalCache(binaryPath);
	// Mark the stable local cache with the installed version so the wrapper can
	// detect and skip a stale cache on a future gated update.
	writeVersionMarker(
		path.join(path.dirname(localRuntimeBinaryPath()), "version.txt"),
		version,
	);

	cacheBinaryBesideWrapper(binaryPath);
	writeVersionMarker(path.join(binDirectory(), ".trumbo.version"), version);
}

try {
	main();
} catch (error) {
	console.error(`postinstall: ${error.message}`);
	process.exit(0);
}
