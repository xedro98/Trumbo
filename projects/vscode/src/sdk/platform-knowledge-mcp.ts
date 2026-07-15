import { removePlatformKnowledgeMcpServer, syncPlatformKnowledgeMcpServer } from "@trumbodev/core"
import { TrumboEnv } from "@/config"
import { Logger } from "@/shared/services/Logger"
import type { AuthService } from "./auth-service"

export async function syncPlatformKnowledgeMcpFromAuthService(authService: AuthService): Promise<void> {
	try {
		const token = await authService.getAuthToken()
		if (!token) {
			await removePlatformKnowledgeMcpServer()
			return
		}
		await syncPlatformKnowledgeMcpServer({
			accessToken: token,
			orgId: authService.getActiveOrganizationId(),
			mcpBaseUrl: TrumboEnv.config().mcpBaseUrl,
		})
	} catch (error) {
		Logger.warn(
			`[PlatformKnowledgeMcp] Failed to sync MCP settings: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}
