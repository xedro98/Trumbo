import { getTremboEnvironmentConfig } from "@trembo/shared";

export const TREMBO_NOT_SUBSCRIBED_RESPONSE_MESSAGE =
	"the user is not subscribed to required model plan";
const TREMBO_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX =
	"no access to trembopass subscription models yet. subscribe to trembopass";
export const TREMBO_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE =
	"organization accounts cannot use individual model inference subscriptions";

export function getTremboPassSubscriptionUrl(): string {
	return `${new URL(
		"/dashboard/subscription?personal=true",
		getTremboEnvironmentConfig().appBaseUrl,
	).toString()}`;
}

export function getTremboNotSubscribedMessage(): string {
	return `No access to TremboPass subscription models yet. Subscribe to TremboPass, the low cost open weights model coding plan: ${getTremboPassSubscriptionUrl()}`;
}

export class TremboNotSubscribedError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getTremboNotSubscribedMessage());
		this.name = "TremboNotSubscribedError";
		this.providerId = providerId;
	}
}

export function getTremboOrgIndividualInferenceSubscriptionMessage(): string {
	return "Organization accounts cannot use TremboPass subscriptions. Go to /account -> change account to switch to your personal account for TremboPass";
}

export class TremboOrgIndividualInferenceSubscriptionError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getTremboOrgIndividualInferenceSubscriptionMessage());
		this.name = "TremboOrgIndividualInferenceSubscriptionError";
		this.providerId = providerId;
	}
}

export function isTremboNotSubscribedError(
	error: unknown,
): error is TremboNotSubscribedError {
	return error instanceof TremboNotSubscribedError;
}

export function isTremboOrgIndividualInferenceSubscriptionError(
	error: unknown,
): error is TremboOrgIndividualInferenceSubscriptionError {
	return error instanceof TremboOrgIndividualInferenceSubscriptionError;
}

export function isTremboNotSubscribedMessage(text: string): boolean {
	const normalized = text.trim().toLowerCase();
	return (
		normalized.includes(TREMBO_NOT_SUBSCRIBED_RESPONSE_MESSAGE) ||
		normalized.includes(TREMBO_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX)
	);
}

export function isTremboOrgIndividualInferenceSubscriptionMessage(
	text: string,
): boolean {
	return text
		.toLowerCase()
		.includes(TREMBO_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE);
}
