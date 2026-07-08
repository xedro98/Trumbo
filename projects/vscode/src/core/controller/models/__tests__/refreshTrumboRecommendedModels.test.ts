import * as sdkCore from "@trumbo/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TrumboEnv } from "@/config"
import { refreshTrumboRecommendedModels, resetTrumboRecommendedModelsCacheForTests } from "../refreshTrumboRecommendedModels"

// The HTTP fetch + normalization + offline fallback lives in the SDK
// (`@trumbo/core` `fetchTrumboRecommendedModels`). These tests cover the
// extension-side wrapper: delegation to the SDK and in-memory caching. There is
// intentionally no feature-flag gate here; onboarding must not race against the
// remote-config cache and accidentally keep the hardcoded fallback list.

describe("refreshTrumboRecommendedModels", () => {
	beforeEach(() => {
		resetTrumboRecommendedModelsCacheForTests()
		// TrumboEnv is not initialized in the unit-test environment; the wrapper
		// passes its apiBaseUrl to the SDK, so provide a stable stub.
		vi.spyOn(TrumboEnv, "config").mockReturnValue({ apiBaseUrl: "https://api.trumbo-test.bot" } as ReturnType<
			typeof TrumboEnv.config
		>)
	})

	afterEach(() => {
		resetTrumboRecommendedModelsCacheForTests()
		vi.restoreAllMocks()
	})

	it("delegates to the SDK fetch", async () => {
		const sdkResult = {
			recommended: [{ id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", description: "Remote", tags: ["NEW"] }],
			free: [{ id: "z-ai/glm-5", name: "GLM 5", description: "Remote free", tags: [] }],
			trumboPass: [],
		}
		const sdkSpy = vi.spyOn(sdkCore, "fetchTrumboRecommendedModels").mockResolvedValue(sdkResult)

		const result = await refreshTrumboRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(1)
		expect(result).toEqual(sdkResult)
	})

	it("uses the in-memory cache after a populated upstream result", async () => {
		const sdkResult = {
			recommended: [{ id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", description: "Remote", tags: ["NEW"] }],
			free: [],
			trumboPass: [],
		}
		const sdkSpy = vi.spyOn(sdkCore, "fetchTrumboRecommendedModels").mockResolvedValue(sdkResult)

		const firstResult = await refreshTrumboRecommendedModels()
		const secondResult = await refreshTrumboRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(1)
		expect(secondResult).toEqual(firstResult)
	})

	it("does not cache the SDK fallback result", async () => {
		const sdkFallbackClone = structuredClone(sdkCore.FALLBACK_TRUMBO_RECOMMENDED_MODELS)
		const sdkSpy = vi
			.spyOn(sdkCore, "fetchTrumboRecommendedModels")
			.mockResolvedValueOnce(sdkFallbackClone)
			.mockResolvedValueOnce({
				recommended: [
					{ id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", description: "Remote", tags: ["NEW"] },
				],
				free: [],
				trumboPass: [],
			})

		const firstResult = await refreshTrumboRecommendedModels()
		const secondResult = await refreshTrumboRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(2)
		expect(firstResult).toEqual(sdkCore.FALLBACK_TRUMBO_RECOMMENDED_MODELS)
		expect(secondResult).not.toEqual(sdkCore.FALLBACK_TRUMBO_RECOMMENDED_MODELS)
	})
})
