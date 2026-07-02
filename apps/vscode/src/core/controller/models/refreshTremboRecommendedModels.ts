import { FALLBACK_TREMBO_RECOMMENDED_MODELS, fetchTremboRecommendedModels } from "@trembo/core"
import { TremboEnv } from "@/config"
import { fetch } from "@/shared/net"

interface TremboRecommendedModelData {
	id: string
	name: string
	description: string
	tags: string[]
}

export interface TremboRecommendedModelsData {
	recommended: TremboRecommendedModelData[]
	free: TremboRecommendedModelData[]
	tremboPass?: TremboRecommendedModelData[]
}

const RECOMMENDED_MODELS_CACHE_TTL_MS = 60 * 60 * 1000

let pendingRefresh: Promise<TremboRecommendedModelsData> | null = null
let inMemoryCache: { data: TremboRecommendedModelsData; timestamp: number } | null = null

export async function refreshTremboRecommendedModels(): Promise<TremboRecommendedModelsData> {
	if (inMemoryCache && Date.now() - inMemoryCache.timestamp <= RECOMMENDED_MODELS_CACHE_TTL_MS) {
		return inMemoryCache.data
	}

	if (pendingRefresh) {
		return pendingRefresh
	}

	pendingRefresh = (async () => {
		try {
			return await fetchAndCacheTremboRecommendedModels()
		} finally {
			pendingRefresh = null
		}
	})()

	return pendingRefresh
}

export function resetTremboRecommendedModelsCacheForTests(): void {
	pendingRefresh = null
	inMemoryCache = null
}

function isFallbackRecommendedModels(data: TremboRecommendedModelsData): boolean {
	return JSON.stringify(data) === JSON.stringify(FALLBACK_TREMBO_RECOMMENDED_MODELS)
}

async function fetchAndCacheTremboRecommendedModels(): Promise<TremboRecommendedModelsData> {
	// Delegate the actual HTTP fetch + response normalization + offline fallback
	// to the SDK so the CLI/JetBrains and the extension share one implementation.
	// We pass the proxy-aware fetch (per .tremborules/network.md) and the
	// extension's configured API base URL. On failure the SDK returns its own
	// fallback list.
	const result = await fetchTremboRecommendedModels({
		baseUrl: TremboEnv.config().apiBaseUrl,
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
