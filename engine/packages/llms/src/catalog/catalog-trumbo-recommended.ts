import { resolveTrumboApiBaseUrl } from "@trumbo/shared";
import type { ModelInfo } from "./types";

export interface TrumboRecommendedModelEntry {
	id: string;
	name?: string;
	description?: string;
}

export interface TrumboRecommendedModelsPayload {
	/** Fireworks-backed models for the `trumbo` provider (auth-only, no user API key). */
	trumbo?: TrumboRecommendedModelEntry[];
	trumboPass?: TrumboRecommendedModelEntry[];
}

type ModelCapabilities = Pick<
	ModelInfo,
	"contextWindow" | "maxInputTokens" | "maxTokens" | "capabilities" | "pricing"
>;

const TRUMBO_PASS_PROVIDER_ID = "trumbo-pass";
const TRUMBO_PROVIDER_ID = "trumbo";

const TRUMBO_PASS_MODEL_DEFAULTS = {
	contextWindow: 128_000,
	maxInputTokens: 128_000,
	maxTokens: 8_192,
	capabilities: ["tools", "reasoning", "temperature"],
	pricing: {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
	},
} as const satisfies ModelCapabilities;

// Trumbo-Pass models have only the model name (and not the lab),
// so we look-up using the model slug (e.g. glm-5.2) instead of the
// fully-qualified trumbo-pass/<model> id.
function buildModelsNameMap(
	openrouterModels: Record<string, ModelInfo>,
): Record<string, ModelInfo> {
	const nameMap: Record<string, ModelInfo> = {};

	for (const model of Object.values(openrouterModels)) {
		const modelSlugWithoutProvider = model.id.split("/").at(-1) ?? model.id;

		nameMap[modelSlugWithoutProvider] = model;
	}

	return nameMap;
}

function capabilityDefaultsFromCatalog(
	entry: TrumboRecommendedModelEntry,
	openRouterModels: Record<string, ModelInfo>,
): ModelCapabilities {
	const modelSlug = entry.id.split("/").at(-1) ?? entry.id;
	const match = openRouterModels[modelSlug];
	if (!match) {
		return TRUMBO_PASS_MODEL_DEFAULTS;
	}
	return {
		contextWindow: match.contextWindow,
		maxInputTokens: match.maxInputTokens,
		maxTokens: match.maxTokens,
		capabilities: match.capabilities,
		pricing: match.pricing,
	};
}

function buildProviderModelsFromEntries(
	entries: TrumboRecommendedModelEntry[],
	openRouterModels: Record<string, ModelInfo>,
): Record<string, ModelInfo> {
	const models: Record<string, ModelInfo> = {};
	const openRouterModelsByName = buildModelsNameMap(openRouterModels);

	entries.forEach((entry) => {
		const defaults = capabilityDefaultsFromCatalog(
			entry,
			openRouterModelsByName,
		);
		models[entry.id] = {
			...defaults,
			id: entry.id,
			name: entry.name?.trim() || entry.id.split("/").pop() || entry.id,
			description: entry.description,
		};
	});

	return models;
}

export function normalizeTrumboRecommendedProviderModels(
	payload: TrumboRecommendedModelsPayload,
	openRouterModels: Record<string, ModelInfo>,
): Record<string, Record<string, ModelInfo>> {
	const out: Record<string, Record<string, ModelInfo>> = {};

	const trumbo = payload.trumbo ?? [];
	if (trumbo.length > 0) {
		const models = buildProviderModelsFromEntries(trumbo, openRouterModels);
		if (Object.keys(models).length > 0) {
			out[TRUMBO_PROVIDER_ID] = models;
		}
	}

	const trumboPass = payload.trumboPass ?? [];
	if (trumboPass.length > 0) {
		const models = buildProviderModelsFromEntries(trumboPass, openRouterModels);
		if (Object.keys(models).length > 0) {
			out[TRUMBO_PASS_PROVIDER_ID] = models;
		}
	}

	return out;
}

export async function fetchTrumboRecommendedModelsPayload(
	fetcher: typeof fetch = fetch,
	apiBaseUrl?: string,
): Promise<TrumboRecommendedModelsPayload> {
	const url = `${resolveTrumboApiBaseUrl(apiBaseUrl)}/api/v1/ai/trumbo/recommended-models`;
	const response = await fetcher(url);
	if (!response.ok) {
		throw new Error(
			`Failed to load Trumbo recommended models from ${url}: HTTP ${response.status}`,
		);
	}

	return (await response.json()) as TrumboRecommendedModelsPayload;
}

export async function fetchTrumboRecommendedProviderModels(
	fetcher: typeof fetch = fetch,
	openRouterModels: Record<string, ModelInfo>,
): Promise<Record<string, Record<string, ModelInfo>>> {
	const payload = await fetchTrumboRecommendedModelsPayload(fetcher);
	return normalizeTrumboRecommendedProviderModels(payload, openRouterModels);
}
