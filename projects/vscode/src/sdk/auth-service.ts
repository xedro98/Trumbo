// Replaces classic src/services/auth/AuthService.ts (see origin/main)
//
// SDK-backed authentication service. Uses @trumbo/core OAuth functions
// for login flows and ProviderSettingsManager (providers.json) as the
// single source of truth for credentials.
//
// User profile info (email, displayName, organizations) is NOT stored on
// disk — it's fetched from the Trumbo API on startup and cached in memory.
// This matches the CLI's pattern (see apps/cli/src/runtime/interactive-welcome.ts).

import type { OAuthCredentials } from "@trumbo/core"
import {
	createOAuthClientCallbacks,
	getValidTrumboCredentials,
	loginTrumboOAuth,
	loginOcaOAuth,
	loginOpenAICodex,
	removePlatformKnowledgeMcpServer,
} from "@trumbo/core"
import type { ApiProvider } from "@shared/api"
import { AuthState, UserInfo } from "@shared/proto/trumbo/account"
import type { EmptyRequest, String } from "@shared/proto/trumbo/common"
import axios from "axios"
import { TrumboEnv } from "@/config"
import type { Controller } from "@/core/controller"
import { getRequestRegistry, type StreamingResponseHandler } from "@/core/controller/grpc-handler"
import { StateManager } from "@/core/storage/StateManager"
import { HostProvider } from "@/hosts/host-provider"
import { openAiCodexOAuthManager } from "@/integrations/openai-codex/oauth"
import { BannerService } from "@/services/banner/BannerService"
import { buildBasicTrumboHeaders } from "@/services/EnvUtils"
import { featureFlagsService } from "@/services/feature-flags"
import { telemetryService } from "@/services/telemetry"
import { TRUMBO_API_ENDPOINT } from "@/shared/trumbo/api"
import { fetch, getAxiosSettings } from "@/shared/net"
import { Logger } from "@/shared/services/Logger"
import { openExternal } from "@/utils/env"
import { getProviderSettingsManager } from "./provider-migration"
import { syncPlatformKnowledgeMcpFromAuthService } from "./platform-knowledge-mcp"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the auth info cached in memory (NOT persisted to disk). */
export interface TrumboAuthInfo {
	idToken: string
	refreshToken?: string
	expiresAt?: number // seconds since epoch
	userInfo: TrumboAccountUserInfo
	provider: string
	startedAt?: number
}

export interface TrumboAccountUserInfo {
	createdAt?: string
	displayName: string
	email: string
	id: string
	organizations: TrumboAccountOrganization[]
	appBaseUrl?: string
	subject?: string
}

export interface TrumboAccountOrganization {
	active: boolean
	memberId: string
	name: string
	organizationId: string
	roles: string[]
}

