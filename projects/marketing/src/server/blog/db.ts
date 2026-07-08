import type { D1Database } from "@cloudflare/workers-types";
import type {
	BlogCategory,
	BlogCategoryRow,
	BlogPostPublic,
	BlogPostRow,
	BlogPostSummary,
} from "./types";

function mapPostSummary(row: BlogPostRow & { category_name?: string | null; category_slug?: string | null }): BlogPostSummary {
	return {
		slug: row.slug,
		title: row.title,
		excerpt: row.excerpt,
		coverImage: row.cover_image ?? null,
		category: row.category_name ?? null,
		categorySlug: row.category_slug ?? null,
		publishedAt: row.published_at,
	};
}

function mapPostPublic(row: BlogPostRow & { category_name?: string | null; category_slug?: string | null }): BlogPostPublic {
	return {
		...mapPostSummary(row),
		body: row.body,
	};
}

const postSelect = `
	SELECT
		p.*,
		c.name AS category_name,
		c.slug AS category_slug
	FROM blog_posts p
	LEFT JOIN blog_categories c ON c.id = p.category_id
`;

export async function listPublishedPosts(db: D1Database, limit?: number): Promise<BlogPostSummary[]> {
	const sql =
		limit != null
			? `${postSelect} WHERE p.published = 1 ORDER BY p.published_at DESC, p.id DESC LIMIT ?`
			: `${postSelect} WHERE p.published = 1 ORDER BY p.published_at DESC, p.id DESC`;

	const statement = limit != null ? db.prepare(sql).bind(limit) : db.prepare(sql);
	const { results } = await statement.all<BlogPostRow & { category_name?: string | null; category_slug?: string | null }>();
	return (results ?? []).map(mapPostSummary);
}

export async function getPublishedPost(db: D1Database, slug: string): Promise<BlogPostPublic | null> {
	const row = await db
		.prepare(`${postSelect} WHERE p.published = 1 AND p.slug = ?`)
		.bind(slug)
		.first<BlogPostRow & { category_name?: string | null; category_slug?: string | null }>();
	return row ? mapPostPublic(row) : null;
}

export async function listCategories(db: D1Database): Promise<BlogCategory[]> {
	const { results } = await db
		.prepare("SELECT id, slug, name FROM blog_categories ORDER BY name ASC")
		.all<BlogCategoryRow>();
	return results ?? [];
}

export async function listAllPosts(db: D1Database): Promise<(BlogPostRow & { category_name?: string | null })[]> {
	const { results } = await db
		.prepare(`${postSelect} ORDER BY p.updated_at DESC, p.id DESC`)
		.all<BlogPostRow & { category_name?: string | null }>();
	return results ?? [];
}

export async function getPostById(db: D1Database, id: number): Promise<BlogPostRow | null> {
	return db.prepare("SELECT * FROM blog_posts WHERE id = ?").bind(id).first<BlogPostRow>();
}

export async function createCategory(db: D1Database, slug: string, name: string): Promise<BlogCategory> {
	await db.prepare("INSERT INTO blog_categories (slug, name) VALUES (?, ?)").bind(slug, name).run();
	const row = await db
		.prepare("SELECT id, slug, name FROM blog_categories WHERE slug = ?")
		.bind(slug)
		.first<BlogCategoryRow>();
	if (!row) {
		throw new Error("Failed to create category");
	}
	return row;
}

export async function deleteCategory(db: D1Database, id: number): Promise<void> {
	await db.prepare("DELETE FROM blog_categories WHERE id = ?").bind(id).run();
}

export type PostInput = {
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	coverImage: string | null;
	categoryId: number | null;
	published: boolean;
	publishedAt: string | null;
};

export async function createPost(db: D1Database, input: PostInput): Promise<number> {
	const result = await db
		.prepare(
			`INSERT INTO blog_posts (slug, title, excerpt, body, cover_image, category_id, published, published_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
		)
		.bind(
			input.slug,
			input.title,
			input.excerpt,
			input.body,
			input.coverImage,
			input.categoryId,
			input.published ? 1 : 0,
			input.publishedAt,
		)
		.run();
	return Number(result.meta.last_row_id);
}

export async function updatePost(db: D1Database, id: number, input: PostInput): Promise<void> {
	await db
		.prepare(
			`UPDATE blog_posts
			 SET slug = ?, title = ?, excerpt = ?, body = ?, cover_image = ?, category_id = ?, published = ?, published_at = ?, updated_at = datetime('now')
			 WHERE id = ?`,
		)
		.bind(
			input.slug,
			input.title,
			input.excerpt,
			input.body,
			input.coverImage,
			input.categoryId,
			input.published ? 1 : 0,
			input.publishedAt,
			id,
		)
		.run();
}

export async function deletePost(db: D1Database, id: number): Promise<void> {
	await db.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id).run();
}

export function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

export function formatPostDate(iso: string | null): string {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
