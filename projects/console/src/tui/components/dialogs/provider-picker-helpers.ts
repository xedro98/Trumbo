import { getTrumboEnvironmentConfig } from "@trumbo/shared";
import { CLI_PROMO_CODE } from "../../../utils/trumbo-pass-errors";

const TRUMBO_PASS_SUBSCRIPTION_PATH = "/dashboard/subscription";

export function buildTrumboPassSubscriptionPageUrl(
	appBaseUrl: string | undefined,
): string {
	const url = new URL(
		TRUMBO_PASS_SUBSCRIPTION_PATH,
		appBaseUrl || getTrumboEnvironmentConfig().appBaseUrl,
	);
	url.searchParams.set("personal", "true");
	url.searchParams.set("code", CLI_PROMO_CODE);
	return url.toString();
}
