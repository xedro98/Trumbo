import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	AGENT_CONFIG_DIRECTORY_NAME,
	HOOKS_CONFIG_DIRECTORY_NAME,
	RULES_CONFIG_DIRECTORY_NAME,
	resolveAgentsConfigDirPath,
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
	resolveTrumboDataDir,
	resolveWorkflowsConfigSearchPaths,
	TRUMBO_CONNECTOR_SETTINGS_FILE_NAME,
	TRUMBO_MCP_SETTINGS_FILE_NAME,
} from "./paths";

type EnvSnapshot = {
	TRUMBO_DIR: string | undefined;
	TRUMBO_DATA_DIR: string | undefined;
	TRUMBO_CONNECTOR_DATA_DIR: string | undefined;
	TRUMBO_CONNECTOR_SETTINGS_PATH: string | undefined;
	TRUMBO_DB_DATA_DIR: string | undefined;
	TRUMBO_GLOBAL_SETTINGS_PATH: string | undefined;
	TRUMBO_MCP_SETTINGS_PATH: string | undefined;
	TRUMBO_PROVIDER_SETTINGS_PATH: string | undefined;
	TRUMBO_SESSION_DATA_DIR: string | undefined;
	TRUMBO_TEAM_DATA_DIR: string | undefined;
};

function captureEnv(): EnvSnapshot {
	return {
		TRUMBO_DIR: process.env.TRUMBO_DIR,
		TRUMBO_DATA_DIR: process.env.TRUMBO_DATA_DIR,
		TRUMBO_CONNECTOR_DATA_DIR: process.env.TRUMBO_CONNECTOR_DATA_DIR,
		TRUMBO_CONNECTOR_SETTINGS_PATH: process.env.TRUMBO_CONNECTOR_SETTINGS_PATH,
		TRUMBO_DB_DATA_DIR: process.env.TRUMBO_DB_DATA_DIR,
		TRUMBO_GLOBAL_SETTINGS_PATH: process.env.TRUMBO_GLOBAL_SETTINGS_PATH,
		TRUMBO_MCP_SETTINGS_PATH: process.env.TRUMBO_MCP_SETTINGS_PATH,
		TRUMBO_PROVIDER_SETTINGS_PATH: process.env.TRUMBO_PROVIDER_SETTINGS_PATH,
		TRUMBO_SESSION_DATA_DIR: process.env.TRUMBO_SESSION_DATA_DIR,
		TRUMBO_TEAM_DATA_DIR: process.env.TRUMBO_TEAM_DATA_DIR,
	};
}

function restoreEnv(snapshot: EnvSnapshot): void {
	process.env.TRUMBO_DATA_DIR = snapshot.TRUMBO_DATA_DIR;
	process.env.TRUMBO_CONNECTOR_DATA_DIR = snapshot.TRUMBO_CONNECTOR_DATA_DIR;
	process.env.TRUMBO_CONNECTOR_SETTINGS_PATH =
		snapshot.TRUMBO_CONNECTOR_SETTINGS_PATH;
	process.env.TRUMBO_DIR = snapshot.TRUMBO_DIR;
	process.env.TRUMBO_DB_DATA_DIR = snapshot.TRUMBO_DB_DATA_DIR;
	process.env.TRUMBO_GLOBAL_SETTINGS_PATH =
		snapshot.TRUMBO_GLOBAL_SETTINGS_PATH;
	process.env.TRUMBO_MCP_SETTINGS_PATH = snapshot.TRUMBO_MCP_SETTINGS_PATH;
	process.env.TRUMBO_PROVIDER_SETTINGS_PATH =
		snapshot.TRUMBO_PROVIDER_SETTINGS_PATH;
	process.env.TRUMBO_SESSION_DATA_DIR = snapshot.TRUMBO_SESSION_DATA_DIR;
	process.env.TRUMBO_TEAM_DATA_DIR = snapshot.TRUMBO_TEAM_DATA_DIR;
}

