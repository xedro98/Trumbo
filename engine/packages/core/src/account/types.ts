export interface TrumboAccountOrganization {
	active: boolean;
	memberId: string;
	name: string;
	organizationId: string;
	roles: Array<"admin" | "member" | "owner">;
}

export interface TrumboAccountUser {
	id: string;
	email: string;
	displayName: string;
	photoUrl: string;
	createdAt: string;
	updatedAt: string;
	organizations: TrumboAccountOrganization[];
}

export interface UserRemoteConfigOrganization {
	organizationId: string;
	name: string;
}

export interface UserRemoteConfigResponse {
	organizationId: string;
	value: string;
	enabled: boolean;
	organizations?: UserRemoteConfigOrganization[];
}

export interface TrumboAccountBalance {
	balance: number;
	userId: string;
}

export interface TrumboAccountUsageTransaction {
	aiInferenceProviderName: string;
	aiModelName: string;
	aiModelTypeName: string;
	completionTokens: number;
	costUsd: number;
	createdAt: string;
	creditsUsed: number;
	generationId: string;
	id: string;
	metadata: {
		additionalProp1: string;
		additionalProp2: string;
		additionalProp3: string;
	};
	operation?: string;
	organizationId: string;
	promptTokens: number;
	totalTokens: number;
	userId: string;
}

export interface TrumboAccountPaymentTransaction {
	paidAt: string;
	creatorId: string;
	amountCents: number;
	credits: number;
}

export interface TrumboOrganization {
	createdAt: string;
	defaultRemoteConfig?: string;
	deletedAt?: string;
	externalOrganizationId?: string;
	id: string;
	memberCount?: number;
	name: string;
	remoteConfigEnabled: boolean;
	updatedAt: string;
}

export interface TrumboAccountOrganizationBalance {
	balance: number;
	organizationId: string;
}

export interface FeaturebaseTokenResponse {
	featurebaseJwt: string;
}

export interface TrumboSubscriptionPlan {
	displayName?: string;
	features?: {
		included?: string[];
		[key: string]: unknown;
	};
	id?: string;
	interval?: string;
	name?: string;
	pricePerSeatCents?: number;
	type?: string;
	[key: string]: unknown;
}

export interface PlanRateLimitWindow {
	used: number;
	limit: number;
	resetsAtSec: number;
}

export interface PlanBillingInfo {
	model: "individual" | "per_seat";
	seatCount: number | null;
	memberCount: number | null;
	pendingInviteCount: number | null;
}

export interface UserCurrentPlan {
	cancelAt?: string;
	canceledAt?: string;
	currentPeriodEnd?: string;
	currentPeriodStart?: string;
	plan?: TrumboSubscriptionPlan | null;
	planHistoryId?: string;
	planTier?: string;
	billing?: PlanBillingInfo;
	rateLimits?: {
		fiveHour: PlanRateLimitWindow;
		daily: PlanRateLimitWindow;
		weekly: PlanRateLimitWindow;
	};
	/** Trumbo Browser Run in-agent tier limits + current month usage. */
	browser?: {
		enabled: boolean;
		minutesMonthly: number;
		minutesUsed: number;
		resetsAtSec: number;
		concurrentSessions: number;
	};
	/** Trumbo Cloud Agents tier limits + current month usage. */
	agents?: {
		enabled: boolean;
		hoursMonthly: number;
		hoursUsed: number;
		resetsAtSec: number;
		concurrentAgents: number;
		concurrentUsed: number;
	};
	/** Trumbo Sandbox tier limits + current month usage. */
	sandbox?: {
		enabled: boolean;
		cpuSecondsMonthly: number;
		cpuSecondsUsed: number;
		resetsAtSec: number;
		concurrentSandboxes: number;
		concurrentUsed: number;
	};
	/** Trumbo Credits pre-paid balance for standalone API usage. */
	credits?: {
		balance: number;
		totalPurchased: number;
		totalUsed: number;
	};
	subscriptionId?: string;
	userId?: string;
	[key: string]: unknown;
}

export interface TrumboAccountOrganizationUsageTransaction {
	aiInferenceProviderName: string;
	aiModelName: string;
	aiModelTypeName: string;
	completionTokens: number;
	costUsd: number;
	createdAt: string;
	creditsUsed: number;
	generationId: string;
	id: string;
	memberDisplayName: string;
	memberEmail: string;
	metadata: {
		additionalProp1: string;
		additionalProp2: string;
		additionalProp3: string;
	};
	operation?: string;
	organizationId: string;
	promptTokens: number;
	totalTokens: number;
	userId: string;
}
