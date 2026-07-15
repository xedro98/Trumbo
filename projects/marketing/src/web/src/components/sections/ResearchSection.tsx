import { ArrowRight } from "@phosphor-icons/react";
import { SectionFooterLink } from "@/components/sections/MarketingSectionHeader";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";
const FEATURED = {
	category: "Engineering",
	title: "Building the Trumbo platform",
	description:
		"How we run the platform on Trumbo edge infrastructure, managed SQL, and static assets, and why we split marketing from the authenticated app.",
};

const POSTS = [
	{
		date: "Jun 2026",
		category: "CLI",
		title: "Publishing @trumbodev/cli to npm",
		excerpt:
			"GitHub Actions, semver, and keeping the OpenTUI terminal UI stable across Windows, macOS, and Linux.",
	},
	{
		date: "May 2026",
		category: "Platform",
		title: "Org-scoped billing and subscription fixes",
		excerpt:
			"Personal orgs, legacy scope fallbacks, and checkout polling: lessons from shipping Stripe on the Trumbo platform.",
	},
	{
		date: "Apr 2026",
		category: "Design",
		title: "Kumo design system adoption",
		excerpt:
			"Migrating buttons, charts, and tabs to our admin component library while keeping Trumbo green as the brand anchor.",
	},
];

export function ResearchSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-3">
			<GridBoxCell className={cn("md:col-span-3", marketingGridCellClass)}>
				<h2 className="marketing-heading">
					We work in the open. Research notes, release write-ups, and engineering deep dives.
				</h2>
			</GridBoxCell>

			<GridBoxCell
				className={cn(
					"flex min-h-[12rem] items-center justify-center bg-muted/10 md:col-span-1",
					marketingGridCellClass,
				)}
			>
				<WireframeShape />
			</GridBoxCell>
			<GridBoxCell className={cn("md:col-span-2", marketingGridCellClass)}>
				<p className="marketing-kicker mb-2">{FEATURED.category}</p>
				<h3 className="mb-3 text-2xl font-semibold">{FEATURED.title}</h3>
				<p className="text-muted-foreground">{FEATURED.description}</p>
			</GridBoxCell>

			{POSTS.map((post) => (
				<GridBoxCell key={post.title} className={marketingGridCellClass}>
					<p className="marketing-kicker mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
						<span>{post.date}</span>
						<span className="marketing-kicker-sep" aria-hidden="true" />
						<span>{post.category}</span>
					</p>
					<h3 className="mb-2 font-semibold leading-snug">{post.title}</h3>
					<p className="text-sm text-muted-foreground">{post.excerpt}</p>
				</GridBoxCell>
			))}

			<GridBoxCell className={cn("flex justify-end md:col-span-3", marketingGridCellClass)}>
				<SectionFooterLink href={platformLink("/docs")}>
					View all posts
					<ArrowRight size={14} />
				</SectionFooterLink>
			</GridBoxCell>
		</GridBox>
	);
}

function WireframeShape() {
	return (
		<svg
			viewBox="0 0 200 200"
			className="h-32 w-32 text-brand/60"
			fill="none"
			stroke="currentColor"
			strokeWidth="1"
		>
			<polygon points="100,20 180,70 180,130 100,180 20,130 20,70" opacity="0.8" />
			<polygon points="100,20 180,70 100,120 20,70" opacity="0.5" />
			<polygon points="100,120 180,70 180,130 100,180" opacity="0.35" />
			<polygon points="100,120 20,70 20,130 100,180" opacity="0.35" />
			<line x1="100" y1="20" x2="100" y2="180" />
			<line x1="20" y1="70" x2="180" y2="130" />
			<line x1="180" y1="70" x2="20" y2="130" />
		</svg>
	);
}