describe("storage path resolution", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
	});

	it("uses TRUMBO_DATA_DIR as-is when set", () => {
		snapshot = captureEnv();
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveTrumboDataDir()).toBe("/tmp/trumbo-data");
	});

	it("falls back to TRUMBO_DATA_DIR/sessions for session storage", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_SESSION_DATA_DIR;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveSessionDataDir()).toBe(join("/tmp/trumbo-data", "sessions"));
	});

	it("falls back to TRUMBO_DATA_DIR/teams for team storage", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_TEAM_DATA_DIR;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveTeamDataDir()).toBe(join("/tmp/trumbo-data", "teams"));
	});

	it("falls back to TRUMBO_DATA_DIR/connectors for connector storage", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_CONNECTOR_DATA_DIR;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveConnectorDataDir()).toBe(
			join("/tmp/trumbo-data", "connectors"),
		);
	});

	it("falls back to TRUMBO_DATA_DIR/connectors/settings.json for connector settings", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_CONNECTOR_DATA_DIR;
		delete process.env.TRUMBO_CONNECTOR_SETTINGS_PATH;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveConnectorSettingsPath()).toBe(
			join(
				"/tmp/trumbo-data",
				"connectors",
				TRUMBO_CONNECTOR_SETTINGS_FILE_NAME,
			),
		);
	});

	it("uses TRUMBO_CONNECTOR_SETTINGS_PATH as-is when set", () => {
		snapshot = captureEnv();
		process.env.TRUMBO_CONNECTOR_SETTINGS_PATH =
			"/tmp/trumbo-connectors/custom-settings.json";

		expect(resolveConnectorSettingsPath()).toBe(
			"/tmp/trumbo-connectors/custom-settings.json",
		);
	});

	it("falls back to TRUMBO_DATA_DIR/db for sqlite storage", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_DB_DATA_DIR;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveDbDataDir()).toBe(join("/tmp/trumbo-data", "db"));
	});

	it("falls back to TRUMBO_DATA_DIR/settings/providers.json for provider settings", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_PROVIDER_SETTINGS_PATH;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveProviderSettingsPath()).toBe(
			join("/tmp/trumbo-data", "settings", "providers.json"),
		);
	});

	it("falls back to TRUMBO_DATA_DIR/settings/global-settings.json for global settings", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_GLOBAL_SETTINGS_PATH;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveGlobalSettingsPath()).toBe(
			join("/tmp/trumbo-data", "settings", "global-settings.json"),
		);
	});

	it("falls back to TRUMBO_DATA_DIR/settings/trumbo_mcp_settings.json for MCP settings", () => {
		snapshot = captureEnv();
		delete process.env.TRUMBO_MCP_SETTINGS_PATH;
		process.env.TRUMBO_DATA_DIR = "/tmp/trumbo-data";

		expect(resolveMcpSettingsPath()).toBe(
			join("/tmp/trumbo-data", "settings", TRUMBO_MCP_SETTINGS_FILE_NAME),
		);
	});

	it("falls back to ~/.trumbo/.agents for agent configs", () => {
		snapshot = captureEnv();
		process.env.TRUMBO_DIR = "/tmp/home/.trumbo";

		expect(resolveAgentsConfigDirPath()).toBe(
			join("/tmp/home", ".trumbo", AGENT_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global hooks from ~/.trumbo", () => {
		snapshot = captureEnv();
		process.env.TRUMBO_DIR = "/tmp/home/.trumbo";
		process.env.TRUMBO_DATA_DIR = "/tmp/home/.trumbo/data";

		expect(resolveHooksConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				join("/tmp/home", ".trumbo", HOOKS_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveHooksConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".trumbo", "data", HOOKS_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves global rules from ~/.trumbo", () => {
		snapshot = captureEnv();
		process.env.TRUMBO_DIR = "/tmp/home/.trumbo";
		process.env.TRUMBO_DATA_DIR = "/tmp/home/.trumbo/data";

		expect(resolveRulesConfigSearchPaths()).toEqual(
			expect.arrayContaining([
				resolveGlobalAgentsRulesPath(),
				join("/tmp/home", ".trumbo", RULES_CONFIG_DIRECTORY_NAME),
			]),
		);
		expect(resolveRulesConfigSearchPaths()).not.toContain(
			join("/tmp/home", ".trumbo", "data", RULES_CONFIG_DIRECTORY_NAME),
		);
	});

	it("resolves legacy and new workflow paths, with .trumbo paths later for duplicate-name precedence", () => {
		snapshot = captureEnv();
		process.env.TRUMBO_DIR = "/tmp/home/.trumbo";
		const workspacePath = "/repo/demo";

		const paths = resolveWorkflowsConfigSearchPaths(workspacePath);

		expect(paths).toEqual([
			join(workspacePath, ".trumborules", "workflows"),
			expect.stringContaining(join("Documents", "Trumbo", "Workflows")),
			join("/tmp/home", ".trumbo", "workflows"),
			join(workspacePath, ".trumbo", "workflows"),
		]);
	});
});
