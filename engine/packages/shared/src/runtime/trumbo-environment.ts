export const TRUMBO_ENVIRONMENT_ENV = "TRUMBO_ENVIRONMENT";
export const TRUMBO_ENVIRONMENT_OVERRIDE_ENV = "TRUMBO_ENVIRONMENT_OVERRIDE";

export type TrumboEnvironment = "production" | "staging" | "local";

export interface TrumboEnvironmentConfig {
	readonly environment: TrumboEnvironment;
	readonly appBaseUrl: string;
	readonly apiBaseUrl: string;
	readonly mcpBaseUrl: string;
	readonly workOsClientId: string;
}

export const TRUMBO_ENVIRONMENTS: Readonly<
	Record<TrumboEnvironment, TrumboEnvironmentConfig>
> = {
	production: {
		environment: "production",
		// Production Trumbo backend = the Trumbo web app deployed to Cloudflare
		// Workers at platform.trumbo.dev. The Worker hosts the SPA + the
		// /api/v1 auth, account, billing, and chat-completion endpoints. The
		// device-code verification URI is returned by the server (built from
		// TRUMBO_APP_URL on the Worker), so the CLI prints the right link
		// automatically. Override locally with TRUMBO_API_BASE_URL /
		// TRUMBO_APP_URL, or run against `wrangler dev` with TRUMBO_ENVIRONMENT=local.
		appBaseUrl: "https://platform.trumbo.dev",
		apiBaseUrl: "https://platform.trumbo.dev",
		mcpBaseUrl: "https://platform.trumbo.dev/v1/mcp",
		workOsClientId: "",
	},
	staging: {
		environment: "staging",
		appBaseUrl: "http://0.0.0.0:0",
		apiBaseUrl: "http://0.0.0.0:0",
		mcpBaseUrl: "http://0.0.0.0:0/v1/mcp",
		workOsClientId: "",
	},
	local: {
		environment: "local",
		// API = wrangler dev (:8787). Browser links (device approval, billing) = Vite (:5173).
		appBaseUrl: "http://localhost:5173",
		apiBaseUrl: "http://localhost:8787",
		mcpBaseUrl: "http://localhost:8787/v1/mcp",
		workOsClientId: "",
	},
};

export const DEFAULT_TRUMBO_ENVIRONMENT: TrumboEnvironment = "production";

/** Placeholder until a production deployment URL is configured. */
export const UNCONFIGURED_TRUMBO_APP_URL = "http://0.0.0.0:0";

export function isUnconfiguredTrumboUrl(url: string | undefined): boolean {
	if (!url?.trim()) {
		return false;
	}
	const normalized = url.trim().replace(/\/$/, "");
	return (
		normalized === UNCONFIGURED_TRUMBO_APP_URL ||
		normalized.startsWith("http://0.0.0.0:0") ||
		normalized.startsWith("http://0.0.0.0/")
	);
}

