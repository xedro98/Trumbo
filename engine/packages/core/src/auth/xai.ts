/**
 * xAI (Grok) OAuth device-code authentication.
 *
 * Implements the RFC 8628 device-code flow against xAI's auth endpoints so
 * users can sign in without manually pasting an API key. The CLI requests a
 * device code, shows the prefilled verification URL, and polls until the user
 * authorizes.
 *
 * Mirrors the device-code pattern in `trumbo.ts`. Live API testing against
 * xAI's endpoints is required to confirm the exact response shapes.
 */

import type { OAuthCredentials, OAuthLoginCallbacks } from "./types";

const XAI_DEVICE_ENDPOINT = "https://api.x.ai/auth/device";
const XAI_TOKEN_ENDPOINT = "https://api.x.ai/auth/token";
const XAI_CLI_CLIENT_ID = "trumbo-cli";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_EXPIRES_IN_SECONDS = 300;
const DEFAULT_POLL_INTERVAL_SECONDS = 5;

interface XaiDeviceCodeResponse {
	device_code?: string;
	user_code?: string;
	verification_uri?: string;
	verification_uri_complete?: string;
	expires_in?: number;
	interval?: number;
	error?: string;
	error_description?: string;
}

interface XaiTokenResponse {
	access_token?: string;
	refresh_token?: string;
	expires_in?: number;
	error?: string;
	error_description?: string;
}

export async function loginXaiOAuth(options: {
	callbacks: OAuthLoginCallbacks;
}): Promise<OAuthCredentials> {
	const { callbacks } = options;

	// Step 1: request a device code.
	const codeResponse = await fetch(XAI_DEVICE_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ client_id: XAI_CLI_CLIENT_ID }),
		signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
	});
	const codeJson = (await codeResponse
		.json()
		.catch(() => ({}))) as XaiDeviceCodeResponse;
	if (!codeResponse.ok || !codeJson.device_code) {
		throw new Error(
			`xAI device authorization failed: ${codeResponse.status}${codeJson.error_description ? ` - ${codeJson.error_description}` : ""}`,
		);
	}

	const verificationUrl =
		codeJson.verification_uri_complete ??
		codeJson.verification_uri ??
		"https://x.ai/auth";
	const expiresInSeconds = codeJson.expires_in ?? DEFAULT_EXPIRES_IN_SECONDS;
	const pollIntervalSeconds = Math.max(
		1,
		codeJson.interval ?? DEFAULT_POLL_INTERVAL_SECONDS,
	);

	// Step 2: show the user the prefilled verification URL.
	callbacks.onAuth({
		url: verificationUrl,
		instructions: codeJson.verification_uri_complete
			? "Opening your browser to authorize Trumbo with xAI..."
			: `Enter this code in your browser: ${codeJson.user_code}`,
	});
	callbacks.onProgress?.(
		`Waiting for xAI authorization (expires in ${expiresInSeconds}s)...`,
	);

	// Step 3: poll for the access token (RFC 8628).
	const deadline = Date.now() + expiresInSeconds * 1000;
	while (Date.now() <= deadline) {
		await new Promise((resolve) =>
			setTimeout(resolve, pollIntervalSeconds * 1000),
		);
		const tokenResponse = await fetch(XAI_TOKEN_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				device_code: codeJson.device_code,
				client_id: XAI_CLI_CLIENT_ID,
			}),
			signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
		});
		const tokenJson = (await tokenResponse
			.json()
			.catch(() => ({}))) as XaiTokenResponse;
		if (tokenJson.access_token) {
			return {
				access: tokenJson.access_token,
				refresh: tokenJson.refresh_token ?? tokenJson.access_token,
				expires: Date.now() + (tokenJson.expires_in ?? expiresInSeconds) * 1000,
			};
		}
		if (
			tokenJson.error &&
			tokenJson.error !== "authorization_pending" &&
			tokenJson.error !== "slow_down"
		) {
			throw new Error(
				`xAI authorization failed: ${tokenJson.error_description ?? tokenJson.error}`,
			);
		}
	}
	throw new Error(
		"xAI device authorization timed out waiting for user approval",
	);
}

export async function getValidXaiCredentials(
	credentials: OAuthCredentials,
): Promise<OAuthCredentials | null> {
	if (Date.now() < credentials.expires) {
		return credentials;
	}
	return null;
}
