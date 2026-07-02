export const DEFAULT_REQUEST_HEADERS: Record<string, string> = {
	"X-Title": "Trumbo",
	"X-IS-MULTIROOT": "false",
	"X-CLIENT-TYPE": "trumbo-sdk",
};

export function serializeAbortReason(reason: unknown): unknown {
	return reason instanceof Error
		? { name: reason.name, message: reason.message }
		: reason;
}
