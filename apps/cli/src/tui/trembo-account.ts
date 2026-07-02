import {
	type TremboAccountBalance,
	type TremboAccountOrganization,
	type TremboAccountOrganizationBalance,
	type TremboSubscriptionPlan,
	type UserCurrentPlan,
	TremboAccountService,
	type TremboAccountUser,
	formatProviderOAuthApiKey,
	getPersistedProviderApiKey,
	getProviderOAuthCredentialsFromSettings,
	getValidTremboCredentials,
	type ProviderSettings,
	ProviderSettingsManager,
	saveLocalProviderOAuthCredentials,
} from "@trembo/core";
import { getTremboEnvironmentConfig } from "@trembo/shared";
import { formatCreditBalance, normalizeCreditBalance } from "../utils/output";
import { identifyTelemetryAccount } from "../utils/telemetry";
import type { Config } from "../utils/types";

export const TREMBO_CREDITS_DASHBOARD_URL =
	"http://0.0.0.0:0/dashboard/account?tab=credits";

type TremboAccountConfig = Pick<Config, "apiKey" | "logger" | "providerId">;

const TREMBO_PASS_PROVIDER_ID = "trembo-pass";

export interface TremboAccountSnapshot {
	user: TremboAccountUser;
	balance: TremboAccountBalance;
	organizationBalance: TremboAccountOrganizationBalance | null;
	organizations: TremboAccountOrganization[];
	activeOrganization: TremboAccountOrganization | null;
	displayedBalance: number;
}

export function formatTremboCredits(value: number): string {
	return formatCreditBalance(normalizeCreditBalance(value));
}

// FIXME: These message checks are temporary until structured error types are
// passed through to the CLI instead of plain error strings.
export function isTremboAccountAuthErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized === "no trembo account auth token found" ||
		normalized.includes("requires re-authentication")
	);
}

export function isTremboAccountCreditsErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("insufficient balance") &&
		normalized.includes("trembo credits balance")
	);
}

function resolveAccountApiBaseUrl(input: {
	tremboApiBaseUrl?: string;
	tremboProviderSettings?: ProviderSettings;
}): string {
	const settingsBaseUrl = input.tremboProviderSettings?.baseUrl?.trim();
	if (settingsBaseUrl) {
		return settingsBaseUrl;
	}
	const configuredBaseUrl = input.tremboApiBaseUrl?.trim();
	if (configuredBaseUrl) {
		return configuredBaseUrl;
	}
	return getTremboEnvironmentConfig().apiBaseUrl;
}

function resolveTremboAccountAuthToken(input: {
	config: TremboAccountConfig;
	tremboProviderSettings?: ProviderSettings;
}): string | undefined {
	const configApiKey =
		input.config.providerId === "trembo" ? input.config.apiKey.trim() : "";
	return (
		getPersistedProviderApiKey("trembo", input.tremboProviderSettings) ||
		configApiKey ||
		undefined
	);
}

async function resolveValidTremboAccountAuthToken(input: {
	config: TremboAccountConfig;
	tremboProviderSettings?: ProviderSettings;
	manager: ProviderSettingsManager;
	apiBaseUrl: string;
}): Promise<string | undefined> {
	const settings = input.tremboProviderSettings;
	const credentials = settings
		? getProviderOAuthCredentialsFromSettings("trembo", settings)
		: null;
	if (settings && credentials) {
		const nextCredentials = await getValidTremboCredentials(credentials, {
			apiBaseUrl: input.apiBaseUrl,
		});
		if (!nextCredentials) {
			throw new Error(
				"Trembo account requires re-authentication. Run trembo auth trembo.",
			);
		}
		const nextAccessToken = formatProviderOAuthApiKey("trembo", nextCredentials);
		if (nextCredentials !== credentials) {
			saveLocalProviderOAuthCredentials(
				input.manager,
				"trembo",
				settings,
				nextCredentials,
				{ setLastUsed: false },
			);
		}
		return nextAccessToken;
	}
	return resolveTremboAccountAuthToken({
		config: input.config,
		tremboProviderSettings: settings,
	});
}

export async function createTremboAccountService(input: {
	config: TremboAccountConfig;
	tremboApiBaseUrl?: string;
	tremboProviderSettings?: ProviderSettings;
	providerSettingsManager?: ProviderSettingsManager;
}): Promise<TremboAccountService | undefined> {
	const manager = input.providerSettingsManager ?? new ProviderSettingsManager();
	const settings =
		manager.getProviderSettings("trembo") ?? input.tremboProviderSettings;
	const apiBaseUrl = resolveAccountApiBaseUrl({
		tremboApiBaseUrl: input.tremboApiBaseUrl,
		tremboProviderSettings: settings,
	});
	const authToken = await resolveValidTremboAccountAuthToken({
		config: input.config,
		tremboProviderSettings: settings,
		manager,
		apiBaseUrl,
	});
	if (!authToken) {
		return undefined;
	}
	return new TremboAccountService({
		apiBaseUrl,
		getAuthToken: async () => authToken,
	});
}

