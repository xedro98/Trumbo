import type { Dirent } from "node:fs";
import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { PluginManifest } from "..";

const DEPRECATED_CONFIG_DIR = ".trumborules";
const TRUMBO_CONFIG_DIR = ".trumbo";
const LEGACY_AGENT_SKILLS_CONFIG_DIR = ".agents";

export const AGENT_CONFIG_DIRECTORY_NAME = "agents";
export const HOOKS_CONFIG_DIRECTORY_NAME = "hooks";
export const SKILLS_CONFIG_DIRECTORY_NAME = "skills";
export const RULES_CONFIG_DIRECTORY_NAME = "rules";
export const WORKFLOWS_CONFIG_DIRECTORY_NAME = "workflows";
export const PLUGINS_DIRECTORY_NAME = "plugins";
export const AGENTS_RULES_FILE_NAME = "AGENTS.md";

export const TRUMBO_MCP_SETTINGS_FILE_NAME = "trumbo_mcp_settings.json";
export const TRUMBO_CONNECTOR_SETTINGS_FILE_NAME = "settings.json";

function resolveDefaultHomeDir(): string {
	const envHome = process?.env?.HOME?.trim();
	if (envHome && envHome !== "~") {
		return envHome;
	}
	const envUserProfile = process?.env?.USERPROFILE?.trim();
	if (envUserProfile) {
		return envUserProfile;
	}
	const envHomeDrive = process?.env?.HOMEDRIVE?.trim();
	const envHomePath = process?.env?.HOMEPATH?.trim();
	if (envHomeDrive && envHomePath) {
		return `${envHomeDrive}${envHomePath}`;
	}
	const osHomeDir = homedir().trim();
	if (osHomeDir && osHomeDir !== "~") {
		return osHomeDir;
	}
	return "~";
}

let HOME_DIR = resolveDefaultHomeDir();
let HOME_DIR_SET_EXPLICITLY = false;

export function setHomeDir(dir: string) {
	const trimmed = dir.trim();
	if (!trimmed) {
		return;
	}
	HOME_DIR = trimmed;
	HOME_DIR_SET_EXPLICITLY = true;
}

export function setHomeDirIfUnset(dir: string) {
	if (HOME_DIR_SET_EXPLICITLY) {
		return;
	}
	const trimmed = dir.trim();
	if (!trimmed) {
		return;
	}
	HOME_DIR = trimmed;
}

let TRUMBO_DIR: string | undefined;
let TRUMBO_DIR_SET_EXPLICITLY = false;

export function setTrumboDir(dir: string): void {
	const trimmed = dir.trim();
	if (!trimmed) {
		return;
	}
	TRUMBO_DIR = trimmed;
	TRUMBO_DIR_SET_EXPLICITLY = true;
}

export function setTrumboDirIfUnset(dir: string): void {
	if (TRUMBO_DIR_SET_EXPLICITLY) {
		return;
	}
	const trimmed = dir.trim();
	if (!trimmed) {
		return;
	}
	TRUMBO_DIR = trimmed;
}

export function resolveTrumboDir(): string {
	if (TRUMBO_DIR) {
		return TRUMBO_DIR;
	}
	const envDir = process.env.TRUMBO_DIR?.trim();
	if (envDir) {
		return envDir;
	}
	return join(HOME_DIR, ".trumbo");
}

export function resolveDocumentsTrumboDirectoryPath(): string {
	return join(HOME_DIR, "Documents", "Trumbo");
}

type DocumentsExtensionName =
	| "Agents"
	| "Hooks"
	| "Rules"
	| "Workflows"
	| "Plugins";

export function resolveDocumentsExtensionPath(
	name: DocumentsExtensionName,
): string {
	return join(resolveDocumentsTrumboDirectoryPath(), name);
}

export function resolveTrumboDataDir(): string {
	const explicitDir = process.env.TRUMBO_DATA_DIR?.trim();
	if (explicitDir) {
		return explicitDir;
	}
	return join(resolveTrumboDir(), "data");
}

