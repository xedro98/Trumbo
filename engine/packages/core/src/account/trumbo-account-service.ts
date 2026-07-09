import type {
	FeaturebaseTokenResponse,
	TrumboAccountBalance,
	TrumboAccountOrganization,
	TrumboAccountOrganizationBalance,
	TrumboAccountOrganizationUsageTransaction,
	TrumboAccountPaymentTransaction,
	TrumboAccountUsageTransaction,
	TrumboAccountUser,
	TrumboOrganization,
	TrumboSubscriptionPlan,
	UserCurrentPlan,
	UserRemoteConfigResponse,
} from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

interface TrumboApiEnvelope<T> {
	success?: boolean;
	error?: string;
	data?: T;
}

function getTrumboApiEnvelopeError(parsed: unknown): string | undefined {
	if (typeof parsed !== "object" || parsed === null || !("error" in parsed)) {
		return undefined;
	}
	const error = parsed.error;
	return typeof error === "string" && error.trim() ? error : undefined;
}

function formatTrumboAccountRequestFailure(
	status: number,
	bodyText: string,
	parsed: unknown,
): string {
	const envelopeError = getTrumboApiEnvelopeError(parsed);
	if (envelopeError) {
		return envelopeError;
	}

	const body = bodyText.trim();
	if (body) {
		const preview = body.length > 200 ? `${body.slice(0, 200)}...` : body;
		return `Trumbo account request failed with status ${status}: ${preview}`;
	}

	return `Trumbo account request failed with status ${status}`;
}

function formatNonJsonAccountResponse(
	requestUrl: string,
	bodyText: string,
): string {
	const trimmed = bodyText.trim();
	if (/^<!doctype html|^<html[\s>]/i.test(trimmed)) {
		return (
			`Trumbo account API at ${requestUrl} returned a web page instead of JSON. ` +
			"Point TRUMBO_API_BASE_URL (or the Trumbo provider baseUrl) at the Trumbo web app " +
			"Worker — e.g. http://localhost:8787 for local dev — not the Vite dev server."
		);
	}
	const preview =
		trimmed.length > 120 ? `${trimmed.slice(0, 120)}...` : trimmed;
	return preview
		? `Trumbo account response was not valid JSON: ${preview}`
		: "Trumbo account response was not valid JSON";
}

export interface TrumboAccountServiceOptions {
	apiBaseUrl: string;
	getAuthToken: () => Promise<string | undefined | null>;
	getCurrentUserId?: () =>
		| Promise<string | undefined | null>
		| string
		| undefined
		| null;
	getOrganizationMemberId?: (
		organizationId: string,
	) => Promise<string | undefined | null> | string | undefined | null;
	getHeaders?: () =>
		| Promise<Record<string, string> | undefined>
		| Record<string, string>
		| undefined;
	requestTimeoutMs?: number;
	fetchImpl?: typeof fetch;
}

export class TrumboAccountService {
	private readonly apiBaseUrl: string;
	private readonly getAuthTokenFn: TrumboAccountServiceOptions["getAuthToken"];
	private readonly getCurrentUserIdFn: TrumboAccountServiceOptions["getCurrentUserId"];
	private readonly getOrganizationMemberIdFn: TrumboAccountServiceOptions["getOrganizationMemberId"];
	private readonly getHeadersFn: TrumboAccountServiceOptions["getHeaders"];
	private readonly requestTimeoutMs: number;
	private readonly fetchImpl: typeof fetch;

	constructor(options: TrumboAccountServiceOptions) {
		const apiBaseUrl = options.apiBaseUrl.trim();
		if (!apiBaseUrl) {
			throw new Error("apiBaseUrl is required");
		}

		this.apiBaseUrl = apiBaseUrl;
		this.getAuthTokenFn = options.getAuthToken;
		this.getCurrentUserIdFn = options.getCurrentUserId;
		this.getOrganizationMemberIdFn = options.getOrganizationMemberId;
		this.getHeadersFn = options.getHeaders;
		this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	public async fetchMe(): Promise<TrumboAccountUser> {
		return this.request<TrumboAccountUser>("/api/v1/users/me");
	}

	public async fetchRemoteConfig(): Promise<UserRemoteConfigResponse | null> {
		return this.request<UserRemoteConfigResponse | null>(
			"/api/v1/users/me/remote-config",
		);
	}

	public async fetchFeaturebaseToken(): Promise<
		FeaturebaseTokenResponse | undefined
	> {
		try {
			return await this.request<FeaturebaseTokenResponse>(
				"/api/v1/users/me/featurebase-token",
			);
		} catch {
			return undefined;
		}
	}

	public async fetchBalance(userId?: string): Promise<TrumboAccountBalance> {
		const resolvedUserId = await this.resolveUserId(userId);
		return this.request<TrumboAccountBalance>(
			`/api/v1/users/${encodeURIComponent(resolvedUserId)}/balance`,
		);
	}

	public async fetchUsageTransactions(
		userId?: string,
	): Promise<TrumboAccountUsageTransaction[]> {
		const resolvedUserId = await this.resolveUserId(userId);
		const response = await this.request<{
			items: TrumboAccountUsageTransaction[];
		}>(`/api/v1/users/${encodeURIComponent(resolvedUserId)}/usages`);
		return response.items ?? [];
	}

	public async fetchPaymentTransactions(
		userId?: string,
	): Promise<TrumboAccountPaymentTransaction[]> {
		const resolvedUserId = await this.resolveUserId(userId);
		const response = await this.request<{
			paymentTransactions: TrumboAccountPaymentTransaction[];
		}>(`/api/v1/users/${encodeURIComponent(resolvedUserId)}/payments`);
		return response.paymentTransactions ?? [];
	}

	public async fetchUserOrganizations(): Promise<TrumboAccountOrganization[]> {
		const me = await this.fetchMe();
		return me.organizations ?? [];
	}

	public async fetchAvailableSubscriptionPlans(): Promise<
		TrumboSubscriptionPlan[]
	> {
		return this.request<TrumboSubscriptionPlan[]>("/api/v1/billing/plans");
	}

	public async fetchCurrentUserPlan(): Promise<UserCurrentPlan | undefined> {
		return this.request<UserCurrentPlan | undefined>("/api/v1/users/me/plan");
	}

	public async fetchOrganization(
		organizationId: string,
	): Promise<TrumboOrganization> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<TrumboOrganization>(
			`/api/v1/organizations/${encodeURIComponent(orgId)}`,
		);
	}

