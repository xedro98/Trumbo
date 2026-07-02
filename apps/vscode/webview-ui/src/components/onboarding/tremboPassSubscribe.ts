import { StringRequest } from "@shared/proto/trembo/common"
import { UiServiceClient } from "@/services/grpc-client"

// TremboPass subscription signup page in the dashboard (requires auth).
const TREMBO_PASS_SUBSCRIBE_PATH = "/onboarding/individual-plan"
const TREMBO_PASS_USAGE_PATH = "/dashboard/subscription"
export const DEFAULT_APP_BASE_URL = "http://0.0.0.0:0"

// Module-level so the pending intent survives OnboardingView unmounting: handleAuthCallback
// completes the welcome view (unmounting onboarding) before it pushes the auth-status update
// that sets tremboUser, so this must outlive the component to fire the redirect.
let pendingTremboPassSubscribe = false

export function setPendingTremboPassSubscribe(pending: boolean): void {
	pendingTremboPassSubscribe = pending
}

// Opens the TremboPass subscription page once a pending signup is authenticated (guarded so it fires once).
export function openTremboPassSubscriptionIfPending(appBaseUrl: string | undefined): void {
	if (!pendingTremboPassSubscribe) {
		return
	}
	pendingTremboPassSubscribe = false
	const baseUrl = appBaseUrl || DEFAULT_APP_BASE_URL
	UiServiceClient.openUrl(StringRequest.create({ value: `${baseUrl}${TREMBO_PASS_SUBSCRIBE_PATH}` })).catch((err) =>
		console.error("Failed to open TremboPass subscription page:", err),
	)
}

export function buildTremboPassSubscriptionPageUrl(appBaseUrl: string | undefined): string {
	return new URL(TREMBO_PASS_USAGE_PATH, appBaseUrl || DEFAULT_APP_BASE_URL).toString()
}
