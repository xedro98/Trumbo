export const DEFAULT_REQUEST_HEADERS: Record<string, string> = {
	"X-Title": "Trembo",
	"X-IS-MULTIROOT": "false",
	"X-CLIENT-TYPE": "trembo-sdk",
};

export function serializeAbortReason(reason: unknown): unknown {
	return reason instanceof Error
		? { name: reason.name, message: reason.message }
		: reason;
}
