import { ArrowRight, CaretDown, GithubLogo, List, X } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { MarketingThemeSwitcher } from "@/components/MarketingThemeSwitcher";
import { TrumboLogo } from "@/components/TrumboLogo";
import {
	MARKETING_EXPLORE_ITEMS,
	isMarketingExploreGroup,
	type MarketingExploreEntry,
	type MarketingExploreGroup,
	type MarketingExploreItem,
} from "@/lib/marketing-sections";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";

function exploreLinkClass(active: boolean) {
	return cn(
		"cursor-pointer font-stat text-sm font-medium leading-none text-muted-foreground transition-colors hover:text-brand",
		active && "text-brand hover:text-brand",
	);
}

function ExploreNavLink({
	href,
	label,
	external,
	className,
	onNavigate,
}: {
	href: string;
	label: string;
	external?: boolean;
	className?: string;
	onNavigate?: () => void;
}) {
	const [location] = useLocation();
	const active = !external && (location === href || location.startsWith(`${href}/`));

	if (external) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noreferrer"
				className={cn(exploreLinkClass(false), className)}
				onClick={onNavigate}
			>
				{label}
			</a>
		);
	}

	return (
		<Link href={href} className={cn(exploreLinkClass(active), className)} onClick={onNavigate}>
			{active ? <span className="text-brand">— </span> : null}
			{label}
		</Link>
	);
}

export const ACTION_ITEMS: {
	label: string;
	href: string;
	trailingArrow?: boolean;
	icon?: Icon;
	external?: boolean;
}[] = [
	{
		label: "GitHub",
		href: "https://github.com/xedro98/Trumbo",
		icon: GithubLogo,
		external: true,
	},
	{ label: "Get Started", href: platformLink("/signup") },
	{ label: "Log In", href: platformLink("/login"), trailingArrow: true },
];
export const LEGAL_ITEMS = [
	{ label: "Privacy", href: "/privacy" },
	{ label: "Terms", href: "/terms" },
	{ label: "Refund", href: "/refund" },
] as const;

export const SOCIAL_ITEMS = [
	{ label: "X", href: "https://x.com/trumbodev" },
	{ label: "GitHub", href: "https://github.com/xedro98/Trumbo" },
	{ label: "LinkedIn", href: "https://linkedin.com/company/trumbo" },
] as const;

const sidebarLinkClass =
	"cursor-pointer font-stat text-sm font-medium leading-none text-muted-foreground transition-colors hover:text-brand";

const sidebarActionLinkClass =
	"cursor-pointer font-stat text-sm font-medium leading-none text-muted-foreground transition-colors hover:text-brand";

function SidebarNavRow({
	bordered,
	children,
}: {
	bordered?: boolean;
	children: ReactNode;
}) {
	return (
		<div className={cn(bordered && "border-t border-t-dotted border-grid-line")}>
			{children}
		</div>
	);
}

function ActionNavLink({
	label,
	href,
	trailingArrow,
	icon: Icon,
	external,
	className,
	onNavigate,
}: {
	label: string;
	href: string;
	trailingArrow?: boolean;
	icon?: Icon;
	external?: boolean;
	className?: string;
	onNavigate?: () => void;
}) {
	return (
		<a
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noreferrer" : undefined}
			className={cn(
				sidebarActionLinkClass,
				"inline-flex items-center gap-1.5",
				className,
			)}
			onClick={onNavigate}
		>
			{Icon ? <Icon size={16} weight="regular" aria-hidden="true" /> : null}
			{label}
			{trailingArrow ? <ArrowRight size={14} weight="regular" aria-hidden="true" /> : null}
		</a>
	);
}

function isExploreChildActive(location: string, items: MarketingExploreItem[]) {
	return items.some(
		(item) =>
			!item.external &&
			(location === item.href || location.startsWith(`${item.href}/`)),
	);
}

function MarketingExploreGroupNav({
	entry,
	bordered,
	linkClassName,
	onNavigate,
}: {
	entry: MarketingExploreGroup;
	bordered?: boolean;
	linkClassName?: string;
	onNavigate?: () => void;
}) {
	const [location] = useLocation();
	const childActive = isExploreChildActive(location, entry.items);
	const [expanded, setExpanded] = useState(childActive);

	useEffect(() => {
		if (childActive) {
			setExpanded(true);
		}
	}, [childActive]);

	return (
		<>
			<SidebarNavRow bordered={bordered}>
				<button
					type="button"
					onClick={() => setExpanded((current) => !current)}
					className={cn(
						exploreLinkClass(childActive),
						"flex w-full items-center justify-between gap-3 py-4 text-left",
						linkClassName,
					)}
					aria-expanded={expanded}
				>
					<span>{entry.group}</span>
					<CaretDown
						size={14}
						weight="regular"
						aria-hidden="true"
						className={cn(
							"shrink-0 text-muted-foreground transition-transform duration-200",
							expanded && "rotate-180",
						)}
					/>
				</button>
			</SidebarNavRow>
			{expanded
				? entry.items.map((item) => (
						<SidebarNavRow key={item.href} bordered>
							<ExploreNavLink
								{...item}
								className={cn("block w-full py-4 pl-4 text-left", linkClassName)}
								onNavigate={onNavigate}
							/>
						</SidebarNavRow>
					))
				: null}
		</>
	);
}