export function resolveSessionDataDir(): string {
	const explicitDir = process.env.TRUMBO_SESSION_DATA_DIR?.trim();
	if (explicitDir) {
		return explicitDir;
	}
	return join(resolveTrumboDataDir(), "sessions");
}

export function resolveTeamDataDir(): string {
	const explicitDir = process.env.TRUMBO_TEAM_DATA_DIR?.trim();
	if (explicitDir) {
		return explicitDir;
	}
	return join(resolveTrumboDataDir(), "teams");
}

export function resolveConnectorDataDir(): string {
	const explicitDir = process.env.TRUMBO_CONNECTOR_DATA_DIR?.trim();
	if (explicitDir) {
		return explicitDir;
	}
	return join(resolveTrumboDataDir(), "connectors");
}

export function resolveConnectorSettingsPath(): string {
	const explicitPath = process.env.TRUMBO_CONNECTOR_SETTINGS_PATH?.trim();
	if (explicitPath) {
		return explicitPath;
	}
	return join(resolveConnectorDataDir(), TRUMBO_CONNECTOR_SETTINGS_FILE_NAME);
}

export function resolveDbDataDir(): string {
	const explicitDir = process.env.TRUMBO_DB_DATA_DIR?.trim();
	if (explicitDir) {
		return explicitDir;
	}
	return join(resolveTrumboDataDir(), "db");
}

/**
 * Path to the dedicated cron/automation database.
 * Lives alongside `sessions.db` but is a separate file so cron lifecycle,
 * retention, and query patterns stay decoupled from session storage.
 */
export function resolveCronDbPath(): string {
	const explicitPath = process.env.TRUMBO_CRON_DB_PATH?.trim();
	if (explicitPath) {
		return explicitPath;
	}
	return join(resolveDbDataDir(), "cron.db");
}

export type CronSpecsScope = "global" | "workspace";

export interface ResolveCronSpecsDirOptions {
	/**
	 * Explicit specs directory. Useful for tests and for future hosts that want
	 * to provide their own merged/global/workspace cron source root.
	 */
	cronSpecsDir?: string;
	/** Defaults to `global`, i.e. `~/.trumbo/cron`. */
	scope?: CronSpecsScope;
	/** Required when `scope` is `workspace`. */
	workspaceRoot?: string;
}

/**
 * Global file-based cron spec authoring directory:
 *   `~/.trumbo/cron/`
 */
export function resolveGlobalCronSpecsDir(): string {
	return join(resolveTrumboDir(), "cron");
}

/**
 * Workspace file-based cron spec authoring directory reserved for future
 * workspace-scoped automation support:
 *   `${workspaceRoot}/.trumbo/cron/`
 */
export function resolveWorkspaceCronSpecsDir(workspaceRoot: string): string {
	return join(workspaceRoot, ".trumbo", "cron");
}

/**
 * Directory containing file-based cron spec authoring.
 *
 * Default: global `~/.trumbo/cron/`.
 * One-off: `*.md`
 * Recurring: `*.cron.md`
 * Event-driven: `events/*.event.md`
 *
 * A string argument is retained as a deprecated compatibility shorthand for
 * workspace scope. New code should pass `{ scope: "workspace", workspaceRoot }`
 * or use `resolveWorkspaceCronSpecsDir(workspaceRoot)` directly.
 */
export function resolveCronSpecsDir(workspaceRoot: string): string;
export function resolveCronSpecsDir(
	options?: ResolveCronSpecsDirOptions,
): string;
export function resolveCronSpecsDir(
	input?: string | ResolveCronSpecsDirOptions,
): string {
	if (typeof input === "string") {
		return resolveWorkspaceCronSpecsDir(input);
	}
	if (input?.cronSpecsDir?.trim()) {
		return input.cronSpecsDir.trim();
	}
	if (input?.scope === "workspace") {
		const workspaceRoot = input.workspaceRoot?.trim();
		if (!workspaceRoot) {
			throw new Error("workspaceRoot is required for workspace cron scope");
		}
		return resolveWorkspaceCronSpecsDir(workspaceRoot);
	}
	return resolveGlobalCronSpecsDir();
}

