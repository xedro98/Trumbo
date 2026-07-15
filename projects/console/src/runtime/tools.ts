import {
	type BuiltinToolAvailabilityContext,
	getCoreBuiltinToolCatalog,
	resolveDisabledToolNames,
	type ToolCatalogEntry,
} from "@trumbodev/core";

export type { ToolCatalogEntry } from "@trumbodev/core";

export function getToolCatalog(
	availabilityContext?: BuiltinToolAvailabilityContext,
): ToolCatalogEntry[] {
	return getCoreBuiltinToolCatalog({
		disabledToolIds: resolveDisabledToolNames(),
		...availabilityContext,
	});
}
