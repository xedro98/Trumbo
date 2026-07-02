import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/trembo/state"
import { describe, expect, it } from "vitest"
import {
	TREMBOPASS_GROUP,
	getTremboUIOnboardingGroups,
	getOnboardingGroupDisplayName,
	getRecommendedModelsData,
} from "../data-models"

function model(id: string, group: string): OnboardingModel {
	return {
		id,
		name: id,
		group,
		badge: "",
		score: 0,
		latency: 0,
		info: undefined,
	} as OnboardingModel
}

function groupOf(models: OnboardingModel[]): OnboardingModelGroup {
	return { models } as OnboardingModelGroup
}

describe("getTremboUIOnboardingGroups", () => {
	it("buckets TremboPass models into the tremboPass group", () => {
		const result = getTremboUIOnboardingGroups(
			groupOf([
				model("trembo-pass/glm-5.1", TREMBOPASS_GROUP),
				model("free-model", "free"),
				model("anthropic/claude", "frontier"),
				model("z-ai/glm", "open source"),
			]),
		)

		expect(result.tremboPass).toHaveLength(1)
		expect(result.tremboPass[0].group).toBe(TREMBOPASS_GROUP)
		expect(result.tremboPass[0].models.map((m) => m.id)).toEqual(["trembo-pass/glm-5.1"])
		expect(result.free[0].models.map((m) => m.id)).toEqual(["free-model"])
		expect(result.power.flatMap((g) => g.models.map((m) => m.id))).toEqual(["anthropic/claude", "z-ai/glm"])
	})

	it("does not bucket trembo-pass ids without a TremboPass group label", () => {
		const result = getTremboUIOnboardingGroups(groupOf([model("trembo-pass/glm-5.2", "frontier")]))

		expect(result.tremboPass).toEqual([])
	})

	it("returns an empty tremboPass group when no TremboPass models are present", () => {
		const result = getTremboUIOnboardingGroups(groupOf([model("free-model", "free")]))
		expect(result.tremboPass).toEqual([])
	})
})

describe("getRecommendedModelsData", () => {
	it("includes TremboPass-only responses without depending on feature-flag timing", () => {
		const result = getRecommendedModelsData({
			recommended: [],
			free: [],
			tremboPass: [{ id: "trembo-pass/glm-5.1", name: "GLM 5.1", description: "", tags: [] }],
		})

		expect(result?.tremboPass.map((model) => model.id)).toEqual(["trembo-pass/glm-5.1"])
	})

	it("keeps classic recommended/free responses and TremboPass responses", () => {
		const result = getRecommendedModelsData({
			recommended: [{ id: "anthropic/claude", name: "Claude", description: "", tags: [] }],
			free: [{ id: "free-model", name: "Free", description: "", tags: [] }],
			tremboPass: [{ id: "trembo-pass/glm-5.1", name: "GLM 5.1", description: "", tags: [] }],
		})

		expect(result?.recommended.map((model) => model.id)).toEqual(["anthropic/claude"])
		expect(result?.free.map((model) => model.id)).toEqual(["free-model"])
		expect(result?.tremboPass.map((model) => model.id)).toEqual(["trembo-pass/glm-5.1"])
	})

	it("returns undefined when every recommended bucket is empty", () => {
		const result = getRecommendedModelsData({ recommended: [], free: [], tremboPass: [] })

		expect(result).toBeUndefined()
	})
})

describe("onboarding display labels", () => {
	it("renders the canonical TremboPass group as a user-facing product name", () => {
		expect(getOnboardingGroupDisplayName(TREMBOPASS_GROUP)).toBe("TremboPass")
		expect(getOnboardingGroupDisplayName("frontier")).toBe("frontier")
	})
})
