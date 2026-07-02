export const TREMBO_ENVIRONMENT_ENV = "TREMBO_ENVIRONMENT";
export const TREMBO_ENVIRONMENT_OVERRIDE_ENV = "TREMBO_ENVIRONMENT_OVERRIDE";

export type TremboEnvironment = "production" | "staging" | "local";

export interface TremboEnvironmentConfig {
	readonly environment: TremboEnvironment;
	readonly appBaseUrl: string;
	readonly apiBaseUrl: string;
	readonly mcpBaseUrl: string;
	readonly workOsClientId: string;
}

export const TREMBO_ENVIRONMENTS: Readonly<
	Record<TremboEnvironment, TremboEnvironmentConfig>
> = {
	production: {
		environment: "production",
		// External Trembo backend endpoints are intentionally disabled. These
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

export const DEFAULT_TREMBO_ENVIRONMENT: TremboEnvironment = "production";

export interface ResolveTremboEnvironmentOptions {
	env?: Partial<NodeJS.ProcessEnv>;
}

function normalizeTremboEnvironment(
	value: string | undefined,
): TremboEnvironment | undefined {
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
	// from the browser entry of `@trembo/shared`). Treat its absence as "no
	// env vars set" so callers always get a deterministic default.
	if (typeof process === "undefined" || !process?.env) {
		return {};
	}
	return process.env;
}

export function resolveTremboEnvironment(): TremboEnvironment {
	const env = readProcessEnv();
	return (
		normalizeTremboEnvironment(env[TREMBO_ENVIRONMENT_OVERRIDE_ENV]) ??
		normalizeTremboEnvironment(env[TREMBO_ENVIRONMENT_ENV]) ??
		DEFAULT_TREMBO_ENVIRONMENT
	);
}

function getEnvConfig(env?: TremboEnvironment) {
	if (typeof env === "string") {
		return TREMBO_ENVIRONMENTS[env];
	}
	return TREMBO_ENVIRONMENTS[resolveTremboEnvironment()];
}

function applyConfigOverrides(
	config: TremboEnvironmentConfig,
	env: NodeJS.ProcessEnv,
): TremboEnvironmentConfig {
	if (env.TREMBO_API_BASE_URL) {
		config = {
			...config,
			apiBaseUrl: env.TREMBO_API_BASE_URL,
			mcpBaseUrl: `${env.TREMBO_API_BASE_URL}/v1/mcp`,
		};
	}

	return config;
}

export function getTremboEnvironmentConfig(
	env?: TremboEnvironment,
): TremboEnvironmentConfig {
	const config = getEnvConfig(env);

	return applyConfigOverrides(config, readProcessEnv());
}
