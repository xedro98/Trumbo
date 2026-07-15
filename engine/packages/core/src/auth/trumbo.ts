import {
	getTrumboEnvironmentConfig,
	type ITelemetryService,
} from "@trumbodev/shared";
import {
	captureAuthFailed,
	captureAuthLoggedOut,
	captureAuthStarted,
	captureAuthSucceeded,
	identifyAccount,
} from "../services/telemetry/core-events";
import { startLocalOAuthServer } from "./server";
import type { OAuthCredentials, OAuthLoginCallbacks } from "./types";
import {
	isCredentialLikelyExpired,
	parseAuthorizationInput,
	parseOAuthError,
	resolveAuthorizationCodeInput,
	resolveUrl,
} from "./utils";

const DEFAULT_AUTH_ENDPOINTS = {
	authorize: "/api/v1/auth/authorize",
	token: "/api/v1/auth/token",
	register: "/api/v1/auth/register",
	refresh: "/api/v1/auth/refresh",
} as const;

const DEFAULT_WORKOS_ENDPOINTS = {
	deviceAuthorization: "/user_management/authorize/device",
	authenticate: "/user_management/authenticate",
} as const;

const DEFAULT_WORKOS_API_BASE_URL = "https://api.workos.com";
const DEFAULT_CALLBACK_PATH = "/auth";
const DEFAULT_CALLBACK_PORTS = Array.from(
	{ length: 11 },
	(_, index) => 48801 + index,
);
const DEFAULT_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_RETRYABLE_TOKEN_GRACE_MS = 30 * 1000;
const DEFAULT_HTTP_TIMEOUT_MS = 30 * 1000;
const DEFAULT_DEVICE_AUTH_EXPIRES_IN_SECONDS = 300;
const DEFAULT_DEVICE_AUTH_INTERVAL_SECONDS = 5;

export type TrumboTokenResolution = {
	forceRefresh?: boolean;
	refreshBufferMs?: number;
	retryableTokenGraceMs?: number;
};

interface TrumboAuthApiUser {
	subject: string | null;
	email: string;
	name: string;
	trumboUserId: string | null;
	accounts: string[] | null;
}

interface TrumboAuthResponseData {
	accessToken: string;
	refreshToken?: string;
	tokenType: string;
	expiresAt: string;
	userInfo: TrumboAuthApiUser;
}

type TrumboTokenResponse = {
	success: boolean;
	data: TrumboAuthResponseData;
};

type HeaderMap = Record<string, string>;
type HeaderInput = HeaderMap | (() => Promise<HeaderMap> | HeaderMap);

export interface TrumboOAuthProviderOptions {
	apiBaseUrl: string;
	headers?: HeaderInput;
	requestTimeoutMs?: number;
	telemetry?: ITelemetryService;
	useWorkOSDeviceAuth?: boolean;
	callbackPath?: string;
	callbackPorts?: number[];
	/**
	 * Optional identity provider name for token exchange.
	 */
	provider?: string;
}

export interface TrumboOAuthCredentials extends OAuthCredentials {
	metadata?: {
		provider?: string;
		tokenType?: string;
		userInfo?: TrumboAuthApiUser;
		[key: string]: unknown;
	};
}

class TrumboOAuthTokenError extends Error {
	public readonly status?: number;
	public readonly errorCode?: string;

	constructor(message: string, opts?: { status?: number; errorCode?: string }) {
		super(message);
		this.name = "TrumboOAuthTokenError";
		this.status = opts?.status;
		this.errorCode = opts?.errorCode;
	}

	public isLikelyInvalidGrant(): boolean {
		if (
			this.errorCode &&
			/invalid_grant|invalid_token|unauthorized/i.test(this.errorCode)
		) {
			return true;
		}
		if (this.status === 400 || this.status === 401 || this.status === 403) {
			return /invalid|expired|revoked|unauthorized/i.test(this.message);
		}
		return false;
	}
}

function toEpochMs(isoDateTime: string): number {
	const epoch = Date.parse(isoDateTime);
	if (Number.isNaN(epoch)) {
		throw new Error(`Invalid expiresAt value: ${isoDateTime}`);
	}
	return epoch;
}

