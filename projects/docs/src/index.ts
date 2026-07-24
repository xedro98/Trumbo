/**
 * Minimal pass-through Worker for the Trumbo docs site.
 * All content is served from the static assets binding (VitePress build output).
 * The Worker exists only so wrangler can attach a custom domain route.
 */
export default {
	async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
		return env.ASSETS.fetch(request);
	},
};
