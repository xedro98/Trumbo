import { getTrumboEnvironmentConfig } from "@trumbo/shared";
import type { ModelInfo } from "./types";

export interface TrumboRecommendedModelEntry {
	id: string;
	name?: string;
	description?: string;
}

export interface TrumboRecommendedModelsPayload {
	trumboPass?: TrumboRecommendedModelEntry[];
}

type ModelCapabilities = Pick<
	ModelInfo,
	"contextWindow" | "maxInputTokens" | "maxTokens" | "capabilities" | "pricing"
>;

const TRUMBO_PASS_PROVIDER_ID = "trumbo-pass";

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

function findORModelCapabilities(
	entry: TrumboRecommendedModelEntry,
	openRouterModels: Record<string, ModelInfo>,
): ModelCapabilities {
	if (!openRouterModels) {
		return TRUMBO_PASS_MODEL_DEFAULTS;
	}

	const modelSlug = entry.id.split("/").at(-1) ?? entry.id;

	return openRouterModels[modelSlug] || TRUMBO_PASS_MODEL_DEFAULTS;
}

// Trumbo-Pass models have only the model name (and not the lab),
// so we need to look-up using glm-5.1 instead of trumbo-pass/glm-5.1
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

export function normalizeTrumboRecommendedProviderModels(
	payload: TrumboRecommendedModelsPayload,
	openRouterModels: Record<string, ModelInfo>,
): Record<string, Record<string, ModelInfo>> {
	const trumboPass = payload.trumboPass ?? [];
	if (trumboPass.length === 0) {
		return {};
	}

	const models: Record<string, ModelInfo> = {};
	const openRouterModelsByName = buildModelsNameMap(openRouterModels);

	trumboPass.forEach((entry) => {
		const capabilities = findORModelCapabilities(entry, openRouterModelsByName);

		models[entry.id] = {
			// We should use the OR name, unless there is not one (like when using defaults)
			name: entry.name,
			...capabilities,
			id: entry.id,
			description: entry.description,
		};
	});

	if (Object.keys(models).length === 0) {
		return {};
	}

	return { [TRUMBO_PASS_PROVIDER_ID]: models };
}

export async function fetchTrumboRecommendedModelsPayload(
	fetcher: typeof fetch = fetch,
): Promise<TrumboRecommendedModelsPayload> {
	const url = `${getTrumboEnvironmentConfig().apiBaseUrl}/api/v1/ai/trumbo/recommended-models`;
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
