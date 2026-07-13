import { describe, expect, it } from "vitest";
import {
	extractTrumboPassLimitMessage,
	getTrumboNotSubscribedMessage,
	getTrumboOrgIndividualInferenceSubscriptionMessage,
	isTrumboNotSubscribedMessage,
	isTrumboOrgIndividualInferenceSubscriptionMessage,
	isTrumboPassLimitError,
	isTrumboPassLimitMessage,
	TrumboNotSubscribedError,
	TrumboOrgIndividualInferenceSubscriptionError,
	TrumboPassLimitError,
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
			extractErrorMessage(
				new TypeError("fetch failed", { cause: socketError }),
			),
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

describe("TrumboNotSubscribedError", () => {
	it("uses the user-facing subscription message", () => {
		expect(new TrumboNotSubscribedError("trumbo-pass").message).toBe(
			getTrumboNotSubscribedMessage(),
		);
	});

	it("detects the TrumboPass required-plan message", () => {
		expect(
			isTrumboNotSubscribedMessage(
				JSON.stringify({
					error: {
						message: "the user is not subscribed to required model plan",
					},
				}),
			),
		).toBe(true);
		expect(isTrumboNotSubscribedMessage("different forbidden error")).toBe(
			false,
		);
	});

	it("detects the formatted TrumboPass subscription message regardless of URL", () => {
		expect(
			isTrumboNotSubscribedMessage(
				"No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan: http://0.0.0.0:0/promo?code=CLI-8OFF&personal=true",
			),
		).toBe(true);
	});
});

describe("TrumboOrgIndividualInferenceSubscriptionError", () => {
	it("uses the user-facing organization account message", () => {
		expect(
			new TrumboOrgIndividualInferenceSubscriptionError("trumbo").message,
		).toBe(getTrumboOrgIndividualInferenceSubscriptionMessage());
	});

	it("detects the organization individual-subscription entitlement message", () => {
		expect(
			isTrumboOrgIndividualInferenceSubscriptionMessage(
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
			isTrumboOrgIndividualInferenceSubscriptionMessage(
				"the user is not subscribed to required model plan",
			),
		).toBe(false);
	});
});

describe("TrumboPassLimitError", () => {
	it("detects rate-limit / plan-cap response messages", () => {
		expect(
			isTrumboPassLimitMessage(
				'{"error":{"code":"rate_limit_error","message":"rate limit exceeded for daily window. Resets in 3 hours."}}',
			),
		).toBe(true);
		expect(isTrumboPassLimitMessage("rate limit exceeded")).toBe(true);
		expect(isTrumboPassLimitMessage("spend_limit_exceeded")).toBe(true);
		expect(isTrumboPassLimitMessage("plan limit reached")).toBe(true);
		expect(isTrumboPassLimitMessage("an unrelated error")).toBe(false);
	});

	it("extracts the window and reset duration from a rate-limit response", () => {
		const details = extractTrumboPassLimitMessage(
			"rate limit exceeded for daily window. Resets in 3 hours.",
		);
		expect(details.window).toBe("daily");
		expect(details.resetsIn).toBe("3 hours");
	});

	it("preserves the raw response text on the error and parses structured fields", () => {
		const raw =
			'{"error":{"code":"rate_limit_error","message":"rate limit exceeded for weekly window. Resets in 12 hours."}}';
		const error = new TrumboPassLimitError("trumbo-pass", raw);
		expect(error.name).toBe("TrumboPassLimitError");
		expect(error.providerId).toBe("trumbo-pass");
		expect(error.rawMessage).toBe(raw);
		// The message preserves the raw gateway text so existing string-based
		// rate-limit detection (e.g. the CLI RateLimitCard parser) keeps working.
		expect(error.message).toBe(raw);
		// The structured fields are best-effort parsed from the embedded text,
		// even when the body is JSON-wrapped.
		expect(error.window).toBe("weekly");
		expect(error.resetsIn).toBe("12 hours");
		expect(isTrumboPassLimitError(error)).toBe(true);
	});

	it("detects the typed error by name even across realms", () => {
		const alien = Object.assign(new Error("rate limit exceeded"), {
			name: "TrumboPassLimitError",
		});
		expect(isTrumboPassLimitError(alien)).toBe(true);
		expect(isTrumboPassLimitError(new Error("other"))).toBe(false);
	});
});
