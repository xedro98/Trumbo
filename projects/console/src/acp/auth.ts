import type { ProviderSettingsManager } from "@trumbodev/core";
import {
	getProviderOAuthCredentialsFromSettings,
	getValidTrumboCredentials,
	loginAndSaveProviderOAuthCredentials,
} from "@trumbodev/core";
import { resolveTrumboApiBaseUrl } from "@trumbodev/shared";
import { getPersistedProviderApiKey } from "../commands/auth";
import { writeDiagnostic } from "../utils/output";

/**
 * The Trumbo inference gateway (`api.trumbo.dev`) authenticates with the CLI's
 * API-realm session token, stored with the `workos:` prefix used by every
 * Trumbo API credential. Set-aside tokens from other hosts (e.g. a desktop
 * `platform.trumbo.dev` session) are rejected with `invalid_grant`, so the
 * credential used for prompts must always come from the API realm.
 */
const TRUMBO_API_KEY_PREFIX = "workos:";

function formatTrumboApiKeyForAcp(accessToken: string): string {
	const token = accessToken.trim();
	return token.toLowerCase().startsWith(TRUMBO_API_KEY_PREFIX)
		? token
		: `${TRUMBO_API_KEY_PREFIX}${token}`;
}

/**
 * Supported ACP OAuth provider IDs.
 */
export const ACP_AUTH_METHODS = [
	{ id: "trumbo", name: "Sign in with Trumbo" },
	{ id: "openai-codex", name: "Sign in with ChatGPT Subscription" },
] as const;

export type AcpAuthMethodId = (typeof ACP_AUTH_METHODS)[number]["id"];

export function isAcpAuthMethodId(id: string): id is AcpAuthMethodId {
	return ACP_AUTH_METHODS.some((m) => m.id === id);
}

/**
 * Perform an OAuth login for the given provider in ACP mode.
 *
 * Since stdin/stdout are used for the JSON-RPC transport, all user-facing
 * output is written to stderr and URLs are opened via the `open` package.
 * If the OAuth flow requires interactive prompts (rare), defaults are used
 * when available; otherwise an error is thrown.
 */
async function performOAuthLogin(input: {
	providerId: AcpAuthMethodId;
	providerSettingsManager: ProviderSettingsManager;
}): Promise<string> {
	const [{ createOAuthClientCallbacks }, { default: open }] = await Promise.all(
		[import("@trumbodev/core"), import("open")],
	);

	const callbacks = createOAuthClientCallbacks({
		onPrompt: ({ defaultValue }) => {
			if (defaultValue) {
				return Promise.resolve(defaultValue);
			}
			return Promise.reject(
				new Error(
					"OAuth flow requires interactive input which is unavailable in ACP mode",
				),
			);
		},
		onOutput: (message) => writeDiagnostic(`[acp/auth] ${message}`),
		openUrl: (url) => open(url, { wait: false }).then(() => undefined),
		onOpenUrlError: ({ url }) => {
			writeDiagnostic(
				`[acp/auth] Could not open browser automatically. Open this URL manually:\n${url}`,
			);
		},
	});

	const settings = await loginAndSaveProviderOAuthCredentials(
		input.providerSettingsManager,
		input.providerId,
		{ callbacks },
	);
	const apiKey = getPersistedProviderApiKey(input.providerId, settings);
	if (!apiKey) {
		throw new Error(
			`OAuth login did not persist credentials for ${input.providerId}`,
		);
	}
	return apiKey;
}

export interface AcpAuthResult {
	providerId: AcpAuthMethodId;
	apiKey: string;
}

/**
 * Authenticate via OAuth for the given ACP auth method.
 *
 * Uses `ProviderSettingsManager` to check for existing credentials first,
 * falling back to a fresh OAuth login if needed.
 */
export async function authenticateAcpProvider(
	methodId: AcpAuthMethodId,
	providerSettingsManager: ProviderSettingsManager,
): Promise<AcpAuthResult> {
	const existing = providerSettingsManager.getProviderSettings(methodId);

	if (methodId === "trumbo") {
		// The persisted credential is validated + refreshed against the API realm
		// before use. A stored-but-expired token is thrown away (falling through to
		// a fresh device login) instead of being handed to the prompt path, where it
		// would 401 with `invalid_grant Authentication required.`.
		const stored = existing
			? getProviderOAuthCredentialsFromSettings(methodId, existing)
			: null;
		const valid = stored
			? await getValidTrumboCredentials(stored, {
					apiBaseUrl: resolveTrumboApiBaseUrl(existing?.baseUrl ?? undefined),
				})
			: null;
		if (valid?.access) {
			writeDiagnostic(`[acp/auth] Using valid Trumbo credentials`);
			return { providerId: methodId, apiKey: formatTrumboApiKeyForAcp(valid.access) };
		}
	} else {
		// Check for already-stored credentials.
		const existingKey = getPersistedProviderApiKey(methodId, existing);
		if (existingKey) {
			writeDiagnostic(`[acp/auth] Using existing credentials for ${methodId}`);
			return { providerId: methodId, apiKey: existingKey };
		}
	}

	// Perform a fresh OAuth login.
	writeDiagnostic(`[acp/auth] Starting OAuth login for ${methodId}…`);
	const apiKey = await performOAuthLogin({
		providerId: methodId,
		providerSettingsManager,
	});
	writeDiagnostic(`[acp/auth] Successfully authenticated with ${methodId}`);
	return { providerId: methodId, apiKey };
}
