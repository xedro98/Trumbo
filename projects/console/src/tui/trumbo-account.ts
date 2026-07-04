import {
	formatProviderOAuthApiKey,
	getPersistedProviderApiKey,
	getProviderOAuthCredentialsFromSettings,
	getValidTrumboCredentials,
	type ProviderSettings,
	ProviderSettingsManager,
	saveLocalProviderOAuthCredentials,
	type TrumboAccountBalance,
	type TrumboAccountOrganization,
	type TrumboAccountOrganizationBalance,
	TrumboAccountService,
	type TrumboAccountUser,
	type TrumboSubscriptionPlan,
	type UserCurrentPlan,
} from "@trumbo/core";
import {
	getTrumboEnvironmentConfig,
	isUnconfiguredTrumboUrl,
	resolveTrumboApiBaseUrl,
} from "@trumbo/shared";
import { formatCreditBalance, normalizeCreditBalance } from "../utils/output";
import { identifyTelemetryAccount } from "../utils/telemetry";
import type { Config } from "../utils/types";

/**
 * Web app URLs shown in the CLI (billing page, credits dashboard). Resolved
 * from the active Trumbo environment so they track the deployed web app
 * (production = https://platform.trumbo.dev) and honor TRUMBO_APP_URL overrides.
 */
const RESOLVED_TRUMBO_APP_URL = getTrumboEnvironmentConfig().appBaseUrl;
export const TRUMBO_CREDITS_DASHBOARD_URL = `${RESOLVED_TRUMBO_APP_URL}/dashboard/account?tab=credits`;
export const TRUMBO_BILLING_URL = `${RESOLVED_TRUMBO_APP_URL}/billing`;

type TrumboAccountConfig = Pick<Config, "apiKey" | "logger" | "providerId">;

const TRUMBO_PASS_PROVIDER_ID = "trumbo-pass";

export interface TrumboAccountSnapshot {
	user: TrumboAccountUser;
	balance: TrumboAccountBalance;
	organizationBalance: TrumboAccountOrganizationBalance | null;
	organizations: TrumboAccountOrganization[];
	activeOrganization: TrumboAccountOrganization | null;
	displayedBalance: number;
	currentPlan?: UserCurrentPlan | null;
}

export function formatTrumboCredits(value: number): string {
	return formatCreditBalance(normalizeCreditBalance(value));
}

// FIXME: These message checks are temporary until structured error types are
// passed through to the CLI instead of plain error strings.
export function isTrumboAccountAuthErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized === "no trumbo account auth token found" ||
		normalized.includes("requires re-authentication")
	);
}

export function formatTrumboAccountConnectionError(
	error: unknown,
	apiBaseUrl: string,
): string {
	if (isUnconfiguredTrumboUrl(apiBaseUrl)) {
		return (
			"Trumbo web app URL is not configured. For local dev run `bun run dev` in projects/console " +
			"(http://localhost:8787 API, http://localhost:5173 UI) or set TRUMBO_API_BASE_URL."
		);
	}

	const message = error instanceof Error ? error.message : String(error);
	if (message.includes("Was there a typo in the url or port")) {
		return (
			`Cannot reach the Trumbo web app at ${apiBaseUrl}. ` +
			"Start it with `bun run dev:api` in projects/web, or check TRUMBO_ENVIRONMENT / TRUMBO_API_BASE_URL."
		);
	}
	return message;
}

export function isTrumboAccountCreditsErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("insufficient balance") &&
		normalized.includes("trumbo credits balance")
	);
}

function resolveAccountApiBaseUrl(input: {
	trumboApiBaseUrl?: string;
	trumboProviderSettings?: ProviderSettings;
}): string {
	const apiBaseUrl = resolveTrumboApiBaseUrl(
		input.trumboProviderSettings?.baseUrl ?? input.trumboApiBaseUrl,
	);
	if (isUnconfiguredTrumboUrl(apiBaseUrl)) {
		throw new Error(formatTrumboAccountConnectionError(null, apiBaseUrl));
	}
	return apiBaseUrl;
}

