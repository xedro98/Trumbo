import {
	listLocalProviders as internalListLocalProviders,
	type ProviderSettingsManager,
} from "@trumbodev/core";

export async function listLocalProviders(
	manager: ProviderSettingsManager,
): ReturnType<typeof internalListLocalProviders> {
	return await internalListLocalProviders(manager, {
		isTrumboPassEnabled: false,
	});
}