/** Directory where per-run markdown reports are written. */
export function resolveCronReportsDir(workspaceRoot: string): string;
export function resolveCronReportsDir(
	options?: ResolveCronSpecsDirOptions,
): string;
export function resolveCronReportsDir(
	input?: string | ResolveCronSpecsDirOptions,
): string {
	return join(
		resolveCronSpecsDir(input as ResolveCronSpecsDirOptions),
		"reports",
	);
}

/** Directory where event-spec files live inside the cron specs dir. */
export function resolveCronEventsDir(workspaceRoot: string): string;
export function resolveCronEventsDir(
	options?: ResolveCronSpecsDirOptions,
): string;
export function resolveCronEventsDir(
	input?: string | ResolveCronSpecsDirOptions,
): string {
	return join(
		resolveCronSpecsDir(input as ResolveCronSpecsDirOptions),
		"events",
	);
}

export function resolveProviderSettingsPath(): string {
	const explicitPath = process.env.TRUMBO_PROVIDER_SETTINGS_PATH?.trim();
	if (explicitPath) {
		return explicitPath;
	}
	return join(resolveTrumboDataDir(), "settings", "providers.json");
}

export function resolveGlobalSettingsPath(): string {
	const explicitPath = process.env.TRUMBO_GLOBAL_SETTINGS_PATH?.trim();
	if (explicitPath) {
		return explicitPath;
	}
	return join(resolveTrumboDataDir(), "settings", "global-settings.json");
}

export function resolveMcpSettingsPath(): string {
	const explicitPath = process.env.TRUMBO_MCP_SETTINGS_PATH?.trim();
	if (explicitPath) {
		return explicitPath;
	}
	return join(
		resolveTrumboDataDir(),
		"settings",
		TRUMBO_MCP_SETTINGS_FILE_NAME,
	);
}

function dedupePaths(paths: ReadonlyArray<string>): string[] {
	const seen = new Set<string>();
	const deduped: string[] = [];
	for (const candidate of paths) {
		if (!candidate || seen.has(candidate)) {
			continue;
		}
		seen.add(candidate);
		deduped.push(candidate);
	}
	return deduped;
}

function getWorkspaceSkillDirectories(workspacePath?: string): string[] {
	if (!workspacePath) {
		return [];
	}
	return [
		DEPRECATED_CONFIG_DIR,
		TRUMBO_CONFIG_DIR,
		LEGACY_AGENT_SKILLS_CONFIG_DIR,
	].map((dir) => join(workspacePath, dir, SKILLS_CONFIG_DIRECTORY_NAME));
}

export function resolveAgentsConfigDirPath(): string {
	return join(resolveTrumboDir(), AGENT_CONFIG_DIRECTORY_NAME);
}

export function resolveAgentConfigSearchPaths(
	workspacePath?: string,
): string[] {
	return dedupePaths([
		workspacePath
			? join(workspacePath, TRUMBO_CONFIG_DIR, AGENT_CONFIG_DIRECTORY_NAME)
			: "",
		resolveAgentsConfigDirPath(),
	]);
}

export function resolveHooksConfigSearchPaths(
	workspacePath?: string,
): string[] {
	const hooks = [
		resolveDocumentsExtensionPath("Hooks"),
		join(resolveTrumboDir(), HOOKS_CONFIG_DIRECTORY_NAME),
	];
	if (workspacePath) {
		hooks.push(
			join(workspacePath, DEPRECATED_CONFIG_DIR, HOOKS_CONFIG_DIRECTORY_NAME),
			join(workspacePath, TRUMBO_CONFIG_DIR, HOOKS_CONFIG_DIRECTORY_NAME),
		);
	}
	return dedupePaths(hooks);
}

