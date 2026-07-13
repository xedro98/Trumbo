/**
 * SDK version stamped onto provider client-identity headers.
 *
 * Kept as an explicit constant (rather than read from package.json) so it
 * resolves identically across the Node and browser builds of `@trumbo/shared`.
 * Bump this together with `engine/packages/shared/package.json` on release.
 */
export const TRUMBO_SDK_VERSION = "0.0.58";

export const DEFAULT_REQUEST_HEADERS: Record<string, string> = {
	"X-Title": "Trumbo",
	"X-IS-MULTIROOT": "false",
	"X-CLIENT-TYPE": "trumbo-sdk",
	"X-CLIENT-VERSION": TRUMBO_SDK_VERSION,
};

export function serializeAbortReason(reason: unknown): unknown {
	return reason instanceof Error
		? { name: reason.name, message: reason.message }
		: reason;
}