function resolveTrumboAccountAuthToken(input: {
	config: TrumboAccountConfig;
	trumboProviderSettings?: ProviderSettings;
}): string | undefined {
	const configApiKey =
		input.config.providerId === "trumbo" ? input.config.apiKey.trim() : "";
	return (
		getPersistedProviderApiKey("trumbo", input.trumboProviderSettings) ||
		configApiKey ||
		undefined
	);
}

async function resolveValidTrumboAccountAuthToken(input: {
	config: TrumboAccountConfig;
	trumboProviderSettings?: ProviderSettings;
	manager: ProviderSettingsManager;
	apiBaseUrl: string;
}): Promise<string | undefined> {
	const settings = input.trumboProviderSettings;
	const credentials = settings
		? getProviderOAuthCredentialsFromSettings("trumbo", settings)
		: null;
	if (settings && credentials) {
		const nextCredentials = await getValidTrumboCredentials(credentials, {
			apiBaseUrl: input.apiBaseUrl,
		});
		if (!nextCredentials) {
			throw new Error(
				"Trumbo account requires re-authentication. Run trumbo auth trumbo.",
			);
		}
		const nextAccessToken = formatProviderOAuthApiKey(
			"trumbo",
			nextCredentials,
		);
		if (nextCredentials !== credentials) {
			saveLocalProviderOAuthCredentials(
				input.manager,
				"trumbo",
				settings,
				nextCredentials,
				{ setLastUsed: false },
			);
		}
		return nextAccessToken;
	}
	return resolveTrumboAccountAuthToken({
		config: input.config,
		trumboProviderSettings: settings,
	});
}

export async function createTrumboAccountService(input: {
	config: TrumboAccountConfig;
	trumboApiBaseUrl?: string;
	trumboProviderSettings?: ProviderSettings;
	providerSettingsManager?: ProviderSettingsManager;
}): Promise<TrumboAccountService | undefined> {
	const manager =
		input.providerSettingsManager ?? new ProviderSettingsManager();
	const settings =
		manager.getProviderSettings("trumbo") ?? input.trumboProviderSettings;
	const apiBaseUrl = resolveAccountApiBaseUrl({
		trumboApiBaseUrl: input.trumboApiBaseUrl,
		trumboProviderSettings: settings,
	});
	const authToken = await resolveValidTrumboAccountAuthToken({
		config: input.config,
		trumboProviderSettings: settings,
		manager,
		apiBaseUrl,
	});
	if (!authToken) {
		return undefined;
	}
	return new TrumboAccountService({
		apiBaseUrl,
		getAuthToken: async () => authToken,
		getHeaders: async (): Promise<Record<string, string>> => {
			const organizationId = settings?.auth?.organizationId?.trim();
			return organizationId ? { "X-Org-Id": organizationId } : {};
		},
	});
}

export async function loadTrumboAccountSnapshot(input: {
	config: TrumboAccountConfig;
	trumboApiBaseUrl?: string;
	trumboProviderSettings?: ProviderSettings;
}): Promise<TrumboAccountSnapshot> {
	const apiBaseUrl = resolveAccountApiBaseUrl({
		trumboApiBaseUrl: input.trumboApiBaseUrl,
		trumboProviderSettings: input.trumboProviderSettings,
	});
	let service: TrumboAccountService | undefined;
	try {
		service = await createTrumboAccountService(input);
	} catch (error) {
		throw new Error(formatTrumboAccountConnectionError(error, apiBaseUrl));
	}
	if (!service) {
		throw new Error("No Trumbo account auth token found");
	}

	try {
		const user = await service.fetchMe();
		const organizations = user.organizations ?? [];
		const normalizedOrganizations = organizations.map((org) => ({
			...org,
			organizationId:
				org.organizationId ??
				(org as TrumboAccountOrganization & { id?: string }).id ??
				"",
		}));
		const activeOrganization =
			normalizedOrganizations.find((organization) => organization.active) ??
			null;
		const [balance, organizationBalance, currentPlan] = await Promise.all([
			service.fetchBalance(user.id),
			activeOrganization
				? service.fetchOrganizationBalance(activeOrganization.organizationId)
				: Promise.resolve(null),
			service.fetchCurrentUserPlan().catch(() => null),
		]);
		const displayedBalance = activeOrganization
			? (organizationBalance?.balance ?? balance.balance)
			: balance.balance;
		const accountContext = {
			id: user.id,
			email: user.email,
			provider: "trumbo",
			organizationId: activeOrganization?.organizationId,
			organizationName: activeOrganization?.name,
			memberId: activeOrganization?.memberId,
		};
		identifyTelemetryAccount(accountContext, input.config.logger);

		return {
			user,
			balance,
			organizationBalance,
			organizations: normalizedOrganizations,
			activeOrganization,
			displayedBalance,
			currentPlan: currentPlan ?? null,
		};
	} catch (error) {
		throw new Error(formatTrumboAccountConnectionError(error, apiBaseUrl));
	}
}

