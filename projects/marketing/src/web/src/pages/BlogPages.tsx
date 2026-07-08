import { PageSEO } from "@/components/PageSEO";
import { ArrowLeft } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { blogPostSeparatorClass } from "@/components/blog/blog-post-separator";
import { MarketingShell } from "@/components/MarketingShell";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { SectionFooterLink } from "@/components/sections/MarketingSectionHeader";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import {
	fetchAllPosts,
	fetchPost,
	formatPostDate,
	type BlogPostPublic,
	type BlogPostSummary,
} from "@/lib/blog-api";
import { cn } from "@/lib/utils";

function BlogBackLink() {
	return (
		<SectionFooterLink href="/blog" className="mb-6 inline-flex">
			<ArrowLeft size={14} />
			All posts
		</SectionFooterLink>
	);
}

export function BlogIndexPage() {
	const [posts, setPosts] = useState<BlogPostSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void fetchAllPosts()
			.then(setPosts)
			.finally(() => setLoading(false));
	}, []);

	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "!px-4 md:!px-6 lg:!px-8")}>
						<BlogBackLink />
						<h1 className="marketing-heading mb-2">Blog</h1>
						<p className="mb-8 max-w-2xl text-muted-foreground">
							Research notes, release write-ups, and engineering deep dives from the Trumbo team.
						</p>

						{loading ? (
							<p className="text-sm text-muted-foreground">Loading posts...</p>
						) : posts.length === 0 ? (
							<p className="text-sm text-muted-foreground">No posts yet.</p>
						) : (
							<div className="-ml-4 -mr-4 grid grid-cols-1 border-t border-grid-line md:-ml-6 md:-mr-6 md:grid-cols-2 lg:-ml-8 lg:-mr-8 lg:grid-cols-3">
								{posts.map((post, index) => (
									<div key={post.slug} className={blogPostSeparatorClass(index)}>
										<BlogPostCard post={post} compact={posts.length >= 3} />
									</div>
								))}
							</div>
						)}
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0 last:border-b-0">
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}

export function BlogPostPage() {
	const [, params] = useRoute("/blog/:slug");
	const slug = params?.slug ?? "";
	const [post, setPost] = useState<BlogPostPublic | null>(null);
	const [loading, setLoading] = useState(true);
	const [missing, setMissing] = useState(false);

	useEffect(() => {
		if (!slug) return;
		setLoading(true);
		setMissing(false);
		void fetchPost(slug)
			.then((result) => {
				if (!result) {
					setMissing(true);
					return;
				}
				setPost(result);
			})
			.finally(() => setLoading(false));
	}, [slug]);

	return (
		<MarketingShell>
			{post ? (
				<PageSEO
					title={post.title}
					description={post.excerpt || `Read ${post.title} on the Trumbo blog.`}
					path={`/blog/${post.slug}`}
					type="article"
					image={post.coverImage || undefined}
				/>
			) : missing ? (
				<PageSEO
					title="Post not found"
					description="This blog post may have been removed or the link is incorrect."
					path={`/blog/${slug}`}
					noIndex
				/>
			) : null}
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "!px-4 md:!px-6 lg:!px-8")}>
						{loading || missing || !post ? <BlogBackLink /> : null}

						{loading ? (
							<p className="text-sm text-muted-foreground">Loading...</p>
						) : missing || !post ? (
							<>
								<h1 className="marketing-heading mb-4">Post not found</h1>
								<p className="text-muted-foreground">
									This post may have been removed or the link is incorrect.
								</p>
								<Link href="/blog" className="mt-4 inline-block text-brand hover:underline">
									Back to blog
								</Link>
							</>
						) : (
							<article className="w-full">
								<div className="mb-6 flex items-center justify-between">
									<SectionFooterLink href="/blog" className="inline-flex">
										<ArrowLeft size={14} />
										All posts
									</SectionFooterLink>
									<p className="marketing-kicker flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
										<span>{formatPostDate(post.publishedAt)}</span>
										{post.category ? (
											<>
												<span className="marketing-kicker-sep" aria-hidden="true" />
												<span>{post.category}</span>
											</>
										) : null}
									</p>
								</div>
								<h1 className="mb-10 w-full font-heading text-[2rem] font-normal leading-[1.25] tracking-[-0.02em] text-foreground md:text-[2.5rem] md:leading-[1.2] lg:text-[3rem] lg:leading-[1.18]">
									{post.title}
								</h1>
								{post.coverImage ? (
									<div className="-ml-4 -mr-4 mb-10 md:-ml-6 md:-mr-6 lg:-ml-8 lg:-mr-8">
										<img
											src={post.coverImage}
											alt=""
											className="h-[28rem] w-full object-cover md:h-[34rem] lg:h-[40rem]"
										/>
									</div>
								) : null}
								<div
									className="blog-post-body w-full"
									dangerouslySetInnerHTML={{ __html: post.body }}
								/>
							</article>
						)}
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0 last:border-b-0">
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