export async function loadTremboAccountSnapshot(input: {
	config: TremboAccountConfig;
	tremboApiBaseUrl?: string;
	tremboProviderSettings?: ProviderSettings;
}): Promise<TremboAccountSnapshot> {
	const service = await createTremboAccountService(input);
	if (!service) {
		throw new Error("No Trembo account auth token found");
	}

	const user = await service.fetchMe();
	const organizations = user.organizations ?? [];
	const activeOrganization =
		organizations.find((organization) => organization.active) ?? null;
	const [balance, organizationBalance] = await Promise.all([
		service.fetchBalance(user.id),
		activeOrganization
			? service.fetchOrganizationBalance(activeOrganization.organizationId)
			: Promise.resolve(null),
	]);
	const displayedBalance = activeOrganization
		? (organizationBalance?.balance ?? balance.balance)
		: balance.balance;
	const accountContext = {
		id: user.id,
		email: user.email,
		provider: "trembo",
		organizationId: activeOrganization?.organizationId,
		organizationName: activeOrganization?.name,
		memberId: activeOrganization?.memberId,
	};
	identifyTelemetryAccount(accountContext, input.config.logger);

	return {
		user,
		balance,
		organizationBalance,
		organizations,
		activeOrganization,
		displayedBalance,
	};
}

export async function switchTremboAccount(input: {
	config: TremboAccountConfig;
	organizationId?: string | null;
	tremboApiBaseUrl?: string;
	tremboProviderSettings?: ProviderSettings;
}): Promise<void> {
	const service = await createTremboAccountService(input);
	if (!service) {
		throw new Error("No Trembo account auth token found");
	}
	await service.switchAccount(input.organizationId);
}

export async function loadIndividualSubscriptionPlans(input: {
	config: TremboAccountConfig;
	tremboApiBaseUrl?: string;
	tremboProviderSettings?: ProviderSettings;
}): Promise<TremboSubscriptionPlan[]> {
	const service = await createTremboAccountService(input);
	if (!service) {
		throw new Error("No Trembo account auth token found");
	}
	return service.fetchAvailableSubscriptionPlans({ type: "individual" });
}

export async function loadCurrentUserPlan(input: {
	config: TremboAccountConfig;
	tremboApiBaseUrl?: string;
	tremboProviderSettings?: ProviderSettings;
}): Promise<UserCurrentPlan | undefined> {
	const service = await createTremboAccountService(input);
	if (!service) {
		throw new Error("No Trembo account auth token found");
	}
	return service.fetchCurrentUserPlan();
}

export async function loadCurrentUserPlanFromProviderSettings(input: {
	providerSettingsManager: ProviderSettingsManager;
	tremboApiBaseUrl?: string;
}): Promise<UserCurrentPlan | undefined> {
	const service = await createTremboAccountService({
		config: { apiKey: "", logger: undefined, providerId: "trembo" },
		tremboApiBaseUrl: input.tremboApiBaseUrl,
		providerSettingsManager: input.providerSettingsManager,
	});
	if (!service) {
		throw new Error("No Trembo account auth token found");
	}
	return service.fetchCurrentUserPlan();
}

export async function loadIndividualSubscriptionPlansFromProviderSettings(input: {
	providerSettingsManager: ProviderSettingsManager;
	tremboApiBaseUrl?: string;
}): Promise<TremboSubscriptionPlan[]> {
	const service = await createTremboAccountService({
		config: { apiKey: "", logger: undefined, providerId: "trembo" },
		tremboApiBaseUrl: input.tremboApiBaseUrl,
		providerSettingsManager: input.providerSettingsManager,
	});
	if (!service) {
		throw new Error("No Trembo account auth token found");
	}
	return service.fetchAvailableSubscriptionPlans({ type: "individual" });
}

async function onChangeToTremboPass(config: TremboAccountConfig) {
	try {
		await switchTremboAccount({
			config: config,
			organizationId: null,
		});
	} catch (error) {
		config.logger?.debug("Failed to switch TremboPass to personal account", {
			error,
		});
	}
}

export async function onProviderChange(input: {
	config: TremboAccountConfig;
	providerId: string;
}): Promise<void> {
	if (input.providerId === TREMBO_PASS_PROVIDER_ID) {
		return onChangeToTremboPass(input.config);
	}

	return;
}