function toTrumboCredentials(
	responseData: TrumboAuthResponseData,
	provider: string | undefined,
	fallback: Partial<TrumboOAuthCredentials> = {},
): TrumboOAuthCredentials {
	const accountId = responseData.userInfo.trumboUserId ?? fallback.accountId;
	const refreshToken = responseData.refreshToken ?? fallback.refresh;

	if (!refreshToken) {
		throw new Error("Token response did not include a refresh token");
	}

	return {
		access: responseData.accessToken,
		refresh: refreshToken,
		expires: toEpochMs(responseData.expiresAt),
		accountId: accountId ?? undefined,
		email: responseData.userInfo.email || fallback.email,
		metadata: {
			provider,
			tokenType: responseData.tokenType,
			userInfo: responseData.userInfo,
		},
	};
}

async function resolveHeaders(input?: HeaderInput): Promise<HeaderMap> {
	if (!input) {
		return {};
	}
	return typeof input === "function" ? await input() : input;
}

function toSeconds(value: unknown, fallback: number): number {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return fallback;
	}
	return Math.floor(value);
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

type WorkOSDeviceAuthorizationResponse = {
	device_code?: string;
	user_code?: string;
	verification_uri?: string;
	verification_uri_complete?: string;
	expires_in?: number;
	interval?: number;
	error?: string;
	error_description?: string;
};

type WorkOSTokenResponse = {
	access_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	error?: string;
	error_description?: string;
};

type WorkOSTokenSuccess = {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
};

function requireTrumboTokenResponse(
	payload: TrumboTokenResponse,
	message: string,
): TrumboAuthResponseData {
	if (!payload.success || !payload.data?.accessToken) {
		throw new Error(message);
	}
	return payload.data;
}

async function requestWorkOSDeviceAuthorization(
	clientId: string,
	options?: { requestTimeoutMs?: number },
): Promise<{
	deviceCode: string;
	userCode: string;
	verificationUri: string;
	verificationUriComplete?: string;
	expiresInSeconds: number;
	pollIntervalSeconds: number;
}> {
	const response = await fetch(
		resolveUrl(
			DEFAULT_WORKOS_API_BASE_URL,
			DEFAULT_WORKOS_ENDPOINTS.deviceAuthorization,
		),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({ client_id: clientId }),
			signal: AbortSignal.timeout(
				options?.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
			),
		},
	);

	const json = (await response
		.json()
		.catch(() => ({}))) as WorkOSDeviceAuthorizationResponse;
	if (!response.ok) {
		throw new TrumboOAuthTokenError(
			`Device authorization failed: ${response.status}${json.error_description ? ` - ${json.error_description}` : ""}`,
			{ status: response.status, errorCode: json.error },
		);
	}
	if (!json.device_code || !json.user_code || !json.verification_uri) {
		throw new Error("Invalid WorkOS device authorization response");
	}

	return {
		deviceCode: json.device_code,
		userCode: json.user_code,
		verificationUri: json.verification_uri,
		verificationUriComplete: json.verification_uri_complete,
		expiresInSeconds: toSeconds(
			json.expires_in,
			DEFAULT_DEVICE_AUTH_EXPIRES_IN_SECONDS,
		),
		pollIntervalSeconds: toSeconds(
			json.interval,
			DEFAULT_DEVICE_AUTH_INTERVAL_SECONDS,
		),
	};
}

async function pollWorkOSTokens(options: {
	clientId: string;
	deviceCode: string;
	expiresInSeconds: number;
	initialPollIntervalSeconds: number;
	requestTimeoutMs: number;
	workosApiBaseUrl: string;
	onProgress?: OAuthLoginCallbacks["onProgress"];
}): Promise<WorkOSTokenSuccess> {
	const deadline = Date.now() + options.expiresInSeconds * 1000;
	let intervalSeconds = Math.max(1, options.initialPollIntervalSeconds);

	while (Date.now() <= deadline) {
		const response = await fetch(
			resolveUrl(
				options.workosApiBaseUrl,
				DEFAULT_WORKOS_ENDPOINTS.authenticate,
			),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "urn:ietf:params:oauth:grant-type:device_code",
					device_code: options.deviceCode,
					client_id: options.clientId,
				}),
				signal: AbortSignal.timeout(options.requestTimeoutMs),
			},
		);
		const payload = (await response
			.json()
			.catch(() => ({}))) as WorkOSTokenResponse;
		if (response.ok) {
			if (!payload.access_token || !payload.refresh_token) {
				throw new Error("Invalid WorkOS token response");
			}
			return {
				accessToken: payload.access_token,
				refreshToken: payload.refresh_token,
				tokenType: payload.token_type ?? "Bearer",
			};
		}

		switch (payload.error) {
			case "authorization_pending": {
				await sleep(intervalSeconds * 1000);
				break;
			}
			case "slow_down": {
				intervalSeconds += 1;
				await sleep(intervalSeconds * 1000);
				break;
			}
			case "access_denied":
			case "expired_token":
			case "invalid_grant": {
				throw new TrumboOAuthTokenError(
					payload.error_description || "WorkOS authorization failed",
					{
						status: response.status,
						errorCode: payload.error,
					},
				);
			}
			default: {
				throw new TrumboOAuthTokenError(
					`WorkOS token polling failed: ${response.status}${payload.error_description ? ` - ${payload.error_description}` : ""}`,
					{
						status: response.status,
						errorCode: payload.error,
					},
				);
			}
		}

		options.onProgress?.("Waiting for browser authentication confirmation...");
	}

	throw new Error("WorkOS device authorization timed out");
}

