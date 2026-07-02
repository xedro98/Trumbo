import { describe, expect, it } from "vitest";
import {
	formatCliErrorMessage,
	getCliNotSubscribedMessage,
	getTremboOrgIndividualInferenceSubscriptionMessage,
	getCliSubscriptionUrl,
	isTremboOrgIndividualInferenceSubscriptionErrorMessage,
	isTremboPassSubscriptionError,
} from "./trembo-pass-errors";

describe("trembo-pass-errors", () => {
	it("recognizes both raw and formatted TremboPass subscription messages", () => {
		expect(
			isTremboPassSubscriptionError(
				"the user is not subscribed to required model plan",
			),
		).toBe(true);

		const sdkFormatted =
			"No access to TremboPass subscription models yet. Subscribe to TremboPass, the low cost open weights model coding plan: http://0.0.0.0:0/dashboard/subscription?personal=true";
		const formatted = getCliNotSubscribedMessage();
		expect(isTremboPassSubscriptionError(sdkFormatted)).toBe(true);
		expect(isTremboPassSubscriptionError(formatted)).toBe(true);
		expect(formatCliErrorMessage(new Error(sdkFormatted))).toBe(formatted);
		expect(formatCliErrorMessage(new Error(formatted))).toBe(formatted);
	});

	it("formats the TremboPass subscription URL", () => {
		expect(getCliSubscriptionUrl()).toBe(
			"http://0.0.0.0:0/promo?code=CLI-8OFF&personal=true",
		);
	});

	it("recognizes and formats organization account individual subscription errors", () => {
		const raw =
			"403 Error 403: organization accounts cannot use individual model inference subscriptions";
		const formatted = getTremboOrgIndividualInferenceSubscriptionMessage();

		expect(isTremboOrgIndividualInferenceSubscriptionErrorMessage(raw)).toBe(
			true,
		);
		expect(
			isTremboOrgIndividualInferenceSubscriptionErrorMessage(
				new Error(formatted),
			),
		).toBe(true);
		expect(formatCliErrorMessage(new Error(raw))).toBe(formatted);
	});
});
