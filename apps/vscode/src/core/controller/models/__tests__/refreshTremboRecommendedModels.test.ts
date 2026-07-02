import * as sdkCore from "@trembo/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TremboEnv } from "@/config"
import { refreshTremboRecommendedModels, resetTremboRecommendedModelsCacheForTests } from "../refreshTremboRecommendedModels"

// The HTTP fetch + normalization + offline fallback lives in the SDK
// (`@trembo/core` `fetchTremboRecommendedModels`). These tests cover the
// extension-side wrapper: delegation to the SDK and in-memory caching. There is
// intentionally no feature-flag gate here; onboarding must not race against the
// remote-config cache and accidentally keep the hardcoded fallback list.

describe("refreshTremboRecommendedModels", () => {
	beforeEach(() => {
		resetTremboRecommendedModelsCacheForTests()
		// TremboEnv is not initialized in the unit-test environment; the wrapper
		// passes its apiBaseUrl to the SDK, so provide a stable stub.
		vi.spyOn(TremboEnv, "config").mockReturnValue({ apiBaseUrl: "https://api.trembo-test.bot" } as ReturnType<
			typeof TremboEnv.config
		>)
	})

	afterEach(() => {
		resetTremboRecommendedModelsCacheForTests()
		vi.restoreAllMocks()
	})

	it("delegates to the SDK fetch", async () => {
		const sdkResult = {
			recommended: [{ id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", description: "Remote", tags: ["NEW"] }],
			free: [{ id: "z-ai/glm-5", name: "GLM 5", description: "Remote free", tags: [] }],
			tremboPass: [],
		}
		const sdkSpy = vi.spyOn(sdkCore, "fetchTremboRecommendedModels").mockResolvedValue(sdkResult)

		const result = await refreshTremboRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(1)
		expect(result).toEqual(sdkResult)
	})

	it("uses the in-memory cache after a populated upstream result", async () => {
		const sdkResult = {
			recommended: [{ id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", description: "Remote", tags: ["NEW"] }],
			free: [],
			tremboPass: [],
		}
		const sdkSpy = vi.spyOn(sdkCore, "fetchTremboRecommendedModels").mockResolvedValue(sdkResult)

		const firstResult = await refreshTremboRecommendedModels()
		const secondResult = await refreshTremboRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(1)
		expect(secondResult).toEqual(firstResult)
	})

	it("does not cache the SDK fallback result", async () => {
		const sdkFallbackClone = structuredClone(sdkCore.FALLBACK_TREMBO_RECOMMENDED_MODELS)
		const sdkSpy = vi
			.spyOn(sdkCore, "fetchTremboRecommendedModels")
			.mockResolvedValueOnce(sdkFallbackClone)
			.mockResolvedValueOnce({
				recommended: [
					{ id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", description: "Remote", tags: ["NEW"] },
				],
				free: [],
				tremboPass: [],
			})

		const firstResult = await refreshTremboRecommendedModels()
		const secondResult = await refreshTremboRecommendedModels()

		expect(sdkSpy).toHaveBeenCalledTimes(2)
		expect(firstResult).toEqual(sdkCore.FALLBACK_TREMBO_RECOMMENDED_MODELS)
		expect(secondResult).not.toEqual(sdkCore.FALLBACK_TREMBO_RECOMMENDED_MODELS)
	})
})
