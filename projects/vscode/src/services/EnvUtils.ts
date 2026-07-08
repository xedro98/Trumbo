import { HostProvider } from "@/hosts/host-provider"
import { ExtensionRegistryInfo } from "@/registry"
import { EmptyRequest } from "@/shared/proto/trumbo/common"
import { Logger } from "@/shared/services/Logger"

// Canonical header names for extra client/host context
const TrumboHeaders = {
	PLATFORM: "X-PLATFORM",
	PLATFORM_VERSION: "X-PLATFORM-VERSION",
	CLIENT_VERSION: "X-CLIENT-VERSION",
	CLIENT_TYPE: "X-CLIENT-TYPE",
	CORE_VERSION: "X-CORE-VERSION",
	IS_MULTIROOT: "X-IS-MULTIROOT",
} as const

export function buildExternalBasicHeaders(): Record<string, string> {
	return {
		"User-Agent": `Trumbo/${ExtensionRegistryInfo.version}`,
	}
}

export async function buildBasicTrumboHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = buildExternalBasicHeaders()
	try {
		const host = await HostProvider.env.getHostVersion(EmptyRequest.create({}))
		headers[TrumboHeaders.PLATFORM] = host.platform || "unknown"
		headers[TrumboHeaders.PLATFORM_VERSION] = host.version || "unknown"
		headers[TrumboHeaders.CLIENT_TYPE] = host.trumboType || "unknown"
		headers[TrumboHeaders.CLIENT_VERSION] = host.trumboVersion || "unknown"
	} catch (error) {
		Logger.log("Failed to get IDE/platform info via HostBridge EnvService.getHostVersion", error)
		headers[TrumboHeaders.PLATFORM] = "unknown"
		headers[TrumboHeaders.PLATFORM_VERSION] = "unknown"
		headers[TrumboHeaders.CLIENT_TYPE] = "unknown"
		headers[TrumboHeaders.CLIENT_VERSION] = "unknown"
	}
	headers[TrumboHeaders.CORE_VERSION] = ExtensionRegistryInfo.version

	return headers
}
