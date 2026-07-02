import type { ITelemetryService } from "@trumbo/shared";

export const TRUMBO_INTERNAL_TELEMETRY_METADATA_KEY =
	"__trumboInternalTelemetry";

export function getToolContextTelemetry(
	metadata: Record<string, unknown> | undefined,
): ITelemetryService | undefined {
	const telemetry = metadata?.[TRUMBO_INTERNAL_TELEMETRY_METADATA_KEY];
	return telemetry &&
		typeof telemetry === "object" &&
		"capture" in telemetry &&
		typeof telemetry.capture === "function"
		? (telemetry as ITelemetryService)
		: undefined;
}
