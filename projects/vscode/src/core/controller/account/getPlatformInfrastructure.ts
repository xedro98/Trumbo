import { PlatformInfrastructureResponse } from "@shared/proto/trumbo/account"
import type { EmptyRequest } from "@shared/proto/trumbo/common"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

/**
 * Fetches Cloud Agents + Sandbox sessions and usage from platform.trumbo.dev.
 * All data is JSON-serialized in the response for webview parsing.
 */
export async function getPlatformInfrastructure(
	controller: Controller,
	_request: EmptyRequest,
): Promise<PlatformInfrastructureResponse> {
	try {
		if (!controller.accountService) {
			throw new Error("Account service not available")
		}

		const data = await controller.accountService.fetchPlatformInfrastructureRPC()
		if (!data) {
			return PlatformInfrastructureResponse.create({
				error: "Failed to fetch platform infrastructure. Sign in and ensure your team has an active subscription.",
			})
		}

		return PlatformInfrastructureResponse.create({
			agentsJson: data.agentsJson,
			sandboxesJson: data.sandboxesJson,
			agentsUsageJson: data.agentsUsageJson,
			sandboxUsageJson: data.sandboxUsageJson,
		})
	} catch (error) {
		Logger.error(`Failed to fetch platform infrastructure: ${error}`)
		return PlatformInfrastructureResponse.create({
			error: error instanceof Error ? error.message : "Failed to fetch platform infrastructure",
		})
	}
}
