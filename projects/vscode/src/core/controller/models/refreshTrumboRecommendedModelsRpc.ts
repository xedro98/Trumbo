import { EmptyRequest } from "@shared/proto/trumbo/common"
import { TrumboRecommendedModel, TrumboRecommendedModelsResponse } from "@shared/proto/trumbo/models"
import type { Controller } from "../index"
import { refreshTrumboRecommendedModels } from "./refreshTrumboRecommendedModels"

export async function refreshTrumboRecommendedModelsRpc(
	_controller: Controller,
	_request: EmptyRequest,
): Promise<TrumboRecommendedModelsResponse> {
	const models = await refreshTrumboRecommendedModels()
	return TrumboRecommendedModelsResponse.create({
		recommended: models.recommended.map((model) =>
			TrumboRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		free: models.free.map((model) =>
			TrumboRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		trumboPass: (models.trumboPass ?? []).map((model) =>
			TrumboRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
	})
}