function stripApiV1Suffix(url: string): string {
	return url.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

/** Trumbo web app host root (no `/api/v1` suffix). */
export function resolveTrumboApiBaseUrl(settingsBaseUrl?: string): string {
	if (resolveTrumboEnvironment() === "local") {
		return getTrumboEnvironmentConfig("local").apiBaseUrl;
	}

	const fromSettings = settingsBaseUrl?.trim();
	if (fromSettings && !isUnconfiguredTrumboUrl(fromSettings)) {
		return stripApiV1Suffix(fromSettings);
	}

	return getTrumboEnvironmentConfig().apiBaseUrl;
}

/** OpenAI-compatible chat endpoint for the Trumbo provider (`…/api/v1`). */
export function resolveTrumboProviderBaseUrl(settingsBaseUrl?: string): string {
	if (resolveTrumboEnvironment() === "local") {
		return `${getTrumboEnvironmentConfig("local").apiBaseUrl}/api/v1`;
	}

	const fromSettings = settingsBaseUrl?.trim();
	if (fromSettings && !isUnconfiguredTrumboUrl(fromSettings)) {
		return fromSettings.replace(/\/$/, "");
	}
	return `${resolveTrumboApiBaseUrl()}/api/v1`;
}

export function formatUnconfiguredTrumboUrlError(): string {
	return (
		"Trumbo web app URL is not configured. For local dev run `bun run dev` in projects/console " +
		"(http://localhost:8787 API, http://localhost:5173 UI) or set TRUMBO_API_BASE_URL."
	);
}

export interface ResolveTrumboEnvironmentOptions {
	env?: Partial<NodeJS.ProcessEnv>;
}

function normalizeTrumboEnvironment(
	value: string | undefined,
): TrumboEnvironment | undefined {
	const normalized = value?.trim().toLowerCase();
	if (
		normalized === "production" ||
		normalized === "staging" ||
		normalized === "local"
	) {
		return normalized;
	}
	return undefined;
}

function readProcessEnv(): NodeJS.ProcessEnv {
	// `process` may be absent in browser-style runtimes (this module ships
	// from the browser entry of `@trumbo/shared`). Treat its absence as "no
	// env vars set" so callers always get a deterministic default.
	if (typeof process === "undefined" || !process?.env) {
		return {};
	}
	return process.env;
}

function hasDevelopmentBuildCondition(execArgv: string[]): boolean {
	for (let index = 0; index < execArgv.length; index += 1) {
		const value = execArgv[index]?.trim();
		if (!value) {
			continue;
		}
		if (
			value === "--conditions" &&
			execArgv[index + 1]?.trim() === "development"
		) {
			return true;
		}
		if (
			value.startsWith("--conditions=") &&
			value
				.slice("--conditions=".length)
				.split(",")
				.map((entry) => entry.trim())
				.includes("development")
		) {
			return true;
		}
	}
	return false;
}

interface BunRuntime {
	main?: string;
}

function readBunRuntime(): BunRuntime | undefined {
	return (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun;
}

/** True when the CLI is run from source via Bun (`bun run dev`, `bun link`). */
function isBunSourceCliDev(): boolean {
	const bun = readBunRuntime();
	if (!bun) {
		return false;
	}
	const main = String(bun.main ?? "").replace(/\\/g, "/");
	return (
		main.includes("/projects/console/src/index.ts") ||
		main.endsWith("/console/src/index.ts")
	);
}

/** True when running the published native CLI binary (npm `@trumbodev/cli`). */
function isPublishedCliBinary(): boolean {
	if (typeof process === "undefined") {
		return false;
	}
	const argv0 = (process.argv[0] ?? "").replace(/\\/g, "/");
	return (
		argv0.includes("@trumbodev/cli-") ||
		(/\/bin\/trumbo(\.exe)?$/i.test(argv0) && readBunRuntime() === undefined)
	);
}

export function resolveTrumboEnvironment(): TrumboEnvironment {
	const env = readProcessEnv();
	const explicit =
		normalizeTrumboEnvironment(env[TRUMBO_ENVIRONMENT_OVERRIDE_ENV]) ??
		normalizeTrumboEnvironment(env[TRUMBO_ENVIRONMENT_ENV]);
	if (explicit) {
		return explicit;
	}
	// Published npm binary → production unless explicitly overridden above.
	if (isPublishedCliBinary()) {
		return DEFAULT_TRUMBO_ENVIRONMENT;
	}
	// Dev CLI: `bun run dev`, `--conditions=development`, or Bun running src/index.ts.
	if (env.TRUMBO_BUILD_ENV?.trim().toLowerCase() === "development") {
		return "local";
	}
	if (
		typeof process !== "undefined" &&
		hasDevelopmentBuildCondition(process.execArgv ?? [])
	) {
		return "local";
	}
	if (isBunSourceCliDev()) {
		return "local";
	}
	return DEFAULT_TRUMBO_ENVIRONMENT;
}

function getEnvConfig(env?: TrumboEnvironment) {
	if (typeof env === "string") {
		return TRUMBO_ENVIRONMENTS[env];
	}
	return TRUMBO_ENVIRONMENTS[resolveTrumboEnvironment()];
}

function applyConfigOverrides(
	config: TrumboEnvironmentConfig,
	env: NodeJS.ProcessEnv,
): TrumboEnvironmentConfig {
	if (env.TRUMBO_APP_URL?.trim()) {
		config = {
			...config,
			appBaseUrl: env.TRUMBO_APP_URL.trim().replace(/\/$/, ""),
		};
	}

	if (env.TRUMBO_API_BASE_URL?.trim()) {
		const apiBaseUrl = env.TRUMBO_API_BASE_URL.trim().replace(/\/$/, "");
		config = {
			...config,
			apiBaseUrl,
			mcpBaseUrl: `${apiBaseUrl}/v1/mcp`,
		};
	}

	return config;
}

export function getTrumboEnvironmentConfig(
	env?: TrumboEnvironment,
): TrumboEnvironmentConfig {
	const config = getEnvConfig(env);

	return applyConfigOverrides(config, readProcessEnv());
}
