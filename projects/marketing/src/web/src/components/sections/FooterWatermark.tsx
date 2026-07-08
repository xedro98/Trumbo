import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "wouter";
import { TrumboLogo } from "@/components/TrumboLogo";
import { SocialBrandIcon } from "@/components/SocialBrandIcons";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import {
	ACTION_ITEMS,
	LEGAL_ITEMS,
	SOCIAL_ITEMS,
} from "@/components/MarketingSidebar";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { MARKETING_EXPLORE_ITEMS } from "@/lib/marketing-sections";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";

const FOOTER_PLATFORM_LINKS = [
	{ label: "Documentation", href: platformLink("/docs"), external: true },
	{ label: "Company", href: "/company" },
	{ label: "Blog", href: "/blog" },
] as const;

const footerLinkClass =
	"font-sans text-sm text-muted-foreground transition-colors hover:text-brand";

const footerKickerClass =
	"mb-4 font-sans text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground sm:mb-6";

const footerGridCellClass = cn(
	marketingGridCellClass,
	"!border-r-0 !py-8 sm:!py-10 md:!py-12 lg:!col-span-3 lg:!py-14 lg:!border-r",
);

const footerBottomCellClass = cn(
	marketingGridCellClass,
	"!border-r-0 !py-6 sm:!py-8 md:!py-10 lg:col-span-12",
);

function FooterLink({
	href,
	label,
	external,
}: {
	href: string;
	label: string;
	external?: boolean;
}) {
	if (external) {
		return (
			<a href={href} target="_blank" rel="noreferrer" className={footerLinkClass}>
				{label}
			</a>
		);
	}

	return (
		<Link href={href} className={footerLinkClass}>
			{label}
		</Link>
	);
}

export function MarketingFooter() {
	const signup = ACTION_ITEMS.find((item) => item.label === "Get Started");
	const login = ACTION_ITEMS.find((item) => item.label === "Log In");

	return (
		<footer className="relative z-[1] -mt-px border-t border-t-dotted border-grid-line bg-background font-sans">
			<GridBox className="grid-cols-1 !border-t-0 sm:grid-cols-2 lg:grid-cols-12">
				<GridBoxCell className={cn(footerGridCellClass, "sm:col-span-2 lg:col-span-3")}>
					<Link href="/" className="inline-flex items-center">
						<TrumboLogo className="h-7 w-auto" />
					</Link>
				</GridBoxCell>

				<GridBoxCell className={footerGridCellClass}>
					<p className={footerKickerClass}>Explore</p>
					<nav className="flex flex-col gap-3.5 sm:gap-5">
						{MARKETING_EXPLORE_ITEMS.map((item) => (
							<FooterLink key={item.href} {...item} />
						))}
					</nav>
				</GridBoxCell>

				<GridBoxCell className={footerGridCellClass}>
					<p className={footerKickerClass}>Platform</p>
					<nav className="flex flex-col gap-3.5 sm:gap-5">
						{FOOTER_PLATFORM_LINKS.map((item) => (
							<FooterLink key={item.href} {...item} />
						))}
						{signup ? (
							<a href={signup.href} className={cn(footerLinkClass, "inline-flex items-center gap-1.5")}>
								{signup.label}
								<ArrowRight size={14} aria-hidden="true" />
							</a>
						) : null}
						{login ? (
							<a href={login.href} className={cn(footerLinkClass, "inline-flex items-center gap-1.5")}>
								{login.label}
								<ArrowRight size={14} aria-hidden="true" />
							</a>
						) : null}
					</nav>
				</GridBoxCell>

				<GridBoxCell className={cn(footerGridCellClass, "sm:col-span-2 lg:col-span-3")}>
					<p className={footerKickerClass}>Connect</p>
					<nav className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3.5 lg:flex-col lg:gap-5">
						{SOCIAL_ITEMS.map(({ label, href }) => (
							<a
								key={label}
								href={href}
								target="_blank"
								rel="noreferrer"
								className={cn(footerLinkClass, "inline-flex items-center gap-2")}
							>
								<SocialBrandIcon label={label as "X" | "GitHub" | "LinkedIn"} size={15} />
								{label}
							</a>
						))}
					</nav>
				</GridBoxCell>

				<GridBoxCell className={footerBottomCellClass}>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
							{LEGAL_ITEMS.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="text-sm tracking-[0.04em] text-muted-foreground transition-colors hover:text-foreground"
								>
									{item.label}
								</Link>
							))}
						</div>
						<p className="text-sm tracking-[0.04em] text-muted-foreground">
							© {new Date().getFullYear()} Maxfense, Inc
						</p>
					</div>
				</GridBoxCell>
			</GridBox>
		</footer>
	);
}

/** @deprecated Use MarketingFooter */
export const FooterWatermark = MarketingFooter;
