import type {
	TremboAccountActionRequest,
	ProviderActionRequest,
} from "@trembo/shared";
import type {
	TremboAccountBalance,
	TremboAccountOrganization,
	TremboAccountOrganizationBalance,
	TremboAccountOrganizationUsageTransaction,
	TremboAccountPaymentTransaction,
	TremboAccountUsageTransaction,
	TremboAccountUser,
	FeaturebaseTokenResponse,
} from "./types";

export interface TremboAccountOperations {
	fetchMe(): Promise<TremboAccountUser>;
	fetchBalance(userId?: string): Promise<TremboAccountBalance>;
	fetchUsageTransactions(
		userId?: string,
	): Promise<TremboAccountUsageTransaction[]>;
	fetchPaymentTransactions(
		userId?: string,
	): Promise<TremboAccountPaymentTransaction[]>;
	fetchUserOrganizations(): Promise<TremboAccountOrganization[]>;
	fetchOrganizationBalance(
		organizationId: string,
	): Promise<TremboAccountOrganizationBalance>;
	fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<TremboAccountOrganizationUsageTransaction[]>;
	switchAccount(organizationId?: string | null): Promise<void>;
	fetchFeaturebaseToken?(): Promise<FeaturebaseTokenResponse | undefined>;
}

export function isTremboAccountActionRequest(
	request: ProviderActionRequest,
): request is TremboAccountActionRequest {
	return request.action === "tremboAccount";
}

export async function executeTremboAccountAction(
	request: TremboAccountActionRequest,
	service: TremboAccountOperations,
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
				`Unsupported Trembo account operation: ${String(exhaustive)}`,
			);
		}
	}
}

export interface ProviderActionExecutor {
	runProviderAction(request: ProviderActionRequest): Promise<{
		result: unknown;
	}>;
}

export class RpcTremboAccountService implements TremboAccountOperations {
	private readonly executor: ProviderActionExecutor;

	constructor(executor: ProviderActionExecutor) {
		this.executor = executor;
	}

	public async fetchMe(): Promise<TremboAccountUser> {
		return this.request<TremboAccountUser>({
			action: "tremboAccount",
			operation: "fetchMe",
		});
	}

	public async fetchBalance(userId?: string): Promise<TremboAccountBalance> {
		return this.request<TremboAccountBalance>({
			action: "tremboAccount",
			operation: "fetchBalance",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUsageTransactions(
		userId?: string,
	): Promise<TremboAccountUsageTransaction[]> {
		return this.request<TremboAccountUsageTransaction[]>({
			action: "tremboAccount",
			operation: "fetchUsageTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchPaymentTransactions(
		userId?: string,
	): Promise<TremboAccountPaymentTransaction[]> {
		return this.request<TremboAccountPaymentTransaction[]>({
			action: "tremboAccount",
			operation: "fetchPaymentTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUserOrganizations(): Promise<TremboAccountOrganization[]> {
		return this.request<TremboAccountOrganization[]>({
			action: "tremboAccount",
			operation: "fetchUserOrganizations",
		});
	}

	public async fetchOrganizationBalance(
		organizationId: string,
	): Promise<TremboAccountOrganizationBalance> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<TremboAccountOrganizationBalance>({
			action: "tremboAccount",
			operation: "fetchOrganizationBalance",
			organizationId: orgId,
		});
	}

	public async fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<TremboAccountOrganizationUsageTransaction[]> {
		const orgId = input.organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<TremboAccountOrganizationUsageTransaction[]>({
			action: "tremboAccount",
			operation: "fetchOrganizationUsageTransactions",
			organizationId: orgId,
			...(input.memberId?.trim() ? { memberId: input.memberId.trim() } : {}),
		});
	}

	public async switchAccount(organizationId?: string | null): Promise<void> {
		await this.request<{ updated: boolean }>({
			action: "tremboAccount",
			operation: "switchAccount",
			organizationId: organizationId?.trim() || null,
		});
	}

	public async fetchFeaturebaseToken(): Promise<
		FeaturebaseTokenResponse | undefined
	> {
		return this.request<FeaturebaseTokenResponse | undefined>({
			action: "tremboAccount",
			operation: "fetchFeaturebaseToken",
		});
	}

	private async request<T>(request: TremboAccountActionRequest): Promise<T> {
		const response = await this.executor.runProviderAction(request);
		return response.result as T;
	}
}