export async function switchTrumboAccount(input: {
	config: TrumboAccountConfig;
	organizationId?: string | null;
	trumboApiBaseUrl?: string;
	trumboProviderSettings?: ProviderSettings;
	providerSettingsManager?: ProviderSettingsManager;
}): Promise<void> {
	const manager =
		input.providerSettingsManager ?? new ProviderSettingsManager();
	const service = await createTrumboAccountService({
		...input,
		providerSettingsManager: manager,
	});
	if (!service) {
		throw new Error("No Trumbo account auth token found");
	}
	await service.switchAccount(input.organizationId);

	const current = manager.getProviderSettings("trumbo");
	if (!current) {
		return;
	}
	const nextOrganizationId = input.organizationId?.trim() || undefined;
	manager.saveProviderSettings({
		...current,
		auth: {
			...current.auth,
			organizationId: nextOrganizationId,
		},
	});
}

export async function loadIndividualSubscriptionPlans(input: {
	config: TrumboAccountConfig;
	trumboApiBaseUrl?: string;
	trumboProviderSettings?: ProviderSettings;
}): Promise<TrumboSubscriptionPlan[]> {
	const service = await createTrumboAccountService(input);
	if (!service) {
		throw new Error("No Trumbo account auth token found");
	}
	return service.fetchAvailableSubscriptionPlans({ type: "individual" });
}

export async function loadCurrentUserPlan(input: {
	config: TrumboAccountConfig;
	trumboApiBaseUrl?: string;
	trumboProviderSettings?: ProviderSettings;
}): Promise<UserCurrentPlan | undefined> {
	const service = await createTrumboAccountService(input);
	if (!service) {
		throw new Error("No Trumbo account auth token found");
	}
	return service.fetchCurrentUserPlan();
}

export async function loadCurrentUserPlanFromProviderSettings(input: {
	providerSettingsManager: ProviderSettingsManager;
	trumboApiBaseUrl?: string;
}): Promise<UserCurrentPlan | undefined> {
	const service = await createTrumboAccountService({
		config: { apiKey: "", logger: undefined, providerId: "trumbo" },
		trumboApiBaseUrl: input.trumboApiBaseUrl,
		providerSettingsManager: input.providerSettingsManager,
	});
	if (!service) {
		throw new Error("No Trumbo account auth token found");
	}
	return service.fetchCurrentUserPlan();
}

export async function loadIndividualSubscriptionPlansFromProviderSettings(input: {
	providerSettingsManager: ProviderSettingsManager;
	trumboApiBaseUrl?: string;
}): Promise<TrumboSubscriptionPlan[]> {
	const service = await createTrumboAccountService({
		config: { apiKey: "", logger: undefined, providerId: "trumbo" },
		trumboApiBaseUrl: input.trumboApiBaseUrl,
		providerSettingsManager: input.providerSettingsManager,
	});
	if (!service) {
		throw new Error("No Trumbo account auth token found");
	}
	return service.fetchAvailableSubscriptionPlans({ type: "individual" });
}

async function onChangeToTrumboPass(config: TrumboAccountConfig) {
	try {
		await switchTrumboAccount({
			config: config,
			organizationId: null,
		});
	} catch (error) {
		config.logger?.debug("Failed to switch TrumboPass to personal account", {
			error,
		});
	}
}

export async function onProviderChange(input: {
	config: TrumboAccountConfig;
	providerId: string;
}): Promise<void> {
	if (input.providerId === TRUMBO_PASS_PROVIDER_ID) {
		return onChangeToTrumboPass(input.config);
	}

	return;
}