async function registerWorkOSTokens(
	workosTokens: WorkOSTokenSuccess,
	options: TrumboOAuthProviderOptions,
	provider?: string,
): Promise<TrumboOAuthCredentials> {
	const body = {
		accessToken: workosTokens.accessToken,
		refreshToken: workosTokens.refreshToken,
	};

	const response = await fetch(
		resolveUrl(options.apiBaseUrl, DEFAULT_AUTH_ENDPOINTS.register),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(await resolveHeaders(options.headers)),
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(
				options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
			),
		},
	);

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		const details = parseOAuthError(text);
		throw new TrumboOAuthTokenError(
			`Token registration failed: ${response.status}${details.message ? ` - ${details.message}` : ""}`,
			{ status: response.status, errorCode: details.code },
		);
	}

	const json = (await response.json()) as TrumboTokenResponse;
	return toTrumboCredentials(
		requireTrumboTokenResponse(json, "Invalid token exchange response"),
		provider ?? options.provider,
	);
}

async function exchangeAuthorizationCode(
	code: string,
	callbackUrl: string,
	options: TrumboOAuthProviderOptions,
	provider?: string,
): Promise<TrumboOAuthCredentials> {
	const body = {
		grant_type: "authorization_code",
		code,
		client_type: "extension",
		redirect_uri: callbackUrl,
		provider: provider ?? options.provider,
	};

	const response = await fetch(
		resolveUrl(options.apiBaseUrl, DEFAULT_AUTH_ENDPOINTS.token),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(await resolveHeaders(options.headers)),
			},
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(
				options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
			),
		},
	);

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		const details = parseOAuthError(text);
		throw new TrumboOAuthTokenError(
			`Token exchange failed: ${response.status}${details.message ? ` - ${details.message}` : ""}`,
			{ status: response.status, errorCode: details.code },
		);
	}

	const json = (await response.json()) as TrumboTokenResponse;
	return toTrumboCredentials(
		requireTrumboTokenResponse(json, "Invalid token exchange response"),
		provider ?? options.provider,
	);
}

