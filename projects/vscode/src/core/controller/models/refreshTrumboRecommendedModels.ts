import { FALLBACK_TRUMBO_RECOMMENDED_MODELS, fetchTrumboRecommendedModels } from "@trumbo/core"
import { TrumboEnv } from "@/config"
import { fetch } from "@/shared/net"

interface TrumboRecommendedModelData {
	id: string
	name: string
	description: string
	tags: string[]
}

export interface TrumboRecommendedModelsData {
	recommended: TrumboRecommendedModelData[]
	free: TrumboRecommendedModelData[]
	trumboPass?: TrumboRecommendedModelData[]
}

const RECOMMENDED_MODELS_CACHE_TTL_MS = 60 * 60 * 1000

let pendingRefresh: Promise<TrumboRecommendedModelsData> | null = null
let inMemoryCache: { data: TrumboRecommendedModelsData; timestamp: number } | null = null

export async function refreshTrumboRecommendedModels(): Promise<TrumboRecommendedModelsData> {
	if (inMemoryCache && Date.now() - inMemoryCache.timestamp <= RECOMMENDED_MODELS_CACHE_TTL_MS) {
		return inMemoryCache.data
	}

	if (pendingRefresh) {
		return pendingRefresh
	}

	pendingRefresh = (async () => {
		try {
			return await fetchAndCacheTrumboRecommendedModels()
		} finally {
			pendingRefresh = null
		}
	})()

	return pendingRefresh
}

export function resetTrumboRecommendedModelsCacheForTests(): void {
	pendingRefresh = null
	inMemoryCache = null
}

function isFallbackRecommendedModels(data: TrumboRecommendedModelsData): boolean {
	return JSON.stringify(data) === JSON.stringify(FALLBACK_TRUMBO_RECOMMENDED_MODELS)
}

async function fetchAndCacheTrumboRecommendedModels(): Promise<TrumboRecommendedModelsData> {
	// Delegate the actual HTTP fetch + response normalization + offline fallback
	// to the SDK so the CLI/JetBrains and the extension share one implementation.
	// We pass the proxy-aware fetch (per .trumborules/network.md) and the
	// extension's configured API base URL. On failure the SDK returns its own
	// fallback list.
	const result = await fetchTrumboRecommendedModels({
		baseUrl: TrumboEnv.config().apiBaseUrl,
		fetchImpl: fetch,
	})

	// Only pin a populated, non-fallback result in memory for the full TTL; a
	// transient failure (SDK returns a clone of its fallback) should be retried
	// next call.
	if ((result.recommended.length > 0 || result.free.length > 0) && !isFallbackRecommendedModels(result)) {
		inMemoryCache = { data: result, timestamp: Date.now() }
	}
	return result
}