export function resolveSkillsConfigSearchPaths(
	workspacePath?: string,
): string[] {
	return dedupePaths([
		...getWorkspaceSkillDirectories(workspacePath),
		join(resolveTrumboDir(), SKILLS_CONFIG_DIRECTORY_NAME),
		join(
			HOME_DIR,
			LEGACY_AGENT_SKILLS_CONFIG_DIR,
			SKILLS_CONFIG_DIRECTORY_NAME,
		),
		join(HOME_DIR, ".claude", SKILLS_CONFIG_DIRECTORY_NAME),
		join(HOME_DIR, ".codex", SKILLS_CONFIG_DIRECTORY_NAME),
	]);
}

export function resolveGlobalAgentsRulesPath(): string {
	return join(HOME_DIR, LEGACY_AGENT_SKILLS_CONFIG_DIR, AGENTS_RULES_FILE_NAME);
}

export function resolveRulesConfigSearchPaths(
	workspacePath?: string,
): string[] {
	const wsPaths = workspacePath
		? [
				join(workspacePath, DEPRECATED_CONFIG_DIR),
				join(workspacePath, TRUMBO_CONFIG_DIR, RULES_CONFIG_DIRECTORY_NAME),
			]
		: [];
	const workspaceAgentsFile = workspacePath
		? [join(workspacePath, AGENTS_RULES_FILE_NAME)]
		: [];
	return dedupePaths([
		...workspaceAgentsFile,
		...wsPaths,
		resolveGlobalAgentsRulesPath(),
		join(resolveTrumboDir(), RULES_CONFIG_DIRECTORY_NAME),
		join(HOME_DIR, ".claude", "CLAUDE.md"),
		resolveDocumentsExtensionPath("Rules"),
	]);
}

export function resolveWorkflowsConfigSearchPaths(
	workspacePath?: string,
): string[] {
	return dedupePaths([
		workspacePath
			? join(workspacePath, ".trumborules", WORKFLOWS_CONFIG_DIRECTORY_NAME)
			: "",
		resolveDocumentsExtensionPath("Workflows"),
		join(resolveTrumboDir(), WORKFLOWS_CONFIG_DIRECTORY_NAME),
		workspacePath
			? join(workspacePath, ".trumbo", WORKFLOWS_CONFIG_DIRECTORY_NAME)
			: "",
	]);
}

export function resolvePluginConfigSearchPaths(
	workspacePath?: string,
): string[] {
	return dedupePaths([
		workspacePath ? join(workspacePath, ".trumbo", PLUGINS_DIRECTORY_NAME) : "",
		join(resolveTrumboDir(), PLUGINS_DIRECTORY_NAME),
		resolveDocumentsExtensionPath("Plugins"),
	]);
}

const PLUGIN_MODULE_EXTENSIONS = new Set([".js", ".ts"]);
const PLUGIN_PACKAGE_JSON_FILE_NAME = "package.json";
const PLUGIN_DIRECTORY_INDEX_CANDIDATES = ["index.ts", "index.js"];

interface PluginPackageManifest {
	plugins?: PluginManifest[];
}

export function isPluginModulePath(path: string): boolean {
	const dot = path.lastIndexOf(".");
	if (dot === -1) {
		return false;
	}
	return PLUGIN_MODULE_EXTENSIONS.has(path.slice(dot));
}

function readPluginPackageManifest(
	packageJsonPath: string,
): PluginPackageManifest | null {
	try {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
			trumbo?: PluginPackageManifest;
		};
		if (!packageJson.trumbo || typeof packageJson.trumbo !== "object") {
			return null;
		}
		return packageJson.trumbo;
	} catch {
		return null;
	}
}

function getManifestPluginEntries(
	manifest: PluginPackageManifest | null,
): string[] {
	const entries = manifest?.plugins;
	if (!Array.isArray(entries)) {
		return [];
	}
	return entries.flatMap((entry) => entry.paths ?? []);
}

