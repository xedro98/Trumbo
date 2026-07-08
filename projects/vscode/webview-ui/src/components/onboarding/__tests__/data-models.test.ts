import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/trumbo/state"
import { describe, expect, it } from "vitest"
import {
	TRUMBOPASS_GROUP,
	getTrumboUIOnboardingGroups,
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

describe("getTrumboUIOnboardingGroups", () => {
	it("buckets TrumboPass models into the trumboPass group", () => {
		const result = getTrumboUIOnboardingGroups(
			groupOf([
				model("trumbo-pass/glm-5.1", TRUMBOPASS_GROUP),
				model("free-model", "free"),
				model("anthropic/claude", "frontier"),
				model("z-ai/glm", "open source"),
			]),
		)

		expect(result.trumboPass).toHaveLength(1)
		expect(result.trumboPass[0].group).toBe(TRUMBOPASS_GROUP)
		expect(result.trumboPass[0].models.map((m) => m.id)).toEqual(["trumbo-pass/glm-5.1"])
		expect(result.free[0].models.map((m) => m.id)).toEqual(["free-model"])
		expect(result.power.flatMap((g) => g.models.map((m) => m.id))).toEqual(["anthropic/claude", "z-ai/glm"])
	})

	it("does not bucket trumbo-pass ids without a TrumboPass group label", () => {
		const result = getTrumboUIOnboardingGroups(groupOf([model("trumbo-pass/glm-5.2", "frontier")]))

		expect(result.trumboPass).toEqual([])
	})

	it("returns an empty trumboPass group when no TrumboPass models are present", () => {
		const result = getTrumboUIOnboardingGroups(groupOf([model("free-model", "free")]))
		expect(result.trumboPass).toEqual([])
	})
})

describe("getRecommendedModelsData", () => {
	it("includes TrumboPass-only responses without depending on feature-flag timing", () => {
		const result = getRecommendedModelsData({
			recommended: [],
			free: [],
			trumboPass: [{ id: "trumbo-pass/glm-5.1", name: "GLM 5.1", description: "", tags: [] }],
		})

		expect(result?.trumboPass.map((model) => model.id)).toEqual(["trumbo-pass/glm-5.1"])
	})

	it("keeps classic recommended/free responses and TrumboPass responses", () => {
		const result = getRecommendedModelsData({
			recommended: [{ id: "anthropic/claude", name: "Claude", description: "", tags: [] }],
			free: [{ id: "free-model", name: "Free", description: "", tags: [] }],
			trumboPass: [{ id: "trumbo-pass/glm-5.1", name: "GLM 5.1", description: "", tags: [] }],
		})

		expect(result?.recommended.map((model) => model.id)).toEqual(["anthropic/claude"])
		expect(result?.free.map((model) => model.id)).toEqual(["free-model"])
		expect(result?.trumboPass.map((model) => model.id)).toEqual(["trumbo-pass/glm-5.1"])
	})

	it("returns undefined when every recommended bucket is empty", () => {
		const result = getRecommendedModelsData({ recommended: [], free: [], trumboPass: [] })

		expect(result).toBeUndefined()
	})
})

describe("onboarding display labels", () => {
	it("renders the canonical TrumboPass group as a user-facing product name", () => {
		expect(getOnboardingGroupDisplayName(TRUMBOPASS_GROUP)).toBe("TrumboPass")
		expect(getOnboardingGroupDisplayName("frontier")).toBe("frontier")
	})
})
