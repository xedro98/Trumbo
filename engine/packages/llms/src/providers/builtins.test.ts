import { TRUMBO_ENVIRONMENT_ENV, TRUMBO_ENVIRONMENTS } from "@trumbo/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BUILTIN_SPECS } from "./builtins";
import { getModelsForProvider, getProvider } from "./model-registry";

function findTrumboSpec() {
	const spec = BUILTIN_SPECS.find((s) => s.id === "trumbo");
	if (!spec) {
		throw new Error("trumbo builtin spec not found");
	}
	return spec;
}

describe("trumbo builtin spec defaults.baseUrl", () => {
	const originalEnvironment = process.env[TRUMBO_ENVIRONMENT_ENV];
	const originalExecArgv = process.execArgv;

	beforeEach(() => {
		delete process.env[TRUMBO_ENVIRONMENT_ENV];
		Object.defineProperty(process, "execArgv", {
			configurable: true,
			value: [],
		});
	});

	afterEach(() => {
		if (originalEnvironment === undefined) {
			delete process.env[TRUMBO_ENVIRONMENT_ENV];
		} else {
			process.env[TRUMBO_ENVIRONMENT_ENV] = originalEnvironment;
		}
		Object.defineProperty(process, "execArgv", {
			configurable: true,
			value: originalExecArgv,
		});
	});

	it("re-resolves baseUrl when TRUMBO_ENVIRONMENT changes between reads", () => {
		const spec = findTrumboSpec();

		expect(spec.defaults?.baseUrl).toBe(
			`${TRUMBO_ENVIRONMENTS.production.apiBaseUrl}/api/v1`,
		);

		process.env[TRUMBO_ENVIRONMENT_ENV] = "staging";
		expect(spec.defaults?.baseUrl).toBe(
			`${TRUMBO_ENVIRONMENTS.staging.apiBaseUrl}/api/v1`,
		);

		process.env[TRUMBO_ENVIRONMENT_ENV] = "local";
		expect(spec.defaults?.baseUrl).toBe(
			`${TRUMBO_ENVIRONMENTS.local.apiBaseUrl}/api/v1`,
		);

		delete process.env[TRUMBO_ENVIRONMENT_ENV];
		expect(spec.defaults?.baseUrl).toBe(
			`${TRUMBO_ENVIRONMENTS.production.apiBaseUrl}/api/v1`,
		);
	});
});

describe("trumbo builtin models", () => {
	it("does not bundle the OpenRouter catalog (Fireworks list is loaded live)", async () => {
		const models = await getModelsForProvider("trumbo");
		expect(models["poolside/laguna-xs.2"]).toBeUndefined();
		expect(models["anthropic/claude-sonnet-4.6"]).toBeUndefined();
	});
});

describe("trumbo-pass builtin spec", () => {
	const originalExecArgv = process.execArgv;
	const originalEnvironment = process.env[TRUMBO_ENVIRONMENT_ENV];
	const originalBuildEnv = process.env.TRUMBO_BUILD_ENV;
	const originalApiBaseUrl = process.env.TRUMBO_API_BASE_URL;
	const originalAppUrl = process.env.TRUMBO_APP_URL;
	const originalEnvironmentOverride = process.env.TRUMBO_ENVIRONMENT_OVERRIDE;

	beforeEach(() => {
		delete process.env.TRUMBO_BUILD_ENV;
		delete process.env.TRUMBO_API_BASE_URL;
		delete process.env.TRUMBO_APP_URL;
		delete process.env.TRUMBO_ENVIRONMENT_OVERRIDE;
		process.env[TRUMBO_ENVIRONMENT_ENV] = "production";
		Object.defineProperty(process, "execArgv", {
			configurable: true,
			value: [],
		});
	});

	afterEach(() => {
		if (originalEnvironment === undefined) {
			delete process.env[TRUMBO_ENVIRONMENT_ENV];
		} else {
			process.env[TRUMBO_ENVIRONMENT_ENV] = originalEnvironment;
		}
		if (originalBuildEnv === undefined) {
			delete process.env.TRUMBO_BUILD_ENV;
		} else {
			process.env.TRUMBO_BUILD_ENV = originalBuildEnv;
		}
		if (originalApiBaseUrl === undefined) {
			delete process.env.TRUMBO_API_BASE_URL;
		} else {
			process.env.TRUMBO_API_BASE_URL = originalApiBaseUrl;
		}
		if (originalAppUrl === undefined) {
			delete process.env.TRUMBO_APP_URL;
		} else {
			process.env.TRUMBO_APP_URL = originalAppUrl;
		}
		if (originalEnvironmentOverride === undefined) {
			delete process.env.TRUMBO_ENVIRONMENT_OVERRIDE;
		} else {
			process.env.TRUMBO_ENVIRONMENT_OVERRIDE = originalEnvironmentOverride;
		}
		Object.defineProperty(process, "execArgv", {
			configurable: true,
			value: originalExecArgv,
		});
	});

	it("registers a distinct Trumbo-compatible provider with a custom model list", async () => {
		const models = await getModelsForProvider("trumbo-pass");
		const provider = await getProvider("trumbo-pass");

		expect(provider).toMatchObject({
			id: "trumbo-pass",
			name: "TrumboPass",
			baseUrl: `${TRUMBO_ENVIRONMENTS.production.apiBaseUrl}/api/v1`,
			client: "openai-compatible",
			capabilities: expect.arrayContaining([
				"oauth",
				"tools",
				"reasoning",
				"prompt-cache",
			]),
		});
		expect(models).toHaveProperty(provider?.defaultModelId ?? "");
		expect(Object.keys(models).length).toBeGreaterThan(0);
		for (const model of Object.values(models)) {
			expect(model.contextWindow).toBeGreaterThan(0);
			expect(model.maxInputTokens).toBeGreaterThan(0);
			expect(model.maxTokens).toBeGreaterThan(0);
			expect(model.capabilities).toEqual(expect.arrayContaining(["tools"]));
			expect(model.pricing).toBeDefined();
		}
	});
});

