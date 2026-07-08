import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRUMBO_BUILD_ENV_ENV } from "./build-env";
import {
	DEFAULT_TRUMBO_ENVIRONMENT,
	getTrumboEnvironmentConfig,
	resolveTrumboApiBaseUrl,
	resolveTrumboEnvironment,
	resolveTrumboProviderBaseUrl,
	TRUMBO_ENVIRONMENT_ENV,
	TRUMBO_ENVIRONMENT_OVERRIDE_ENV,
	TRUMBO_ENVIRONMENTS,
} from "./trumbo-environment";

const ENV_KEYS = [
	TRUMBO_ENVIRONMENT_ENV,
	TRUMBO_ENVIRONMENT_OVERRIDE_ENV,
	TRUMBO_BUILD_ENV_ENV,
	"TRUMBO_API_BASE_URL",
] as const;

const originalEnvValues = Object.fromEntries(
	ENV_KEYS.map((key) => [key, process.env[key]]),
);
const originalExecArgv = process.execArgv;

beforeEach(() => {
	vi.unstubAllGlobals();
	for (const key of ENV_KEYS) {
		delete process.env[key];
	}
	Object.defineProperty(process, "execArgv", {
		configurable: true,
		value: [],
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	for (const key of ENV_KEYS) {
		const value = originalEnvValues[key];
		if (typeof value === "string") {
			process.env[key] = value;
		} else {
			delete process.env[key];
		}
	}
	Object.defineProperty(process, "execArgv", {
		configurable: true,
		value: originalExecArgv,
	});
});

describe("resolveTrumboEnvironment", () => {
	it("defaults to local in development builds when TRUMBO_ENVIRONMENT is unset", () => {
		process.env[TRUMBO_BUILD_ENV_ENV] = "development";
		expect(resolveTrumboEnvironment()).toBe("local");
	});

	it("defaults to local when launched with --conditions=development", () => {
		const originalExecArgv = process.execArgv;
		Object.defineProperty(process, "execArgv", {
			configurable: true,
			value: ["--conditions=development"],
		});
		try {
			expect(resolveTrumboEnvironment()).toBe("local");
		} finally {
			Object.defineProperty(process, "execArgv", {
				configurable: true,
				value: originalExecArgv,
			});
		}
	});

	it("defaults to production when no env var is set", () => {
		expect(resolveTrumboEnvironment()).toBe(DEFAULT_TRUMBO_ENVIRONMENT);
	});

	it("reads TRUMBO_ENVIRONMENT from process.env", () => {
		process.env[TRUMBO_ENVIRONMENT_ENV] = "staging";
		expect(resolveTrumboEnvironment()).toBe("staging");

		process.env[TRUMBO_ENVIRONMENT_ENV] = "local";
		expect(resolveTrumboEnvironment()).toBe("local");
	});

	it("prefers TRUMBO_ENVIRONMENT_OVERRIDE over TRUMBO_ENVIRONMENT", () => {
		process.env[TRUMBO_ENVIRONMENT_OVERRIDE_ENV] = "local";
		process.env[TRUMBO_ENVIRONMENT_ENV] = "staging";

		expect(resolveTrumboEnvironment()).toBe("local");
	});

	it("normalizes case and surrounding whitespace", () => {
		process.env[TRUMBO_ENVIRONMENT_ENV] = "  STAGING  ";

		expect(resolveTrumboEnvironment()).toBe("staging");
	});

	it("ignores unknown values and falls through to the next source", () => {
		process.env[TRUMBO_ENVIRONMENT_OVERRIDE_ENV] = "qa";
		process.env[TRUMBO_ENVIRONMENT_ENV] = "staging";
		expect(resolveTrumboEnvironment()).toBe("staging");

		delete process.env[TRUMBO_ENVIRONMENT_OVERRIDE_ENV];
		process.env[TRUMBO_ENVIRONMENT_ENV] = "qa";
		expect(resolveTrumboEnvironment()).toBe(DEFAULT_TRUMBO_ENVIRONMENT);
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(resolveTrumboEnvironment()).toBe(DEFAULT_TRUMBO_ENVIRONMENT);
	});
});

describe("resolveTrumboApiBaseUrl", () => {
	it("ignores persisted placeholder URLs and uses the active environment", () => {
		process.env[TRUMBO_BUILD_ENV_ENV] = "development";
		expect(resolveTrumboApiBaseUrl("http://0.0.0.0:0/api/v1")).toBe(
			"http://localhost:8787",
		);
	});

	it("uses a valid persisted provider base URL", () => {
		expect(resolveTrumboApiBaseUrl("http://127.0.0.1:9000/api/v1")).toBe(
			"http://127.0.0.1:9000",
		);
	});

	it("ignores a stale local-dev base URL in production and uses the production default", () => {
		expect(resolveTrumboApiBaseUrl("http://localhost:8787/api/v1")).toBe(
			"https://platform.trumbo.dev",
		);
		expect(resolveTrumboApiBaseUrl("http://localhost:8787")).toBe(
			"https://platform.trumbo.dev",
		);
	});

	it("ignores persisted production URLs in local dev builds", () => {
		process.env[TRUMBO_BUILD_ENV_ENV] = "development";
		expect(resolveTrumboApiBaseUrl("https://platform.trumbo.dev/api/v1")).toBe(
			"http://localhost:8787",
		);
		expect(
			resolveTrumboProviderBaseUrl("https://platform.trumbo.dev/api/v1"),
		).toBe("http://localhost:8787/api/v1");
	});

	it("uses localhost:5173 for the local app UI and :8787 for the API", () => {
		expect(TRUMBO_ENVIRONMENTS.local).toMatchObject({
			appBaseUrl: "http://localhost:5173",
			apiBaseUrl: "http://localhost:8787",
		});
	});
});

describe("resolveTrumboProviderBaseUrl", () => {
	it("returns the OpenAI-compatible chat endpoint for local dev", () => {
		process.env[TRUMBO_BUILD_ENV_ENV] = "development";
		expect(resolveTrumboProviderBaseUrl("http://0.0.0.0:0/api/v1")).toBe(
			"http://localhost:8787/api/v1",
		);
	});

	it("ignores a stale local-dev base URL persisted from a prior local session in production", () => {
		// Default env is production. A localhost:8787 base URL leaked into
		// providers.json from a TRUMBO_ENVIRONMENT=local session must NOT be
		// reused in production, or production JWTs get sent to a local
		// wrangler-dev server that rejects them with 401.
		expect(resolveTrumboProviderBaseUrl("http://localhost:8787/api/v1")).toBe(
			"https://platform.trumbo.dev/api/v1",
		);
		expect(resolveTrumboProviderBaseUrl("http://localhost:8787")).toBe(
			"https://platform.trumbo.dev/api/v1",
		);
	});

	it("still honors an explicit non-local override in production", () => {
		expect(resolveTrumboProviderBaseUrl("http://127.0.0.1:9000/api/v1")).toBe(
			"http://127.0.0.1:9000/api/v1",
		);
	});
});

describe("getTrumboEnvironmentConfig", () => {
	it("returns the config for an explicit environment", () => {
		expect(getTrumboEnvironmentConfig("staging")).toBe(
			TRUMBO_ENVIRONMENTS.staging,
		);
		expect(getTrumboEnvironmentConfig("local")).toBe(TRUMBO_ENVIRONMENTS.local);
		expect(getTrumboEnvironmentConfig("production")).toBe(
			TRUMBO_ENVIRONMENTS.production,
		);
	});

	it("falls back to production by default", () => {
		expect(getTrumboEnvironmentConfig()).toBe(TRUMBO_ENVIRONMENTS.production);
	});

	it("uses the resolved process.env environment when no explicit environment is provided", () => {
		process.env[TRUMBO_ENVIRONMENT_ENV] = "staging";

		expect(getTrumboEnvironmentConfig()).toBe(TRUMBO_ENVIRONMENTS.staging);
	});

	it("applies TRUMBO_API_BASE_URL without mutating the catalog config", () => {
		process.env.TRUMBO_API_BASE_URL = "http://127.0.0.1:3000";

		expect(getTrumboEnvironmentConfig("local")).toEqual({
			...TRUMBO_ENVIRONMENTS.local,
			apiBaseUrl: "http://127.0.0.1:3000",
			mcpBaseUrl: "http://127.0.0.1:3000/v1/mcp",
		});
		expect(TRUMBO_ENVIRONMENTS.local.apiBaseUrl).toBe("http://localhost:8787");
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(getTrumboEnvironmentConfig()).toBe(TRUMBO_ENVIRONMENTS.production);
	});
});

describe("TRUMBO_ENVIRONMENTS catalog", () => {
	it("exposes an environment field that matches its key", () => {
		for (const [key, config] of Object.entries(TRUMBO_ENVIRONMENTS)) {
			expect(config.environment).toBe(key);
		}
	});

	it("populates appBaseUrl, apiBaseUrl, and mcpBaseUrl for every environment", () => {
		for (const config of Object.values(TRUMBO_ENVIRONMENTS)) {
			expect(config.appBaseUrl).toMatch(/^https?:\/\//);
			expect(config.apiBaseUrl).toMatch(/^https?:\/\//);
			expect(config.mcpBaseUrl).toMatch(/^https?:\/\//);
		}
	});
});
