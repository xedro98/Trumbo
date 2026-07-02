import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	AGENT_CONFIG_DIRECTORY_NAME,
	TREMBO_CONNECTOR_SETTINGS_FILE_NAME,
	TREMBO_MCP_SETTINGS_FILE_NAME,
	HOOKS_CONFIG_DIRECTORY_NAME,
	RULES_CONFIG_DIRECTORY_NAME,
	resolveAgentsConfigDirPath,
	resolveTremboDataDir,
	resolveConnectorDataDir,
	resolveConnectorSettingsPath,
	resolveDbDataDir,
	resolveGlobalAgentsRulesPath,
	resolveGlobalSettingsPath,
	resolveHooksConfigSearchPaths,
	resolveMcpSettingsPath,
	resolveProviderSettingsPath,
	resolveRulesConfigSearchPaths,
	resolveSessionDataDir,
	resolveTeamDataDir,
	resolveWorkflowsConfigSearchPaths,
} from "./paths";

type EnvSnapshot = {
	TREMBO_DIR: string | undefined;
	TREMBO_DATA_DIR: string | undefined;
	TREMBO_CONNECTOR_DATA_DIR: string | undefined;
	TREMBO_CONNECTOR_SETTINGS_PATH: string | undefined;
	TREMBO_DB_DATA_DIR: string | undefined;
	TREMBO_GLOBAL_SETTINGS_PATH: string | undefined;
	TREMBO_MCP_SETTINGS_PATH: string | undefined;
	TREMBO_PROVIDER_SETTINGS_PATH: string | undefined;
	TREMBO_SESSION_DATA_DIR: string | undefined;
	TREMBO_TEAM_DATA_DIR: string | undefined;
};

function captureEnv(): EnvSnapshot {
	return {
		TREMBO_DIR: process.env.TREMBO_DIR,
		TREMBO_DATA_DIR: process.env.TREMBO_DATA_DIR,
		TREMBO_CONNECTOR_DATA_DIR: process.env.TREMBO_CONNECTOR_DATA_DIR,
		TREMBO_CONNECTOR_SETTINGS_PATH: process.env.TREMBO_CONNECTOR_SETTINGS_PATH,
		TREMBO_DB_DATA_DIR: process.env.TREMBO_DB_DATA_DIR,
		TREMBO_GLOBAL_SETTINGS_PATH: process.env.TREMBO_GLOBAL_SETTINGS_PATH,
		TREMBO_MCP_SETTINGS_PATH: process.env.TREMBO_MCP_SETTINGS_PATH,
		TREMBO_PROVIDER_SETTINGS_PATH: process.env.TREMBO_PROVIDER_SETTINGS_PATH,
		TREMBO_SESSION_DATA_DIR: process.env.TREMBO_SESSION_DATA_DIR,
		TREMBO_TEAM_DATA_DIR: process.env.TREMBO_TEAM_DATA_DIR,
	};
}

function restoreEnv(snapshot: EnvSnapshot): void {
	process.env.TREMBO_DATA_DIR = snapshot.TREMBO_DATA_DIR;
	process.env.TREMBO_CONNECTOR_DATA_DIR = snapshot.TREMBO_CONNECTOR_DATA_DIR;
	process.env.TREMBO_CONNECTOR_SETTINGS_PATH =
		snapshot.TREMBO_CONNECTOR_SETTINGS_PATH;
	process.env.TREMBO_DIR = snapshot.TREMBO_DIR;
	process.env.TREMBO_DB_DATA_DIR = snapshot.TREMBO_DB_DATA_DIR;
	process.env.TREMBO_GLOBAL_SETTINGS_PATH = snapshot.TREMBO_GLOBAL_SETTINGS_PATH;
	process.env.TREMBO_MCP_SETTINGS_PATH = snapshot.TREMBO_MCP_SETTINGS_PATH;
	process.env.TREMBO_PROVIDER_SETTINGS_PATH =
		snapshot.TREMBO_PROVIDER_SETTINGS_PATH;
	process.env.TREMBO_SESSION_DATA_DIR = snapshot.TREMBO_SESSION_DATA_DIR;
	process.env.TREMBO_TEAM_DATA_DIR = snapshot.TREMBO_TEAM_DATA_DIR;
}

