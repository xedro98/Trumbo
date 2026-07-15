// Replaces classic src/services/account/TrumboAccountService.ts (see origin/main)
//
// SDK-backed account service. Handles credits, organizations, and user data
// by making authenticated requests to the Trumbo API.

import type { UserResponse } from "@shared/TrumboAccount"
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios"
import { TrumboEnv } from "@/config"
import { buildBasicTrumboHeaders } from "@/services/EnvUtils"
import { getAxiosSettings } from "@/shared/net"
import { Logger } from "@/shared/services/Logger"
import { TRUMBO_API_ENDPOINT } from "@/shared/trumbo/api"
import { AuthService } from "./auth-service"
import { syncPlatformKnowledgeMcpFromAuthService } from "./platform-knowledge-mcp"
import { getProviderSettingsManager } from "./provider-migration"

/**
 * Live rate-limit usage for a single window (5h / daily / weekly).
 */
export interface CurrentPlanRateLimitWindow {
	used: number
	limit: number
	resetsAtSec: number
}

export interface CurrentPlanBillingInfo {
	model: "individual" | "per_seat"
	seatCount: number | null
	memberCount: number | null
	pendingInviteCount: number | null
}

/**
 * Current subscription plan + live rate-limit usage returned by
 * `GET /api/v1/users/me/plan`. Replaces the legacy credit-balance fetch.
 * `null` when the user/team has no active paid subscription.
 */
export interface CurrentPlanResponse {
	plan?: {
		id?: string
		name?: string
		tier?: string
		displayName?: string
		type?: string
		interval?: string
	} | null
	planTier?: string
	billing?: CurrentPlanBillingInfo
	rateLimits?: {
		fiveHour?: CurrentPlanRateLimitWindow
		daily?: CurrentPlanRateLimitWindow
		weekly?: CurrentPlanRateLimitWindow
	} | null
	subscription?: {
		id?: string
		status?: string
		currentPeriodStart?: string
		currentPeriodEnd?: string
	} | null
	userId?: string
	agents?: {
		enabled: boolean
		hoursMonthly: number
		hoursUsed: number
		resetsAtSec: number
		concurrentAgents: number
		concurrentUsed: number
	}
	sandbox?: {
		enabled: boolean
		cpuSecondsMonthly: number
		cpuSecondsUsed: number
		resetsAtSec: number
		concurrentSandboxes: number
		concurrentUsed: number
		maxBackups?: number
	}
}

export interface PlatformInfrastructureRpcResponse {
	agentsJson?: string
	sandboxesJson?: string
	agentsUsageJson?: string
	sandboxUsageJson?: string
}

export class TrumboAccountService {
	private static instance: TrumboAccountService
	private _authService: AuthService

	constructor() {
		this._authService = AuthService.getInstance()
	}

	/**
	 * Returns the singleton instance of TrumboAccountService
	 */
	public static getInstance(): TrumboAccountService {
		if (!TrumboAccountService.instance) {
			TrumboAccountService.instance = new TrumboAccountService()
		}
		return TrumboAccountService.instance
	}

	/**
	 * Returns the base URL for the Trumbo API
	 */
	get baseUrl(): string {
		return TrumboEnv.config().apiBaseUrl
	}

	private async resolveOrganizationId(): Promise<string | undefined> {
		try {
			const manager = getProviderSettingsManager()
			const settings = manager.getProviderSettings("trumbo")
			const fromSettings = settings?.auth?.organizationId?.trim()
			if (fromSettings) {
				return fromSettings
			}
		} catch {
			// Fall through to auth service active org.
		}
		return this._authService.getActiveOrganizationId()?.trim() || undefined
	}

	/**
	 * Helper function to make authenticated requests to the Trumbo API.
	 * Uses the SDK-backed AuthService for token management.
	 */
	private async authenticatedRequest<T>(
		endpoint: string,
		config: AxiosRequestConfig = {},
		options?: { allowNullData?: boolean },
	): Promise<T> {
		const url = new URL(endpoint, this.baseUrl).toString()
		// IMPORTANT: Prefixed with 'workos:' so backend can route verification to WorkOS provider
		const trumboAccountAuthToken = await this._authService.getAuthToken()
		if (!trumboAccountAuthToken) {
			throw new Error("No Trumbo account auth token found")
		}
		const organizationId = await this.resolveOrganizationId()
		const requestConfig: AxiosRequestConfig = {
			...config,
			headers: {
				Authorization: `Bearer ${trumboAccountAuthToken}`,
				"Content-Type": "application/json",
				...(organizationId ? { "X-Org-Id": organizationId } : {}),
				...(await buildBasicTrumboHeaders()),
				...config.headers,
			},
			...getAxiosSettings(),
		}
		const response: AxiosResponse<{ data?: T; error: string; success: boolean }> = await axios.request({
			url,
			method: "GET",
			...requestConfig,
		})
		const status = response.status
		if (status < 200 || status >= 300) {
			throw new Error(`Request to ${endpoint} failed with status ${status}`)
		}
		if (typeof response.data === "object" && !response.data.success) {
			throw new Error(`API error: ${response.data.error}`)
		}
		if (response.statusText === "No Content") {
			return {} as T
		}
		const payload = response.data?.data
		if (payload === undefined) {
			throw new Error(`Invalid response from ${endpoint} API`)
		}
		if (payload === null && !options?.allowNullData) {
			throw new Error(`Invalid response from ${endpoint} API`)
		}
		return payload as T
	}

