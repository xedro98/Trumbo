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
		// External Trumbo backend endpoints. The Trumbo web app (@trumbo/web,
		// deployed to Cloudflare Workers) hosts these. Point at your deployment
		// via `TRUMBO_API_BASE_URL` (and `TRUMBO_APP_URL`), or run locally with
		// `TRUMBO_ENVIRONMENT=local` against `wrangler dev` on :8787. An empty
		// `workOsClientId` selects the self-hosted device-code auth flow; set a
		// non-empty client id to use WorkOS instead. BYO-key providers are
		// unaffected.
		appBaseUrl: "http://0.0.0.0:0",
		apiBaseUrl: "http://0.0.0.0:0",
		mcpBaseUrl: "http://0.0.0.0:0/v1/mcp",
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
		// The Trumbo web app served by `wrangler dev` (projects/web). The same
		// Worker hosts the SPA and the /api/v1 auth + account endpoints.
		appBaseUrl: "http://localhost:8787",
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
	const fromSettings = settingsBaseUrl?.trim();
	if (fromSettings && !isUnconfiguredTrumboUrl(fromSettings)) {
		return stripApiV1Suffix(fromSettings);
	}

	return getTrumboEnvironmentConfig().apiBaseUrl;
}

/** OpenAI-compatible chat endpoint for the Trumbo provider (`…/api/v1`). */
export function resolveTrumboProviderBaseUrl(settingsBaseUrl?: string): string {
	const fromSettings = settingsBaseUrl?.trim();
	if (fromSettings && !isUnconfiguredTrumboUrl(fromSettings)) {
		return fromSettings.replace(/\/$/, "");
	}
	return `${resolveTrumboApiBaseUrl()}/api/v1`;
}

export function formatUnconfiguredTrumboUrlError(): string {
	return (
		"Trumbo web app URL is not configured. For local dev set TRUMBO_ENVIRONMENT=local " +
		"(http://localhost:8787) or set TRUMBO_API_BASE_URL to your deployment."
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

export function resolveTrumboEnvironment(): TrumboEnvironment {
	const env = readProcessEnv();
	const explicit =
		normalizeTrumboEnvironment(env[TRUMBO_ENVIRONMENT_OVERRIDE_ENV]) ??
		normalizeTrumboEnvironment(env[TRUMBO_ENVIRONMENT_ENV]);
	if (explicit) {
		return explicit;
	}
	// Dev CLI launches use --conditions=development and/or TRUMBO_BUILD_ENV.
	if (env.TRUMBO_BUILD_ENV?.trim().toLowerCase() === "development") {
		return "local";
	}
	if (
		typeof process !== "undefined" &&
		hasDevelopmentBuildCondition(process.execArgv ?? [])
	) {
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
