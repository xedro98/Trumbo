import type {
	ProviderActionRequest,
	TrumboAccountActionRequest,
} from "@trumbodev/shared";
import type {
	FeaturebaseTokenResponse,
	TrumboAccountBalance,
	TrumboAccountOrganization,
	TrumboAccountOrganizationBalance,
	TrumboAccountOrganizationUsageTransaction,
	TrumboAccountPaymentTransaction,
	TrumboAccountUsageTransaction,
	TrumboAccountUser,
} from "./types";

export interface TrumboAccountOperations {
	fetchMe(): Promise<TrumboAccountUser>;
	fetchBalance(userId?: string): Promise<TrumboAccountBalance>;
	fetchUsageTransactions(
		userId?: string,
	): Promise<TrumboAccountUsageTransaction[]>;
	fetchPaymentTransactions(
		userId?: string,
	): Promise<TrumboAccountPaymentTransaction[]>;
	fetchUserOrganizations(): Promise<TrumboAccountOrganization[]>;
	fetchOrganizationBalance(
		organizationId: string,
	): Promise<TrumboAccountOrganizationBalance>;
	fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<TrumboAccountOrganizationUsageTransaction[]>;
	switchAccount(organizationId?: string | null): Promise<void>;
	fetchFeaturebaseToken?(): Promise<FeaturebaseTokenResponse | undefined>;
}

export function isTrumboAccountActionRequest(
	request: ProviderActionRequest,
): request is TrumboAccountActionRequest {
	return request.action === "trumboAccount";
}

export async function executeTrumboAccountAction(
	request: TrumboAccountActionRequest,
	service: TrumboAccountOperations,
): Promise<unknown> {
	switch (request.operation) {
		case "fetchMe":
			return service.fetchMe();
		case "fetchBalance":
			return service.fetchBalance(request.userId);
		case "fetchUsageTransactions":
			return service.fetchUsageTransactions(request.userId);
		case "fetchPaymentTransactions":
			return service.fetchPaymentTransactions(request.userId);
		case "fetchUserOrganizations":
			return service.fetchUserOrganizations();
		case "fetchOrganizationBalance":
			return service.fetchOrganizationBalance(request.organizationId);
		case "fetchOrganizationUsageTransactions":
			return service.fetchOrganizationUsageTransactions({
				organizationId: request.organizationId,
				memberId: request.memberId,
			});
		case "switchAccount":
			await service.switchAccount(request.organizationId);
			return { updated: true };
		case "fetchFeaturebaseToken":
			return service.fetchFeaturebaseToken?.();
		default: {
			const exhaustive: never = request;
			throw new Error(
				`Unsupported Trumbo account operation: ${String(exhaustive)}`,
			);
		}
	}
}

export interface ProviderActionExecutor {
	runProviderAction(request: ProviderActionRequest): Promise<{
		result: unknown;
	}>;
}

export class RpcTrumboAccountService implements TrumboAccountOperations {
	private readonly executor: ProviderActionExecutor;

	constructor(executor: ProviderActionExecutor) {
		this.executor = executor;
	}

	public async fetchMe(): Promise<TrumboAccountUser> {
		return this.request<TrumboAccountUser>({
			action: "trumboAccount",
			operation: "fetchMe",
		});
	}

	public async fetchBalance(userId?: string): Promise<TrumboAccountBalance> {
		return this.request<TrumboAccountBalance>({
			action: "trumboAccount",
			operation: "fetchBalance",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUsageTransactions(
		userId?: string,
	): Promise<TrumboAccountUsageTransaction[]> {
		return this.request<TrumboAccountUsageTransaction[]>({
			action: "trumboAccount",
			operation: "fetchUsageTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchPaymentTransactions(
		userId?: string,
	): Promise<TrumboAccountPaymentTransaction[]> {
		return this.request<TrumboAccountPaymentTransaction[]>({
			action: "trumboAccount",
			operation: "fetchPaymentTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUserOrganizations(): Promise<TrumboAccountOrganization[]> {
		return this.request<TrumboAccountOrganization[]>({
			action: "trumboAccount",
			operation: "fetchUserOrganizations",
		});
	}

	public async fetchOrganizationBalance(
		organizationId: string,
	): Promise<TrumboAccountOrganizationBalance> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<TrumboAccountOrganizationBalance>({
			action: "trumboAccount",
			operation: "fetchOrganizationBalance",
			organizationId: orgId,
		});
	}

	public async fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<TrumboAccountOrganizationUsageTransaction[]> {
		const orgId = input.organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<TrumboAccountOrganizationUsageTransaction[]>({
			action: "trumboAccount",
			operation: "fetchOrganizationUsageTransactions",
			organizationId: orgId,
			...(input.memberId?.trim() ? { memberId: input.memberId.trim() } : {}),
		});
	}

	public async switchAccount(organizationId?: string | null): Promise<void> {
		await this.request<{ updated: boolean }>({
			action: "trumboAccount",
			operation: "switchAccount",
			organizationId: organizationId?.trim() || null,
		});
	}

	public async fetchFeaturebaseToken(): Promise<
		FeaturebaseTokenResponse | undefined
	> {
		return this.request<FeaturebaseTokenResponse | undefined>({
			action: "trumboAccount",
			operation: "fetchFeaturebaseToken",
		});
	}

	private async request<T>(request: TrumboAccountActionRequest): Promise<T> {
		const response = await this.executor.runProviderAction(request);
		return response.result as T;
	}
}
