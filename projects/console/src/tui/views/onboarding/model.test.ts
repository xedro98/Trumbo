import { describe, expect, it } from "vitest";
import {
	getMainMenuOptions,
	getOAuthProviderLabel,
	shouldUseFeaturedTrumboModelPicker,
	toModelEntriesFromKnownModels,
	toModelEntry,
	toProviderEntry,
} from "./model";

describe("onboarding model helpers", () => {
	it("shows Sign in with Trumbo and never shows TrumboPass in the main menu", () => {
		expect(
			getMainMenuOptions().some((option) => option.value === "trumbo"),
		).toBe(true);
		expect(
			getMainMenuOptions().some((option) => option.value === "trumbo-pass"),
		).toBe(false);
		expect(
			getMainMenuOptions({ isTrumboPassEnabled: true }).some(
				(option) => option.value === "trumbo-pass",
			),
		).toBe(false);
	});

	it("maps provider catalog entries into onboarding provider entries", () => {
		expect(
			toProviderEntry({
				id: "trumbo",
				name: "Trumbo",
				apiKey: "",
				oauthAccessTokenPresent: true,
				models: 12,
				defaultModelId: "openai/gpt-5.3-codex",
			}),
		).toEqual({
			id: "trumbo",
			name: "Trumbo",
			isOAuth: true,
			isLocalAuth: false,
			hasAuth: true,
			models: 12,
			defaultModelId: "openai/gpt-5.3-codex",
		});
	});

	it("treats API key providers as authenticated when an API key exists", () => {
		expect(
			toProviderEntry({
				id: "anthropic",
				name: "Anthropic",
				apiKey: "sk-test",
				models: null,
			}),
		).toMatchObject({
			id: "anthropic",
			isOAuth: false,
			isLocalAuth: false,
			hasAuth: true,
			models: null,
		});
	});

	it("marks the OpenAI Codex CLI provider as local auth", () => {
		expect(
			toProviderEntry({
				id: "openai-codex-cli",
				name: "OpenAI Codex CLI",
				models: null,
			}),
		).toMatchObject({
			id: "openai-codex-cli",
			isOAuth: false,
			isLocalAuth: true,
		});
	});

	it("maps model names and reasoning support strictly", () => {
		expect(
			toModelEntry({
				id: "anthropic/claude-sonnet-4.6",
				supportsReasoning: false,
			}),
		).toEqual({
			id: "anthropic/claude-sonnet-4.6",
			name: "anthropic/claude-sonnet-4.6",
			supportsReasoning: false,
		});

		expect(
			toModelEntry({
				id: "openai/gpt-5.3-codex",
				name: "GPT-5.3 Codex",
				supportsReasoning: true,
			}),
		).toEqual({
			id: "openai/gpt-5.3-codex",
			name: "GPT-5.3 Codex",
			supportsReasoning: true,
		});
	});

	it("maps resolved known models into sorted onboarding model entries", () => {
		expect(
			toModelEntriesFromKnownModels({
				"gpt-5.2": {
					name: "GPT-5.2",
					capabilities: ["tools"],
				},
				"gpt-5.3-codex": {
					name: "GPT-5.3 Codex",
					capabilities: ["tools", "reasoning"],
				},
			}),
		).toEqual([
			{
				id: "gpt-5.2",
				name: "GPT-5.2",
				supportsReasoning: false,
			},
			{
				id: "gpt-5.3-codex",
				name: "GPT-5.3 Codex",
				supportsReasoning: true,
			},
		]);
	});

	it("formats OAuth provider labels for onboarding status views", () => {
		expect(getOAuthProviderLabel("trumbo")).toBe("Trumbo");
		expect(getOAuthProviderLabel("trumbo-pass")).toBe("TrumboPass");
		expect(getOAuthProviderLabel("openai-codex")).toBe("ChatGPT");
		expect(getOAuthProviderLabel("oca")).toBe("oca");
	});

	it("uses the featured Trumbo model picker only for the Trumbo provider", () => {
		expect(shouldUseFeaturedTrumboModelPicker("trumbo")).toBe(true);
		expect(shouldUseFeaturedTrumboModelPicker("trumbo-pass")).toBe(false);
		expect(shouldUseFeaturedTrumboModelPicker("anthropic")).toBe(false);
	});
});
