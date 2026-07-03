import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { safeParseSettings, toProviderConfig } from "./provider-settings";

describe("provider settings", () => {
	const originalBuildEnv = process.env.TRUMBO_BUILD_ENV;

	beforeEach(() => {
		process.env.TRUMBO_BUILD_ENV = "development";
	});

	afterEach(() => {
		if (originalBuildEnv === undefined) {
			delete process.env.TRUMBO_BUILD_ENV;
		} else {
			process.env.TRUMBO_BUILD_ENV = originalBuildEnv;
		}
	});

	it("formats Trumbo OAuth access tokens for runtime API keys", () => {
		const config = toProviderConfig({
			provider: "trumbo",
			model: "anthropic/claude-sonnet-4.6",
			auth: {
				accessToken: "oauth-access-token",
			},
		});

		expect(config.apiKey).toBe("workos:oauth-access-token");
		expect(config.accessToken).toBe("oauth-access-token");
	});

	it("ignores persisted Trumbo placeholder base URLs when resolving chat endpoint", () => {
		const config = toProviderConfig({
			provider: "trumbo",
			model: "glm-5p2",
			baseUrl: "http://0.0.0.0:0/api/v1",
			auth: {
				accessToken: "oauth-access-token",
			},
		});

		expect(config.baseUrl).toBe("http://localhost:8787/api/v1");
	});

	it("accepts the Bedrock apikey authentication alias", () => {
		const result = safeParseSettings({
			provider: "bedrock",
			model: "anthropic.claude-sonnet-4-5-20250929-v1:0",
			aws: {
				authentication: "apikey",
				region: "us-east-1",
			},
		});

		expect(result.success).toBe(true);
		if (!result.success) {
			throw new Error("expected Bedrock apikey settings to parse");
		}

		expect(toProviderConfig(result.data).aws).toEqual(
			expect.objectContaining({
				authentication: "apikey",
			}),
		);
	});
});
