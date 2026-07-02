// ---------------------------------------------------------------------------
// Environment helpers for test setup.
//
// Usage:
//   test.use({ env: tremboEnv("default") });
//   test.use({ env: tremboEnv("claude-sonnet-4.6") });
//   test.use({ env: tremboEnv("/absolute/path/to/config") });
// ---------------------------------------------------------------------------

import { cpSync, mkdirSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const TEST_SUITE_ROOT = new URL("../", import.meta.url).pathname;

let envCounter = 0;

function createIsolatedTremboDir(sourceDir: string): string {
	const tempRoot = mkdtempSync(path.join(os.tmpdir(), "trembo-tui-test-"));
	const targetDir = path.join(tempRoot, "trembo");
	cpSync(sourceDir, targetDir, {
		recursive: true,
		errorOnExist: false,
		force: true,
	});
	mkdirSync(path.join(targetDir, "home"), { recursive: true });
	return targetDir;
}

function nextHubPort(): string {
	envCounter += 1;
	const basePort = 30_000 + (process.pid % 10_000);
	return String(basePort + (envCounter % 10_000));
}

/**
 * Build the process environment for a trembo test.
 *
 * @param configDir - Named config under `configs/`, or an absolute path.
 * @param extra     - Additional env vars to merge in (override defaults).
 */
export function tremboEnv(
	configDir: string,
	extra: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
	const tremboPath = path.isAbsolute(configDir)
		? configDir
		: path.join(TEST_SUITE_ROOT, "configs", configDir);
	const isolatedTremboPath = createIsolatedTremboDir(tremboPath);
	const dataDir = path.join(isolatedTremboPath, "data");

	// Determine effective VCR mode: extra overrides > parent env > default "playback"
	const effectiveVcrMode =
		extra.TREMBO_VCR ?? process.env.TREMBO_VCR ?? "playback";

	// During recording, authenticated configs read real OAuth credentials from
	// ~/.trembo/data/settings/providers.json while keeping all other settings
	// (model, provider, global state) from the mock config directory.
	const isRecording = effectiveVcrMode === "record";
	const isAuthenticated = configDir !== "unauthenticated";
	const realProvidersFile =
		isRecording && isAuthenticated
			? path.join(os.homedir(), ".trembo", "data", "settings", "providers.json")
			: undefined;

	// Remove CI so terminal renderers treat the spawned process as interactive.
	// Remove VITEST so the spawned CLI binary doesn't skip initVcr().
	// cli/src/index.ts guards `initVcr` behind `process.env.VITEST !== "true"`,
	// so if the parent vitest process's VITEST=true leaks into the child, VCR
	// recording/playback is silently skipped.
	const { CI: _ci, VITEST: _vitest, ...cleanEnv } = process.env;
	if (!isAuthenticated) {
		delete cleanEnv.TREMBO_API_KEY;
	}

	// Only enable VCR when a cassette path is provided (via extra or parent env),
	// otherwise tests without cassettes would trigger a spurious
	// "[VCR] No TREMBO_VCR_CASSETTE" warning on every run.
	const hasCassette = !!(
		extra.TREMBO_VCR_CASSETTE ?? process.env.TREMBO_VCR_CASSETTE
	);
	const vcrDefaults = hasCassette
		? { TREMBO_VCR: "playback", TREMBO_VCR_FILTER: "" }
		: {};

	// the order of these env vars matter; later ones override earlier ones
	return {
		...vcrDefaults,
		...cleanEnv,
		...(realProvidersFile
			? { TREMBO_PROVIDER_SETTINGS_PATH: realProvidersFile }
			: {}),
		TREMBO_TELEMETRY_DISABLED: "1",
		HOME: path.join(isolatedTremboPath, "home"),
		TREMBO_DIR: isolatedTremboPath,
		TREMBO_DATA_DIR: dataDir,
		TREMBO_DB_DATA_DIR: path.join(dataDir, "db"),
		TREMBO_GLOBAL_SETTINGS_PATH: path.join(
			dataDir,
			"settings",
			"global-settings.json",
		),
		TREMBO_HOOKS_LOG_PATH: path.join(dataDir, "logs", "hooks.jsonl"),
		TREMBO_HUB_DISCOVERY_PATH: path.join(
			dataDir,
			"locks",
			"hub",
			"discovery.json",
		),
		TREMBO_HUB_PORT: nextHubPort(),
		TREMBO_MCP_SETTINGS_PATH: path.join(
			dataDir,
			"settings",
			"trembo_mcp_settings.json",
		),
		...(realProvidersFile
			? {}
			: {
					TREMBO_PROVIDER_SETTINGS_PATH: path.join(
						dataDir,
						"settings",
						"providers.json",
					),
				}),
		TREMBO_SESSION_DATA_DIR: path.join(dataDir, "sessions"),
		TREMBO_TEAM_DATA_DIR: path.join(dataDir, "teams"),
		TREMBO_DISABLE_TREMBO_PASS_NOTICE: "1",
		NO_UPDATE_NOTIFIER: "1",
		TREMBO_NO_AUTO_UPDATE: "1",
		...extra,
	};
}
