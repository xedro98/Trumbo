import { getTrumboEnvironmentConfig } from "@trumbodev/shared";
import { describe, expect, it } from "vitest";
import {
	formatCliErrorMessage,
	getCliNotSubscribedMessage,
	getCliSubscriptionUrl,
	getTrumboOrgIndividualInferenceSubscriptionMessage,
	isTrumboOrgIndividualInferenceSubscriptionErrorMessage,
	isTrumboPassSubscriptionError,
} from "./trumbo-pass-errors";

describe("trumbo-pass-errors", () => {
	it("recognizes both raw and formatted TrumboPass subscription messages", () => {
		expect(
			isTrumboPassSubscriptionError(
				"the user is not subscribed to required model plan",
			),
		).toBe(true);

		const sdkFormatted =
			"No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan: http://0.0.0.0:0/dashboard/subscription?personal=true";
		const formatted = getCliNotSubscribedMessage();
		expect(isTrumboPassSubscriptionError(sdkFormatted)).toBe(true);
		expect(isTrumboPassSubscriptionError(formatted)).toBe(true);
		expect(formatCliErrorMessage(new Error(sdkFormatted))).toBe(formatted);
		expect(formatCliErrorMessage(new Error(formatted))).toBe(formatted);
	});

	it("formats the TrumboPass subscription URL", () => {
		const appBaseUrl = getTrumboEnvironmentConfig().appBaseUrl;
		expect(getCliSubscriptionUrl()).toBe(
			`${appBaseUrl}/promo?code=CLI-8OFF&personal=true`,
		);
	});

	it("recognizes and formats organization account individual subscription errors", () => {
		const raw =
			"403 Error 403: organization accounts cannot use individual model inference subscriptions";
		const formatted = getTrumboOrgIndividualInferenceSubscriptionMessage();

		expect(isTrumboOrgIndividualInferenceSubscriptionErrorMessage(raw)).toBe(
			true,
		);
		expect(
			isTrumboOrgIndividualInferenceSubscriptionErrorMessage(
				new Error(formatted),
			),
		).toBe(true);
		expect(formatCliErrorMessage(new Error(raw))).toBe(formatted);
	});
});
