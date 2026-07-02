import {
	listLocalProviders as internalListLocalProviders,
	type ProviderSettingsManager,
} from "@trumbo/core";

export async function listLocalProviders(
	manager: ProviderSettingsManager,
): ReturnType<typeof internalListLocalProviders> {
	return await internalListLocalProviders(manager, {
		isTrumboPassEnabled: true,
	});
}