export async function loginTrumboOAuth(
	options: TrumboOAuthProviderOptions & {
		callbacks: OAuthLoginCallbacks;
	},
): Promise<TrumboOAuthCredentials> {
	captureAuthStarted(options.telemetry, options.provider ?? "trumbo");
	const useWorkOSDeviceAuth = options.useWorkOSDeviceAuth ?? true;
	const callbackPorts = options.callbackPorts?.length
		? options.callbackPorts
		: DEFAULT_CALLBACK_PORTS;
	const callbackPath = options.callbackPath ?? DEFAULT_CALLBACK_PATH;
	const localServer = useWorkOSDeviceAuth
		? null
		: await startLocalOAuthServer({
				ports: callbackPorts,
				callbackPath,
				onListening: options.callbacks.onServerListening,
				onClose: options.callbacks.onServerClose,
			});
	const callbackUrl =
		localServer?.callbackUrl ||
		`http://127.0.0.1:${callbackPorts[0] ?? DEFAULT_CALLBACK_PORTS[0]}${callbackPath}`;

	try {
		let credentials: TrumboOAuthCredentials;
		const env = getTrumboEnvironmentConfig();
		// Self-hosted device auth (Trumbo web app) when no WorkOS client id is
		// configured. `auth trumbo` enters via loginTrumboOAuth, not only via
		// startTrumboDeviceAuth — both paths must branch the same way.
		if (!env.workOsClientId) {
			const deviceAuthorization = await requestSelfHostedDeviceAuthorization({
				apiBaseUrl: options.apiBaseUrl,
				requestTimeoutMs: options.requestTimeoutMs,
			});
			options.callbacks.onAuth({
				url:
					deviceAuthorization.verificationUriComplete ??
					deviceAuthorization.verificationUri,
				instructions: `Enter this code in your browser: ${deviceAuthorization.userCode}`,
			});
			const tokenData = await pollSelfHostedDeviceTokens({
				apiBaseUrl: options.apiBaseUrl,
				deviceCode: deviceAuthorization.deviceCode,
				expiresInSeconds: deviceAuthorization.expiresInSeconds,
				initialPollIntervalSeconds: deviceAuthorization.pollIntervalSeconds,
				requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
			});
			credentials = toTrumboCredentials(tokenData, options.provider);
		} else if (useWorkOSDeviceAuth) {
			const clientId = env.workOsClientId;
			const deviceAuthorization = await requestWorkOSDeviceAuthorization(
				clientId,
				options,
			);
			options.callbacks.onAuth({
				url:
					deviceAuthorization.verificationUriComplete ??
					deviceAuthorization.verificationUri,
				instructions: `Enter this code in your browser: ${deviceAuthorization.userCode}`,
			});

			const workosTokens = await pollWorkOSTokens({
				clientId,
				deviceCode: deviceAuthorization.deviceCode,
				expiresInSeconds: deviceAuthorization.expiresInSeconds,
				initialPollIntervalSeconds: deviceAuthorization.pollIntervalSeconds,
				requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
				workosApiBaseUrl: DEFAULT_WORKOS_API_BASE_URL,
				onProgress: options.callbacks.onProgress,
			});

			credentials = await registerWorkOSTokens(
				workosTokens,
				options,
				options.provider,
			);
		} else {
			const authUrl = new URL(
				resolveUrl(options.apiBaseUrl, DEFAULT_AUTH_ENDPOINTS.authorize),
			);
			authUrl.searchParams.set("client_type", "extension");
			authUrl.searchParams.set("callback_url", callbackUrl);
			authUrl.searchParams.set("redirect_uri", callbackUrl);
			options.callbacks.onAuth({
				url: authUrl.toString(),
				instructions: "Continue the authentication process in your browser.",
			});

			let code: string | undefined;
			let provider = options.provider;
			const authResult = await resolveAuthorizationCodeInput({
				waitForCallback: localServer?.waitForCallback ?? (async () => null),
				cancelWait: localServer?.cancelWait ?? (() => {}),
				onManualCodeInput: options.callbacks.onManualCodeInput,
				parseOptions: { includeProvider: true },
			});
			if (authResult.error) {
				throw new Error(`OAuth error: ${authResult.error}`);
			}
			code = authResult.code;
			provider = authResult.provider ?? provider;
			if (!code) {
				const input = await options.callbacks.onPrompt({
					message: "Paste the authorization code (or full redirect URL):",
				});
				const parsed = parseAuthorizationInput(input, {
					includeProvider: true,
				});
				code = parsed.code;
				provider = parsed.provider ?? provider;
			}
			if (!code) {
				throw new Error("Missing authorization code");
			}
			credentials = await exchangeAuthorizationCode(
				code,
				callbackUrl,
				options,
				provider,
			);
		}

		captureAuthSucceeded(options.telemetry, options.provider ?? "trumbo");
		identifyAccount(options.telemetry, {
			id: credentials.accountId,
			email: credentials.email,
			provider: options.provider ?? "trumbo",
		});
		return credentials;
	} catch (error) {
		captureAuthFailed(
			options.telemetry,
			options.provider ?? "trumbo",
			error instanceof Error ? error.message : String(error),
		);
		throw error;
	} finally {
		localServer?.close();
	}
}

/**
 * Self-hosted device-authorization request. Used when `workOsClientId` is empty
 * (the default once the Trumbo web app is the identity backend). The web app's
 * `POST /api/v1/auth/device` returns the same field shape as WorkOS's device
 * authorization response, so parsing mirrors `requestWorkOSDeviceAuthorization`.
 */
