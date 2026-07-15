import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import {
	createCategory,
	createPost,
	deleteCategory,
	deletePost,
	getPostById,
	listAllPosts,
	listCategories,
	listPublishedPosts,
	getPublishedPost,
	slugify,
	updatePost,
	type PostInput,
} from "./db";
import {
	clearSessionCookie,
	createSession,
	deleteSession,
	getSessionUser,
	json,
	readSessionToken,
	requireAdmin,
	sessionCookie,
} from "./auth";
import { ensureBlogSeed } from "./seed";
import { verifyAdminLogin } from "./users";

type EnvWithBlog = {
	DB?: D1Database;
	BUCKET?: R2Bucket;
	BLOG_ADMIN_EMAIL?: string;
	BLOG_ADMIN_PASSWORD?: string;
};

async function getDb(env: EnvWithBlog): Promise<D1Database | null> {
	if (!env.DB) return null;
	await ensureBlogSeed(env.DB, {
		adminEmail: env.BLOG_ADMIN_EMAIL,
		adminPassword: env.BLOG_ADMIN_PASSWORD,
	});
	return env.DB;
}

function noDatabase(): Response {
	return json({ error: "Blog database is not configured" }, { status: 503 });
}

function parsePostInput(body: Record<string, unknown>): PostInput {
	const title = String(body.title ?? "").trim();
	const slug = slugify(String(body.slug ?? title));
	const excerpt = String(body.excerpt ?? "").trim();
	const content = String(body.body ?? "").trim();
	const coverImage =
		body.coverImage == null || body.coverImage === "" ? null : String(body.coverImage);
	const categoryId =
		body.categoryId == null || body.categoryId === "" ? null : Number(body.categoryId);
	const published = Boolean(body.published);
	const publishedAt =
		published
			? String(body.publishedAt ?? new Date().toISOString())
			: null;

	return {
		slug,
		title,
		excerpt,
		body: content,
		coverImage,
		categoryId: Number.isFinite(categoryId) ? categoryId : null,
		published,
		publishedAt,
	};
}

const ALLOWED_CONTENT_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/svg+xml",
]);

const EXTENSION_BY_TYPE: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/svg+xml": "svg",
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const D1_MAX_UPLOAD_BYTES = 750 * 1024;

async function handleUpload(
	request: Request,
	bucket: R2Bucket | undefined,
	db: D1Database | undefined,
): Promise<Response> {
	const formData = await request.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return json({ error: "No file provided" }, { status: 400 });
	}

	if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
		return json({ error: "Unsupported file type" }, { status: 400 });
	}

	if (file.size > MAX_UPLOAD_BYTES) {
		return json({ error: "File too large (max 10MB)" }, { status: 413 });
	}

	const extension = EXTENSION_BY_TYPE[file.type] ?? "bin";
	const key = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

	// R2 storage (preferred)
	if (bucket) {
		await bucket.put(key, file.stream(), {
			httpMetadata: { contentType: file.type },
		});
		return json({ url: `/api/uploads/${key}` }, { status: 201 });
	}

	// D1 fallback (base64) — requires smaller files
	if (!db) {
		return json({ error: "Upload storage is not configured" }, { status: 503 });
	}

	if (file.size > D1_MAX_UPLOAD_BYTES) {
		return json(
			{ error: "File too large for D1 storage (max 750KB). Enable object storage in the admin dashboard for larger uploads." },
			{ status: 413 },
		);
	}

	const arrayBuffer = await file.arrayBuffer();
	const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

	await db
		.prepare("INSERT INTO blog_uploads (key, content_type, data) VALUES (?, ?, ?)")
		.bind(key, file.type, base64)
		.run();

	return json({ url: `/api/uploads/${key}` }, { status: 201 });
}

