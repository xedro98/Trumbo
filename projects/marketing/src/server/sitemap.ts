import type { D1Database } from "@cloudflare/workers-types";
import { listPublishedPosts } from "./blog/db";

const SITE_URL = "https://trumbo.dev";

const STATIC_PATHS = [
	"/",
	"/agent",
	"/quartz",
	"/models",
	"/pricing",
	"/company",
	"/blog",
	"/privacy",
	"/terms",
	"/refund",
] as const;

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function urlEntry(loc: string, lastmod?: string | null): string {
	const lastModified = lastmod
		? `\n    <lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>`
		: "";
	return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastModified}
  </url>`;
}

export async function buildSitemapXml(db?: D1Database): Promise<string> {
	const entries = STATIC_PATHS.map((path) =>
		urlEntry(`${SITE_URL}${path === "/" ? "" : path}`),
	);

	if (db) {
		const posts = await listPublishedPosts(db);
		for (const post of posts) {
			entries.push(urlEntry(`${SITE_URL}/blog/${post.slug}`, post.publishedAt));
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}

export async function handleSitemapRequest(request: Request, db?: D1Database): Promise<Response> {
	if (request.method !== "GET") {
		return new Response("Method Not Allowed", { status: 405 });
	}

	const xml = await buildSitemapXml(db);
	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