async function requestSelfHostedDeviceAuthorization(options: {
	apiBaseUrl: string;
	requestTimeoutMs?: number;
}): Promise<{
	deviceCode: string;
	userCode: string;
	verificationUri: string;
	verificationUriComplete?: string;
	expiresInSeconds: number;
	pollIntervalSeconds: number;
}> {
	const response = await fetch(
		resolveUrl(options.apiBaseUrl, "/api/v1/auth/device"),
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({}),
			signal: AbortSignal.timeout(
				options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
			),
		},
	);
	const json = (await response
		.json()
		.catch(() => ({}))) as WorkOSDeviceAuthorizationResponse;
	if (!response.ok) {
		throw new TrumboOAuthTokenError(
			`Device authorization failed: ${response.status}${json.error_description ? ` - ${json.error_description}` : ""}`,
			{ status: response.status, errorCode: json.error },
		);
	}
	if (!json.device_code || !json.user_code || !json.verification_uri) {
		throw new Error("Invalid device authorization response");
	}
	return {
		deviceCode: json.device_code,
		userCode: json.user_code,
		verificationUri: json.verification_uri,
		verificationUriComplete: json.verification_uri_complete,
		expiresInSeconds: toSeconds(
			json.expires_in,
			DEFAULT_DEVICE_AUTH_EXPIRES_IN_SECONDS,
		),
		pollIntervalSeconds: toSeconds(
			json.interval,
			DEFAULT_DEVICE_AUTH_INTERVAL_SECONDS,
		),
	};
}

/**
 * Self-hosted device-code token poll. Polls the web app's
 * `POST /api/v1/auth/token` with the device-code grant; once approved it
 * returns the Trumbo token envelope directly (no separate register step).
 * pending / slow_down / expired / denied handling mirrors `pollWorkOSTokens`.
 */
async function pollSelfHostedDeviceTokens(options: {
	apiBaseUrl: string;
	deviceCode: string;
	expiresInSeconds: number;
	initialPollIntervalSeconds: number;
	requestTimeoutMs: number;
}): Promise<TrumboAuthResponseData> {
	const deadline = Date.now() + options.expiresInSeconds * 1000;
	let intervalSeconds = Math.max(1, options.initialPollIntervalSeconds);

	while (Date.now() <= deadline) {
		let response: Response;
		let payload: Record<string, unknown>;
		try {
			response = await fetch(
				resolveUrl(options.apiBaseUrl, DEFAULT_AUTH_ENDPOINTS.token),
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						grant_type: "urn:ietf:params:oauth:grant-type:device_code",
						device_code: options.deviceCode,
					}),
					signal: AbortSignal.timeout(options.requestTimeoutMs),
				},
			);
			payload = (await response.json().catch(() => ({}))) as Record<
				string,
				unknown
			>;
		} catch {
			// Transient network errors (e.g. socket closed) during long poll — retry.
			await sleep(intervalSeconds * 1000);
			continue;
		}
		if (response.ok) {
			return requireTrumboTokenResponse(
				payload as unknown as TrumboTokenResponse,
				"Invalid token response",
			);
		}
		const errorCode =
			typeof payload.error === "string" ? payload.error : undefined;
		const errorDescription =
			typeof payload.error_description === "string"
				? payload.error_description
				: undefined;
		switch (errorCode) {
			case "authorization_pending": {
				await sleep(intervalSeconds * 1000);
				break;
			}
			case "slow_down": {
				intervalSeconds += 1;
				await sleep(intervalSeconds * 1000);
				break;
			}
			case "access_denied":
			case "expired_token":
			case "invalid_grant": {
				throw new TrumboOAuthTokenError(
					errorDescription || "Device authorization failed",
					{ status: response.status, errorCode: errorCode },
				);
			}
			default: {
				throw new TrumboOAuthTokenError(
					`Token polling failed: ${response.status}${errorDescription ? ` - ${errorDescription}` : ""}`,
					{ status: response.status, errorCode: errorCode },
				);
			}
		}
	}

	throw new Error("Device authorization timed out");
}

export async function startTrumboDeviceAuth(options?: {
	requestTimeoutMs?: number;
}): Promise<{
	deviceCode: string;
	userCode: string;
	verificationUri: string;
	verificationUriComplete?: string;
	expiresInSeconds: number;
	pollIntervalSeconds: number;
}> {
	const env = getTrumboEnvironmentConfig();
	// WorkOS device auth when a client id is configured; otherwise talk to the
	// self-hosted Trumbo web app's /api/v1/auth/device endpoint directly.
	if (env.workOsClientId) {
		return await requestWorkOSDeviceAuthorization(env.workOsClientId, options);
	}
	return await requestSelfHostedDeviceAuthorization({
		apiBaseUrl: env.apiBaseUrl,
		requestTimeoutMs: options?.requestTimeoutMs,
	});
}

