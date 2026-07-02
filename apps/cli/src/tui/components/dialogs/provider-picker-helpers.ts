import { CLI_PROMO_CODE } from "../../../utils/trembo-pass-errors";

const TREMBO_PASS_SUBSCRIPTION_PATH = "/dashboard/subscription";
const DEFAULT_APP_BASE_URL = "https://app.trembo.bot";

export function buildTremboPassSubscriptionPageUrl(
	appBaseUrl: string | undefined,
): string {
	const url = new URL(
		TREMBO_PASS_SUBSCRIPTION_PATH,
		appBaseUrl || DEFAULT_APP_BASE_URL,
	);
	url.searchParams.set("personal", "true");
	url.searchParams.set("code", CLI_PROMO_CODE);
	return url.toString();
}
