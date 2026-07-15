import { getTrumboEnvironmentConfig } from "@trumbodev/shared";
import { CLI_PROMO_CODE } from "../../../utils/trumbo-pass-errors";

const TRUMBO_PASS_BILLING_PATH = "/billing";

export function buildTrumboPassSubscriptionPageUrl(
	appBaseUrl: string | undefined,
): string {
	const url = new URL(
		TRUMBO_PASS_BILLING_PATH,
		appBaseUrl || getTrumboEnvironmentConfig().appBaseUrl,
	);
	url.searchParams.set("code", CLI_PROMO_CODE);
	return url.toString();
}