describe("built-in provider metadata", () => {
	it("marks popular providers with a provider capability and rank", async () => {
		await expect(getProvider("trumbo")).resolves.toMatchObject({
			name: "Trumbo Usage-Billing",
			capabilities: expect.arrayContaining(["popular"]),
			metadata: { popularRank: 1 },
		});
		await expect(getProvider("zai")).resolves.not.toMatchObject({
			capabilities: expect.arrayContaining(["popular"]),
		});
	});

	it("uses the current Hugging Face router endpoint", async () => {
		await expect(getProvider("huggingface")).resolves.toMatchObject({
			baseUrl: "https://router.huggingface.co/v1",
		});
	});

	it("derives ChatGPT subscription models from the generated OpenAI catalog", async () => {
		const chatGptModels = await getModelsForProvider("openai-codex");
		const openAiModels = await getModelsForProvider("openai-native");
		const modelIds = Object.keys(chatGptModels);

		expect(modelIds).toEqual(
			expect.arrayContaining([
				"gpt-5.5",
				"gpt-5.5-pro",
				"gpt-5.4",
				"gpt-5.4-mini",
			]),
		);
		expect(modelIds).not.toContain("gpt-5.1-codex-max");
		expect(modelIds).not.toContain("gpt-5.2");
		expect(modelIds).not.toContain("gpt-5.2-codex");
		expect(modelIds).not.toContain("gpt-5.3-codex");
		expect(modelIds).not.toContain("gpt-5.3-codex-spark");
		expect(modelIds).not.toContain("gpt-5.4-nano");
		expect(modelIds).not.toContain("o3");
		expect(chatGptModels["gpt-5.5"]).toEqual(
			expect.objectContaining({
				...openAiModels["gpt-5.5"],
				maxInputTokens: 272_000,
				contextWindow: 400_000,
			}),
		);
		expect(chatGptModels["gpt-5.4"]).toEqual(
			expect.objectContaining({
				name: "GPT-5.4",
				maxInputTokens: expect.any(Number),
				contextWindow: expect.any(Number),
			}),
		);
	});

	it("routes native Z.AI providers through GLM thinking metadata", async () => {
		for (const providerId of ["zai", "zai-coding-plan"] as const) {
			await expect(getProvider(providerId)).resolves.toMatchObject({
				metadata: {
					routing: {
						reasoning: {
							format: "glm-thinking",
						},
					},
				},
			});

			const models = Object.values(await getModelsForProvider(providerId));
			expect(models.length).toBeGreaterThan(0);
			for (const model of models) {
				expect(model.family?.startsWith("glm")).toBe(true);
			}
		}
	});

	it("routes direct MiniMax M3 through MiniMax thinking metadata", async () => {
		await expect(getProvider("minimax")).resolves.toMatchObject({
			metadata: {
				routing: {
					reasoning: {
						format: "minimax-thinking",
						routes: [
							expect.objectContaining({
								matcher: "model-id",
								modelId: "MiniMax-M3",
							}),
						],
					},
				},
			},
		});
	});
});
