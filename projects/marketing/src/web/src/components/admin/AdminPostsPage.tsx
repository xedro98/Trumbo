import { Badge, Button, Loader, Tabs } from "@cloudflare/kumo";
import { MagnifyingGlass, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
	adminDeletePost,
	adminFetchPosts,
	formatPostDate,
	type AdminBlogPost,
} from "@/lib/blog-api";

type Filter = "all" | "published" | "draft";

export function AdminPostsPage() {
	const [posts, setPosts] = useState<AdminBlogPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState<Filter>("all");
	const [query, setQuery] = useState("");
	const [deleting, setDeleting] = useState<number | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<AdminBlogPost | null>(null);

	useEffect(() => {
		setLoading(true);
		adminFetchPosts()
			.then(setPosts)
			.catch(() => setError("Failed to load posts"))
			.finally(() => setLoading(false));
	}, []);

	const stats = useMemo(() => {
		const published = posts.filter((p) => p.published === 1).length;
		return { total: posts.length, published, drafts: posts.length - published };
	}, [posts]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return posts.filter((post) => {
			if (filter === "published" && post.published !== 1) return false;
			if (filter === "draft" && post.published === 1) return false;
			if (!q) return true;
			return (
				post.title.toLowerCase().includes(q) ||
				post.excerpt.toLowerCase().includes(q) ||
				(post.category_name ?? "").toLowerCase().includes(q)
			);
		});
	}, [posts, filter, query]);

	async function doDelete() {
		if (!deleteConfirm) return;
		const id = deleteConfirm.id;
		setDeleting(id);
		setPosts((prev) => prev.filter((p) => p.id !== id));
		try {
			await adminDeletePost(id);
			setDeleteConfirm(null);
		} catch (deleteError) {
			setPosts((prev) => [deleteConfirm, ...prev].sort((a, b) => b.id - a.id));
			setError(deleteError instanceof Error ? deleteError.message : "Failed to delete");
		} finally {
			setDeleting(null);
		}
	}

	return (
		<div className="p-6 md:p-8 lg:p-10 space-y-6">
			{/* page header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-kumo-strong">Posts</h1>
					<p className="mt-1 text-kumo-subtle text-sm max-w-lg">
						Write, publish, and manage blog posts for trumbo.dev.
					</p>
				</div>
				<Link href="/admin/posts/new">
					<Button variant="primary" icon={<Plus size={16} />}>
						New post
					</Button>
				</Link>
			</div>

			{/* stats */}
			<div className="grid grid-cols-3 gap-0 rounded-xl border border-kumo-hairline bg-kumo-elevated overflow-hidden">
				{[
					{ label: "Total", value: stats.total },
					{ label: "Published", value: stats.published },
					{ label: "Drafts", value: stats.drafts },
				].map((stat) => (
					<div
						key={stat.label}
						className="px-5 py-4 border-r border-r-kumo-border last:border-r-0"
					>
						<div className="text-xs font-medium text-kumo-inactive uppercase tracking-wider">
							{stat.label}
						</div>
						<div className="text-2xl font-semibold text-kumo-strong mt-1">{stat.value}</div>
					</div>
				))}
			</div>

			{/* filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<Tabs
					variant="underline"
					size="sm"
					value={filter}
					onValueChange={(v) => setFilter(v as Filter)}
					tabs={[
						{ value: "all", label: `All (${stats.total})` },
						{ value: "published", label: `Published (${stats.published})` },
						{ value: "draft", label: `Drafts (${stats.drafts})` },
					]}
				/>
				<div className="relative w-full sm:max-w-[14rem]">
					<MagnifyingGlass
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-inactive pointer-events-none z-10"
					/>
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search posts..."
						className="w-full h-9 rounded-lg border border-kumo-hairline bg-kumo-canvas pl-9 pr-3 text-sm text-kumo-strong placeholder:text-kumo-inactive focus:outline-none focus:ring-2 focus:ring-kumo-brand/20 focus:border-kumo-brand/40"
					/>
				</div>
			</div>

			{/* error */}
			{error ? (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			) : null}

			{/* content */}
			{loading ? (
				<div className="flex items-center gap-3 py-16 text-sm text-kumo-subtle">
					<Loader className="size-4" />
					Loading posts...
				</div>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-kumo-hairline py-16 text-center">
					<p className="text-sm font-medium text-kumo-strong">
						{posts.length === 0 ? "No posts yet" : "No matches"}
					</p>
					<p className="mt-1 text-sm text-kumo-subtle max-w-sm">
						{posts.length === 0
							? "Create your first post to show up on the homepage and blog index."
							: "Try a different filter or search term."}
					</p>
					{posts.length === 0 ? (
						<Link href="/admin/posts/new" className="mt-4">
							<Button variant="primary" size="sm" icon={<Plus size={14} />}>
								Create first post
							</Button>
						</Link>
					) : null}
				</div>
			) : (
				<div className="rounded-xl border border-kumo-hairline overflow-hidden">
					{filtered.map((post) => (
						<div
							key={post.id}
							className="flex flex-col gap-3 px-6 py-5 border-b border-kumo-hairline last:border-b-0 hover:bg-kumo-fill-hover/50 transition-colors md:flex-row md:items-start md:justify-between"
						>
							<div className="min-w-0 flex-1 space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant={post.published === 1 ? "success" : "neutral"}
									>
										{post.published === 1 ? "Published" : "Draft"}
									</Badge>
									{post.category_name ? (
										<span className="text-xs text-kumo-inactive font-medium uppercase tracking-wider">
											{post.category_name}
										</span>
									) : null}
									<span className="text-xs text-kumo-inactive">
										{post.published ? formatPostDate(post.published_at) : "Unscheduled"}
									</span>
								</div>
								<h2 className="font-semibold text-kumo-strong">{post.title}</h2>
								{post.excerpt ? (
									<p className="line-clamp-2 text-sm text-kumo-subtle max-w-2xl">
										{post.excerpt}
									</p>
								) : null}
								<p className="text-xs text-kumo-inactive font-mono">/blog/{post.slug}</p>
							</div>

							<div className="flex shrink-0 items-center gap-2">
								{post.published === 1 ? (
									<a
										href={`/blog/${post.slug}`}
										target="_blank"
										rel="noreferrer"
										className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-medium text-kumo-subtle hover:text-kumo-strong rounded-md hover:bg-kumo-fill-hover transition-colors"
									>
										Preview
									</a>
								) : null}
								<Link href={`/admin/posts/${post.id}`}>
									<Button variant="outline" size="sm" icon={<PencilSimple size={14} />}>
										Edit
									</Button>
								</Link>
								<Button
									variant="ghost"
									size="sm"
									shape="square"
									onClick={() => setDeleteConfirm(post)}
									aria-label={`Delete ${post.title}`}
								>
									<Trash size={16} />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* delete confirm */}
			{deleteConfirm ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<button
						type="button"
						className="absolute inset-0 bg-black/20 backdrop-blur-sm"
						onClick={() => setDeleteConfirm(null)}
						aria-label="Close"
					/>
					<div className="relative w-full max-w-md rounded-xl border border-kumo-hairline bg-kumo-canvas p-6 shadow-xl">
						<h2 className="font-semibold text-kumo-strong">Delete post?</h2>
						<p className="mt-2 text-sm text-kumo-subtle">
							"{deleteConfirm.title}" will be removed permanently. This cannot be undone.
						</p>
						<div className="mt-6 flex gap-3 justify-end">
							<Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								size="sm"
								loading={deleting === deleteConfirm.id}
								onClick={doDelete}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
