import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	autoUpdateOnStartup,
	buildCliInstallCommand,
	checkForUpdates,
	getInstallationInfo,
	PackageManager,
	resolveCliHubOwnerContext,
	shouldSkipAutoUpdateOnStartup,
	withMinimumReleaseAgeBypass,
} from "./update";

const originalArgv = [...process.argv];
const originalBuildEnv = process.env.TRUMBO_BUILD_ENV;
const originalDataDir = process.env.TRUMBO_DATA_DIR;
const originalHubDiscoveryPath = process.env.TRUMBO_HUB_DISCOVERY_PATH;
const originalWrapperPath = process.env.TRUMBO_WRAPPER_PATH;
const originalGlobalSettingsPath = process.env.TRUMBO_GLOBAL_SETTINGS_PATH;
const originalIsDev = process.env.IS_DEV;
const originalNoAutoUpdate = process.env.TRUMBO_NO_AUTO_UPDATE;
const tempDirs: string[] = [];

function createFile(path: string): string {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, "");
	return path;
}

function createTempFile(pathSuffix: string): string {
	const root = mkdtempSync(join(tmpdir(), "trumbo-update-test-"));
	tempDirs.push(root);
	return createFile(join(root, pathSuffix));
}

describe("getInstallationInfo", () => {
	afterEach(() => {
		process.argv = [...originalArgv];
		if (originalBuildEnv === undefined) {
			delete process.env.TRUMBO_BUILD_ENV;
		} else {
			process.env.TRUMBO_BUILD_ENV = originalBuildEnv;
		}
		if (originalDataDir === undefined) {
			delete process.env.TRUMBO_DATA_DIR;
		} else {
			process.env.TRUMBO_DATA_DIR = originalDataDir;
		}
		if (originalHubDiscoveryPath === undefined) {
			delete process.env.TRUMBO_HUB_DISCOVERY_PATH;
		} else {
			process.env.TRUMBO_HUB_DISCOVERY_PATH = originalHubDiscoveryPath;
		}
		if (originalWrapperPath === undefined) {
			delete process.env.TRUMBO_WRAPPER_PATH;
		} else {
			process.env.TRUMBO_WRAPPER_PATH = originalWrapperPath;
		}
		if (originalGlobalSettingsPath === undefined) {
			delete process.env.TRUMBO_GLOBAL_SETTINGS_PATH;
		} else {
			process.env.TRUMBO_GLOBAL_SETTINGS_PATH = originalGlobalSettingsPath;
		}
		if (originalIsDev === undefined) {
			delete process.env.IS_DEV;
		} else {
			process.env.IS_DEV = originalIsDev;
		}
		if (originalNoAutoUpdate === undefined) {
			delete process.env.TRUMBO_NO_AUTO_UPDATE;
		} else {
			process.env.TRUMBO_NO_AUTO_UPDATE = originalNoAutoUpdate;
		}
		vi.restoreAllMocks();
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("detects npm installs from the wrapper path passed to the compiled binary", () => {
		const wrapperPath = createTempFile(
			"lib/node_modules/@trumbodev/cli/bin/trumbo",
		);
		process.env.TRUMBO_WRAPPER_PATH = wrapperPath;
		process.argv = ["bun", "/$bunfs/root/trumbo", "update", "--verbose"];

		expect(getInstallationInfo("1.2.3")).toEqual({
			packageManager: PackageManager.NPM,
			packageName: "@trumbodev/cli",
			updateCommand: buildCliInstallCommand({
				packageManager: PackageManager.NPM,
				packageName: "@trumbodev/cli",
				tag: "latest",
			}),
		});
	});

	it("uses the nightly tag when the current CLI version is nightly", () => {
		const wrapperPath = createTempFile(
			"lib/node_modules/@trumbodev/cli/bin/trumbo",
		);
		process.env.TRUMBO_WRAPPER_PATH = wrapperPath;
		process.argv = ["bun", "/$bunfs/root/trumbo", "update", "--verbose"];

		expect(getInstallationInfo("1.2.3-nightly.456")).toEqual({
			packageManager: PackageManager.NPM,
			packageName: "@trumbodev/cli",
			updateCommand: buildCliInstallCommand({
				packageManager: PackageManager.NPM,
				packageName: "@trumbodev/cli",
				tag: "nightly",
			}),
		});
	});

	it("falls back to unknown when only Bun's virtual compiled path is available", () => {
		delete process.env.TRUMBO_WRAPPER_PATH;
		process.argv = ["bun", "/$bunfs/root/trumbo", "update", "--verbose"];

		expect(getInstallationInfo("1.2.3")).toEqual({
			packageManager: PackageManager.UNKNOWN,
			packageName: "@trumbodev/cli",
		});
	});
});

describe("auto update settings", () => {
	afterEach(() => {
		process.argv = [...originalArgv];
		if (originalBuildEnv === undefined) {
			delete process.env.TRUMBO_BUILD_ENV;
		} else {
			process.env.TRUMBO_BUILD_ENV = originalBuildEnv;
		}
		if (originalDataDir === undefined) {
			delete process.env.TRUMBO_DATA_DIR;
		} else {
			process.env.TRUMBO_DATA_DIR = originalDataDir;
		}
		if (originalHubDiscoveryPath === undefined) {
			delete process.env.TRUMBO_HUB_DISCOVERY_PATH;
		} else {
			process.env.TRUMBO_HUB_DISCOVERY_PATH = originalHubDiscoveryPath;
		}
		if (originalWrapperPath === undefined) {
			delete process.env.TRUMBO_WRAPPER_PATH;
		} else {
			process.env.TRUMBO_WRAPPER_PATH = originalWrapperPath;
		}
		if (originalGlobalSettingsPath === undefined) {
			delete process.env.TRUMBO_GLOBAL_SETTINGS_PATH;
		} else {
			process.env.TRUMBO_GLOBAL_SETTINGS_PATH = originalGlobalSettingsPath;
		}
		if (originalIsDev === undefined) {
			delete process.env.IS_DEV;
		} else {
			process.env.IS_DEV = originalIsDev;
		}
		if (originalNoAutoUpdate === undefined) {
			delete process.env.TRUMBO_NO_AUTO_UPDATE;
		} else {
			process.env.TRUMBO_NO_AUTO_UPDATE = originalNoAutoUpdate;
		}
		vi.restoreAllMocks();
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("skips startup auto update when disabled globally", () => {
		const settingsPath = createTempFile("data/global-settings.json");
		writeFileSync(settingsPath, JSON.stringify({ autoUpdateEnabled: false }));
		process.env.TRUMBO_GLOBAL_SETTINGS_PATH = settingsPath;
		delete process.env.IS_DEV;
		delete process.env.TRUMBO_NO_AUTO_UPDATE;
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockRejectedValue(new Error("should not fetch"));

		autoUpdateOnStartup();

		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("still lets manual update checks run when startup auto update is disabled", async () => {
		const settingsPath = createTempFile("data/global-settings.json");
		writeFileSync(settingsPath, JSON.stringify({ autoUpdateEnabled: false }));
		process.env.TRUMBO_GLOBAL_SETTINGS_PATH = settingsPath;
		delete process.env.TRUMBO_NO_AUTO_UPDATE;
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: async () => ({ version: "0.0.0" }),
		} as Response);

		await checkForUpdates({ includeKanban: false });

		expect(fetchSpy).toHaveBeenCalled();
		// Kanban is excluded from updates: only the CLI version check runs,
		// never a second fetch for the kanban package version.
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("excludes kanban from updates by default", async () => {
		delete process.env.TRUMBO_NO_AUTO_UPDATE;
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: async () => ({ version: "0.0.0" }),
		} as Response);

		await checkForUpdates();

		// Default flow performs only the CLI version check; no kanban version
		// check fetch and no kanban install path is reached.
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});
});

describe("hub restart owner selection", () => {
	afterEach(() => {
		if (originalBuildEnv === undefined) {
			delete process.env.TRUMBO_BUILD_ENV;
		} else {
			process.env.TRUMBO_BUILD_ENV = originalBuildEnv;
		}
		if (originalDataDir === undefined) {
			delete process.env.TRUMBO_DATA_DIR;
		} else {
			process.env.TRUMBO_DATA_DIR = originalDataDir;
		}
		if (originalHubDiscoveryPath === undefined) {
			delete process.env.TRUMBO_HUB_DISCOVERY_PATH;
		} else {
			process.env.TRUMBO_HUB_DISCOVERY_PATH = originalHubDiscoveryPath;
		}
	});

	it("uses the shared hub owner outside production builds", () => {
		process.env.TRUMBO_BUILD_ENV = "development";
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-update-test-data";
		delete process.env.TRUMBO_HUB_DISCOVERY_PATH;

		const owner = resolveCliHubOwnerContext();

		expect(owner.discoveryPath).toContain("/locks/hub/owners/");
		expect(owner.discoveryPath).not.toBe(
			"/tmp/trumbo-update-test-data/locks/hub/production.json",
		);
	});
});

describe("shouldSkipAutoUpdateOnStartup", () => {
	it("skips update and version invocations", () => {
		expect(shouldSkipAutoUpdateOnStartup(["update"])).toBe(true);
		expect(shouldSkipAutoUpdateOnStartup(["--verbose", "update"])).toBe(true);
		expect(shouldSkipAutoUpdateOnStartup(["version"])).toBe(true);
		expect(shouldSkipAutoUpdateOnStartup(["--update"])).toBe(true);
		expect(shouldSkipAutoUpdateOnStartup(["chat"])).toBe(false);
	});
});

describe("withMinimumReleaseAgeBypass", () => {
	it("adds the package-manager-specific cooldown bypass", () => {
		expect(
			withMinimumReleaseAgeBypass(
				"npm install -g @trumbodev/cli@latest --allow-scripts=@trumbodev/cli",
				PackageManager.NPM,
			).command,
		).toBe(
			"npm install -g @trumbodev/cli@latest --allow-scripts=@trumbodev/cli --min-release-age=0",
		);
		expect(
			withMinimumReleaseAgeBypass(
				"bun add -g @trumbodev/cli@latest",
				PackageManager.BUN,
			).command,
		).toBe("bun add -g @trumbodev/cli@latest --minimum-release-age=0");
		expect(
			withMinimumReleaseAgeBypass(
				"yarn global add @trumbodev/cli@latest",
				PackageManager.YARN,
			).command,
		).toBe("yarn global add @trumbodev/cli@latest");
		expect(
			withMinimumReleaseAgeBypass(
				"yarn global add @trumbodev/cli@latest",
				PackageManager.YARN,
			).env?.YARN_NPM_MINIMAL_AGE_GATE,
		).toBe("0");

		expect(
			withMinimumReleaseAgeBypass(
				"pnpm add -g @trumbodev/cli@latest",
				PackageManager.PNPM,
			).env?.pnpm_config_minimum_release_age,
		).toBe("0");
	});
});
