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
		// External Trumbo backend endpoints are intentionally disabled. These
		// pointed at the upstream-hosted auth/API/MCP service; pointing them at
		// a dead local address makes any call fail fast instead of reaching an
		// external host. Bring-your-own-key providers are unaffected.
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
		appBaseUrl: "http://localhost:3000",
		apiBaseUrl: "http://localhost:7777",
		mcpBaseUrl: "http://localhost:7777/v1/mcp",
		workOsClientId: "",
	},
};

export const DEFAULT_TRUMBO_ENVIRONMENT: TrumboEnvironment = "production";

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

export function resolveTrumboEnvironment(): TrumboEnvironment {
	const env = readProcessEnv();
	return (
		normalizeTrumboEnvironment(env[TRUMBO_ENVIRONMENT_OVERRIDE_ENV]) ??
		normalizeTrumboEnvironment(env[TRUMBO_ENVIRONMENT_ENV]) ??
		DEFAULT_TRUMBO_ENVIRONMENT
	);
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
	if (env.TRUMBO_API_BASE_URL) {
		config = {
			...config,
			apiBaseUrl: env.TRUMBO_API_BASE_URL,
			mcpBaseUrl: `${env.TRUMBO_API_BASE_URL}/v1/mcp`,
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
