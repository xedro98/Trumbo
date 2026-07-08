export type BlogPostSummary = {
	slug: string;
	title: string;
	excerpt: string;
	coverImage: string | null;
	category: string | null;
	categorySlug: string | null;
	publishedAt: string | null;
};

export type BlogPostPublic = BlogPostSummary & {
	body: string;
};

export type BlogCategory = {
	id: number;
	slug: string;
	name: string;
};

export type AdminBlogPost = {
	id: number;
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	cover_image: string | null;
	category_id: number | null;
	category_name?: string | null;
	published: number;
	published_at: string | null;
	created_at: string;
	updated_at: string;
};

async function parseJson<T>(response: Response): Promise<T> {
	const data = (await response.json()) as T & { error?: string };
	if (!response.ok) {
		throw new Error((data as { error?: string }).error ?? "Request failed");
	}
	return data;
}

function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
	return fetch(input, { credentials: "include", ...init });
}

export function formatPostDate(iso: string | null): string {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export async function fetchLatestPosts(limit = 3): Promise<BlogPostSummary[]> {
	try {
		const response = await fetch(`/api/blog/posts?limit=${limit}`);
		if (!response.ok) return [];
		const data = await parseJson<{ posts: BlogPostSummary[] }>(response);
		return data.posts ?? [];
	} catch {
		return [];
	}
}

export async function fetchAllPosts(): Promise<BlogPostSummary[]> {
	const response = await fetch("/api/blog/posts");
	const data = await parseJson<{ posts: BlogPostSummary[] }>(response);
	return data.posts ?? [];
}

export async function fetchPost(slug: string): Promise<BlogPostPublic | null> {
	const response = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`);
	if (response.status === 404) return null;
	const data = await parseJson<{ post: BlogPostPublic }>(response);
	return data.post;
}

export async function fetchCategories(): Promise<BlogCategory[]> {
	const response = await fetch("/api/blog/categories");
	const data = await parseJson<{ categories: BlogCategory[] }>(response);
	return data.categories ?? [];
}

export async function adminMe(): Promise<{ authed: boolean; email: string | null }> {
	try {
		const response = await adminFetch("/api/admin/me");
		if (!response.ok) return { authed: false, email: null };
		return await parseJson<{ authed: boolean; email: string | null }>(response);
	} catch {
		return { authed: false, email: null };
	}
}

export async function adminLogin(email: string, password: string): Promise<void> {
	const response = await adminFetch("/api/admin/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	await parseJson(response);
}

export async function adminLogout(): Promise<void> {
	await adminFetch("/api/admin/logout", { method: "POST" });
}

export async function adminFetchPosts(): Promise<AdminBlogPost[]> {
	const response = await adminFetch("/api/admin/posts");
	const data = await parseJson<{ posts: AdminBlogPost[] }>(response);
	return data.posts ?? [];
}

export async function adminFetchPost(id: number): Promise<AdminBlogPost> {
	const response = await adminFetch(`/api/admin/posts/${id}`);
	const data = await parseJson<{ post: AdminBlogPost }>(response);
	return data.post;
}

export type PostInput = {
	title: string;
	slug: string;
	excerpt: string;
	body: string;
	coverImage: string | null;
	categoryId: number | null;
	published: boolean;
	publishedAt: string | null;
};

export async function adminCreatePost(input: PostInput): Promise<number> {
	const response = await adminFetch("/api/admin/posts", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const data = await parseJson<{ id: number }>(response);
	return data.id;
}

export async function adminUpdatePost(id: number, input: PostInput): Promise<void> {
	const response = await adminFetch(`/api/admin/posts/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	await parseJson(response);
}

export async function adminDeletePost(id: number): Promise<void> {
	const response = await adminFetch(`/api/admin/posts/${id}`, { method: "DELETE" });
	await parseJson(response);
}

export async function adminFetchCategories(): Promise<BlogCategory[]> {
	const response = await adminFetch("/api/admin/categories");
	const data = await parseJson<{ categories: BlogCategory[] }>(response);
	return data.categories ?? [];
}

export async function adminCreateCategory(name: string, slug?: string): Promise<BlogCategory> {
	const response = await adminFetch("/api/admin/categories", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, slug }),
	});
	const data = await parseJson<{ category: BlogCategory }>(response);
	return data.category;
}

export async function adminDeleteCategory(id: number): Promise<void> {
	const response = await adminFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
	await parseJson(response);
}

export async function adminUploadImage(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("file", file);
	const response = await adminFetch("/api/admin/upload", {
		method: "POST",
		body: formData,
	});
	const data = await parseJson<{ url: string }>(response);
	return data.url;
}

export function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}
