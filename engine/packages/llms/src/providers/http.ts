import type { GatewayProviderSettings } from "@trumbodev/shared";

export function ensureFetch(fetchImpl?: typeof fetch): typeof fetch {
	const resolved = fetchImpl ?? globalThis.fetch;
	if (!resolved) {
		throw new Error(
			"No fetch implementation is available. Pass one in the gateway or provider config.",
		);
	}
	return resolved;
}

export async function resolveApiKey(
	settings: GatewayProviderSettings,
): Promise<string | undefined> {
	const explicitApiKey = settings.apiKey?.trim();
	if (explicitApiKey) {
		return explicitApiKey;
	}

	const resolvedApiKey = await settings.apiKeyResolver?.();
	const trimmedResolvedApiKey = resolvedApiKey?.trim();
	if (trimmedResolvedApiKey) {
		return trimmedResolvedApiKey;
	}

	for (const key of settings.apiKeyEnv ?? []) {
		const value = readEnv(key);
		if (value) {
			return value;
		}
	}

	return undefined;
}

export async function fetchJson(
	url: string,
	init: RequestInit,
	options: {
		fetch: typeof fetch;
		timeoutMs?: number;
		signal?: AbortSignal;
	},
): Promise<unknown> {
	const controller = new AbortController();
	const signal = mergeSignals(options.signal, controller.signal);
	const timeoutMs = options.timeoutMs ?? 30_000;
	const timeout =
		timeoutMs > 0
			? setTimeout(
					() => controller.abort(new Error("Request timed out")),
					timeoutMs,
				)
			: undefined;

	try {
		const response = await options.fetch(url, { ...init, signal });
		const text = await response.text();
		const payload = text ? (JSON.parse(text) as unknown) : undefined;

		if (!response.ok) {
			const message =
				typeof payload === "object" && payload && "error" in payload
					? JSON.stringify((payload as { error: unknown }).error)
					: text || `${response.status} ${response.statusText}`;
			throw new Error(`Gateway request failed: ${message}`);
		}

		return payload;
	} finally {
		if (timeout) {
			clearTimeout(timeout);
		}
	}
}

function mergeSignals(
	first: AbortSignal | undefined,
	second: AbortSignal,
): AbortSignal {
	if (!first) {
		return second;
	}

	if (first.aborted) {
		second.throwIfAborted?.();
		return first;
	}

	const controller = new AbortController();
	const abort = (event?: Event) => {
		const target = event?.target as AbortSignal | null;
		controller.abort(target?.reason);
	};

	first.addEventListener("abort", abort, { once: true });
	second.addEventListener("abort", abort, { once: true });
	return controller.signal;
}

export function compactObject<T extends Record<string, unknown>>(value: T): T {
	return Object.fromEntries(
		Object.entries(value).filter(([, entry]) => entry !== undefined),
	) as T;
}

/**
 * Returns true when an error represents a transient DNS resolution failure
 * that is safe to retry (the request never reached the server). Matches the
 * common Node/undici shapes: a top-level `code`, a wrapped `cause.code`, or a
 * `getaddrinfo ENOTFOUND/EAI_AGAIN` message.
 */
export function isDnsTransportError(error: unknown): boolean {
	if (!error) return false;
	const code = (error as { code?: string } | null)?.code;
	if (code === "ENOTFOUND" || code === "EAI_AGAIN") return true;
	const cause = (error as { cause?: unknown } | null)?.cause;
	if (cause && typeof cause === "object") {
		const causeCode = (cause as { code?: string }).code;
		if (causeCode === "ENOTFOUND" || causeCode === "EAI_AGAIN") return true;
	}
	const message = (error as Error | null)?.message?.toLowerCase() ?? "";
	return (
		message.includes("getaddrinfo enotfound") ||
		message.includes("getaddrinfo eai_again")
	);
}

/**
 * Wrap a fetch implementation so transient DNS resolution failures are retried
 * with exponential backoff. These commonly occur on flaky networks and VPN
 * reconnects; since the request never reached the server, retrying is safe and
 * idempotent. Non-DNS errors are rethrown immediately.
 *
 * @param baseFetch The fetch to wrap (defaults to `globalThis.fetch`).
 * @param maxRetries Number of retries after the initial attempt. Default 2.
 */
export function wrapFetchForDnsRetry(
	baseFetch: typeof fetch | undefined,
	maxRetries = 2,
): typeof fetch | undefined {
	const delegate = baseFetch ?? globalThis.fetch;
	if (!delegate) {
		return baseFetch;
	}

	const wrapped = async (
		...args: Parameters<typeof fetch>
	): Promise<Response> => {
		let lastError: unknown;
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await delegate(...args);
			} catch (error) {
				lastError = error;
				if (!isDnsTransportError(error) || attempt === maxRetries) {
					throw error;
				}
				// Exponential backoff: 200ms, 400ms, ...
				await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
			}
		}
		throw lastError;
	};
	return wrapped as typeof fetch;
}

export function readEnv(key: string): string | undefined {
	const env = globalThis.process?.env;
	if (!env) {
		return undefined;
	}

	const value = env[key];
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}
