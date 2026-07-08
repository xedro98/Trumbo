import type { TrumboRecommendedModel, OpenRouterModelInfo } from "@shared/proto/trumbo/models"
import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/trumbo/state"

export const TRUMBOPASS_GROUP = "trumbo-pass"

export interface RecommendedModelsData {
	recommended: TrumboRecommendedModel[]
	free: TrumboRecommendedModel[]
	trumboPass: TrumboRecommendedModel[]
}

type RecommendedModelsResponseLike = {
	recommended?: TrumboRecommendedModel[]
	free?: TrumboRecommendedModel[]
	trumboPass?: TrumboRecommendedModel[]
}

export function getRecommendedModelsData(response: RecommendedModelsResponseLike): RecommendedModelsData | undefined {
	const recommended = response.recommended ?? []
	const free = response.free ?? []
	const trumboPass = response.trumboPass ?? []

	if (recommended.length === 0 && free.length === 0 && trumboPass.length === 0) {
		return undefined
	}

	return { recommended, free, trumboPass }
}

export interface OnboardingModelsByGroup {
	trumboPass: ModelGroup[]
	free: ModelGroup[]
	power: ModelGroup[]
}

interface ModelGroup {
	group: string
	models: OnboardingModel[]
}

function isTrumboPassOnboardingModel(model: OnboardingModel): boolean {
	return model.group === TRUMBOPASS_GROUP
}

export function getTrumboUIOnboardingGroups(groupedModels: OnboardingModelGroup): OnboardingModelsByGroup {
	const { models } = groupedModels

	const trumboPassModels = models.filter(isTrumboPassOnboardingModel)
	const freeModels = models.filter((m) => m.group === "free")
	const frontierModels = models.filter((m) => m.group === "frontier")
	const openSourceModels = models.filter((m) => m.group === "open source")

	return {
		trumboPass: trumboPassModels.length > 0 ? [{ group: TRUMBOPASS_GROUP, models: trumboPassModels }] : [],
		free: freeModels.length > 0 ? [{ group: "free", models: freeModels }] : [],
		power: [
			...(frontierModels.length > 0 ? [{ group: "frontier", models: frontierModels }] : []),
			...(openSourceModels.length > 0 ? [{ group: "open source", models: openSourceModels }] : []),
		],
	}
}

export function getOnboardingGroupDisplayName(group: string): string {
	if (group === TRUMBOPASS_GROUP) {
		return "TrumboPass"
	}
	return group
}

export function getPriceRange(modelInfo: OpenRouterModelInfo): string {
	const prompt = Number(modelInfo.inputPrice ?? 0)
	const completion = Number(modelInfo.outputPrice ?? 0)
	const cost = prompt + completion
	if (cost === 0) {
		return "Free"
	}
	if (cost < 10) {
		return "$"
	}
	if (cost > 50) {
		return "$$$"
	}
	return "$$"
}

export function getCapabilities(modelInfo: OpenRouterModelInfo): string[] {
	const capabilities = new Set<string>()
	if (modelInfo.supportsImages) {
		capabilities.add("Images")
	}
	if (modelInfo.supportsPromptCache) {
		capabilities.add("Prompt Cache")
	}
	capabilities.add("Tools")
	return Array.from(capabilities)
}

export function getSpeedLabel(latency?: number): string {
	if (!latency) {
		return "Average"
	}
	if (latency < 1) {
		return "Instant"
	}
	if (latency < 2) {
		return "Fast"
	}
	if (latency > 5) {
		return "Slow"
	}

	return "Average"
}