/** Logout reason for telemetry */
export enum LogoutReason {
	USER_INITIATED = "user_initiated",
	CROSS_WINDOW_SYNC = "cross_window_sync",
	ERROR_RECOVERY = "error_recovery",
	UNKNOWN = "unknown",
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WORKOS_TOKEN_PREFIX = "workos:"

// ---------------------------------------------------------------------------
// providers.json helpers
// ---------------------------------------------------------------------------

/**
 * Read Trumbo OAuth credentials from providers.json.
 * Returns { accessToken, refreshToken, expiresAt, accountId } or null.
 */
function readTrumboCredentials(): {
	accessToken: string
	refreshToken?: string
	expiresAt?: number // milliseconds since epoch (providers.json convention)
	accountId?: string
} | null {
	try {
		const manager = getProviderSettingsManager()
		const settings = manager.getProviderSettings("trumbo")
		if (!settings?.auth?.accessToken) return null

		// Strip workos: prefix if present (providers.json stores it with prefix)
		let accessToken = settings.auth.accessToken
		if (accessToken.toLowerCase().startsWith(WORKOS_TOKEN_PREFIX)) {
			accessToken = accessToken.slice(WORKOS_TOKEN_PREFIX.length)
		}

		return {
			accessToken,
			refreshToken: settings.auth.refreshToken,
			expiresAt: (settings.auth as { expiresAt?: number }).expiresAt,
			accountId: settings.auth.accountId,
		}
	} catch (error) {
		Logger.error("[SdkAuthService] Failed to read credentials from providers.json:", error)
		return null
	}
}

/**
 * Write Trumbo OAuth credentials to providers.json.
 */
function writeTrumboCredentials(credentials: {
	accessToken: string
	refreshToken?: string
	expiresAt?: number // milliseconds since epoch
	accountId?: string
}): void {
	try {
		const manager = getProviderSettingsManager()
		const existing = manager.getProviderSettings("trumbo")

		const auth = {
			...(existing?.auth ?? {}),
			accessToken: `${WORKOS_TOKEN_PREFIX}${credentials.accessToken}`,
			refreshToken: credentials.refreshToken,
			accountId: credentials.accountId,
		} as Record<string, unknown>
		if (credentials.expiresAt !== undefined) {
			auth.expiresAt = credentials.expiresAt
		}

		manager.saveProviderSettings(
			{
				...(existing ?? { provider: "trumbo" }),
				provider: "trumbo",
				auth: auth as { accessToken?: string; refreshToken?: string; accountId?: string },
			},
			{ tokenSource: "oauth", setLastUsed: true },
		)
	} catch (error) {
		Logger.error("[SdkAuthService] Failed to write credentials to providers.json:", error)
	}
}

/**
 * Clear Trumbo OAuth credentials from providers.json.
 */
function clearTrumboCredentials(): void {
	try {
		const manager = getProviderSettingsManager()
		const existing = manager.getProviderSettings("trumbo")
		if (existing) {
			manager.saveProviderSettings(
				{
					...existing,
					provider: "trumbo",
					auth: undefined,
				},
				{ tokenSource: "manual" },
			)
		}
	} catch (error) {
		Logger.error("[SdkAuthService] Failed to clear credentials from providers.json:", error)
	}
}

// ---------------------------------------------------------------------------
// AuthService
// ---------------------------------------------------------------------------

export class AuthService {
	private static instance: AuthService | null = null

	private _authenticated = false
	private _trumboAuthInfo: TrumboAuthInfo | null = null
	private _activeAuthStatusUpdateHandlers = new Set<StreamingResponseHandler<AuthState>>()
	private _handlerToController = new Map<StreamingResponseHandler<AuthState>, Controller>()
	private _refreshPromise: Promise<string | undefined> | null = null

	private constructor() {}