function MarketingExploreNav({
	className,
	linkClassName,
	onNavigate,
}: {
	className?: string;
	linkClassName?: string;
	onNavigate?: () => void;
}) {
	let keyCounter = 0;
	const nextKey = () => `explore-${keyCounter++}`;

	return (
		<nav className={cn("flex w-full flex-col", className)}>
			{MARKETING_EXPLORE_ITEMS.map((entry: MarketingExploreEntry) => {
				if (isMarketingExploreGroup(entry)) {
					keyCounter++;
					return (
						<MarketingExploreGroupNav
							key={nextKey()}
							entry={entry}
							bordered={keyCounter > 1}
							linkClassName={linkClassName}
							onNavigate={onNavigate}
						/>
					);
				}

				keyCounter++;
				return (
					<SidebarNavRow key={entry.href} bordered={keyCounter > 1}>
						<ExploreNavLink
							{...entry}
							className={cn("block w-full py-4 text-left", linkClassName)}
							onNavigate={onNavigate}
						/>
					</SidebarNavRow>
				);
			})}
		</nav>
	);
}

function MarketingActionNav({
	className,
	linkClassName,
	onNavigate,
}: {
	className?: string;
	linkClassName?: string;
	onNavigate?: () => void;
}) {
	return (
		<nav className={cn("flex w-full flex-col", className)}>
			{ACTION_ITEMS.map((item, index) => (
				<SidebarNavRow key={item.href} bordered={index > 0}>
					<ActionNavLink
						{...item}
						className={cn(sidebarLinkClass, "w-full py-4", linkClassName)}
						onNavigate={onNavigate}
					/>
				</SidebarNavRow>
			))}
		</nav>
	);
}

/** Plain nav — no grid lines or borders (poolside-style). */
export function MarketingNav() {
	return (
		<aside
			className={cn(
				"sticky top-0 hidden min-h-dvh shrink-0 flex-col self-start border-r border-r-dotted border-grid-line lg:flex",
				"w-[calc(var(--nav-width)+var(--nav-gutter))] py-6 pl-4 pr-3 md:pl-5 md:pr-4 lg:pl-6",
			)}
		>
			<Link href="/" className="mb-8 inline-flex items-center">
				<TrumboLogo className="h-7 w-auto" />
			</Link>

			<MarketingExploreNav />

			<div className="mt-auto pb-6">
				<MarketingActionNav />
				<SidebarNavRow bordered>
					<MarketingThemeSwitcher />
				</SidebarNavRow>
			</div>
		</aside>
	);
}

export function MarketingMobileNav() {
	const [location] = useLocation();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setOpen(false);
	}, [location]);

	useEffect(() => {
		if (!open) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open]);

	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	const closeMenu = () => setOpen(false);

	return (
		<>
			<header className="sticky top-0 z-40 border-b border-b-dotted border-grid-line bg-background/95 backdrop-blur lg:hidden">
				<div className="flex items-center justify-between gap-4 py-3 pl-6 pr-4 sm:pl-8 sm:pr-5">
					<Link href="/" className="inline-flex shrink-0 items-center" onClick={closeMenu}>
						<TrumboLogo className="h-7 w-auto" />
					</Link>
					<button
						type="button"
						className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
						aria-expanded={open}
						aria-controls="marketing-mobile-menu"
						aria-label={open ? "Close menu" : "Open menu"}
						onClick={() => setOpen((current) => !current)}
					>
						{open ? <X size={20} weight="regular" /> : <List size={20} weight="regular" />}
					</button>
				</div>
			</header>

			{open ? (
				<>
					<button
						type="button"
						className="fixed inset-0 top-14 z-30 bg-foreground/5 lg:hidden"
						aria-label="Close menu"
						onClick={closeMenu}
					/>
					<div
						id="marketing-mobile-menu"
						className="sticky top-14 z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-b-dotted border-grid-line bg-background pl-6 pr-4 sm:pl-8 sm:pr-5 lg:hidden"
					>
						<MarketingExploreNav onNavigate={closeMenu} />
						<div className="border-t border-t-dotted border-grid-line">
							<MarketingActionNav onNavigate={closeMenu} />
							<SidebarNavRow bordered>
								<MarketingThemeSwitcher onNavigate={closeMenu} />
							</SidebarNavRow>
						</div>
					</div>
				</>
			) : null}
		</>
	);
}
