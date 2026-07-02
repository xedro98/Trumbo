import type { MarketplaceInstallResult, MarketplaceLocalInstalledEntryRequest } from "@shared/proto/trembo/marketplace"
import type { Controller } from "../index"
import { uninstallLocalMarketplaceInstalledEntry } from "./marketplace-helpers"

export async function uninstallMarketplaceLocalInstalledEntry(
	controller: Controller,
	request: MarketplaceLocalInstalledEntryRequest,
): Promise<MarketplaceInstallResult> {
	return uninstallLocalMarketplaceInstalledEntry(controller, request)
}