	/**
	 * RPC variant that fetches the current user's subscription plan + live
	 * rate-limit usage (5h / daily / weekly). Trumbo is subscription-based:
	 * there is no credit balance. Returns `null` when there is no active paid
	 * subscription, or `undefined` on auth/fetch failure.
	 */
	async fetchCurrentUserPlanRPC(): Promise<CurrentPlanResponse | null | undefined> {
		try {
			const data = await this.authenticatedRequest<CurrentPlanResponse | null>(
				"/api/v1/users/me/plan",
				{},
				{ allowNullData: true },
			)
			return data ?? null
		} catch (error) {
			Logger.error("Failed to fetch current plan (RPC):", error)
			return undefined
		}
	}

	/**
	 * Fetches cloud agent + sandbox sessions and usage for the platform dashboard.
	 */
	async fetchPlatformInfrastructureRPC(): Promise<PlatformInfrastructureRpcResponse | undefined> {
		try {
			const [plan, agentsRes, sandboxesRes] = await Promise.all([
				this.fetchCurrentUserPlanRPC(),
				this.authenticatedRequest<{ success: boolean; data: unknown[] }>("/api/v1/agents").catch(() => ({
					success: false,
					data: [],
				})),
				this.authenticatedRequest<{ success: boolean; data: unknown[] }>("/api/v1/sandbox").catch(() => ({
					success: false,
					data: [],
				})),
			])

			return {
				agentsJson: JSON.stringify(agentsRes.data ?? []),
				sandboxesJson: JSON.stringify(sandboxesRes.data ?? []),
				agentsUsageJson: plan?.agents ? JSON.stringify(plan.agents) : undefined,
				sandboxUsageJson: plan?.sandbox ? JSON.stringify(plan.sandbox) : undefined,
			}
		} catch (error) {
			Logger.error("Failed to fetch platform infrastructure (RPC):", error)
			return undefined
		}
	}

	/**
	 * Fetches the current user data
	 */
	async fetchMe(): Promise<UserResponse | undefined> {
		try {
			const data = await this.authenticatedRequest<UserResponse>(TRUMBO_API_ENDPOINT.USER_INFO)
			return data
		} catch (error) {
			Logger.error("Failed to fetch user data (RPC):", error)
			return undefined
		}
	}

	/**
	 * Fetches the current user's organizations
	 */
	async fetchUserOrganizationsRPC(): Promise<UserResponse["organizations"] | undefined> {
		try {
			const me = await this.fetchMe()
			if (!me || !me.organizations) {
				Logger.error("Failed to fetch user organizations")
				return undefined
			}
			return me.organizations
		} catch (error) {
			Logger.error("Failed to fetch user organizations (RPC):", error)
			return undefined
		}
	}

	/**
	 * Submits a spend limit increase request to the user's org admin.
	 */
	async submitLimitIncreaseRequestRPC(): Promise<void> {
		try {
			await this.authenticatedRequest<void>("/api/v1/users/me/budget/request", {
				method: "POST",
			})
		} catch (error) {
			Logger.error("Failed to submit limit increase request (RPC):", error)
			throw error
		}
	}

	/**
	 * Switches the active account to the specified organization or personal account.
	 */
	async switchAccount(organizationId?: string): Promise<void> {
		try {
			await this.authenticatedRequest<string>(TRUMBO_API_ENDPOINT.ACTIVE_ACCOUNT, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				data: {
					organizationId: organizationId || null,
				},
			})
			this.persistActiveOrganizationId(organizationId ?? null)
			await this._authService.restoreRefreshTokenAndRetrieveAuthInfo()
			await syncPlatformKnowledgeMcpFromAuthService(this._authService)
		} catch (error) {
			Logger.error("Error switching account:", error)
			await this._authService.restoreRefreshTokenAndRetrieveAuthInfo()
			throw error
		}
	}

	private persistActiveOrganizationId(organizationId: string | null): void {
		try {
			const manager = getProviderSettingsManager()
			const existing = manager.getProviderSettings("trumbo")
			if (!existing) {
				return
			}
			manager.saveProviderSettings({
				...existing,
				provider: "trumbo",
				auth: {
					...existing.auth,
					organizationId: organizationId?.trim() || undefined,
				},
			})
		} catch (error) {
			Logger.warn(
				`[TrumboAccountService] Failed to persist active organization id: ${
					error instanceof Error ? error.message : String(error)
				}`,
			)
		}
	}
}
