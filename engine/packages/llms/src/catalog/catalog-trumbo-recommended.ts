import { resolveTrumboApiBaseUrl } from "@trumbodev/shared";
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

/**
 * Trumbo Quartz — the public frontier model family. Users see three model ids
 * (`quartz` / `quartz-lite` / `quartz-hyper`); the platform routes each turn to
 * the right backing model server-side. These stable model facts live here (per
 * the @trumbodev/llms AGENTS rule: known-model facts belong in ModelInfo, not a
 * new registry) and are merged into both the bundled `trumbo` provider factory
 * baseline and the runtime-fetched recommended-models payload.
 */
export const QUARTZ_MODEL_FACTS: Record<string, ModelInfo> = {
	quartz: {
		id: "quartz",
		name: "Quartz 1.0",
		description:
			"Adaptive reasoning model that scales compute to the complexity of each request.",
		contextWindow: 256_000,
		maxInputTokens: 256_000,
		maxTokens: 32_768,
		capabilities: [
			"tools",
			"reasoning",
			"reasoning-effort",
			"streaming",
			"temperature",
			"prompt-cache",
		],
		pricing: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		metadata: { reasoningDefaultOn: true },
	},
	"quartz-lite": {
		id: "quartz-lite",
		name: "Quartz 1.0 Lite",
		description:
			"Fast and economical Quartz variant for everyday agent loops and inline edits.",
		contextWindow: 128_000,
		maxInputTokens: 128_000,
		maxTokens: 16_384,
		capabilities: [
			"tools",
			"reasoning",
			"reasoning-effort",
			"streaming",
			"temperature",
			"prompt-cache",
		],
		pricing: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		metadata: { reasoningDefaultOn: false },
	},
	"quartz-hyper": {
		id: "quartz-hyper",
		name: "Quartz 1.0 Hyper",
		description:
			"Flagship Quartz variant for maximum reasoning depth on hard engineering and research. Max/Ultra plans.",
		contextWindow: 1_000_000,
		maxInputTokens: 1_000_000,
		maxTokens: 65_536,
		capabilities: [
			"tools",
			"reasoning",
			"reasoning-effort",
			"streaming",
			"temperature",
			"prompt-cache",
		],
		pricing: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		metadata: { reasoningDefaultOn: true },
	},
};

/** Public Quartz model ids in display order (adaptive default first). */
export const QUARTZ_MODEL_IDS: readonly string[] = [
	"quartz",
	"quartz-lite",
	"quartz-hyper",
];

export function isQuartzModelId(id: string): boolean {
	return id in QUARTZ_MODEL_FACTS;
}

/** Bundled baseline emitted by the `trumbo` provider factory (always available,
 * even before the platform catalog loads). */
export function buildQuartzModelInfos(): Record<string, ModelInfo> {
	const out: Record<string, ModelInfo> = {};
	for (const id of QUARTZ_MODEL_IDS) {
		const facts = QUARTZ_MODEL_FACTS[id];
		if (facts) {
			out[id] = { ...facts };
		}
	}
	return out;
}

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
		const quartzFacts = QUARTZ_MODEL_FACTS[entry.id];
		models[entry.id] = {
			...defaults,
			...(quartzFacts ?? {}),
			id: entry.id,
			name:
				entry.name?.trim() ||
				quartzFacts?.name ||
				entry.id.split("/").pop() ||
				entry.id,
			description: entry.description ?? quartzFacts?.description,
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
