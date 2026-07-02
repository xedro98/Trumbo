import { buildModelInfoNameMap, type ModelInfo, resolveTremboPassModelInfo } from "@shared/api"
import { TREMBO_ONBOARDING_MODELS } from "@shared/trembo/onboarding"
import { EmptyRequest } from "@shared/proto/trembo/common"
import type { TremboRecommendedModel } from "@shared/proto/trembo/models"
import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/trembo/state"
import { useEffect, useMemo, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useProviderModels } from "@/hooks/useProviderModels"
import { ModelsServiceClient } from "@/services/grpc-client"
import { TREMBOPASS_GROUP, getRecommendedModelsData, type RecommendedModelsData } from "./data-models"

type OnboardingModelsStatus = "loading" | "success" | "empty"

export interface UseOnboardingModelsResult {
	status: OnboardingModelsStatus
	models: OnboardingModelGroup
}

function toOnboardingModel(
	rec: TremboRecommendedModel,
	group: string,
	fallbackBadge: string,
	modelCatalog: Record<string, ModelInfo>,
): OnboardingModel {
	const catalogInfo = modelCatalog[rec.id]
	const tag = rec.tags?.[0] ?? ""
	const badge = tag || fallbackBadge

	return {
		id: rec.id,
		name: rec.name || rec.id,
		group,
		badge,
		score: 0,
		latency: 0,
		info: catalogInfo
			? {
					contextWindow: catalogInfo.contextWindow ?? 0,
					supportsImages: catalogInfo.supportsImages ?? false,
					supportsPromptCache: catalogInfo.supportsPromptCache ?? false,
					inputPrice: catalogInfo.inputPrice ?? 0,
					outputPrice: catalogInfo.outputPrice ?? 0,
					tiers: catalogInfo.tiers ?? [],
				}
			: undefined,
	}
}

type FetchState = { status: "loading" } | { status: "success"; data: RecommendedModelsData } | { status: "empty" }

export function useOnboardingModels(): UseOnboardingModelsResult {
	const { openRouterModels } = useExtensionState()
	const { models: tremboModels } = useProviderModels("trembo")
	const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" })

	useEffect(() => {
		let cancelled = false

		const refreshRecommendedModels = async () => {
			try {
				const response = await ModelsServiceClient.refreshTremboRecommendedModelsRpc(EmptyRequest.create({}))
				if (!cancelled) {
					const data = getRecommendedModelsData(response)
					if (!data) {
						setFetchState({ status: "empty" })
					} else {
						setFetchState({ status: "success", data })
					}
				}
			} catch {
				if (!cancelled) {
					setFetchState({ status: "empty" })
				}
			}
		}

		refreshRecommendedModels()

		return () => {
			cancelled = true
		}
	}, [])

	// Merge openRouter and trembo models into a single catalog for lookups
	const modelCatalog = useMemo<Record<string, ModelInfo>>(() => {
		return { ...openRouterModels, ...(tremboModels ?? {}) }
	}, [openRouterModels, tremboModels])

	// TremboPass model IDs omit the upstream lab (e.g. "trembo-pass/glm-5.1"), so look up
	// capabilities via the model slug against the OpenRouter catalog, falling back to
	// conservative TremboPass defaults. Mirrors TremboPassProvider's resolution.
	const openRouterModelsByName = useMemo(() => buildModelInfoNameMap(openRouterModels), [openRouterModels])

	return useMemo<UseOnboardingModelsResult>(() => {
		if (fetchState.status !== "success") {
			return { status: fetchState.status, models: { models: TREMBO_ONBOARDING_MODELS } }
		}

		const { data } = fetchState
		const freeModels = data.free.map((rec) => toOnboardingModel(rec, "free", "Free", modelCatalog))
		const frontierModels = data.recommended.map((rec) => toOnboardingModel(rec, "frontier", "", modelCatalog))
		const tremboPassCatalog = Object.fromEntries(
			data.tremboPass.map((rec) => [rec.id, resolveTremboPassModelInfo(rec.id, openRouterModelsByName)]),
		)
		const tremboPassModels = data.tremboPass.map((rec) => toOnboardingModel(rec, TREMBOPASS_GROUP, "", tremboPassCatalog))

		return { status: "success", models: { models: [...tremboPassModels, ...freeModels, ...frontierModels] } }
	}, [fetchState, modelCatalog, openRouterModelsByName])
}
