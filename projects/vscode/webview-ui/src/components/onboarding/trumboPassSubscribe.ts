import { StringRequest } from "@shared/proto/trumbo/common"
import { UiServiceClient } from "@/services/grpc-client"

// TrumboPass subscription signup + management live on the platform billing
// page (requires auth). The web app has no /onboarding/* or /dashboard/*
// routes — /billing is the single subscription surface.
const TRUMBO_PASS_SUBSCRIBE_PATH = "/billing"
const TRUMBO_PASS_USAGE_PATH = "/billing"
export const DEFAULT_APP_BASE_URL = "https://platform.trumbo.dev"

// Module-level so the pending intent survives OnboardingView unmounting: handleAuthCallback
// completes the welcome view (unmounting onboarding) before it pushes the auth-status update
// that sets trumboUser, so this must outlive the component to fire the redirect.
let pendingTrumboPassSubscribe = false

export function setPendingTrumboPassSubscribe(pending: boolean): void {
	pendingTrumboPassSubscribe = pending
}

// Opens the TrumboPass subscription page once a pending signup is authenticated (guarded so it fires once).
export function openTrumboPassSubscriptionIfPending(appBaseUrl: string | undefined): void {
	if (!pendingTrumboPassSubscribe) {
		return
	}
	pendingTrumboPassSubscribe = false
	const baseUrl = appBaseUrl || DEFAULT_APP_BASE_URL
	UiServiceClient.openUrl(StringRequest.create({ value: `${baseUrl}${TRUMBO_PASS_SUBSCRIBE_PATH}` })).catch((err) =>
		console.error("Failed to open TrumboPass subscription page:", err),
	)
}

export function buildTrumboPassSubscriptionPageUrl(appBaseUrl: string | undefined): string {
	return new URL(TRUMBO_PASS_USAGE_PATH, appBaseUrl || DEFAULT_APP_BASE_URL).toString()
}