async function handleServeUpload(
	request: Request,
	bucket: R2Bucket | undefined,
	db: D1Database | undefined,
	key: string,
): Promise<Response> {
	// R2 storage (preferred)
	if (bucket) {
		const object = await bucket.get(key);
		if (!object) {
			return json({ error: "Not found" }, { status: 404 });
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set("Cache-Control", "public, max-age=31536000, immutable");
		if (request.headers.get("Range")) {
			headers.set("Accept-Ranges", "bytes");
		}

		return new Response(object.body, { headers });
	}

	// D1 fallback
	if (!db) {
		return json({ error: "Upload storage is not configured" }, { status: 503 });
	}

	const row = await db
		.prepare("SELECT content_type, data FROM blog_uploads WHERE key = ?")
		.bind(key)
		.first<{ content_type: string; data: string }>();

	if (!row) {
		return json({ error: "Not found" }, { status: 404 });
	}

	const binaryString = atob(row.data);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i += 1) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return new Response(bytes, {
		headers: {
			"Content-Type": row.content_type,
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}

export async function handleBlogRequest(request: Request, env: EnvWithBlog): Promise<Response | null> {
	const url = new URL(request.url);
	if (!url.pathname.startsWith("/api/")) {
		return null;
	}

	// Public uploads (no auth) — serve before DB init
	const uploadMatch = url.pathname.match(/^\/api\/uploads\/(.+)$/);
	if (uploadMatch && request.method === "GET") {
		return handleServeUpload(request, env.BUCKET, env.DB, decodeURIComponent(uploadMatch[1]));
	}

	const db = await getDb(env);

	if (url.pathname.startsWith("/api/blog")) {
		if (!db) return noDatabase();

		if (url.pathname === "/api/blog/posts" && request.method === "GET") {
			const limit = Number(url.searchParams.get("limit") ?? "0");
			const posts = await listPublishedPosts(db, limit > 0 ? limit : undefined);
			return json({ posts });
		}

		const postMatch = url.pathname.match(/^\/api\/blog\/posts\/([^/]+)$/);
		if (postMatch && request.method === "GET") {
			const post = await getPublishedPost(db, decodeURIComponent(postMatch[1]));
			if (!post) return json({ error: "Not found" }, { status: 404 });
			return json({ post });
		}

		if (url.pathname === "/api/blog/categories" && request.method === "GET") {
			const categories = await listCategories(db);
			return json({ categories });
		}

		return json({ error: "Not found" }, { status: 404 });
	}

	if (url.pathname.startsWith("/api/admin")) {
		if (!db) return noDatabase();

		if (url.pathname === "/api/admin/login" && request.method === "POST") {
			const body = (await request.json()) as { email?: string; password?: string };
			const email = String(body.email ?? "").trim();
			const password = String(body.password ?? "");
			if (!email || !password) {
				return json({ error: "Email and password are required" }, { status: 400 });
			}
			const user = await verifyAdminLogin(db, email, password);
			if (!user) {
				return json({ error: "Invalid email or password" }, { status: 401 });
			}
			const token = await createSession(db, user.id);
			return json({ ok: true, email: user.email }, { headers: { "Set-Cookie": sessionCookie(token) } });
		}

		if (url.pathname === "/api/admin/logout" && request.method === "POST") {
			const token = readSessionToken(request);
			if (token) await deleteSession(db, token);
			return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
		}

		if (url.pathname === "/api/admin/me" && request.method === "GET") {
			const user = await getSessionUser(db, readSessionToken(request));
			return json({ authed: user != null, email: user?.email ?? null });
		}

		const unauthorized = await requireAdmin(request, db);
		if (unauthorized) return unauthorized;

		if (url.pathname === "/api/admin/upload" && request.method === "POST") {
			return handleUpload(request, env.BUCKET, db);
		}

		if (url.pathname === "/api/admin/posts" && request.method === "GET") {
			const posts = await listAllPosts(db);
			return json({ posts });
		}

		if (url.pathname === "/api/admin/posts" && request.method === "POST") {
			const body = (await request.json()) as Record<string, unknown>;
			const input = parsePostInput(body);
			if (!input.title || !input.slug) {
				return json({ error: "Title is required" }, { status: 400 });
			}
			const id = await createPost(db, input);
			return json({ id }, { status: 201 });
		}

		const postIdMatch = url.pathname.match(/^\/api\/admin\/posts\/(\d+)$/);
		if (postIdMatch) {
			const id = Number(postIdMatch[1]);

			if (request.method === "GET") {
				const post = await getPostById(db, id);
				if (!post) return json({ error: "Not found" }, { status: 404 });
				return json({ post });
			}

			if (request.method === "PUT") {
				const body = (await request.json()) as Record<string, unknown>;
				const input = parsePostInput(body);
				if (!input.title || !input.slug) {
					return json({ error: "Title is required" }, { status: 400 });
				}
				await updatePost(db, id, input);
				return json({ ok: true });
			}

			if (request.method === "DELETE") {
				await deletePost(db, id);
				return json({ ok: true });
			}
		}

		if (url.pathname === "/api/admin/categories" && request.method === "GET") {
			return json({ categories: await listCategories(db) });
		}

		if (url.pathname === "/api/admin/categories" && request.method === "POST") {
			const body = (await request.json()) as { name?: string; slug?: string };
			const name = String(body.name ?? "").trim();
			const slug = slugify(String(body.slug ?? name));
			if (!name || !slug) {
				return json({ error: "Name is required" }, { status: 400 });
			}
			const category = await createCategory(db, slug, name);
			return json({ category }, { status: 201 });
		}

		const categoryIdMatch = url.pathname.match(/^\/api\/admin\/categories\/(\d+)$/);
		if (categoryIdMatch && request.method === "DELETE") {
			await deleteCategory(db, Number(categoryIdMatch[1]));
			return json({ ok: true });
		}

		return json({ error: "Not found" }, { status: 404 });
	}

	return null;
}
