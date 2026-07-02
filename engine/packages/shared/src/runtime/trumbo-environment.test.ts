import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_TRUMBO_ENVIRONMENT,
	getTrumboEnvironmentConfig,
	resolveTrumboEnvironment,
	TRUMBO_ENVIRONMENT_ENV,
	TRUMBO_ENVIRONMENT_OVERRIDE_ENV,
	TRUMBO_ENVIRONMENTS,
} from "./trumbo-environment";

const ENV_KEYS = [
	TRUMBO_ENVIRONMENT_ENV,
	TRUMBO_ENVIRONMENT_OVERRIDE_ENV,
	"TRUMBO_API_BASE_URL",
] as const;

const originalEnvValues = Object.fromEntries(
	ENV_KEYS.map((key) => [key, process.env[key]]),
);

beforeEach(() => {
	vi.unstubAllGlobals();
	for (const key of ENV_KEYS) {
		delete process.env[key];
	}
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
});

describe("resolveTrumboEnvironment", () => {
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
		expect(TRUMBO_ENVIRONMENTS.local.apiBaseUrl).toBe("http://localhost:7777");
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
