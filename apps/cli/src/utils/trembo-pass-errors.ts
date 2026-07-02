import {
	type TremboSubscriptionPlan,
	getTremboOrgIndividualInferenceSubscriptionMessage,
	isTremboNotSubscribedError,
	isTremboNotSubscribedMessage,
	isTremboOrgIndividualInferenceSubscriptionError,
	isTremboOrgIndividualInferenceSubscriptionMessage,
} from "@trembo/core";

import { getTremboEnvironmentConfig } from "@trembo/shared";

export { getTremboOrgIndividualInferenceSubscriptionMessage };

export const CLI_PROMO_CODE = "CLI-8OFF";

export function getCliSubscriptionUrl(): string {
	return `${new URL(
		`/promo?code=${CLI_PROMO_CODE}&personal=true`,
		getTremboEnvironmentConfig().appBaseUrl,
	).toString()}`;
}

export function getCliNotSubscribedMessage(): string {
	return `No access to TremboPass subscription models yet. Subscribe to TremboPass, the low cost open weights model coding plan: ${getCliSubscriptionUrl()}`;
}

export function getIndividualPlanFeatures(
	plans: TremboSubscriptionPlan[],
): string[] {
	const planWithFeatures = plans.find((plan) => plan.interval === "Monthly");

	return planWithFeatures?.features?.included ?? [];
}

function isFormattedTremboPassSubscriptionMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("no access to trembopass subscription models yet") &&
		normalized.includes("subscribe to trembopass")
	);
}

export function isTremboPassSubscriptionError(error: unknown): boolean {
	if (isTremboNotSubscribedError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "TremboNotSubscribedError" ||
			isTremboNotSubscribedMessage(error.message) ||
			isFormattedTremboPassSubscriptionMessage(error.message)
		);
	}
	return (
		typeof error === "string" &&
		(isTremboNotSubscribedMessage(error) ||
			isFormattedTremboPassSubscriptionMessage(error))
	);
}

export function isTremboOrgIndividualInferenceSubscriptionErrorMessage(
	error: unknown,
): boolean {
	if (isTremboOrgIndividualInferenceSubscriptionError(error)) {
		return true;
	}
	if (error instanceof Error) {
		return (
			error.name === "TremboOrgIndividualInferenceSubscriptionError" ||
			isTremboOrgIndividualInferenceSubscriptionMessage(error.message) ||
			error.message === getTremboOrgIndividualInferenceSubscriptionMessage()
		);
	}
	return (
		typeof error === "string" &&
		(isTremboOrgIndividualInferenceSubscriptionMessage(error) ||
			error === getTremboOrgIndividualInferenceSubscriptionMessage())
	);
}

export function formatCliErrorMessage(error: unknown): string {
	if (isTremboPassSubscriptionError(error)) {
		return getCliNotSubscribedMessage();
	}
	if (isTremboOrgIndividualInferenceSubscriptionErrorMessage(error)) {
		return getTremboOrgIndividualInferenceSubscriptionMessage();
	}
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