describe("storage path resolution", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
	});

	it("uses TREMBO_DATA_DIR as-is when set", () => {
		snapshot = captureEnv();
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveTremboDataDir()).toBe("/tmp/trembo-data");
	});

	it("falls back to TREMBO_DATA_DIR/sessions for session storage", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_SESSION_DATA_DIR;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveSessionDataDir()).toBe(join("/tmp/trembo-data", "sessions"));
	});

	it("falls back to TREMBO_DATA_DIR/teams for team storage", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_TEAM_DATA_DIR;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveTeamDataDir()).toBe(join("/tmp/trembo-data", "teams"));
	});

	it("falls back to TREMBO_DATA_DIR/connectors for connector storage", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_CONNECTOR_DATA_DIR;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveConnectorDataDir()).toBe(
			join("/tmp/trembo-data", "connectors"),
		);
	});

	it("falls back to TREMBO_DATA_DIR/connectors/settings.json for connector settings", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_CONNECTOR_DATA_DIR;
		delete process.env.TREMBO_CONNECTOR_SETTINGS_PATH;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveConnectorSettingsPath()).toBe(
			join("/tmp/trembo-data", "connectors", TREMBO_CONNECTOR_SETTINGS_FILE_NAME),
		);
	});

	it("uses TREMBO_CONNECTOR_SETTINGS_PATH as-is when set", () => {
		snapshot = captureEnv();
		process.env.TREMBO_CONNECTOR_SETTINGS_PATH =
			"/tmp/trembo-connectors/custom-settings.json";

		expect(resolveConnectorSettingsPath()).toBe(
			"/tmp/trembo-connectors/custom-settings.json",
		);
	});

	it("falls back to TREMBO_DATA_DIR/db for sqlite storage", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_DB_DATA_DIR;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveDbDataDir()).toBe(join("/tmp/trembo-data", "db"));
	});

	it("falls back to TREMBO_DATA_DIR/settings/providers.json for provider settings", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_PROVIDER_SETTINGS_PATH;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveProviderSettingsPath()).toBe(
			join("/tmp/trembo-data", "settings", "providers.json"),
		);
	});

	it("falls back to TREMBO_DATA_DIR/settings/global-settings.json for global settings", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_GLOBAL_SETTINGS_PATH;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveGlobalSettingsPath()).toBe(
			join("/tmp/trembo-data", "settings", "global-settings.json"),
		);
	});

	it("falls back to TREMBO_DATA_DIR/settings/trembo_mcp_settings.json for MCP settings", () => {
		snapshot = captureEnv();
		delete process.env.TREMBO_MCP_SETTINGS_PATH;
		process.env.TREMBO_DATA_DIR = "/tmp/trembo-data";

		expect(resolveMcpSettingsPath()).toBe(
			join("/tmp/trembo-data", "settings", TREMBO_MCP_SETTINGS_FILE_NAME),
		);
	});

	it("falls back to ~/.trembo/.agents for agent configs", () => {
		snapshot = captureEnv();
		process.env.TREMBO_DIR = "/tmp/home/.trembo";

		expect(resolveAgentsConfigDirPath()).toBe(
			join("/tmp/home", ".trembo", AGENT_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global hooks from ~/.trembo", () => {
		snapshot = captureEnv();
		process.env.TREMBO_DIR = "/tmp/home/.trembo";
		process.env.TREMBO_DATA_DIR = "/tmp/home/.trembo/data";

		expect(resolveHooksConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				join("/tmp/home", ".trembo", HOOKS_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveHooksConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".trembo", "data", HOOKS_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global rules from ~/.trembo", () => {
		snapshot = captureEnv();
		process.env.TREMBO_DIR = "/tmp/home/.trembo";
		process.env.TREMBO_DATA_DIR = "/tmp/home/.trembo/data";

		expect(resolveRulesConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				resolveGlobalAgentsRulesPath(),
				join("/tmp/home", ".trembo", RULES_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveRulesConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".trembo", "data", RULES_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves legacy and new workflow paths, with .trembo paths later for duplicate-name precedence", () => {
		snapshot = captureEnv();
		process.env.TREMBO_DIR = "/tmp/home/.trembo";
		const workspacePath = "/repo/demo";

		const paths = resolveWorkflowsConfigSearchPaths(workspacePath);

		expect(paths).toEqual([
			join(workspacePath, ".tremborules", "workflows"),
			expect.stringContaining(join("Documents", "Trembo", "Workflows")),
			join("/tmp/home", ".trembo", "workflows"),
			join(workspacePath, ".trembo", "workflows"),
		]);
	});
});
