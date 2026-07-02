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