export async function completeTrumboDeviceAuth(options: {
	deviceCode: string;
	expiresInSeconds: number;
	pollIntervalSeconds: number;
	apiBaseUrl: string;
	provider?: string;
	headers?: HeaderInput;
	requestTimeoutMs?: number;
	telemetry?: ITelemetryService;
}): Promise<TrumboOAuthCredentials> {
	const providerName = options.provider ?? "trumbo";
	captureAuthStarted(options.telemetry, providerName);
	try {
		const env = getTrumboEnvironmentConfig();
		let credentials: TrumboOAuthCredentials;
		if (env.workOsClientId) {
			const workosTokens = await pollWorkOSTokens({
				clientId: env.workOsClientId,
				deviceCode: options.deviceCode,
				expiresInSeconds: options.expiresInSeconds,
				initialPollIntervalSeconds: options.pollIntervalSeconds,
				requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
				workosApiBaseUrl: DEFAULT_WORKOS_API_BASE_URL,
			});
			credentials = await registerWorkOSTokens(
				workosTokens,
				{
					apiBaseUrl: options.apiBaseUrl,
					headers: options.headers,
					requestTimeoutMs: options.requestTimeoutMs,
					provider: options.provider,
				},
				options.provider,
			);
		} else {
			const tokenData = await pollSelfHostedDeviceTokens({
				apiBaseUrl: options.apiBaseUrl,
				deviceCode: options.deviceCode,
				expiresInSeconds: options.expiresInSeconds,
				initialPollIntervalSeconds: options.pollIntervalSeconds,
				requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
			});
			credentials = toTrumboCredentials(tokenData, providerName);
		}
		captureAuthSucceeded(options.telemetry, providerName);
		identifyAccount(options.telemetry, {
			id: credentials.accountId,
			email: credentials.email,
			provider: providerName,
		});
		return credentials;
	} catch (error) {
		captureAuthFailed(
			options.telemetry,
			providerName,
			error instanceof Error ? error.message : String(error),
		);
		throw error;
	}
}

export async function refreshTrumboToken(
	current: TrumboOAuthCredentials,
	options: TrumboOAuthProviderOptions,
): Promise<TrumboOAuthCredentials> {
	const response = await fetch(
		resolveUrl(options.apiBaseUrl, DEFAULT_AUTH_ENDPOINTS.refresh),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(await resolveHeaders(options.headers)),
			},
			body: JSON.stringify({
				refreshToken: current.refresh,
				grantType: "refresh_token",
			}),
			signal: AbortSignal.timeout(
				options.requestTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
			),
		},
	);

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		const details = parseOAuthError(text);
		throw new TrumboOAuthTokenError(
			`Token refresh failed: ${response.status}${details.message ? ` - ${details.message}` : ""}`,
			{ status: response.status, errorCode: details.code },
		);
	}

	const json = (await response.json()) as TrumboTokenResponse;
	const provider =
		(current.metadata?.provider as string | undefined) ?? options.provider;
	return toTrumboCredentials(
		requireTrumboTokenResponse(json, "Invalid token refresh response"),
		provider,
		current,
	);
}

export async function getValidTrumboCredentials(
	currentCredentials: TrumboOAuthCredentials | null,
	providerOptions: TrumboOAuthProviderOptions,
	options?: TrumboTokenResolution,
): Promise<TrumboOAuthCredentials | null> {
	if (!currentCredentials) {
		return null;
	}

	const refreshBufferMs = options?.refreshBufferMs ?? DEFAULT_REFRESH_BUFFER_MS;
	const retryableTokenGraceMs =
		options?.retryableTokenGraceMs ?? DEFAULT_RETRYABLE_TOKEN_GRACE_MS;
	const forceRefresh = options?.forceRefresh === true;

	if (
		!forceRefresh &&
		!isCredentialLikelyExpired(currentCredentials, refreshBufferMs)
	) {
		return currentCredentials;
	}

	try {
		return await refreshTrumboToken(currentCredentials, providerOptions);
	} catch (error) {
		if (
			error instanceof TrumboOAuthTokenError &&
			error.isLikelyInvalidGrant()
		) {
			captureAuthLoggedOut(
				providerOptions.telemetry,
				providerOptions.provider ?? "trumbo",
				"invalid_grant",
			);
			return null;
		}
		if (currentCredentials.expires - Date.now() > retryableTokenGraceMs) {
			// Keep current token on transient refresh failures while still valid.
			return currentCredentials;
		}
		return null;
	}
}
