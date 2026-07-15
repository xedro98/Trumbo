import type { ExtensionContext } from "@trumbodev/shared";
import type { RuntimeCapabilities } from "../runtime/capabilities";
import { normalizeRuntimeCapabilities } from "../runtime/capabilities";
import type {
	LocalRuntimeStartOptions,
	StartSessionInput,
} from "../runtime/host/runtime-host";
import { splitCoreSessionConfig } from "../runtime/host/runtime-host";
import type { CoreSessionConfig } from "../types/config";
import type { TrumboCoreStartInput } from "./types";

export function toTrumboCoreStartInput(
	input: StartSessionInput | TrumboCoreStartInput,
): TrumboCoreStartInput {
	const config = input.config as CoreSessionConfig;
	return "providerId" in config
		? {
				...input,
				config: {
					...config,
					...coreConfigFromLocalRuntime(input.localRuntime),
				},
				localRuntime: input.localRuntime,
			}
		: (input as TrumboCoreStartInput);
}

export interface NormalizeTrumboCoreStartInputOptions {
	defaultCapabilities?: RuntimeCapabilities;
	withExtensionContext?: (
		context?: ExtensionContext,
	) => ExtensionContext | undefined;
}

export function normalizeTrumboCoreStartInput(
	input: TrumboCoreStartInput,
	options: NormalizeTrumboCoreStartInputOptions = {},
): StartSessionInput {
	const split = splitCoreSessionConfig(input.config);
	const capabilities = normalizeRuntimeCapabilities(
		options.defaultCapabilities,
		input.capabilities,
	);
	let localRuntime = mergeLocalRuntimeStartOptions(
		split.localRuntime,
		input.localRuntime,
	);
	const extensionContext = options.withExtensionContext?.(
		localRuntime?.extensionContext,
	);
	if (extensionContext) {
		localRuntime = {
			...(localRuntime ?? {}),
			extensionContext,
		};
	}
	return {
		...input,
		...split,
		...(localRuntime ? { localRuntime } : {}),
		...(capabilities ? { capabilities } : {}),
	};
}

function coreConfigFromLocalRuntime(
	localRuntime: LocalRuntimeStartOptions | undefined,
): Partial<CoreSessionConfig> {
	if (!localRuntime) {
		return {};
	}
	const {
		modelCatalogDefaults: _modelCatalogDefaults,
		userInstructionService: _userInstructionService,
		configExtensions: _configExtensions,
		onTeamRestored: _onTeamRestored,
		...localConfig
	} = localRuntime;
	return localConfig;
}

function mergeLocalRuntimeStartOptions(
	...sources: Array<LocalRuntimeStartOptions | undefined>
): LocalRuntimeStartOptions | undefined {
	const merged: LocalRuntimeStartOptions = {};
	for (const source of sources) {
		if (source) {
			Object.assign(merged, source);
		}
	}
	return Object.keys(merged).length > 0 ? merged : undefined;
}
