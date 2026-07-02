import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	TREMBO_ENVIRONMENT_ENV,
	TREMBO_ENVIRONMENT_OVERRIDE_ENV,
	TREMBO_ENVIRONMENTS,
	DEFAULT_TREMBO_ENVIRONMENT,
	getTremboEnvironmentConfig,
	resolveTremboEnvironment,
} from "./trembo-environment";

const ENV_KEYS = [
	TREMBO_ENVIRONMENT_ENV,
	TREMBO_ENVIRONMENT_OVERRIDE_ENV,
	"TREMBO_API_BASE_URL",
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

describe("resolveTremboEnvironment", () => {
	it("defaults to production when no env var is set", () => {
		expect(resolveTremboEnvironment()).toBe(DEFAULT_TREMBO_ENVIRONMENT);
	});

	it("reads TREMBO_ENVIRONMENT from process.env", () => {
		process.env[TREMBO_ENVIRONMENT_ENV] = "staging";
		expect(resolveTremboEnvironment()).toBe("staging");

		process.env[TREMBO_ENVIRONMENT_ENV] = "local";
		expect(resolveTremboEnvironment()).toBe("local");
	});

	it("prefers TREMBO_ENVIRONMENT_OVERRIDE over TREMBO_ENVIRONMENT", () => {
		process.env[TREMBO_ENVIRONMENT_OVERRIDE_ENV] = "local";
		process.env[TREMBO_ENVIRONMENT_ENV] = "staging";

		expect(resolveTremboEnvironment()).toBe("local");
	});

	it("normalizes case and surrounding whitespace", () => {
		process.env[TREMBO_ENVIRONMENT_ENV] = "  STAGING  ";

		expect(resolveTremboEnvironment()).toBe("staging");
	});

	it("ignores unknown values and falls through to the next source", () => {
		process.env[TREMBO_ENVIRONMENT_OVERRIDE_ENV] = "qa";
		process.env[TREMBO_ENVIRONMENT_ENV] = "staging";
		expect(resolveTremboEnvironment()).toBe("staging");

		delete process.env[TREMBO_ENVIRONMENT_OVERRIDE_ENV];
		process.env[TREMBO_ENVIRONMENT_ENV] = "qa";
		expect(resolveTremboEnvironment()).toBe(DEFAULT_TREMBO_ENVIRONMENT);
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(resolveTremboEnvironment()).toBe(DEFAULT_TREMBO_ENVIRONMENT);
	});
});

describe("getTremboEnvironmentConfig", () => {
	it("returns the config for an explicit environment", () => {
		expect(getTremboEnvironmentConfig("staging")).toBe(
			TREMBO_ENVIRONMENTS.staging,
		);
		expect(getTremboEnvironmentConfig("local")).toBe(TREMBO_ENVIRONMENTS.local);
		expect(getTremboEnvironmentConfig("production")).toBe(
			TREMBO_ENVIRONMENTS.production,
		);
	});

	it("falls back to production by default", () => {
		expect(getTremboEnvironmentConfig()).toBe(TREMBO_ENVIRONMENTS.production);
	});

	it("uses the resolved process.env environment when no explicit environment is provided", () => {
		process.env[TREMBO_ENVIRONMENT_ENV] = "staging";

		expect(getTremboEnvironmentConfig()).toBe(TREMBO_ENVIRONMENTS.staging);
	});

	it("applies TREMBO_API_BASE_URL without mutating the catalog config", () => {
		process.env.TREMBO_API_BASE_URL = "http://127.0.0.1:3000";

		expect(getTremboEnvironmentConfig("local")).toEqual({
			...TREMBO_ENVIRONMENTS.local,
			apiBaseUrl: "http://127.0.0.1:3000",
			mcpBaseUrl: "http://127.0.0.1:3000/v1/mcp",
		});
		expect(TREMBO_ENVIRONMENTS.local.apiBaseUrl).toBe("http://localhost:7777");
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(getTremboEnvironmentConfig()).toBe(TREMBO_ENVIRONMENTS.production);
	});
});

describe("TREMBO_ENVIRONMENTS catalog", () => {
	it("exposes an environment field that matches its key", () => {
		for (const [key, config] of Object.entries(TREMBO_ENVIRONMENTS)) {
			expect(config.environment).toBe(key);
		}
	});

	it("populates appBaseUrl, apiBaseUrl, and mcpBaseUrl for every environment", () => {
		for (const config of Object.values(TREMBO_ENVIRONMENTS)) {
			expect(config.appBaseUrl).toMatch(/^https?:\/\//);
			expect(config.apiBaseUrl).toMatch(/^https?:\/\//);
			expect(config.mcpBaseUrl).toMatch(/^https?:\/\//);
		}
	});
});
