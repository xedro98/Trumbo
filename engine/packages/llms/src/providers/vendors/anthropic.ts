import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import type {
	GatewayProviderContext,
	GatewayResolvedProviderConfig,
} from "@trumbodev/shared";
import { wrapLanguageModel } from "ai";
import { readEnv, resolveApiKey } from "../http";
import {
	createMiniMaxThinkingFetch,
	miniMaxThinkingDisabledMiddleware,
} from "./minimax-thinking";
import type { ProviderFactoryResult } from "./types";

export async function createAnthropicProviderModule(
	config: GatewayResolvedProviderConfig,
	context: GatewayProviderContext,
): Promise<ProviderFactoryResult> {
	const apiKey = await resolveApiKey(config);
	// ANTHROPIC_BEARER_TOKEN authenticates via `Authorization: Bearer` instead
	// of (or alongside) the standard `x-api-key` header. Used by
	// Anthropic-compatible gateways that issue bearer tokens rather than raw
	// API keys. When present it is also passed as `apiKey` so the underlying
	// SDK is satisfied (it requires a non-empty key); the bearer header is what
	// the gateway actually validates.
	const bearerToken = readEnv("ANTHROPIC_BEARER_TOKEN");
	const headers = bearerToken
		? { ...config.headers, Authorization: `Bearer ${bearerToken}` }
		: config.headers;
	const isMiniMax = context.provider.id === "minimax";
	const provider = createAnthropic({
		apiKey: bearerToken ?? apiKey,
		baseURL: config.baseUrl,
		headers,
		fetch: isMiniMax ? createMiniMaxThinkingFetch(config.fetch) : config.fetch,
		name: context.provider.id,
	});
	return {
		model: (modelId) => {
			const model = provider(modelId);
			return isMiniMax
				? wrapLanguageModel({
						model: model as LanguageModelV3,
						middleware: miniMaxThinkingDisabledMiddleware,
					})
				: model;
		},
	};
}
