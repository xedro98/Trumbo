import { ProviderSettingsManager } from "@trumbodev/core";
import { isProviderConfigured as hasPersistedProviderConfig } from "../../utils/provider-auth";
import type { TuiProps } from "../types";

/**
 * Onboarding gate. Decides whether the interactive TUI jumps straight into the
 * chat/home view or re-runs the onboarding wizard on startup.
 *
 * Mirrors the lenient semantics of `isProviderConfigured` in
 * `../../utils/provider-auth` (used by the provider picker): a provider counts
 * as configured when the user has completed setup for it — i.e. there is any
 * persisted API key, base URL, *or* saved model (and an OAuth access token for
 * OAuth providers). We intentionally do NOT require an API key here.
 *
 * Why: the runtime no longer pre-flights credentials (see the comment on the
 * sibling `isProviderConfigured`), so a missing key is surfaced as the
 * provider's own auth error on the first turn rather than by wiping the user's
 * setup. Gating on `isProviderSettingsUsable` instead forced a re-onboarding
 * loop for any bring-your-own-key provider that had a saved model but no
 * persisted `apiKey` (e.g. the key was never captured or was cleared), making
 * the CLI "forget everything" on every restart. The first-run default provider
 * (`trumbo`, OAuth) still triggers onboarding because it has no access token.
 */
export function isProviderConfigured(config: TuiProps["config"]): boolean {
	if (config.apiKey?.trim()) {
		return true;
	}
	const manager = new ProviderSettingsManager();
	const settings = manager.getProviderSettings(config.providerId);
	return hasPersistedProviderConfig(config.providerId, settings);
}
