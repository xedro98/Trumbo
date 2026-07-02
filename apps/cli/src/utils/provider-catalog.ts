import {
	listLocalProviders as internalListLocalProviders,
	type ProviderSettingsManager,
} from "@trembo/core";

export async function listLocalProviders(
	manager: ProviderSettingsManager,
): ReturnType<typeof internalListLocalProviders> {
	return await internalListLocalProviders(manager, {
		isTremboPassEnabled: true,
	});
}
