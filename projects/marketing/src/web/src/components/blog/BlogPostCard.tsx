import { Link } from "wouter";
import { formatPostDate, type BlogPostSummary } from "@/lib/blog-api";
import { cn } from "@/lib/utils";

export function BlogPostCard({
	post,
	className,
	solo = false,
	compact = false,
}: {
	post: BlogPostSummary;
	className?: string;
	solo?: boolean;
	compact?: boolean;
}) {
	return (
		<Link
			href={`/blog/${post.slug}`}
			className={`group flex h-full w-full flex-col text-left ${className ?? ""}`}
		>
			<div
				className={cn(
					"relative w-full overflow-hidden bg-muted/10",
					solo
						? "aspect-[16/9] md:aspect-[16/9] lg:aspect-[5/3]"
						: compact
							? "aspect-[16/9] md:aspect-[2/1]"
							: "aspect-[16/10] md:aspect-[2/1] lg:aspect-[5/2]",
				)}
			>
				{post.coverImage ? (
					<img
						src={post.coverImage}
						alt=""
						className="absolute inset-0 block h-full w-full object-cover object-center"
						loading="lazy"
						decoding="async"
					/>
				) : (
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(43,191,119,0.12),transparent_65%)]" />
				)}
			</div>

			<div
				className={cn(
					"flex w-full flex-1 flex-col",
					compact ? "px-4 py-5 md:px-5 md:py-6" : "px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10",
				)}
			>
				<p className="marketing-kicker mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
					<span>{formatPostDate(post.publishedAt)}</span>
					{post.category ? (
						<>
							<span className="marketing-kicker-sep" aria-hidden="true" />
							<span>{post.category}</span>
						</>
					) : null}
				</p>
				<h3
					className={cn(
						"mb-3 font-heading font-normal leading-[1.34] tracking-[-0.02em] text-foreground",
						solo
							? "max-w-5xl text-2xl md:text-3xl lg:text-4xl"
							: compact
								? "text-lg md:text-xl"
								: "max-w-3xl text-xl md:text-2xl lg:text-3xl",
					)}
				>
					{post.title}
				</h3>
				{post.excerpt ? (
					<p
						className={cn(
							"text-sm leading-relaxed text-muted-foreground",
							solo
								? "max-w-5xl text-base md:text-lg lg:text-xl lg:leading-relaxed"
								: compact
									? "line-clamp-4 md:text-sm"
									: "max-w-3xl md:text-base lg:text-lg",
						)}
					>
						{post.excerpt}
					</p>
				) : null}
			</div>
		</Link>
	);
}
