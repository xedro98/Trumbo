import type { ITelemetryService } from "@trembo/shared";

export const TREMBO_INTERNAL_TELEMETRY_METADATA_KEY = "__tremboInternalTelemetry";

export function getToolContextTelemetry(
	metadata: Record<string, unknown> | undefined,
): ITelemetryService | undefined {
	const telemetry = metadata?.[TREMBO_INTERNAL_TELEMETRY_METADATA_KEY];
	return telemetry &&
		typeof telemetry === "object" &&
		"capture" in telemetry &&
		typeof telemetry.capture === "function"
		? (telemetry as ITelemetryService)
		: undefined;
}
