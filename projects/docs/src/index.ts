/**
 * Reverse-proxy docs.trumbo.dev → Mintlify (trumbo.mintlify.app).
 * Keeps the Cloudflare custom domain while Mintlify hosts the docs UI.
 */
const MINTLIFY_HOST = "trumbo.mintlify.app";
const PUBLIC_HOST = "docs.trumbo.dev";

export default {
	async fetch(request: Request): Promise<Response> {
		const incoming = new URL(request.url);
		const target = new URL(incoming.pathname + incoming.search, `https://${MINTLIFY_HOST}`);

		const headers = new Headers(request.headers);
		headers.set("Host", MINTLIFY_HOST);
		headers.set("X-Forwarded-Host", PUBLIC_HOST);
		headers.set("X-Forwarded-Proto", "https");
		headers.delete("cf-connecting-ip");
		const clientIp = request.headers.get("CF-Connecting-IP");
		if (clientIp) headers.set("CF-Connecting-IP", clientIp);

		const proxyRequest = new Request(target.toString(), {
			method: request.method,
			headers,
			body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
			redirect: "manual",
		});

		const response = await fetch(proxyRequest);
		const outHeaders = new Headers(response.headers);

		// Rewrite absolute redirects back onto the public docs host.
		const location = outHeaders.get("Location");
		if (location) {
			try {
				const loc = new URL(location, `https://${MINTLIFY_HOST}`);
				if (loc.hostname === MINTLIFY_HOST || loc.hostname === "trumbo.mintlify.site") {
					loc.hostname = PUBLIC_HOST;
					outHeaders.set("Location", loc.toString());
				}
			} catch {
				/* leave Location as-is */
			}
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: outHeaders,
		});
	},
};
