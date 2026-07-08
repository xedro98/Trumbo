import { useEffect, useState } from "react";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { fetchLatestPosts, type BlogPostSummary } from "@/lib/blog-api";
import { cn } from "@/lib/utils";

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";

function BlogGridCell({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				gridCellSizeClass,
				"border-b border-r border-dotted bg-muted/[0.06]",
				sideGridLineClass,
				className,
			)}
		/>
	);
}

function BlogGridPanel({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"grid w-fit shrink-0 grid-cols-3 grid-rows-4 border-foreground/30",
				className,
			)}
			aria-hidden="true"
		>
			{Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, index) => {
				const row = Math.floor(index / GRID_COLS);
				const col = index % GRID_COLS;

				return (
					<BlogGridCell
						key={index}
						className={cn(col === GRID_COLS - 1 && "border-r-0", row === GRID_ROWS - 1 && "border-b-0")}
					/>
				);
			})}
		</div>
	);
}

function BlogBannerHeading() {
	return (
		<div className="flex flex-col">
			<p className="marketing-kicker mb-3">Blog</p>
			<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
				Release write-ups, engineering essays, and what we learn shipping AI tools developers
				actually use.
			</h2>
		</div>
	);
}

function BlogBanner() {
	return (
		<>
			<div className="hidden md:flex md:items-stretch">
				<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
					<BlogBannerHeading />
				</div>
				<BlogGridPanel className="border-l border-dotted" />
			</div>
			<div className="md:hidden">
				<div className={cn(marketingGridCellClass, "!py-5")}>
					<BlogBannerHeading />
				</div>
				<div className={cn("flex justify-end border-t border-dotted", sideGridLineClass)}>
					<BlogGridPanel />
				</div>
			</div>
		</>
	);
}

function SecondaryBlogPostCell({
	post,
	index,
	compact = true,
}: {
	post: BlogPostSummary;
	index: number;
	compact?: boolean;
}) {
	return (
		<GridBoxCell
			key={post.slug}
			className={cn(
				"!p-0 md:!border-r-0",
				index > 0 &&
					"border-t border-t-dotted border-grid-line md:border-t-0 md:border-l md:border-l-solid",
			)}
		>
			<BlogPostCard post={post} compact={compact} />
		</GridBoxCell>
	);
}

function LatestBlogPostList({ posts }: { posts: BlogPostSummary[] }) {
	if (posts.length === 1) {
		return (
			<GridBoxCell className="col-span-full !p-0">
				<BlogPostCard post={posts[0]} solo />
			</GridBoxCell>
		);
	}

	if (posts.length >= 3) {
		const [featured, ...secondary] = posts;

		return (
			<>
				<GridBoxCell className="col-span-full !p-0">
					<BlogPostCard post={featured} solo />
				</GridBoxCell>
				<GridBoxCell className="col-span-full !p-0">
					<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-2">
						{secondary.slice(0, 2).map((post, index) => (
							<SecondaryBlogPostCell key={post.slug} post={post} index={index} />
						))}
					</GridBox>
				</GridBoxCell>
			</>
		);
	}

	return (
		<GridBoxCell className="col-span-full !p-0">
			<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-2">
				{posts.map((post, index) => (
					<SecondaryBlogPostCell key={post.slug} post={post} index={index} compact={false} />
				))}
			</GridBox>
		</GridBoxCell>
	);
}

export function LatestBlogPosts() {
	const [posts, setPosts] = useState<BlogPostSummary[]>([]);

	useEffect(() => {
		void fetchLatestPosts(3).then(setPosts);
	}, []);

	if (posts.length === 0) {
		return null;
	}

	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="col-span-full !p-0">
				<BlogBanner />
			</GridBoxCell>

			<LatestBlogPostList posts={posts} />
		</GridBox>
	);
}
