import { describe, expect, it } from "vitest";
import {
	TremboNotSubscribedError,
	TremboOrgIndividualInferenceSubscriptionError,
	getTremboNotSubscribedMessage,
	getTremboOrgIndividualInferenceSubscriptionMessage,
	isTremboNotSubscribedMessage,
	isTremboOrgIndividualInferenceSubscriptionMessage,
} from "./errors";
import { extractErrorMessage } from "./format";

describe("extractErrorMessage", () => {
	it("extracts structured provider errors without fallback branches", () => {
		expect(
			extractErrorMessage({
				statusCode: 400,
				responseBody: {
					error: {
						message: "Bad request detail",
					},
				},
				message: "Bad Request",
			}),
		).toBe("Bad request detail");

		expect(
			extractErrorMessage({
				cause: new Error("Nested failure"),
			}),
		).toBe("Nested failure");

		expect(extractErrorMessage(new Error("Plain failure"))).toBe(
			"Plain failure",
		);
	});

	it("preserves native transport error wrappers and cause metadata", () => {
		const socketError = Object.assign(new Error("other side closed"), {
			name: "SocketError",
			code: "UND_ERR_SOCKET",
		});

		expect(
			extractErrorMessage(new TypeError("fetch failed", { cause: socketError })),
		).toBe("fetch failed: SocketError: other side closed (UND_ERR_SOCKET)");
	});

	it("prefers nested stream error details over generic wrapper messages", () => {
		expect(
			extractErrorMessage({
				message: "Stream error occurred",
				errors: [
					{
						responseBody: JSON.stringify({
							error: { message: "Missing upstream API key" },
						}),
					},
				],
			}),
		).toBe("Missing upstream API key");
	});
});

describe("TremboNotSubscribedError", () => {
	it("uses the user-facing subscription message", () => {
		expect(new TremboNotSubscribedError("trembo-pass").message).toBe(
			getTremboNotSubscribedMessage(),
		);
	});

	it("detects the TremboPass required-plan message", () => {
		expect(
			isTremboNotSubscribedMessage(
				JSON.stringify({
					error: {
						message: "the user is not subscribed to required model plan",
					},
				}),
			),
		).toBe(true);
		expect(isTremboNotSubscribedMessage("different forbidden error")).toBe(
			false,
		);
	});

	it("detects the formatted TremboPass subscription message regardless of URL", () => {
		expect(
			isTremboNotSubscribedMessage(
				"No access to TremboPass subscription models yet. Subscribe to TremboPass, the low cost open weights model coding plan: http://0.0.0.0:0/promo?code=CLI-8OFF&personal=true",
			),
		).toBe(true);
	});
});

describe("TremboOrgIndividualInferenceSubscriptionError", () => {
	it("uses the user-facing organization account message", () => {
		expect(
			new TremboOrgIndividualInferenceSubscriptionError("trembo").message,
		).toBe(getTremboOrgIndividualInferenceSubscriptionMessage());
	});

	it("detects the organization individual-subscription entitlement message", () => {
		expect(
			isTremboOrgIndividualInferenceSubscriptionMessage(
				JSON.stringify({
					error: {
						code: "ENTITLEMENT_ERROR",
						message:
							"organization accounts cannot use individual model inference subscriptions",
					},
				}),
			),
		).toBe(true);
		expect(
			isTremboOrgIndividualInferenceSubscriptionMessage(
				"the user is not subscribed to required model plan",
			),
		).toBe(false);
	});
});
