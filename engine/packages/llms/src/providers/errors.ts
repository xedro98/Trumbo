import { getTrumboEnvironmentConfig } from "@trumbo/shared";

export const TRUMBO_NOT_SUBSCRIBED_RESPONSE_MESSAGE =
	"the user is not subscribed to required model plan";
const TRUMBO_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX =
	"no access to trumbopass subscription models yet. subscribe to trumbopass";
export const TRUMBO_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE =
	"organization accounts cannot use individual model inference subscriptions";

export function getTrumboPassSubscriptionUrl(): string {
	return `${new URL(
		"/dashboard/subscription?personal=true",
		getTrumboEnvironmentConfig().appBaseUrl,
	).toString()}`;
}

export function getTrumboNotSubscribedMessage(): string {
	return `No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan: ${getTrumboPassSubscriptionUrl()}`;
}

export class TrumboNotSubscribedError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getTrumboNotSubscribedMessage());
		this.name = "TrumboNotSubscribedError";
		this.providerId = providerId;
	}
}

export function getTrumboOrgIndividualInferenceSubscriptionMessage(): string {
	return "Organization accounts cannot use TrumboPass subscriptions. Go to /account -> change account to switch to your personal account for TrumboPass";
}

export class TrumboOrgIndividualInferenceSubscriptionError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getTrumboOrgIndividualInferenceSubscriptionMessage());
		this.name = "TrumboOrgIndividualInferenceSubscriptionError";
		this.providerId = providerId;
	}
}

export function isTrumboNotSubscribedError(
	error: unknown,
): error is TrumboNotSubscribedError {
	return error instanceof TrumboNotSubscribedError;
}

export function isTrumboOrgIndividualInferenceSubscriptionError(
	error: unknown,
): error is TrumboOrgIndividualInferenceSubscriptionError {
	return error instanceof TrumboOrgIndividualInferenceSubscriptionError;
}

export function isTrumboNotSubscribedMessage(text: string): boolean {
	const normalized = text.trim().toLowerCase();
	return (
		normalized.includes(TRUMBO_NOT_SUBSCRIBED_RESPONSE_MESSAGE) ||
		normalized.includes(TRUMBO_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX)
	);
}

export function isTrumboOrgIndividualInferenceSubscriptionMessage(
	text: string,
): boolean {
	return text
		.toLowerCase()
		.includes(TRUMBO_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE);
}

/**
 * Substrings that identify a TrumboPass (subscription plan) rate-limit
 * response. Trumbo has no usage-based billing tier, so a "limit reached"
 * always means the user hit their Pro/Max/Ultra plan request cap
 * (5h / daily / weekly), and the recovery action is to upgrade the plan,
 * not to switch billing modes.
 */
const TRUMBO_PASS_LIMIT_RESPONSE_MARKERS = [
	"rate_limit_error",
	"rate limit exceeded",
	"spend_limit_exceeded",
	"plan limit reached",
	"request limit reached",
] as const;

export function isTrumboPassLimitMessage(text: string): boolean {
	const normalized = text.trim().toLowerCase();
	if (!normalized.includes("rate limit") && !normalized.includes("limit")) {
		return false;
	}
	return TRUMBO_PASS_LIMIT_RESPONSE_MARKERS.some((marker) =>
		normalized.includes(marker),
	);
}

export interface TrumboPassLimitDetails {
	/** Rate-limit window name parsed from the response, when present. */
	window?: string;
	/** Human-readable "resets in ..." duration parsed from the response. */
	resetsIn?: string;
	/** The original response body text. */
	raw: string;
}

export function extractTrumboPassLimitMessage(
	text: string,
): TrumboPassLimitDetails {
	const windowMatch = text.match(/(\w+)\s+window/i);
	const resetMatch = text.match(/resets?\s+in\s+([^.\n]+)/i);
	return {
		raw: text,
		window: windowMatch?.[1]?.trim() || undefined,
		resetsIn: resetMatch?.[1]?.trim() || undefined,
	};
}

/**
 * Typed error raised when a TrumboPass (subscription plan) request cap is hit.
 *
 * The recovery action is to upgrade the subscription plan (Pro/Max/Ultra);
 * Trumbo has no usage-based billing tier, so this never offers a billing-mode
 * switch. Use {@link isTrumboPassLimitError} to detect it on the host side and
 * surface an upgrade affordance.
 *
 * The `message` preserves the original gateway response text so existing
 * string-based rate-limit detection (e.g. the CLI `RateLimitCard` parser,
 * which reads `Resets in ...` and `... window`) keeps working unchanged; the
 * structured {@link window} / {@link resetsIn} fields are best-effort parses
 * for hosts that prefer typed access.
 */
export class TrumboPassLimitError extends Error {
	public readonly providerId?: string;
	public readonly window?: string;
	public readonly resetsIn?: string;
	public readonly rawMessage: string;

	constructor(providerId: string, responseText: string) {
		super(responseText);
		this.name = "TrumboPassLimitError";
		this.providerId = providerId;
		this.rawMessage = responseText;
		const details = extractTrumboPassLimitMessage(responseText);
		this.window = details.window;
		this.resetsIn = details.resetsIn;
	}
}

export function isTrumboPassLimitError(
	error: unknown,
): error is TrumboPassLimitError {
	return (
		error instanceof TrumboPassLimitError ||
		(error instanceof Error && error.name === "TrumboPassLimitError")
	);
}
