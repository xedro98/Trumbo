import type { ApiConfiguration } from "@shared/api"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

export const TRUMBO_PASS_PROVIDER_ID = "trumbo-pass"

/**
 * TrumboPass always uses the user's personal Trumbo account balance.
 *
 * This is intentionally best-effort: selecting the provider should still be
 * saved even if the account switch fails.
 */
export async function clearOrganizationForTrumboPassProviderSelection(
	controller: Controller,
	apiConfiguration: Pick<ApiConfiguration, "planModeApiProvider" | "actModeApiProvider">,
): Promise<void> {
	if (
		apiConfiguration.planModeApiProvider !== TRUMBO_PASS_PROVIDER_ID &&
		apiConfiguration.actModeApiProvider !== TRUMBO_PASS_PROVIDER_ID
	) {
		return
	}

	try {
		await controller.accountService.switchAccount(undefined)
	} catch (error) {
		Logger.debug("Failed to switch TrumboPass to personal account", { error })
	}
}
