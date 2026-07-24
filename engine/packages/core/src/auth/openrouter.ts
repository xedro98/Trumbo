/**
 * OpenRouter OAuth device-code authentication.
 *
 * Implements OpenRouter's device-code flow so users can sign in without
 * manually pasting an API key. The CLI requests a device code, shows the
 * verification URL, and polls until the user authorizes. The resulting access
 * token is stored as the provider's API key.
 *
 * Mirrors the device-code pattern in `trumbo.ts`. Live API testing against
 * OpenRouter's endpoints is required to confirm the exact response shapes.
 */

import type { OAuthCredentials, OAuthLoginCallbacks } from "./types";

const OPENROUTER_AUTH_BASE = "https://openrouter.ai/api/v1/auth";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_EXPIRES_IN_SECONDS = 3600;

interface OpenRouterDeviceCodeResponse {
	code?: string;
	verification_url?: string;
	expires_in?: number;
	interval?: number;
	error?: string;
	error_description?: string;
}

interface OpenRouterTokenResponse {
	token?: string;
	access_token?: string;
	error?: string;
	error_description?: string;
}

export async function loginOpenRouterOAuth(options: {
	callbacks: OAuthLoginCallbacks;
}): Promise<OAuthCredentials> {
	const { callbacks } = options;

	// Step 1: request a device code.
	const codeResponse = await fetch(OPENROUTER_AUTH_BASE, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "auth" }),
		signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
	});
	const codeJson = (await codeResponse
		.json()
		.catch(() => ({}))) as OpenRouterDeviceCodeResponse;
	if (!codeResponse.ok || !codeJson.code) {
		throw new Error(
			`OpenRouter device authorization failed: ${codeResponse.status}${codeJson.error_description ? ` - ${codeJson.error_description}` : ""}`,
		);
	}

	const verificationUrl =
		codeJson.verification_url ?? "https://openrouter.ai/auth";
	const expiresInSeconds = codeJson.expires_in ?? DEFAULT_EXPIRES_IN_SECONDS;
	const pollIntervalSeconds = Math.max(1, codeJson.interval ?? 5);

	// Step 2: show the user the verification URL + code.
	callbacks.onAuth({
		url: verificationUrl,
		instructions: `Open the URL in your browser to authorize Trumbo. Code: ${codeJson.code}`,
	});
	callbacks.onProgress?.(
		`Waiting for OpenRouter authorization (expires in ${expiresInSeconds}s)...`,
	);

	// Step 3: poll for the access token.
	const deadline = Date.now() + expiresInSeconds * 1000;
	while (Date.now() <= deadline) {
		await new Promise((resolve) =>
			setTimeout(resolve, pollIntervalSeconds * 1000),
		);
		const tokenResponse = await fetch(OPENROUTER_AUTH_BASE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "token", code: codeJson.code }),
			signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
		});
		const tokenJson = (await tokenResponse
			.json()
			.catch(() => ({}))) as OpenRouterTokenResponse;
		const token = tokenJson.token ?? tokenJson.access_token;
		if (token) {
			return {
				access: token,
				refresh: token,
				expires: Date.now() + expiresInSeconds * 1000,
			};
		}
		if (tokenJson.error && tokenJson.error !== "pending") {
			throw new Error(
				`OpenRouter authorization failed: ${tokenJson.error_description ?? tokenJson.error}`,
			);
		}
	}
	throw new Error(
		"OpenRouter device authorization timed out waiting for user approval",
	);
}

export async function getValidOpenRouterCredentials(
	credentials: OAuthCredentials,
): Promise<OAuthCredentials | null> {
	// OpenRouter's device-code tokens are long-lived; return as-is unless
	// expired. A refresh-token flow can be added when OpenRouter documents one.
	if (Date.now() < credentials.expires) {
		return credentials;
	}
	return null;
}
