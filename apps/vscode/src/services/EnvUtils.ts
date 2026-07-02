import { HostProvider } from "@/hosts/host-provider"
import { ExtensionRegistryInfo } from "@/registry"
import { EmptyRequest } from "@/shared/proto/trembo/common"
import { Logger } from "@/shared/services/Logger"

// Canonical header names for extra client/host context
const TremboHeaders = {
	PLATFORM: "X-PLATFORM",
	PLATFORM_VERSION: "X-PLATFORM-VERSION",
	CLIENT_VERSION: "X-CLIENT-VERSION",
	CLIENT_TYPE: "X-CLIENT-TYPE",
	CORE_VERSION: "X-CORE-VERSION",
	IS_MULTIROOT: "X-IS-MULTIROOT",
} as const

export function buildExternalBasicHeaders(): Record<string, string> {
	return {
		"User-Agent": `Trembo/${ExtensionRegistryInfo.version}`,
	}
}

export async function buildBasicTremboHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = buildExternalBasicHeaders()
	try {
		const host = await HostProvider.env.getHostVersion(EmptyRequest.create({}))
		headers[TremboHeaders.PLATFORM] = host.platform || "unknown"
		headers[TremboHeaders.PLATFORM_VERSION] = host.version || "unknown"
		headers[TremboHeaders.CLIENT_TYPE] = host.tremboType || "unknown"
		headers[TremboHeaders.CLIENT_VERSION] = host.tremboVersion || "unknown"
	} catch (error) {
		Logger.log("Failed to get IDE/platform info via HostBridge EnvService.getHostVersion", error)
		headers[TremboHeaders.PLATFORM] = "unknown"
		headers[TremboHeaders.PLATFORM_VERSION] = "unknown"
		headers[TremboHeaders.CLIENT_TYPE] = "unknown"
		headers[TremboHeaders.CLIENT_VERSION] = "unknown"
	}
	headers[TremboHeaders.CORE_VERSION] = ExtensionRegistryInfo.version

	return headers
}
