import {
	type BasicLogger,
	type ITelemetryService,
	type TelemetryMetadata,
	type TelemetryProperties,
} from "@trembo/shared";
import { getCliBuildInfo } from "./common";

// ── No-op telemetry service ───────────────────────────────────────
// All telemetry is disabled. No data is sent to any external server.
const NOOP_TELEMETRY: ITelemetryService = {
	setDistinctId: () => {},
	setMetadata: (_metadata: Partial<TelemetryMetadata>) => {},
	updateMetadata: (_metadata: Partial<TelemetryMetadata>) => {},
	setCommonProperties: (_properties: TelemetryProperties) => {},
	updateCommonProperties: (_properties: TelemetryProperties) => {},
	isEnabled: () => false,
	capture: (_input: { event: string; properties?: TelemetryProperties }) => {},
	captureRequired: (_event: string, _properties?: TelemetryProperties) => {},
	recordCounter: (
		_name: string,
		_value: number,
		_attributes?: TelemetryProperties,
		_description?: string,
		_required?: boolean,
	) => {},
	recordHistogram: (
		_name: string,
		_value: number,
		_attributes?: TelemetryProperties,
		_description?: string,
		_required?: boolean,
	) => {},
	recordGauge: (
		_name: string,
		_value: number | null,
		_attributes?: TelemetryProperties,
		_description?: string,
		_required?: boolean,
	) => {},
	flush: async () => {},
	dispose: async () => {},
};

let telemetrySingleton:
	| {
			telemetry: ITelemetryService;
			dispose: () => Promise<void>;
			loggerAttached: boolean;
	  }
	| undefined;

export function getCliTelemetryService(
	_logger?: BasicLogger,
): ITelemetryService {
	if (!telemetrySingleton) {
		// Intentionally no-op: telemetry disabled, no external connections.
		const { version, name, os_type, os_version } = getCliBuildInfo();
		void version; void name; void os_type; void os_version; // unused, kept for API compat
		telemetrySingleton = {
			telemetry: NOOP_TELEMETRY,
			loggerAttached: false,
			dispose: async () => {},
		};
	}
	return telemetrySingleton.telemetry;
}

export async function disposeCliTelemetryService(): Promise<void> {
	if (!telemetrySingleton) {
		return;
	}
	telemetrySingleton = undefined;
}

export interface CliTelemetryAccountContext {
	id?: string;
	email?: string;
	provider?: string;
	organizationId?: string;
	organizationName?: string;
	memberId?: string;
}

export function identifyTelemetryAccount(
	_account: CliTelemetryAccountContext,
	_logger?: BasicLogger,
): void {
	// No-op: telemetry disabled
}

export function captureCliExtensionActivated(
	_logger?: BasicLogger,
	_account?: CliTelemetryAccountContext,
): void {
	// No-op: telemetry disabled
}
