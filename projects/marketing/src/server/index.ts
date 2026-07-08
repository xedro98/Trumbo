import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { handleBlogRequest } from "./blog/router";
import { handleSitemapRequest } from "./sitemap";

export interface Env {
	ASSETS: Fetcher;
	TRUMBO_PLATFORM_URL: string;
	DB?: D1Database;
	BUCKET?: R2Bucket;
	BLOG_ADMIN_EMAIL?: string;
	BLOG_ADMIN_PASSWORD?: string;
}
function platformRedirect(request: Request, env: Env): Response | null {
	const url = new URL(request.url);
	const platformBase = env.TRUMBO_PLATFORM_URL.replace(/\/$/, "");
	const forwardPrefixes = ["/login", "/signup", "/register", "/device", "/dashboard", "/billing", "/docs"];
	if (forwardPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
		return Response.redirect(`${platformBase}${url.pathname}${url.search}`, 302);
	}
	if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
		const rest = url.pathname.slice("/app".length) || "/";
		return Response.redirect(`${platformBase}${rest}${url.search}`, 302);
	}
	return null;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const redirect = platformRedirect(request, env);
		if (redirect) {
			return redirect;
		}

		const url = new URL(request.url);
		if (url.pathname === "/sitemap.xml") {
			return handleSitemapRequest(request, env.DB);
		}

		const blogResponse = await handleBlogRequest(request, env);
		if (blogResponse) {
			return blogResponse;
		}

		const response = await env.ASSETS.fetch(request);
		if (response.status === 404 && request.method === "GET") {
			const url = new URL(request.url);
			if (!url.pathname.includes(".")) {
				return env.ASSETS.fetch(new Request(new URL("/index.html", url.origin), request));
			}
		}
		return response;
	},
} satisfies ExportedHandler<Env>;
