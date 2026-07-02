import type { ApiConfiguration } from "@shared/api"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

export const TREMBO_PASS_PROVIDER_ID = "trembo-pass"

/**
 * TremboPass always uses the user's personal Trembo account balance.
 *
 * This is intentionally best-effort: selecting the provider should still be
 * saved even if the account switch fails.
 */
export async function clearOrganizationForTremboPassProviderSelection(
	controller: Controller,
	apiConfiguration: Pick<ApiConfiguration, "planModeApiProvider" | "actModeApiProvider">,
): Promise<void> {
	if (
		apiConfiguration.planModeApiProvider !== TREMBO_PASS_PROVIDER_ID &&
		apiConfiguration.actModeApiProvider !== TREMBO_PASS_PROVIDER_ID
	) {
		return
	}

	try {
		await controller.accountService.switchAccount(undefined)
	} catch (error) {
		Logger.debug("Failed to switch TremboPass to personal account", { error })
	}
}
