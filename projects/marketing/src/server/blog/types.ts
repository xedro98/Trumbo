export type BlogCategoryRow = {
	id: number;
	slug: string;
	name: string;
	created_at: string;
};

export type BlogPostRow = {
	id: number;
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	cover_image: string | null;
	category_id: number | null;
	published: number;
	published_at: string | null;
	created_at: string;
	updated_at: string;
};

export type BlogPostPublic = {
	slug: string;
	title: string;
	excerpt: string;
	coverImage: string | null;
	body: string;
	category: string | null;
	categorySlug: string | null;
	publishedAt: string | null;
};

export type BlogPostSummary = Omit<BlogPostPublic, "body">;

export type BlogCategory = {
	id: number;
	slug: string;
	name: string;
};
