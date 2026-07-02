import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	autoUpdateOnStartup,
	checkForUpdates,
	getInstallationInfo,
	PackageManager,
	resolveCliHubOwnerContext,
	withMinimumReleaseAgeBypass,
} from "./update";

const originalArgv = [...process.argv];
const originalBuildEnv = process.env.TREMBO_BUILD_ENV;
const originalDataDir = process.env.TREMBO_DATA_DIR;
const originalHubDiscoveryPath = process.env.TREMBO_HUB_DISCOVERY_PATH;
const originalWrapperPath = process.env.TREMBO_WRAPPER_PATH;
const originalGlobalSettingsPath = process.env.TREMBO_GLOBAL_SETTINGS_PATH;
const originalIsDev = process.env.IS_DEV;
const originalNoAutoUpdate = process.env.TREMBO_NO_AUTO_UPDATE;
const tempDirs: string[] = [];

function createFile(path: string): string {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, "");
	return path;
}

function createTempFile(pathSuffix: string): string {
	const root = mkdtempSync(join(tmpdir(), "trembo-update-test-"));
	tempDirs.push(root);
	return createFile(join(root, pathSuffix));
}

describe("getInstallationInfo", () => {
	afterEach(() => {
		process.argv = [...originalArgv];
		if (originalBuildEnv === undefined) {
			delete process.env.TREMBO_BUILD_ENV;
		} else {
			process.env.TREMBO_BUILD_ENV = originalBuildEnv;
		}
		if (originalDataDir === undefined) {
			delete process.env.TREMBO_DATA_DIR;
		} else {
			process.env.TREMBO_DATA_DIR = originalDataDir;
		}
		if (originalHubDiscoveryPath === undefined) {
			delete process.env.TREMBO_HUB_DISCOVERY_PATH;
		} else {
			process.env.TREMBO_HUB_DISCOVERY_PATH = originalHubDiscoveryPath;
		}
		if (originalWrapperPath === undefined) {
			delete process.env.TREMBO_WRAPPER_PATH;
		} else {
			process.env.TREMBO_WRAPPER_PATH = originalWrapperPath;
		}
		if (originalGlobalSettingsPath === undefined) {
			delete process.env.TREMBO_GLOBAL_SETTINGS_PATH;
		} else {
			process.env.TREMBO_GLOBAL_SETTINGS_PATH = originalGlobalSettingsPath;
		}
		if (originalIsDev === undefined) {
			delete process.env.IS_DEV;
		} else {
			process.env.IS_DEV = originalIsDev;
		}
		if (originalNoAutoUpdate === undefined) {
			delete process.env.TREMBO_NO_AUTO_UPDATE;
		} else {
			process.env.TREMBO_NO_AUTO_UPDATE = originalNoAutoUpdate;
		}
		vi.restoreAllMocks();
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("detects npm installs from the wrapper path passed to the compiled binary", () => {
		const wrapperPath = createTempFile("lib/node_modules/trembo/bin/trembo");
		process.env.TREMBO_WRAPPER_PATH = wrapperPath;
		process.argv = ["bun", "/$bunfs/root/trembo", "update", "--verbose"];

		expect(getInstallationInfo("1.2.3")).toEqual({
			packageManager: PackageManager.NPM,
			packageName: "trembo",
			updateCommand: "npm update -g trembo --tag latest",
		});
	});

	it("uses the nightly tag when the current CLI version is nightly", () => {
		const wrapperPath = createTempFile("lib/node_modules/trembo/bin/trembo");
		process.env.TREMBO_WRAPPER_PATH = wrapperPath;
		process.argv = ["bun", "/$bunfs/root/trembo", "update", "--verbose"];

		expect(getInstallationInfo("1.2.3-nightly.456")).toEqual({
			packageManager: PackageManager.NPM,
			packageName: "trembo",
			updateCommand: "npm update -g trembo --tag nightly",
		});
	});

	it("falls back to unknown when only Bun's virtual compiled path is available", () => {
		delete process.env.TREMBO_WRAPPER_PATH;
		process.argv = ["bun", "/$bunfs/root/trembo", "update", "--verbose"];

		expect(getInstallationInfo("1.2.3")).toEqual({
			packageManager: PackageManager.UNKNOWN,
			packageName: "trembo",
		});
	});
});

describe("auto update settings", () => {
	afterEach(() => {
		process.argv = [...originalArgv];
		if (originalBuildEnv === undefined) {
			delete process.env.TREMBO_BUILD_ENV;
		} else {
			process.env.TREMBO_BUILD_ENV = originalBuildEnv;
		}
		if (originalDataDir === undefined) {
			delete process.env.TREMBO_DATA_DIR;
		} else {
			process.env.TREMBO_DATA_DIR = originalDataDir;
		}
		if (originalHubDiscoveryPath === undefined) {
			delete process.env.TREMBO_HUB_DISCOVERY_PATH;
		} else {
			process.env.TREMBO_HUB_DISCOVERY_PATH = originalHubDiscoveryPath;
		}
		if (originalWrapperPath === undefined) {
			delete process.env.TREMBO_WRAPPER_PATH;
		} else {
			process.env.TREMBO_WRAPPER_PATH = originalWrapperPath;
		}
		if (originalGlobalSettingsPath === undefined) {
			delete process.env.TREMBO_GLOBAL_SETTINGS_PATH;
		} else {
			process.env.TREMBO_GLOBAL_SETTINGS_PATH = originalGlobalSettingsPath;
		}
		if (originalIsDev === undefined) {
			delete process.env.IS_DEV;
		} else {
			process.env.IS_DEV = originalIsDev;
		}
		if (originalNoAutoUpdate === undefined) {
			delete process.env.TREMBO_NO_AUTO_UPDATE;
		} else {
			process.env.TREMBO_NO_AUTO_UPDATE = originalNoAutoUpdate;
		}
		vi.restoreAllMocks();
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("skips startup auto update when disabled globally", () => {
		const settingsPath = createTempFile("data/global-settings.json");
		writeFileSync(settingsPath, JSON.stringify({ autoUpdateEnabled: false }));
		process.env.TREMBO_GLOBAL_SETTINGS_PATH = settingsPath;
		delete process.env.IS_DEV;
		delete process.env.TREMBO_NO_AUTO_UPDATE;
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockRejectedValue(new Error("should not fetch"));

		autoUpdateOnStartup();

		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("still lets manual update checks run when startup auto update is disabled", async () => {
		const settingsPath = createTempFile("data/global-settings.json");
		writeFileSync(settingsPath, JSON.stringify({ autoUpdateEnabled: false }));
		process.env.TREMBO_GLOBAL_SETTINGS_PATH = settingsPath;
		delete process.env.TREMBO_NO_AUTO_UPDATE;
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
		delete process.env.TREMBO_NO_AUTO_UPDATE;
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
			delete process.env.TREMBO_BUILD_ENV;
		} else {
			process.env.TREMBO_BUILD_ENV = originalBuildEnv;
		}
		if (originalDataDir === undefined) {
			delete process.env.TREMBO_DATA_DIR;
		} else {
			process.env.TREMBO_DATA_DIR = originalDataDir;
		}
		if (originalHubDiscoveryPath === undefined) {
			delete process.env.TREMBO_HUB_DISCOVERY_PATH;
		} else {
			process.env.TREMBO_HUB_DISCOVERY_PATH = originalHubDiscoveryPath;
		}
	});

	it("uses the shared hub owner outside production builds", () => {
		process.env.TREMBO_BUILD_ENV = "development";
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-update-test-data";
		delete process.env.TREMBO_HUB_DISCOVERY_PATH;

		const owner = resolveCliHubOwnerContext();

		expect(owner.discoveryPath).toContain("/locks/hub/owners/");
		expect(owner.discoveryPath).not.toBe(
			"/tmp/trembo-update-test-data/locks/hub/production.json",
		);
	});
});

describe("withMinimumReleaseAgeBypass", () => {
	it("adds the package-manager-specific cooldown bypass", () => {
		expect(
			withMinimumReleaseAgeBypass(
				"npm update -g trembo --tag latest",
				PackageManager.NPM,
			).command,
		).toBe("npm update -g trembo --tag latest --min-release-age=0");
		expect(
			withMinimumReleaseAgeBypass("bun add -g trembo@latest", PackageManager.BUN)
				.command,
		).toBe("bun add -g trembo@latest --minimum-release-age=0");
		expect(
			withMinimumReleaseAgeBypass(
				"yarn global add trembo@latest",
				PackageManager.YARN,
			).command,
		).toBe("yarn global add trembo@latest");
		expect(
			withMinimumReleaseAgeBypass(
				"yarn global add trembo@latest",
				PackageManager.YARN,
			).env?.YARN_NPM_MINIMAL_AGE_GATE,
		).toBe("0");

		expect(
			withMinimumReleaseAgeBypass(
				"pnpm add -g trembo@latest",
				PackageManager.PNPM,
			).env?.pnpm_config_minimum_release_age,
		).toBe("0");
	});
});
