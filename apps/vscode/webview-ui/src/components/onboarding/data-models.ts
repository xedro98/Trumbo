import type { TremboRecommendedModel, OpenRouterModelInfo } from "@shared/proto/trembo/models"
import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/trembo/state"

export const TREMBOPASS_GROUP = "trembo-pass"

export interface RecommendedModelsData {
	recommended: TremboRecommendedModel[]
	free: TremboRecommendedModel[]
	tremboPass: TremboRecommendedModel[]
}

type RecommendedModelsResponseLike = {
	recommended?: TremboRecommendedModel[]
	free?: TremboRecommendedModel[]
	tremboPass?: TremboRecommendedModel[]
}

export function getRecommendedModelsData(response: RecommendedModelsResponseLike): RecommendedModelsData | undefined {
	const recommended = response.recommended ?? []
	const free = response.free ?? []
	const tremboPass = response.tremboPass ?? []

	if (recommended.length === 0 && free.length === 0 && tremboPass.length === 0) {
		return undefined
	}

	return { recommended, free, tremboPass }
}

export interface OnboardingModelsByGroup {
	tremboPass: ModelGroup[]
	free: ModelGroup[]
	power: ModelGroup[]
}

interface ModelGroup {
	group: string
	models: OnboardingModel[]
}

function isTremboPassOnboardingModel(model: OnboardingModel): boolean {
	return model.group === TREMBOPASS_GROUP
}

export function getTremboUIOnboardingGroups(groupedModels: OnboardingModelGroup): OnboardingModelsByGroup {
	const { models } = groupedModels

	const tremboPassModels = models.filter(isTremboPassOnboardingModel)
	const freeModels = models.filter((m) => m.group === "free")
	const frontierModels = models.filter((m) => m.group === "frontier")
	const openSourceModels = models.filter((m) => m.group === "open source")

	return {
		tremboPass: tremboPassModels.length > 0 ? [{ group: TREMBOPASS_GROUP, models: tremboPassModels }] : [],
		free: freeModels.length > 0 ? [{ group: "free", models: freeModels }] : [],
		power: [
			...(frontierModels.length > 0 ? [{ group: "frontier", models: frontierModels }] : []),
			...(openSourceModels.length > 0 ? [{ group: "open source", models: openSourceModels }] : []),
		],
	}
}

export function getOnboardingGroupDisplayName(group: string): string {
	if (group === TREMBOPASS_GROUP) {
		return "TremboPass"
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
