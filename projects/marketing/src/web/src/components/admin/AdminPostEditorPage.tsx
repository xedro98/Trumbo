import { Button, Input, InputArea, Loader, Select, Switch } from "@cloudflare/kumo";
import { ArrowSquareOut, FloppyDisk } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AdminCoverImageUploader } from "@/components/admin/AdminCoverImageUploader";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import {
	adminCreatePost,
	adminFetchCategories,
	adminFetchPost,
	adminUpdatePost,
	slugify,
	type BlogCategory,
	type PostInput,
} from "@/lib/blog-api";

export function AdminPostEditorPage({ postId }: { postId?: number }) {
	const [, navigate] = useLocation();
	const [categories, setCategories] = useState<BlogCategory[]>([]);
	const [loading, setLoading] = useState(Boolean(postId));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [excerpt, setExcerpt] = useState("");
	const [body, setBody] = useState("");
	const [coverImage, setCoverImage] = useState<string | null>(null);
	const [categoryId, setCategoryId] = useState<string>("");
	const [published, setPublished] = useState(false);
	const [slugTouched, setSlugTouched] = useState(false);

	useEffect(() => {
		void adminFetchCategories().then(setCategories);
	}, []);

	useEffect(() => {
		if (!postId) return;
		void adminFetchPost(postId)
			.then((post) => {
				setTitle(post.title);
				setSlug(post.slug);
				setExcerpt(post.excerpt);
				setBody(post.body);
				setCoverImage(post.cover_image ?? null);
				setCategoryId(post.category_id ? String(post.category_id) : "");
				setPublished(post.published === 1);
				setSlugTouched(true);
			})
			.catch(() => setError("Failed to load post"))
			.finally(() => setLoading(false));
	}, [postId]);

	useEffect(() => {
		if (!slugTouched && title) {
			setSlug(slugify(title));
		}
	}, [title, slugTouched]);

	function buildInput(): PostInput {
		return {
			title: title.trim(),
			slug: slugify(slug || title),
			excerpt: excerpt.trim(),
			body,
			coverImage,
			categoryId: categoryId ? Number(categoryId) : null,
			published,
			publishedAt: published ? new Date().toISOString() : null,
		};
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError("");
		try {
			const input = buildInput();
			if (postId) {
				await adminUpdatePost(postId, input);
			} else {
				await adminCreatePost(input);
			}
			navigate("/admin/posts");
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center gap-3 p-10 text-sm text-kumo-subtle">
				<Loader className="size-4" />
				Loading post...
			</div>
		);
	}

	const previewSlug = slugify(slug || title);

	return (
		<div className="p-6 md:p-8 lg:p-10">
			<Link
				href="/admin/posts"
				className="inline-flex items-center gap-1.5 text-sm text-kumo-subtle hover:text-kumo-strong transition-colors mb-6"
			>
				&larr; All posts
			</Link>

			<form onSubmit={handleSubmit}>
				<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8">
					<div>
						<h1 className="text-2xl font-semibold text-kumo-strong">
							{postId ? "Edit post" : "New post"}
						</h1>
						<p className="mt-1 text-sm text-kumo-subtle">
							Write in rich text. Content is stored as HTML.
						</p>
					</div>
					<div className="flex items-center gap-3">
						{published && previewSlug ? (
							<a href={`/blog/${previewSlug}`} target="_blank" rel="noreferrer">
								<Button
									type="button"
									variant="outline"
									size="sm"
									icon={<ArrowSquareOut size={14} />}
								>
									Preview
								</Button>
							</a>
						) : null}
						<Button
							type="submit"
							variant="primary"
							size="sm"
							loading={saving}
							icon={<FloppyDisk size={14} />}
						>
							{postId ? "Save changes" : "Create post"}
						</Button>
					</div>
				</div>

				<AdminCoverImageUploader value={coverImage} onChange={setCoverImage} className="mb-8" />

				<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
					{/* main fields */}
					<div className="space-y-5">
						<Input
							label="Title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Post title"
							required
						/>

						<div>
							<label className="block mb-1.5 text-xs font-medium text-kumo-inactive uppercase tracking-wider">
								Slug
							</label>
							<input
								value={slug}
								onChange={(e) => {
									setSlugTouched(true);
									setSlug(e.target.value);
								}}
								placeholder="your-post-slug"
								className="w-full h-10 rounded-lg border border-kumo-hairline bg-kumo-canvas px-3 text-sm text-kumo-strong font-mono placeholder:text-kumo-inactive focus:outline-none focus:ring-2 focus:ring-kumo-brand/20 focus:border-kumo-brand/40"
								required
							/>
							<p className="mt-1 text-xs text-kumo-inactive">
								Public URL: /blog/{previewSlug || "your-slug"}
							</p>
						</div>

						<InputArea
							label="Excerpt"
							value={excerpt}
							onChange={(e) => setExcerpt(e.target.value)}
							placeholder="A short summary for listing pages"
							description={`${excerpt.length} characters — used on cards and for SEO`}
							rows={3}
						/>

						<div>
							<label className="block mb-1.5 text-xs font-medium text-kumo-inactive uppercase tracking-wider">
								Body
							</label>
							<AdminRichTextEditor value={body} onChange={setBody} />
						</div>
					</div>

					{/* sidebar */}
					<aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
						<div className="rounded-xl border border-kumo-hairline bg-kumo-elevated p-5 space-y-4">
							<h3 className="text-xs font-medium text-kumo-inactive uppercase tracking-wider">
								Publish
							</h3>
							<div className="flex items-center justify-between">
								<span className="text-sm text-kumo-strong">Published</span>
								<Switch
									checked={published}
									onCheckedChange={setPublished}
								/>
							</div>
						</div>

						<div className="rounded-xl border border-kumo-hairline bg-kumo-elevated p-5 space-y-3">
							<h3 className="text-xs font-medium text-kumo-inactive uppercase tracking-wider">
								Organization
							</h3>
							<Select
								label="Category"
								value={categoryId || null}
								onValueChange={(v) => setCategoryId(v ?? "")}
								placeholder="Uncategorized"
								items={Object.fromEntries(
									categories.map((cat) => [String(cat.id), cat.name]),
								)}
							/>
						</div>

						{error ? (
							<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
								{error}
							</div>
						) : null}

						<Button
							type="submit"
							variant="primary"
							className="w-full"
							loading={saving}
							icon={<FloppyDisk size={16} />}
						>
							{postId ? "Save changes" : "Create post"}
						</Button>
						<Link href="/admin/posts">
							<Button type="button" variant="outline" className="w-full">
								Cancel
							</Button>
						</Link>
					</aside>
				</div>
			</form>
		</div>
	);
}