	public async fetchOrganizationBalance(
		organizationId: string,
	): Promise<TrumboAccountOrganizationBalance> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<TrumboAccountOrganizationBalance>(
			`/api/v1/organizations/${encodeURIComponent(orgId)}/balance`,
		);
	}

	public async fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<TrumboAccountOrganizationUsageTransaction[]> {
		const organizationId = input.organizationId.trim();
		if (!organizationId) {
			throw new Error("organizationId is required");
		}

		const memberId = await this.resolveOrganizationMemberId(
			organizationId,
			input.memberId,
		);
		const response = await this.request<{
			items: TrumboAccountOrganizationUsageTransaction[];
		}>(
			`/api/v1/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(memberId)}/usages`,
		);
		return response.items ?? [];
	}

	public async switchAccount(organizationId?: string | null): Promise<void> {
		await this.request<void>("/api/v1/users/active-account", {
			method: "PUT",
			body: {
				organizationId: organizationId?.trim() || null,
			},
			expectNoContent: true,
		});
	}

	private async resolveUserId(userId?: string): Promise<string> {
		const explicit = userId?.trim();
		if (explicit) {
			return explicit;
		}

		const fromProvider = this.getCurrentUserIdFn
			? await this.getCurrentUserIdFn()
			: undefined;
		const provided = fromProvider?.trim();
		if (provided) {
			return provided;
		}

		const me = await this.fetchMe();
		if (!me.id?.trim()) {
			throw new Error("Unable to resolve current user id");
		}
		return me.id;
	}

	private async resolveOrganizationMemberId(
		organizationId: string,
		memberId?: string,
	): Promise<string> {
		const explicit = memberId?.trim();
		if (explicit) {
			return explicit;
		}

		const fromProvider = this.getOrganizationMemberIdFn
			? await this.getOrganizationMemberIdFn(organizationId)
			: undefined;
		const provided = fromProvider?.trim();
		if (provided) {
			return provided;
		}

		const organizations = await this.fetchUserOrganizations();
		const resolved = organizations.find(
			(org) => org.organizationId === organizationId,
		)?.memberId;
		if (!resolved?.trim()) {
			throw new Error(
				`Unable to resolve memberId for organization ${organizationId}`,
			);
		}
		return resolved;
	}

	private async request<T>(
		endpoint: string,
		input?: {
			method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
			body?: unknown;
			expectNoContent?: boolean;
		},
	): Promise<T> {
		const token = (await this.getAuthTokenFn())?.trim();
		if (!token) {
			throw new Error("No Trumbo account auth token found");
		}

		const extraHeaders = this.getHeadersFn ? await this.getHeadersFn() : {};
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

		try {
			const requestUrl = new URL(endpoint, this.apiBaseUrl).toString();
			const response = await this.fetchImpl(requestUrl, {
				method: input?.method ?? "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					...(extraHeaders ?? {}),
				},
				body:
					input?.body !== undefined ? JSON.stringify(input.body) : undefined,
				signal: controller.signal,
			});

			if (response.status === 204 || input?.expectNoContent) {
				if (!response.ok) {
					throw new Error(
						`Trumbo account request failed with status ${response.status}`,
					);
				}
				return undefined as T;
			}

			const text = await response.text();
			let parsed: unknown;
			if (text.trim()) {
				try {
					parsed = JSON.parse(text);
				} catch {
					if (!response.ok) {
						throw new Error(
							formatTrumboAccountRequestFailure(
								response.status,
								text,
								undefined,
							),
						);
					}
					throw new Error(formatNonJsonAccountResponse(requestUrl, text));
				}
			}

			if (!response.ok) {
				throw new Error(
					formatTrumboAccountRequestFailure(response.status, text, parsed),
				);
			}

			if (typeof parsed === "object" && parsed !== null) {
				const envelope = parsed as TrumboApiEnvelope<T>;
				if (typeof envelope.success === "boolean") {
					if (!envelope.success) {
						throw new Error(envelope.error || "Trumbo account request failed");
					}
					return envelope.data as T;
				}
			}

			if (parsed === undefined || parsed === null) {
				throw new Error("Trumbo account response payload was empty");
			}
			return parsed as T;
		} finally {
			clearTimeout(timeout);
		}
	}
}
