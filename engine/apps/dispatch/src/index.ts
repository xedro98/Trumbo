/**
 * trumbo-apps — the dispatch Worker for Trumbo Agent Apps.
 *
 * Routes a hostname to the correct tenant User Worker script in the Workers for
 * Platforms dispatch namespace. The route table lives in D1 (`app_routes`) and
 * is cached in a KV namespace (`APPS_ROUTES_KV`) for sub-10ms lookups.
 *
 * Deployed as a separate Worker on the `*.trumbo.app` zone (Cloudflare for
 * SaaS custom hostnames also land here). It is NOT the platform Worker.
 *
 * Bindings (wrangler.toml):
 *   DB                     — D1 (the trumbo-web database; read-only here)
 *   DISPATCHER             — Workers for Platforms dispatch namespace (Fetcher)
 *   APPS_ROUTES_KV         — KV cache of hostname → {scriptName, environment}
 */

interface DispatchEnv {
	DB: D1Database;
	DISPATCHER: Fetcher;
	APPS_ROUTES_KV?: KVNamespace;
}

interface RouteRow {
	app_id: string;
	script_name: string;
	environment: string;
	status: string;
}

const ROUTE_CACHE_TTL_SEC = 60;

async function lookupRoute(
	env: DispatchEnv,
	hostname: string,
): Promise<RouteRow | null> {
	// 1. Warm KV cache.
	if (env.APPS_ROUTES_KV) {
		const cached = await env.APPS_ROUTES_KV.get(`route:${hostname}`, "json");
		if (cached) return cached as RouteRow;
	}
	// 2. D1 fallback (source of truth).
	const row = await env.DB.prepare(
		"SELECT app_id, script_name, environment, status FROM app_routes WHERE hostname = ?",
	)
		.bind(hostname)
		.first<RouteRow>();
	if (row && env.APPS_ROUTES_KV) {
		await env.APPS_ROUTES_KV.put(`route:${hostname}`, JSON.stringify(row), {
			expirationTtl: ROUTE_CACHE_TTL_SEC,
		});
	}
	return row ?? null;
}

/** Fixed 60s window start for per-app request rate limiting. */
function rateLimitWindowStart(nowSec: number): number {
	return nowSec - (nowSec % 60);
}

/** Enforce a per-app requests/min cap (apps.rate_limit_rpm). Returns true when
 *  the request is allowed (and the counter has been incremented), false when the
 *  cap is exceeded. 0 = unlimited. Best-effort: a D1 error allows the request. */
async function checkRateLimit(
	env: DispatchEnv,
	hostname: string,
	appId: string,
): Promise<boolean> {
	const app = await env.DB.prepare(
		"SELECT rate_limit_rpm FROM apps WHERE id = ?",
	)
		.bind(appId)
		.first<{ rate_limit_rpm: number }>();
	const rpm = Number(app?.rate_limit_rpm ?? 0);
	if (rpm <= 0) return true;
	const nowSec = Math.floor(Date.now() / 1000);
	const windowStart = rateLimitWindowStart(nowSec);
	const row = await env.DB.prepare(
		"SELECT count FROM app_rate_limit_counters WHERE hostname = ? AND window_start = ?",
	)
		.bind(hostname, windowStart)
		.first<{ count: number }>();
	const used = Number(row?.count ?? 0);
	if (used >= rpm) return false;
	await env.DB.prepare(
		`INSERT INTO app_rate_limit_counters (hostname, window_start, count)
			 VALUES (?, ?, 1)
			 ON CONFLICT(hostname, window_start) DO UPDATE SET count = count + 1`,
	)
		.bind(hostname, windowStart)
		.run();
	return true;
}

export default {
	async fetch(request: Request, env: DispatchEnv): Promise<Response> {
		const url = new URL(request.url);
		const hostname = url.hostname.toLowerCase();

		const route = await lookupRoute(env, hostname);
		if (!route || route.status !== "live") {
			return new Response("No app found for this hostname.", { status: 404 });
		}

		// Per-app rate limit (Phase 3). 429 when the rpm cap is exceeded.
		const allowed = await checkRateLimit(env, hostname, route.app_id).catch(
			() => true,
		);
		if (!allowed) {
			return new Response("Rate limit exceeded for this app.", { status: 429 });
		}

		// Dispatch to the tenant User Worker script in the dispatch namespace.
		// The DISPATCHER binding is a Fetcher over the WfP namespace; `.get(name)`
		// returns a Fetcher bound to that named script, whose `.fetch()` runs it.
		try {
			const worker = env.DISPATCHER.get(route.script_name);
			return await worker.fetch(request);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Dispatch failed.";
			return new Response(`App unavailable: ${message}`, { status: 502 });
		}
	},
};