export function resolvePluginModuleEntries(
	directoryPath: string,
): string[] | null {
	const root = resolve(directoryPath);
	if (!existsSync(root) || !statSync(root).isDirectory()) {
		return null;
	}

	const packageJsonPath = join(root, PLUGIN_PACKAGE_JSON_FILE_NAME);
	if (existsSync(packageJsonPath)) {
		const manifest = readPluginPackageManifest(packageJsonPath);
		const entries = getManifestPluginEntries(manifest)
			.map((entry) => resolve(root, entry))
			.filter(
				(entryPath) =>
					existsSync(entryPath) &&
					statSync(entryPath).isFile() &&
					isPluginModulePath(entryPath),
			);
		if (entries.length > 0) {
			return entries;
		}
	}

	for (const candidate of PLUGIN_DIRECTORY_INDEX_CANDIDATES) {
		const entryPath = join(root, candidate);
		if (existsSync(entryPath) && statSync(entryPath).isFile()) {
			return [entryPath];
		}
	}

	return null;
}

export function discoverPluginModulePaths(directoryPath: string): string[] {
	const root = resolve(directoryPath);
	if (!existsSync(root)) {
		return [];
	}
	const discovered: string[] = [];
	const stack = [root];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) {
			continue;
		}
		let entries: Dirent[];
		try {
			entries = readdirSync(current, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			const candidate = join(current, entry.name);
			if (entry.isDirectory()) {
				const packageJsonPath = join(candidate, PLUGIN_PACKAGE_JSON_FILE_NAME);
				if (existsSync(packageJsonPath)) {
					const manifest = readPluginPackageManifest(packageJsonPath);
					const entries = getManifestPluginEntries(manifest)
						.map((e) => resolve(candidate, e))
						.filter(
							(entryPath) =>
								existsSync(entryPath) &&
								statSync(entryPath).isFile() &&
								isPluginModulePath(entryPath),
						);
					if (entries.length > 0) {
						discovered.push(...entries);
						continue;
					}
				}
				stack.push(candidate);
				continue;
			}
			if (entry.name.startsWith(".")) {
				continue;
			}
			if (entry.isFile() && isPluginModulePath(candidate)) {
				discovered.push(candidate);
			}
		}
	}
	return discovered.sort((a, b) => a.localeCompare(b));
}

export function resolveConfiguredPluginModulePaths(
	pluginPaths: ReadonlyArray<string>,
	cwd: string,
): string[] {
	const resolvedPaths: string[] = [];
	for (const pluginPath of pluginPaths) {
		const trimmed = pluginPath.trim();
		if (!trimmed) {
			continue;
		}
		const absolutePath = resolve(cwd, trimmed);
		if (!existsSync(absolutePath)) {
			throw new Error(`Plugin path does not exist: ${absolutePath}`);
		}
		const stats = statSync(absolutePath);
		if (stats.isDirectory()) {
			const entries = resolvePluginModuleEntries(absolutePath);
			if (entries) {
				resolvedPaths.push(...entries);
				continue;
			}
			resolvedPaths.push(...discoverPluginModulePaths(absolutePath));
			continue;
		}
		if (!isPluginModulePath(absolutePath)) {
			throw new Error(
				`Plugin file must use a supported extension (${[...PLUGIN_MODULE_EXTENSIONS].join(", ")}): ${absolutePath}`,
			);
		}
		resolvedPaths.push(absolutePath);
	}
	return resolvedPaths;
}

export function ensureParentDir(filePath: string): void {
	const parent = dirname(filePath);
	if (!existsSync(parent)) {
		mkdirSync(parent, { recursive: true });
	}
}

export function ensureFileExists(filePath: string): void {
	mkdirSync(dirname(filePath), { recursive: true });
	appendFileSync(filePath, "");
}

export function ensureHookLogDir(filePath?: string): string {
	if (filePath?.trim()) {
		ensureParentDir(filePath);
		return dirname(filePath);
	}
	const dir = join(resolveTrumboDataDir(), "logs");
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	return dir;
}
