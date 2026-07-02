import { EmptyRequest } from "@shared/proto/trembo/common"
import { TremboRecommendedModel, TremboRecommendedModelsResponse } from "@shared/proto/trembo/models"
import type { Controller } from "../index"
import { refreshTremboRecommendedModels } from "./refreshTremboRecommendedModels"

export async function refreshTremboRecommendedModelsRpc(
	_controller: Controller,
	_request: EmptyRequest,
): Promise<TremboRecommendedModelsResponse> {
	const models = await refreshTremboRecommendedModels()
	return TremboRecommendedModelsResponse.create({
		recommended: models.recommended.map((model) =>
			TremboRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		free: models.free.map((model) =>
			TremboRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		tremboPass: (models.tremboPass ?? []).map((model) =>
			TremboRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
	})
}
