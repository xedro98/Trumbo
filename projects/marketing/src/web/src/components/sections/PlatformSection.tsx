import { ArrowRight, ChartLineUp, CreditCard, UsersThree } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { MarketingSectionHeader, SectionFooterLink } from "@/components/sections/MarketingSectionHeader";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { Button } from "@/components/ui/button";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";
const FEATURES: {
	icon: Icon;
	title: string;
	description: string;
}[] = [
	{
		icon: UsersThree,
		title: "Teams & orgs",
		description:
			"Personal workspaces and shared orgs with role-based access. Switch contexts without leaving the CLI.",
	},
	{
		icon: ChartLineUp,
		title: "Usage & analytics",
		description:
			"Track model spend, token usage, and latency across your team. Kumo-powered dashboards on the platform.",
	},
	{
		icon: CreditCard,
		title: "Billing that scales",
		description:
			"Pro, Max, and Ultra plans with Stripe checkout. Subscribe once, use across CLI and web.",
	},
];

export function PlatformSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-3">
			<GridBoxCell className={cn("md:col-span-3", marketingGridCellClass)}>
				<MarketingSectionHeader
					kicker="Platform"
					title="Go further with platform.trumbo.dev: billing, teams, and observability for production agent workflows."
					description="The CLI is your daily driver. The platform is where teams manage subscriptions, review usage, and onboard developers, all on Cloudflare Workers with the same design system you see here."
				/>
			</GridBoxCell>

			{FEATURES.map(({ icon: Icon, title, description }) => (
				<GridBoxCell key={title} className={marketingGridCellClass}>
					<h3 className="mb-3 flex items-center gap-2 font-semibold">
						<Icon size={18} weight="duotone" className="shrink-0 text-brand" />
						{title}
					</h3>
					<p className="text-sm text-muted-foreground">{description}</p>
				</GridBoxCell>
			))}

			<GridBoxCell className={cn("flex flex-wrap items-center gap-3 md:col-span-3", marketingGridCellClass)}>
				<Button onClick={() => { window.location.href = platformLink("/signup"); }}>
					Get started free
				</Button>
				<Button
					variant="outline"
					onClick={() => { window.location.href = platformLink("/login"); }}
				>
					Sign in
				</Button>
				<SectionFooterLink href={platformLink("/dashboard")} className="ml-auto">
					Open dashboard
					<ArrowRight size={14} />
				</SectionFooterLink>
			</GridBoxCell>
		</GridBox>
	);
}
