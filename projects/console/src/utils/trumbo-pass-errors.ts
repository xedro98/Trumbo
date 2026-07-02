import {
	getTrumboOrgIndividualInferenceSubscriptionMessage,
	isTrumboNotSubscribedError,
	isTrumboNotSubscribedMessage,
	isTrumboOrgIndividualInferenceSubscriptionError,
	isTrumboOrgIndividualInferenceSubscriptionMessage,
	type TrumboSubscriptionPlan,
} from "@trumbo/core";

import { getTrumboEnvironmentConfig } from "@trumbo/shared";

export { getTrumboOrgIndividualInferenceSubscriptionMessage };

export const CLI_PROMO_CODE = "CLI-8OFF";

export function getCliSubscriptionUrl(): string {
	return `${new URL(
		`/promo?code=${CLI_PROMO_CODE}&personal=true`,
		getTrumboEnvironmentConfig().appBaseUrl,
	).toString()}`;
}

export function getCliNotSubscribedMessage(): string {
	return `No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan: ${getCliSubscriptionUrl()}`;
}

export function getIndividualPlanFeatures(
	plans: TrumboSubscriptionPlan[],
): string[] {
	const planWithFeatures = plans.find((plan) => plan.interval === "Monthly");

	return planWithFeatures?.features?.included ?? [];
}

function isFormattedTrumboPassSubscriptionMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("no access to trumbopass subscription models yet") &&
		normalized.includes("subscribe to trumbopass")
	);
}

export function isTrumboPassSubscriptionError(error: unknown): boolean {
	if (isTrumboNotSubscribedError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "TrumboNotSubscribedError" ||
			isTrumboNotSubscribedMessage(error.message) ||
			isFormattedTrumboPassSubscriptionMessage(error.message)
		);
	}
	return (
		typeof error === "string" &&
		(isTrumboNotSubscribedMessage(error) ||
			isFormattedTrumboPassSubscriptionMessage(error))
	);
}

export function isTrumboOrgIndividualInferenceSubscriptionErrorMessage(
	error: unknown,
): boolean {
	if (isTrumboOrgIndividualInferenceSubscriptionError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "TrumboOrgIndividualInferenceSubscriptionError" ||
			isTrumboOrgIndividualInferenceSubscriptionMessage(error.message) ||
			error.message === getTrumboOrgIndividualInferenceSubscriptionMessage()
		);
	}
	return (
		typeof error === "string" &&
		(isTrumboOrgIndividualInferenceSubscriptionMessage(error) ||
			error === getTrumboOrgIndividualInferenceSubscriptionMessage())
	);
}

export function formatCliErrorMessage(error: unknown): string {
	if (isTrumboPassSubscriptionError(error)) {
		return getCliNotSubscribedMessage();
	}
	if (isTrumboOrgIndividualInferenceSubscriptionErrorMessage(error)) {
		return getTrumboOrgIndividualInferenceSubscriptionMessage();
	}
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
