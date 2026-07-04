#!/usr/bin/env node

// Shared helpers for caching the compiled CLI outside node_modules.
// Used by postinstall.mjs and mirrored in bin/trumbo (CommonJS).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function platformPackageName() {
	const platformMap = {
		darwin: "darwin",
		linux: "linux",
		win32: "windows",
	};
	const platform = platformMap[os.platform()] || os.platform();
	return `@trumbodev/cli-${platform}-${os.arch()}`;
}

export function platformBinaryFileName() {
	return os.platform() === "win32" ? "trumbo.exe" : "trumbo";
}

/** Stable runtime cache — avoids Windows EBUSY locks inside node_modules during npm upgrades. */
export function localRuntimeBinaryPath() {
	if (os.platform() === "win32") {
		const base =
			process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
		return path.join(base, "Trumbo", "bin", "trumbo.exe");
	}
	return path.join(os.homedir(), ".trumbo", "bin", "trumbo");
}

export function copyBinaryToLocalCache(sourcePath) {
	const target = localRuntimeBinaryPath();
	const targetDir = path.dirname(target);
	fs.mkdirSync(targetDir, { recursive: true });

	try {
		if (fs.existsSync(target)) {
			fs.unlinkSync(target);
		}
	} catch {
		// Locked binary — write a versioned sibling and prefer it from resolver.
		const fallback = path.join(targetDir, `trumbo-${Date.now()}.exe`);
		fs.copyFileSync(sourcePath, fallback);
		fs.writeFileSync(
			path.join(targetDir, "current.txt"),
			path.basename(fallback),
			"utf8",
		);
		return fallback;
	}

	fs.copyFileSync(sourcePath, target);
	if (os.platform() !== "win32") {
		fs.chmodSync(target, 0o755);
	}
	return target;
}

export function readLocalRuntimeBinaryPath() {
	const target = localRuntimeBinaryPath();
	if (fs.existsSync(target)) {
		return target;
	}

	if (os.platform() !== "win32") {
		return undefined;
	}

	const pointer = path.join(path.dirname(target), "current.txt");
	if (!fs.existsSync(pointer)) {
		return undefined;
	}

	const fileName = fs.readFileSync(pointer, "utf8").trim();
	if (!fileName) {
		return undefined;
	}

	const resolved = path.join(path.dirname(target), fileName);
	return fs.existsSync(resolved) ? resolved : undefined;
}