	/**
	 * Gets the singleton instance of AuthService.
	 * On first call with a controller, initializes BannerService.
	 */
	public static getInstance(controller?: Controller): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService()
		}
		// Initialize BannerService on first call with a controller
		// (mirrors classic AuthService behavior)
		if (controller) {
			try {
				BannerService.initialize(controller)
			} catch {
				// BannerService may already be initialized — that's fine
			}
		}
		return AuthService.instance
	}

	set controller(_controller: Controller) {
		// Kept for interface compatibility — not needed in SDK-backed version
	}

	// ---- SDK OAuth → TrumboAuthInfo conversion ----

	/**
	 * Convert SDK OAuthCredentials to our TrumboAuthInfo format.
	 * Also fetches full user info from the Trumbo API.
	 */
	private async credentialsToAuthInfo(credentials: OAuthCredentials, provider: string): Promise<TrumboAuthInfo> {
		// Fetch full user info from the API using the access token
		const userInfo = await this.fetchUserInfoFromApi(credentials.access)

		return {
			idToken: credentials.access,
			refreshToken: credentials.refresh,
			expiresAt: credentials.expires ? credentials.expires / 1000 : undefined, // SDK uses ms, we store seconds
			userInfo: userInfo ?? {
				id: credentials.accountId ?? "",
				email: credentials.email ?? "",
				displayName: "",
				organizations: [],
			},
			provider,
			startedAt: Date.now(),
		}
	}

	/**
	 * Fetch user info from the Trumbo API using an access token.
	 */
	private async fetchUserInfoFromApi(accessToken: string): Promise<TrumboAccountUserInfo | null> {
		try {
			const apiBaseUrl = TrumboEnv.config().apiBaseUrl
			// Ensure the token has the workos: prefix for the API
			const bearerToken = accessToken.toLowerCase().startsWith(WORKOS_TOKEN_PREFIX)
				? accessToken
				: `${WORKOS_TOKEN_PREFIX}${accessToken}`
			const response = await axios.get(`${apiBaseUrl}/api/v1/users/me`, {
				headers: {
					Authorization: `Bearer ${bearerToken}`,
					"Content-Type": "application/json",
					...(await buildBasicTrumboHeaders()),
				},
				...getAxiosSettings(),
			})
			return response.data?.data ?? null
		} catch (error) {
			Logger.error("[SdkAuthService] Failed to fetch user info from API:", error)
			return null
		}
	}

	private toOAuthCredentials(authInfo: TrumboAuthInfo): OAuthCredentials {
		return {
			access: authInfo.idToken,
			refresh: authInfo.refreshToken ?? "",
			expires: authInfo.expiresAt ? authInfo.expiresAt * 1000 : 0,
			accountId: authInfo.userInfo.id || undefined,
			email: authInfo.userInfo.email || undefined,
		}
	}

	private async resolveValidTrumboCredentials(
		authInfo: TrumboAuthInfo,
		options?: { forceRefresh?: boolean },
	): Promise<OAuthCredentials | null> {
		if (options?.forceRefresh && !authInfo.refreshToken) {
			return null
		}

		return getValidTrumboCredentials(
			this.toOAuthCredentials(authInfo),
			{ apiBaseUrl: TrumboEnv.config().apiBaseUrl },
			{ forceRefresh: options?.forceRefresh },
		)
	}

	// ---- Public API (used by gRPC handlers) ----

	/**
	 * Returns the current authentication token with the `workos:` prefix.
	 * Refreshes if necessary using the SDK's token management.
	 */
	async getAuthToken(): Promise<string | null> {
		if (!this._trumboAuthInfo?.idToken) {
			return null
		}

		// Check if we need to refresh
		const expiresAt = this._trumboAuthInfo.expiresAt
		if (expiresAt) {
			const currentTime = Date.now() / 1000
			const bufferSeconds = 5 * 60 // 5 minute buffer
			if (currentTime + bufferSeconds >= expiresAt) {
				// Token is expired or about to expire — try to refresh
				const refreshed = await this.refreshAccessToken()
				if (!refreshed) {
					return null
				}
			}
		}

		// Verify the token is still valid (not past expiry)
		if (expiresAt && Date.now() / 1000 >= expiresAt) {
			return null
		}

		return `${WORKOS_TOKEN_PREFIX}${this._trumboAuthInfo.idToken}`
	}

	/**
	 * Refresh the access token using the SDK's shared Trumbo credential validator.
	 * Persists refreshed credentials to providers.json when credentials change.
	 */
	private async refreshAccessToken(): Promise<boolean> {
		if (this._refreshPromise) {
			await this._refreshPromise
			return this._trumboAuthInfo?.idToken !== undefined
		}

		if (!this._trumboAuthInfo?.refreshToken) {
			return false
		}

		this._refreshPromise = (async () => {
			try {
				const currentInfo = this._trumboAuthInfo
				if (!currentInfo) {
					return undefined
				}
				const newCredentials = await this.resolveValidTrumboCredentials(currentInfo, { forceRefresh: true })
				if (!newCredentials) {
					this._trumboAuthInfo = null
					this._authenticated = false
					clearTrumboCredentials()
					await removePlatformKnowledgeMcpServer().catch(() => {})
					setImmediate(() => {
						this.sendAuthStatusUpdate().catch(() => {})
					})
					return undefined
				}

				const credentialsChanged =
					newCredentials.access !== currentInfo.idToken ||
					newCredentials.refresh !== (currentInfo.refreshToken ?? "") ||
					(newCredentials.expires ? newCredentials.expires / 1000 : undefined) !== currentInfo.expiresAt ||
					(newCredentials.accountId ?? "") !== currentInfo.userInfo.id

				const userInfo = credentialsChanged
					? await this.fetchUserInfoFromApi(newCredentials.access)
					: currentInfo.userInfo
				this._trumboAuthInfo = {
					idToken: newCredentials.access,
					refreshToken: newCredentials.refresh,
					expiresAt: newCredentials.expires ? newCredentials.expires / 1000 : undefined,
					userInfo: userInfo ?? currentInfo.userInfo,
					provider: currentInfo.provider,
					startedAt: currentInfo.startedAt ?? Date.now(),
				}
				this._authenticated = true

				if (credentialsChanged) {
					writeTrumboCredentials({
						accessToken: newCredentials.access,
						refreshToken: newCredentials.refresh,
						expiresAt: newCredentials.expires,
						accountId: this._trumboAuthInfo.userInfo.id,
					})
				}
				void this.syncPlatformKnowledgeMcpSettings()

				if (credentialsChanged) {
					setImmediate(() => {
						this.sendAuthStatusUpdate().catch((err) => {
							Logger.error("[SdkAuthService] Error sending auth status update after refresh:", err)
						})
					})
				}

				return this._trumboAuthInfo.idToken
			} catch (error) {
				Logger.error("[SdkAuthService] Token refresh failed:", error)
				return undefined
			} finally {
				this._refreshPromise = null
			}
		})()

		const result = await this._refreshPromise
		return result !== undefined
	}

	private async syncPlatformKnowledgeMcpSettings(): Promise<void> {
		await syncPlatformKnowledgeMcpFromAuthService(this)
	}

	/**
	 * Gets the active organization ID from the authenticated user's info.
	 */
	getActiveOrganizationId(): string | null {
		if (!this._trumboAuthInfo?.userInfo?.organizations) return null
		const activeOrg = this._trumboAuthInfo.userInfo.organizations.find((org) => org.active)
		return activeOrg?.organizationId ?? null
	}

	/**
	 * Gets all organizations from the authenticated user's info.
	 */
	getUserOrganizations(): TrumboAccountOrganization[] | undefined {
		return this._trumboAuthInfo?.userInfo?.organizations
	}

	/**
	 * Gets the provider name for the current authentication.
	 */
	getProviderName(): string | null {
		return this._trumboAuthInfo?.provider ?? null
	}

	/**
	 * Returns the current auth state for the webview.
	 */
	getInfo(): AuthState {
		if (this._trumboAuthInfo && this._authenticated) {
			const userInfo = this._trumboAuthInfo.userInfo
			userInfo.appBaseUrl = TrumboEnv.config().appBaseUrl

			const user = UserInfo.create({
				uid: userInfo?.id,
				displayName: userInfo?.displayName,
				email: userInfo?.email,
				photoUrl: undefined,
				appBaseUrl: userInfo?.appBaseUrl,
			})
			return AuthState.create({ user })
		}

		return AuthState.create({})
	}

	// ---- Login flows ----

	/**
	 * Initiate Trumbo OAuth login.
	 * Uses SDK's loginTrumboOAuth() which spawns a local callback server.
	 * Persists credentials to providers.json.
	 */
	async createAuthRequest(strict = false): Promise<String> {
		// In strict mode, don't open a new auth window if already authenticated
		if (strict && this._authenticated) {
			await this.sendAuthStatusUpdate()
			const { String: ProtoString } = await import("@shared/proto/trumbo/common")
			return ProtoString.create({ value: "Already authenticated" })
		}

		// E2E test mode: authenticate against the local mock API server instead
		// of loginTrumboOAuth(), which opens a real browser window the tests can't
		// interact with. Replaces classic AuthServiceMock (see origin/main
		// src/services/auth/AuthServiceMock.ts).
		if (process.env.E2E_TEST === "true") {
			return this.createMockAuthRequest()
		}

		let resolveAuthMessage!: (message: string) => void
		let rejectAuthMessage!: (error: unknown) => void
		const authMessagePromise = new Promise<string>((resolve, reject) => {
			resolveAuthMessage = resolve
			rejectAuthMessage = reject
		})

		void (async () => {
			try {
				const apiBaseUrl = TrumboEnv.config().apiBaseUrl
				const credentials = await loginTrumboOAuth({
					apiBaseUrl,
					// Use WorkOS device auth so the browser confirmation code can be surfaced in the extension.
					useWorkOSDeviceAuth: true,
					headers: await buildBasicTrumboHeaders(),
					callbacks: createOAuthClientCallbacks({
						onOutput: (message) => {
							resolveAuthMessage(message)
						},
						onPrompt: async (prompt) => prompt.defaultValue ?? "",
						openUrl: async (url: string) => {
							resolveAuthMessage(url)
							await openExternal(url)
						},
						onOpenUrlError: ({ url, error }) => {
							Logger.error(`[SdkAuthService] Failed to open browser for ${url}:`, error)
						},
					}),
				})

				// Convert and persist to providers.json
				const authInfo = await this.credentialsToAuthInfo(credentials, "trumbo")
				this._trumboAuthInfo = authInfo
				this._authenticated = true

				writeTrumboCredentials({
					accessToken: credentials.access,
					refreshToken: credentials.refresh,
					expiresAt: credentials.expires,
					accountId: authInfo.userInfo.id || credentials.accountId,
				})

				void this.syncPlatformKnowledgeMcpSettings()

				// Push auth state update
				await this.sendAuthStatusUpdate()

				// Notify BannerService of auth change (mirrors classic AuthService)
				BannerService.onAuthUpdate(authInfo.userInfo?.id || null).catch((error) => {
					Logger.error("[SdkAuthService] Banner update failed after login", error)
				})
			} catch (error) {
				rejectAuthMessage(error)
				Logger.error("[SdkAuthService] Trumbo OAuth login failed:", error)
			}
		})()

		const { String: ProtoString } = await import("@shared/proto/trumbo/common")
		return ProtoString.create({ value: await authMessagePromise })
	}

	/**
	 * E2E test login: exchange a well-known test code with the local mock API
	 * server (src/test/e2e/fixtures/server) for tokens, with no browser
	 * interaction. Replaces classic AuthServiceMock.createAuthRequest().
	 */
	private async createMockAuthRequest(): Promise<String> {
		if (TrumboEnv.config().environment !== "local") {
			throw new Error("E2E mock auth is only available when TRUMBO_ENVIRONMENT=local")
		}

		const apiBaseUrl = TrumboEnv.config().apiBaseUrl
		const tokenUrl = new URL(TRUMBO_API_ENDPOINT.TOKEN_EXCHANGE, apiBaseUrl)
		const response = await fetch(tokenUrl.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(await buildBasicTrumboHeaders()),
			},
			body: JSON.stringify({
				code: "test-personal-token",
				grantType: "authorization_code",
			}),
		})
		if (!response.ok) {
			throw new Error(`Mock server authentication failed: ${response.status} ${response.statusText}`)
		}
		const responseJSON = await response.json()
		const tokenData = responseJSON?.data
		if (!responseJSON?.success || !tokenData?.accessToken) {
			throw new Error("Invalid response from mock server")
		}

		this._trumboAuthInfo = {
			idToken: tokenData.accessToken,
			refreshToken: tokenData.refreshToken,
			expiresAt: new Date(tokenData.expiresAt).getTime() / 1000,
			userInfo: {
				id: tokenData.userInfo?.trumboUserId || tokenData.userInfo?.subject || "",
				email: tokenData.userInfo?.email || "",
				displayName: tokenData.userInfo?.name || "",
				createdAt: new Date().toISOString(),
				organizations: tokenData.userInfo?.organizations ?? [],
				appBaseUrl: TrumboEnv.config().appBaseUrl,
				subject: tokenData.userInfo?.subject,
			},
			provider: "trumbo",
			startedAt: Date.now(),
		}
		this._authenticated = true

		// Persist to providers.json so session config resolution
		// (resolveApiKey) and provider-usability checks see the credentials.
		writeTrumboCredentials({
			accessToken: tokenData.accessToken,
			refreshToken: tokenData.refreshToken,
			expiresAt: new Date(tokenData.expiresAt).getTime(),
			accountId: this._trumboAuthInfo.userInfo.id,
		})

		void this.syncPlatformKnowledgeMcpSettings()

		await this.sendAuthStatusUpdate()
		Logger.log(`[SdkAuthService] E2E mock login completed as ${this._trumboAuthInfo.userInfo.email}`)

		const { String: ProtoString } = await import("@shared/proto/trumbo/common")
		return ProtoString.create({ value: apiBaseUrl })
	}

	/**
	 * Initiate OCA OAuth login.
	 */
	async ocaLogin(): Promise<String> {
		try {
			const callbacks = createOAuthClientCallbacks({
				onPrompt: async (prompt) => prompt.defaultValue ?? "",
				openUrl: async (url: string) => {
					await openExternal(url)
				},
				onOpenUrlError: ({ url, error }) => {
					Logger.error(`[SdkAuthService] Failed to open browser for OCA: ${url}:`, error)
				},
			})

			const credentials = await loginOcaOAuth({ callbacks })

			const authInfo = await this.credentialsToAuthInfo(credentials, "oca")
			this._trumboAuthInfo = authInfo
			this._authenticated = true

			writeTrumboCredentials({
				accessToken: credentials.access,
				refreshToken: credentials.refresh,
				expiresAt: credentials.expires,
				accountId: authInfo.userInfo.id || credentials.accountId,
			})

			await this.sendAuthStatusUpdate()

			const { String: ProtoString } = await import("@shared/proto/trumbo/common")
			return ProtoString.create({ value: "Authenticated" })
		} catch (error) {
			Logger.error("[SdkAuthService] OCA OAuth login failed:", error)
			throw error
		}
	}

	/**
	 * Initiate OpenAI Codex OAuth login.
	 */
	async openAiCodexLogin(): Promise<void> {
		try {
			const callbacks = createOAuthClientCallbacks({
				onPrompt: async (prompt) => prompt.defaultValue ?? "",
				openUrl: async (url: string) => {
					await openExternal(url)
				},
				onOpenUrlError: ({ url, error }) => {
					Logger.error(`[SdkAuthService] Failed to open browser for Codex: ${url}:`, error)
				},
			})

			const credentials = await loginOpenAICodex(callbacks)

			// Store Codex credentials in providers.json
			await this.saveCodexCredentials(credentials)
			await openAiCodexOAuthManager.saveCredentials({
				type: "openai-codex",
				access_token: credentials.access,
				refresh_token: credentials.refresh,
				expires: credentials.expires,
				email: credentials.email,
				accountId: credentials.accountId,
			})

			// Notify webview of state change
			await this.sendAuthStatusUpdate()
		} catch (error) {
			Logger.error("[SdkAuthService] OpenAI Codex OAuth login failed:", error)
			throw error
		}
	}

	/**
	 * Save Codex OAuth credentials to provider settings.
	 */
	private async saveCodexCredentials(credentials: OAuthCredentials): Promise<void> {
		try {
			const manager = getProviderSettingsManager()
			const existing = manager.getProviderSettings("openai-codex")

			manager.saveProviderSettings(
				{
					...(existing ?? { provider: "openai-codex" }),
					provider: "openai-codex",
					auth: {
						accessToken: credentials.access,
						refreshToken: credentials.refresh,
						accountId: credentials.accountId,
					},
				},
				{ tokenSource: "oauth" },
			)
		} catch (error) {
			Logger.error("[SdkAuthService] Failed to save Codex credentials:", error)
		}
	}

	/**
	 * Clear Codex credentials from provider settings.
	 */
	async clearCodexCredentials(): Promise<void> {
		try {
			await openAiCodexOAuthManager.clearCredentials()

			const manager = getProviderSettingsManager()
			const existing = manager.getProviderSettings("openai-codex")
			if (existing) {
				manager.saveProviderSettings(
					{
						...existing,
						provider: "openai-codex",
						auth: undefined,
					},
					{ tokenSource: "manual" },
				)
			}
		} catch (error) {
			Logger.error("[SdkAuthService] Failed to clear Codex credentials:", error)
		}
	}

	// ---- Logout ----

	/**
	 * Handle deauthentication — clear tokens from providers.json and push unauthenticated state.
	 */
	async handleDeauth(_reason: LogoutReason = LogoutReason.UNKNOWN): Promise<void> {
		try {
			this._trumboAuthInfo = null
			this._authenticated = false
			clearTrumboCredentials()
			await removePlatformKnowledgeMcpServer().catch(() => {})
			await this.sendAuthStatusUpdate()

			// Notify BannerService of auth change (mirrors classic AuthService)
			BannerService.onAuthUpdate(null).catch((error) => {
				Logger.error("[SdkAuthService] Banner update failed after logout", error)
			})
		} catch (error) {
			Logger.error("[SdkAuthService] Error signing out:", error)
			throw error
		}
	}

	/**
	 * Handle auth callback from URI handler.
	 * This is called when the browser redirects back to the extension after OAuth.
	 */
	async handleAuthCallback(authorizationCode: string, provider: string): Promise<void> {
		try {
			// Exchange the authorization code for tokens using the Trumbo API
			const apiBaseUrl = TrumboEnv.config().apiBaseUrl
			const callbackUrl = await HostProvider.get().getCallbackUrl("/auth")

			const tokenUrl = new URL(TRUMBO_API_ENDPOINT.TOKEN_EXCHANGE, apiBaseUrl)
			const response = await fetch(tokenUrl.toString(), {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					...(await buildBasicTrumboHeaders()),
				},
				body: JSON.stringify({
					grant_type: "authorization_code",
					code: authorizationCode,
					client_type: "extension",
					redirect_uri: callbackUrl,
					provider: provider,
				}),
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error_description || "Failed to exchange authorization code for tokens")
			}

			const responseJSON = await response.json()
			const tokenData = responseJSON.data

			if (!tokenData.accessToken || !tokenData.refreshToken || !tokenData.userInfo) {
				throw new Error("Invalid token response from server")
			}

			// Fetch full user info
			const userInfo = await this.fetchUserInfoFromApi(tokenData.accessToken)

			const authInfo: TrumboAuthInfo = {
				idToken: tokenData.accessToken,
				refreshToken: tokenData.refreshToken,
				userInfo: userInfo ?? {
					id: tokenData.userInfo.trumboUserId || "",
					email: tokenData.userInfo.email || "",
					displayName: tokenData.userInfo.name || "",
					createdAt: new Date().toISOString(),
					organizations: [],
				},
				expiresAt: new Date(tokenData.expiresAt).getTime() / 1000,
				provider: "trumbo",
				startedAt: Date.now(),
			}

			this._trumboAuthInfo = authInfo
			this._authenticated = true

			// Persist to providers.json
			writeTrumboCredentials({
				accessToken: tokenData.accessToken,
				refreshToken: tokenData.refreshToken,
				expiresAt: new Date(tokenData.expiresAt).getTime(),
				accountId: authInfo.userInfo.id,
			})

			void this.syncPlatformKnowledgeMcpSettings()

			await this.sendAuthStatusUpdate()
		} catch (error) {
			Logger.error("[SdkAuthService] Error handling auth callback:", error)
			throw error
		}
	}

	/**
	 * Handle OCA auth callback.
	 */
	async handleOcaAuthCallback(_code: string, _state: string): Promise<void> {
		// OCA uses SDK's local callback server, so this shouldn't normally be called.
		// Keeping it as a stub for interface compatibility.
		Logger.warn("[SdkAuthService] handleOcaAuthCallback called — OCA uses SDK callback server")
	}

	// ---- Restore auth on startup ----

	/**
	 * Restore authentication from providers.json on startup.
	 *
	 * Reads tokens from providers.json, refreshes if needed, then fetches
	 * user profile from the API. This matches the CLI's pattern — credentials
	 * live in providers.json, user info is fetched fresh each session.
	 */
	async restoreRefreshTokenAndRetrieveAuthInfo(): Promise<void> {
		try {
			const creds = readTrumboCredentials()
			if (!creds) {
				this._authenticated = false
				this._trumboAuthInfo = null
				return
			}

			const restoredAuthInfo: TrumboAuthInfo = {
				idToken: creds.accessToken,
				refreshToken: creds.refreshToken,
				expiresAt: creds.expiresAt ? creds.expiresAt / 1000 : undefined, // providers.json uses ms, we use seconds
				userInfo: {
					id: creds.accountId ?? "",
					email: "",
					displayName: "",
					organizations: [],
				},
				provider: "trumbo",
			}

			const validCredentials = await this.resolveValidTrumboCredentials(restoredAuthInfo)
			if (!validCredentials) {
				this._authenticated = false
				this._trumboAuthInfo = null
				clearTrumboCredentials()
				await removePlatformKnowledgeMcpServer().catch(() => {})
				await this.sendAuthStatusUpdate()
				return
			}

			writeTrumboCredentials({
				accessToken: validCredentials.access,
				refreshToken: validCredentials.refresh,
				expiresAt: validCredentials.expires,
				accountId: validCredentials.accountId ?? restoredAuthInfo.userInfo.id,
			})

			this._trumboAuthInfo = {
				idToken: validCredentials.access,
				refreshToken: validCredentials.refresh,
				expiresAt: validCredentials.expires ? validCredentials.expires / 1000 : undefined,
				userInfo: {
					...restoredAuthInfo.userInfo,
					id: validCredentials.accountId ?? restoredAuthInfo.userInfo.id,
					email: validCredentials.email ?? restoredAuthInfo.userInfo.email,
				},
				provider: restoredAuthInfo.provider,
			}
			this._authenticated = true

			// Fetch full user info from the API (the key step — fills in
			// email, displayName, organizations that providers.json doesn't store)
			if (this._authenticated && this._trumboAuthInfo) {
				const userInfo = await this.fetchUserInfoFromApi(this._trumboAuthInfo.idToken)
				if (userInfo) {
					this._trumboAuthInfo.userInfo = userInfo
				} else {
					Logger.warn("[SdkAuthService] Could not fetch user info on restore — UI will show limited profile")
				}
			}

			void this.syncPlatformKnowledgeMcpSettings()

			await this.sendAuthStatusUpdate()

			// Notify BannerService of auth change (mirrors classic AuthService)
			BannerService.onAuthUpdate(this._trumboAuthInfo?.userInfo?.id || null).catch((error) => {
				Logger.error("[SdkAuthService] Banner update failed after restore", error)
			})
		} catch (error) {
			Logger.error("[SdkAuthService] Error restoring auth token:", error)
			this._authenticated = false
			this._trumboAuthInfo = null
		}
	}

	// ---- Streaming subscriptions ----

	/**
	 * Subscribe to authStatusUpdate events.
	 * Pushes initial auth state immediately on subscribe.
	 */
	async subscribeToAuthStatusUpdate(
		controller: Controller,
		_request: EmptyRequest,
		responseStream: StreamingResponseHandler<AuthState>,
		requestId?: string,
	): Promise<void> {
		this._activeAuthStatusUpdateHandlers.add(responseStream)
		this._handlerToController.set(responseStream, controller)

		const cleanup = () => {
			this._activeAuthStatusUpdateHandlers.delete(responseStream)
			this._handlerToController.delete(responseStream)
		}

		if (requestId) {
			getRequestRegistry().registerRequest(requestId, cleanup, { type: "authStatusUpdate_subscription" }, responseStream)
		}

		// Push initial auth state immediately (prevents race condition)
		try {
			await this.sendAuthStatusUpdate()
		} catch (error) {
			Logger.error("[SdkAuthService] Error sending initial auth status:", error)
			this._activeAuthStatusUpdateHandlers.delete(responseStream)
			this._handlerToController.delete(responseStream)
		}
	}

	/**
	 * Send an authStatusUpdate event to all active subscribers.
	 */
	async sendAuthStatusUpdate(): Promise<void> {
		const authState: AuthState = this.getInfo()
		const uniqueControllers = new Set<Controller>()

		const streamSends = Array.from(this._activeAuthStatusUpdateHandlers).map(async (responseStream) => {
			const controller = this._handlerToController.get(responseStream)
			if (controller) {
				uniqueControllers.add(controller)
			}
			try {
				await responseStream(authState, false)
			} catch (error) {
				Logger.error("[SdkAuthService] Error sending authStatusUpdate event:", error)
				this._activeAuthStatusUpdateHandlers.delete(responseStream)
				this._handlerToController.delete(responseStream)
			}
		})

		await Promise.all(streamSends)

		// Poll feature flags immediately for the current auth context so cache-only
		// consumers (for example BannerService) see the latest remote config.
		const authInfo = this._trumboAuthInfo
		if (authInfo?.userInfo) {
			await telemetryService.identifyAccount(authInfo.userInfo)
		}
		const userId = authInfo?.userInfo?.id || null
		await featureFlagsService.poll(userId)
		for (const controller of uniqueControllers) {
			controller.invalidateProviderListings()
		}

		// Update state in webviews once per unique controller
		await Promise.all(Array.from(uniqueControllers).map((c) => c.postStateToWebview()))
	}

	// ---- Provider-specific auth callbacks ----

	/**
	 * Shared helper: set a provider's API key and switch both plan/act modes to it.
	 */
	private setProviderApiKey(provider: ApiProvider, apiKeyField: string, apiKey: string): void {
		const stateManager = StateManager.get()
		const currentApiConfiguration = stateManager.getApiConfiguration()
		const updatedConfig = {
			...currentApiConfiguration,
			planModeApiProvider: provider,
			actModeApiProvider: provider,
			[apiKeyField]: apiKey,
		}
		stateManager.setApiConfiguration(updatedConfig)
	}

	/**
	 * Handle OpenRouter OAuth callback.
	 */
	async handleOpenRouterCallback(code: string): Promise<void> {
		let apiKey: string
		try {
			const response = await fetch("https://openrouter.ai/api/v1/auth/keys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code }),
			})
			if (!response.ok) {
				throw new Error(`OpenRouter API responded with status ${response.status}`)
			}
			const data = (await response.json()) as { key?: string }
			if (data?.key) {
				apiKey = data.key
			} else {
				throw new Error("Invalid response from OpenRouter API")
			}
		} catch (error) {
			Logger.error("[SdkAuthService] Error exchanging code for API key:", error)
			throw error
		}

		this.setProviderApiKey("openrouter", "openRouterApiKey", apiKey)
	}

	/**
	 * Handle Requesty OAuth callback.
	 */
	async handleRequestyCallback(code: string): Promise<void> {
		this.setProviderApiKey("requesty", "requestyApiKey", code)
	}

	/**
	 * Handle Hicap OAuth callback.
	 */
	async handleHicapCallback(code: string): Promise<void> {
		this.setProviderApiKey("hicap", "hicapApiKey", code)
	}
}
