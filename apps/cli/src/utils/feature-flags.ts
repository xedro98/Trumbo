import { join } from "node:path";
import {
	type BasicLogger,
	type FeatureFlagsContext,
	FeatureFlagsService,
	type ITelemetryService,
	NoOpFeatureFlagsProvider,
	registerDisposable,
	resolveCoreDistinctId,
} from "@trembo/core";
import { resolveTremboDataDir } from "@trembo/shared/storage";

let cliFeatureFlagsContext: FeatureFlagsContext = { clientName: "trembo-cli" };
let cliFeatureFlagsService: FeatureFlagsService | undefined;

const CLI_FEATURE_FLAGS_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function resolveCliFeatureFlagsCachePath(): string {
	return join(resolveTremboDataDir(), "cache", "feature-flags.json");
}

function ensureCliDistinctId(): string {
	const distinctId = cliFeatureFlagsContext.distinctId?.trim();
	if (distinctId) {
		return distinctId;
	}
	const resolved = resolveCoreDistinctId();
	cliFeatureFlagsContext.distinctId = resolved;
	return resolved;
}

export function getCliFeatureFlagsContext(): FeatureFlagsContext {
	ensureCliDistinctId();
	return { ...cliFeatureFlagsContext };
}

export function getCliFeatureFlagsService(options?: {
	logger?: BasicLogger;
	telemetry?: ITelemetryService;
}): FeatureFlagsService {
	if (!cliFeatureFlagsService) {
		// PostHog disabled — always use NoOp provider, no external connections.
		const provider = new NoOpFeatureFlagsProvider();

		cliFeatureFlagsService = new FeatureFlagsService({
			provider,
			telemetry: options?.telemetry,
			logger: options?.logger,
			context: getCliFeatureFlagsContext(),
			cacheFilePath: resolveCliFeatureFlagsCachePath(),
			persistentCacheMaxAgeMs: CLI_FEATURE_FLAGS_CACHE_MAX_AGE_MS,
		});
		registerDisposable(disposeCliFeatureFlagsService);
	}

	return cliFeatureFlagsService;
}

export function refreshCliFeatureFlagsInBackground(logger?: BasicLogger): void {
	const service = getCliFeatureFlagsService({ logger });
	void service.poll().catch((error) => {
		logger?.error?.("Error refreshing CLI feature flags", { error });
	});
}

export async function disposeCliFeatureFlagsService(): Promise<void> {
	if (!cliFeatureFlagsService) {
		return;
	}

	const current = cliFeatureFlagsService;
	cliFeatureFlagsService = undefined;
	await current.dispose();
}

export function setCliFeatureFlagsAccountContext(account: {
	id?: string;
	email?: string;
}): void {
	const accountId = account.id?.trim();
	cliFeatureFlagsContext = {
		...cliFeatureFlagsContext,
		...(accountId ? { distinctId: accountId, userId: accountId } : {}),
		...(account.email?.trim() ? { email: account.email.trim() } : {}),
	};
	cliFeatureFlagsService?.setContext(getCliFeatureFlagsContext());
}

export async function identifyFeatureFlagsAccount(
	account: { id?: string; email?: string },
	logger?: BasicLogger,
): Promise<void> {
	setCliFeatureFlagsAccountContext(account);

	if (!cliFeatureFlagsService) {
		return;
	}

	try {
		await cliFeatureFlagsService.poll();
	} catch (error) {
		logger?.error?.("Error polling CLI feature flags", { error });
	}
}
