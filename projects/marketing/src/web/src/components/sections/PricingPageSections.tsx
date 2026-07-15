import { Tabs, Tooltip } from "@cloudflare/kumo";
import { useState } from "react";
import { marketingGridCellClass, marketingGridListRowClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { Button } from "@/components/ui/button";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";

const ENTERPRISE_CONTACT_EMAIL = "enterprise@trumbo.dev";

/**
 * Pricing page — blended with the existing design system.
 * Same typography, borders, cell padding, and visual rhythm as
 * the home, agent, and quartz pages. No rounded corners, no box
 * shadows, no background fills. Just grid cells, dotted borders,
 * font-stat metadata, and brand green accents.
 */

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

export function PricingHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">Pricing</p>
			<h1 className="marketing-hero-heading mb-7 max-w-5xl">
				Rate-limited plans. No per-token bills.
			</h1>
			<p className="max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
				Personal plans are a flat monthly fee. Team plans bill per seat and scale with your
				roster. No token counting, no surprise bills. Every plan ships with the full CLI and
				210+ hosted open models.
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Tier columns — three side by side                                          */
/* -------------------------------------------------------------------------- */

type Tier = {
	id: string;
	name: string;
	price: string;
	period: string;
	tagline: string;
	description: string;
	features: TierFeature[];
	limits: { window: string; requests: string }[];
	platformLimits?: { label: string; value: string; tooltip: string }[];
	featured?: boolean;
	perSeat?: boolean;
	customPrice?: boolean;
	contactSales?: boolean;
	contactEmail?: string;
};

type TierFeature = {
	label: string;
	included: boolean;
};

type PlatformQuotaLimits = {
	browserMinutes: number;
	browserConcurrent: number;
	agentHours: number;
	agentConcurrent: number;
	sandboxCpuHours: number;
	sandboxConcurrent: number;
	securityCredits: number;
	securityOverageCents: number;
};

const PLATFORM_LIMIT_TOOLTIPS = {
	Browser:
		"Monthly active minutes for in-agent browser sessions. The multiplier is how many browser sessions can run at once.",
	Agents:
		"Monthly agent-hours for Cloud Agents on Trumbo infrastructure. The multiplier is how many agents can run in parallel.",
	Sandbox:
		"Monthly CPU-hours for isolated code execution sandboxes. The multiplier is how many sandboxes can run at once.",
	Security:
		"Monthly scan credits for repository and dependency security analysis. Extra credits bill at the overage rate shown.",
} as const;

function platformQuotaRows(limits: PlatformQuotaLimits): { label: string; value: string; tooltip: string }[] {
	return [
		{
			label: "Browser",
			value: `${limits.browserMinutes.toLocaleString()} min, ×${limits.browserConcurrent}`,
			tooltip: PLATFORM_LIMIT_TOOLTIPS.Browser,
		},
		{
			label: "Agents",
			value: `${limits.agentHours} h, ×${limits.agentConcurrent}`,
			tooltip: PLATFORM_LIMIT_TOOLTIPS.Agents,
		},
		{
			label: "Sandbox",
			value: `${limits.sandboxCpuHours} CPU-h, ×${limits.sandboxConcurrent}`,
			tooltip: PLATFORM_LIMIT_TOOLTIPS.Sandbox,
		},
		{
			label: "Security",
			value: `${limits.securityCredits.toLocaleString()} cr, ${limits.securityOverageCents}¢`,
			tooltip: PLATFORM_LIMIT_TOOLTIPS.Security,
		},
	];
}

function personalFeatures(includedCount: number): TierFeature[] {
	return ALL_FEATURES.map((label, index) => ({
		label,
		included: index < includedCount,
	}));
}

const PERSONAL_PLATFORM_QUOTAS = {
	pro: {
		browserMinutes: 100,
		browserConcurrent: 1,
		agentHours: 10,
		agentConcurrent: 1,
		sandboxCpuHours: 3,
		sandboxConcurrent: 1,
		securityCredits: 1_000,
		securityOverageCents: 25,
	},
	max: {
		browserMinutes: 500,
		browserConcurrent: 3,
		agentHours: 50,
		agentConcurrent: 3,
		sandboxCpuHours: 15,
		sandboxConcurrent: 3,
		securityCredits: 10_000,
		securityOverageCents: 25,
	},
	ultra: {
		browserMinutes: 2_000,
		browserConcurrent: 10,
		agentHours: 200,
		agentConcurrent: 10,
		sandboxCpuHours: 60,
		sandboxConcurrent: 10,
		securityCredits: 40_000,
		securityOverageCents: 20,
	},
} as const satisfies Record<string, PlatformQuotaLimits>;

const TEAM_PLATFORM_QUOTAS = {
	scaling: {
		browserMinutes: 250,
		browserConcurrent: 2,
		agentHours: 25,
		agentConcurrent: 2,
		sandboxCpuHours: 3,
		sandboxConcurrent: 2,
		securityCredits: 2_500,
		securityOverageCents: 25,
	},
	premium: {
		browserMinutes: 500,
		browserConcurrent: 3,
		agentHours: 50,
		agentConcurrent: 3,
		sandboxCpuHours: 9,
		sandboxConcurrent: 5,
		securityCredits: 10_000,
		securityOverageCents: 25,
	},
} as const satisfies Record<string, PlatformQuotaLimits>;

const QUARTZ_COMING_SOON = "Quartz reasoning model access";

const ALL_FEATURES = [
	"Trumbo Agent CLI with all tools",
	"210+ open models",
	"Session history and checkpoints",
	"Permissions and .trumborules",
	"Trumbo Knowledge (team docs + RAG)",
	"Trumbo Browser Run (in-agent browser tools)",
	"Priority Quartz routing",
	"Long-horizon reasoning sessions",
	"Sub-agents and parallel workstreams",
	"MCP tool integrations",
	"Team sessions and shared permissions",
	"Scheduled jobs and headless CI",
	"Slack, Discord, and Linear connectors",
];

const PERSONAL_TIERS: Tier[] = [
	{
		id: "pro",
		name: "Pro",
		price: "$20",
		period: "/month",
		tagline: "For individual developers",
		description:
			"The CLI, Quartz, hosted models, sessions, and checkpoints. Generous limits for solo work.",
		features: personalFeatures(6),
		platformLimits: platformQuotaRows(PERSONAL_PLATFORM_QUOTAS.pro),
		limits: [
			{ window: "5-hour", requests: "75" },
			{ window: "Daily", requests: "300" },
			{ window: "Weekly", requests: "1,400" },
		],
	},
	{
		id: "max",
		name: "Max",
		price: "$100",
		period: "/month",
		tagline: "For power users shipping every day",
		description:
			"Priority Quartz, sub-agents, and deeper limits for daily multi-step work.",
		featured: true,
		features: personalFeatures(9),
		platformLimits: platformQuotaRows(PERSONAL_PLATFORM_QUOTAS.max),
		limits: [
			{ window: "5-hour", requests: "375" },
			{ window: "Daily", requests: "1,500" },
			{ window: "Weekly", requests: "7,000" },
		],
	},
	{
		id: "ultra",
		name: "Ultra",
		price: "$200",
		period: "/month",
		tagline: "For production-grade solo workloads",
		description:
			"MCP integrations, scheduled jobs, chat connectors, and the deepest personal limits.",
		features: ALL_FEATURES.map((label, index) => ({
			label,
			included: index < 12 && index !== 10,
		})),
		platformLimits: platformQuotaRows(PERSONAL_PLATFORM_QUOTAS.ultra),
		limits: [
			{ window: "5-hour", requests: "1,500" },
			{ window: "Daily", requests: "6,000" },
			{ window: "Weekly", requests: "28,000" },
		],
	},
];

const TEAM_FEATURES = [
	"Full Trumbo Agent CLI for every teammate",
	"Team workspace with shared billing",
	"Per-seat billing for confirmed members",
	"Trumbo Knowledge (team docs + RAG)",
	"Trumbo Browser Run (in-agent browser tools)",
	"Shared sessions and team permissions",
	"Scheduled jobs and headless CI",
	"Slack, Discord, and Linear connectors",
];

const TEAM_TIERS: Tier[] = [
	{
		id: "scaling",
		name: "Scaling",
		price: "$40",
		period: "/ seat / month",
		tagline: "For growing teams",
		description:
			"Per-seat billing for teams getting started. Seats increase when teammates accept their invite.",
		perSeat: true,
		features: [
			{ label: TEAM_FEATURES[0], included: true },
			{ label: TEAM_FEATURES[1], included: true },
			{ label: TEAM_FEATURES[2], included: true },
			{ label: TEAM_FEATURES[3], included: true },
			{ label: TEAM_FEATURES[4], included: true },
			{ label: TEAM_FEATURES[5], included: true },
			{ label: TEAM_FEATURES[6], included: false },
			{ label: TEAM_FEATURES[7], included: false },
			{ label: "96K max tokens / request", included: true },
			{ label: "Trumbo Knowledge: 100 docs, 200 MB, 200 searches/day", included: true },
		],
		platformLimits: platformQuotaRows(TEAM_PLATFORM_QUOTAS.scaling),
		limits: [
			{ window: "5-hour", requests: "150" },
			{ window: "Daily", requests: "600" },
			{ window: "Weekly", requests: "2,800" },
		],
	},
	{
		id: "premium",
		name: "Premium",
		price: "$120",
		period: "/ seat / month",
		tagline: "For teams shipping daily",
		description:
			"Higher limits, larger Knowledge quotas, and production connectors for teams running agents at scale.",
		perSeat: true,
		featured: true,
		features: [
			...TEAM_FEATURES.map((label) => ({ label, included: true })),
			{ label: "128K max tokens / request", included: true },
			{ label: "Trumbo Knowledge: 250 docs, 500 MB, 1,000 searches/day", included: true },
		],
		platformLimits: platformQuotaRows(TEAM_PLATFORM_QUOTAS.premium),
		limits: [
			{ window: "5-hour", requests: "375" },
			{ window: "Daily", requests: "1,500" },
			{ window: "Weekly", requests: "7,000" },
		],
	},
];

const ENTERPRISE_TIER: Tier = {
	id: "enterprise",
	name: "Enterprise",
	price: "Custom",
	period: "pricing",
	tagline: "For larger organizations",
	description:
		"Tailored request limits, Knowledge quotas, support, and per-seat pricing for teams with custom needs.",
	customPrice: true,
	contactSales: true,
	contactEmail: ENTERPRISE_CONTACT_EMAIL,
	features: [
		{ label: "Custom request rate limits", included: true },
		{ label: "Custom Knowledge storage and search quotas", included: true },
		{ label: "Custom max tokens per request", included: true },
		{ label: "Dedicated support and SLA options", included: true },
		{ label: "Custom per-seat pricing", included: true },
		{ label: "Team workspace with shared billing", included: true },
	],
	platformLimits: [
		{ label: "Browser", value: "Custom", tooltip: PLATFORM_LIMIT_TOOLTIPS.Browser },
		{ label: "Agents", value: "Custom", tooltip: PLATFORM_LIMIT_TOOLTIPS.Agents },
		{ label: "Sandbox", value: "Custom", tooltip: PLATFORM_LIMIT_TOOLTIPS.Sandbox },
		{ label: "Security", value: "Custom", tooltip: PLATFORM_LIMIT_TOOLTIPS.Security },
	],
	limits: [
		{ window: "5-hour", requests: "Custom" },
		{ window: "Daily", requests: "Custom" },
		{ window: "Weekly", requests: "Custom" },
	],
};

export function PricingTiersSection() {
	const [scope, setScope] = useState<"personal" | "team" | "enterprise">("personal");
	const tiers =
		scope === "personal"
			? PERSONAL_TIERS
			: scope === "team"
				? TEAM_TIERS
				: [ENTERPRISE_TIER];
	const [planTab, setPlanTab] = useState(tiers[0]?.id ?? "pro");
	const activeTier = tiers.find((tier) => tier.id === planTab) ?? tiers[0];
	const gridClassName =
		scope === "personal"
			? "md:grid-cols-3"
			: scope === "team"
				? "md:grid-cols-2"
				: "md:grid-cols-1";

	const handleScopeChange = (value: string) => {
		const nextScope = value as "personal" | "team" | "enterprise";
		setScope(nextScope);
		const nextTiers =
			nextScope === "personal"
				? PERSONAL_TIERS
				: nextScope === "team"
					? TEAM_TIERS
					: [ENTERPRISE_TIER];
		const defaultPlan =
			nextTiers.find((tier) => tier.featured)?.id ?? nextTiers[0]?.id ?? "pro";
		setPlanTab(defaultPlan);
	};

	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"border-b border-b-dotted border-grid-line !py-5 !pl-0 !pr-7 md:!py-6 md:!pl-1 md:!pr-10",
				)}
			>
				<Tabs
					variant="segmented"
					tabs={[
						{ value: "personal", label: "Personal", className: "min-w-0 flex-1 justify-center" },
						{ value: "team", label: "Team", className: "min-w-0 flex-1 justify-center" },
						{ value: "enterprise", label: "Enterprise", className: "min-w-0 flex-1 justify-center" },
					]}
					value={scope}
					onValueChange={handleScopeChange}
					className="w-full"
					listClassName="w-full"
					aria-label="Plan type"
				/>
			</GridBoxCell>
			{tiers.length > 1 ? (
				<GridBoxCell
					className={cn(
						marketingGridCellClass,
						"border-b border-b-dotted border-grid-line !py-5 !pl-0 !pr-7 md:!pl-1 md:!pr-10 md:hidden",
					)}
				>
					<Tabs
						variant="segmented"
						tabs={tiers.map((tier) => ({
							value: tier.id,
							label: tier.name,
							className: "min-w-0 flex-1 justify-center",
						}))}
						value={planTab}
						onValueChange={setPlanTab}
						className="w-full"
						listClassName="w-full"
						aria-label="Plan"
					/>
				</GridBoxCell>
			) : null}
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="md:hidden">
					{activeTier ? <TierColumn tier={activeTier} isLast /> : null}
				</div>
				<div className={cn("hidden md:grid", gridClassName)}>
					{tiers.map((tier, index) => (
						<TierColumn
							key={tier.id}
							tier={tier}
							isLast={index === tiers.length - 1}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function FeatureRow({
	label,
	included,
	comingSoon,
}: {
	label: string;
	included?: boolean;
	comingSoon?: boolean;
}) {
	if (comingSoon) {
		return (
			<li className="grid grid-cols-[0.75rem_minmax(0,1fr)] items-center gap-x-2.5 text-sm leading-relaxed text-amber-700 dark:text-amber-400">
				<span
					className="marketing-feature-dash justify-self-center bg-amber-500/70"
					aria-hidden="true"
				/>
				<span className="flex min-w-0 items-center justify-between gap-2 py-0.5">
					<span className="min-w-0">{label}</span>
					<span className="font-stat inline-flex h-[1.125rem] shrink-0 items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 text-[0.5625rem] font-medium uppercase leading-none tracking-[0.08em] text-amber-700 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-400">
						Coming soon
					</span>
				</span>
			</li>
		);
	}

	return (
		<li
			className={cn(
				"grid grid-cols-[0.75rem_minmax(0,1fr)] items-center gap-x-2.5 text-sm leading-relaxed",
				included ? "text-foreground" : "text-muted-foreground/40",
			)}
		>
			<span
				className={cn(
					"marketing-feature-dash justify-self-center",
					included ? "bg-brand" : "bg-muted-foreground/20",
				)}
				aria-hidden="true"
			/>
			<span className="py-0.5">{label}</span>
		</li>
	);
}

function LimitRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<span className="font-stat shrink-0 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground">
				{label}
			</span>
			<span className="font-stat whitespace-nowrap text-right text-[0.8125rem] tabular-nums text-foreground md:text-sm">
				{value}
			</span>
		</div>
	);
}

function PlatformLimitRow({
	label,
	value,
	tooltip,
}: {
	label: string;
	value: string;
	tooltip: string;
}) {
	return (
		<div className="flex items-center justify-between gap-2">
			<span className="font-stat shrink-0 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground">
				{label}
			</span>
			<Tooltip
				content={<span className="marketing-limit-tooltip-content">{tooltip}</span>}
				side="top"
				align="end"
				delay={250}
				render={
					<span
						tabIndex={0}
						className="marketing-limit-dotted-underline font-stat cursor-help whitespace-nowrap text-[0.8125rem] tabular-nums text-foreground outline-none md:text-sm"
						aria-label={`About ${label} limits`}
					/>
				}
			>
				{value}
			</Tooltip>
		</div>
	);
}

function TierColumn({ tier, isLast }: { tier: Tier; isLast: boolean }) {
	const contactEmail = tier.contactEmail ?? ENTERPRISE_CONTACT_EMAIL;

	return (
		<GridBoxCell
			className={cn(
				marketingGridCellClass,
				"flex flex-col !py-8 md:!py-10",
				!isLast && "border-b border-b-dotted border-grid-line md:border-b-0 md:border-r md:border-r-dotted md:border-grid-line",
			)}
		>
			{/* Header */}
			<div className="flex min-h-[1.125rem] items-center gap-3.5">
				<h3 className="font-heading text-xl font-semibold leading-none text-foreground md:text-2xl">
					{tier.name}
				</h3>
				{tier.featured ? (
					<span className="font-stat inline-flex h-[1.125rem] shrink-0 items-center rounded-full border border-brand/40 bg-brand/10 px-2.5 text-[0.5625rem] font-medium uppercase leading-none tracking-[0.08em] text-brand">
						Popular
					</span>
				) : null}
			</div>
			<p className="font-stat mt-3 text-xs uppercase tracking-[0.08em] text-muted-foreground">
				{tier.tagline}
			</p>

			{/* Price */}
			<div className="mt-5 flex items-baseline gap-1.5">
				{tier.customPrice ? (
					<span className="font-stat text-[2.75rem] font-light leading-none tracking-tight text-foreground md:text-[3.25rem]">
						{tier.price}
					</span>
				) : (
					<>
						<span className="font-stat text-[1.5rem] font-medium leading-none text-muted-foreground md:text-[1.75rem]">
							$
						</span>
						<span className="font-stat text-[2.75rem] font-light leading-none tabular-nums tracking-tight text-foreground md:text-[3.25rem]">
							{tier.price.replace("$", "")}
						</span>
					</>
				)}
				<span className="font-stat text-sm text-muted-foreground">{tier.period}</span>
			</div>

			{tier.perSeat ? (
				<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
					Billed per teammate (confirmed members who accepted their invite).
				</p>
			) : null}

			<p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{tier.description}
			</p>

			{/* Limits */}
			<div className="mt-6 flex flex-col gap-2.5 border-y border-y-dotted border-grid-line py-4">
				<span className="font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
					Rate limits
				</span>
				{tier.limits.map((limit) => (
					<LimitRow key={limit.window} label={limit.window} value={limit.requests} />
				))}

				{tier.platformLimits?.length ? (
					<>
						<div
							className="my-0.5 border-t border-t-dotted border-grid-line"
							aria-hidden="true"
						/>
						<span className="font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
							Platform limits
						</span>
						{tier.platformLimits.map((limit) => (
							<PlatformLimitRow
								key={limit.label}
								label={limit.label}
								value={limit.value}
								tooltip={limit.tooltip}
							/>
						))}
					</>
				) : null}
			</div>

			{/* Features */}
			<ul className="mt-5 flex flex-1 flex-col gap-2.5">
				{tier.features.map((feature) => (
					<FeatureRow
						key={feature.label}
						label={feature.label}
						included={feature.included}
					/>
				))}
				{!tier.contactSales ? <FeatureRow label={QUARTZ_COMING_SOON} comingSoon /> : null}
			</ul>

			{/* CTA */}
			{tier.contactSales ? (
				<Button
					className="mt-6 w-full"
					onClick={() => {
						window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent("Trumbo Enterprise inquiry")}`;
					}}
				>
					Contact sales
				</Button>
			) : (
				<Button
					variant={tier.featured ? "default" : "outline"}
					className="mt-6 w-full"
					onClick={() => {
						window.location.href = platformLink("/signup");
					}}
				>
					Get {tier.name}
				</Button>
			)}
		</GridBoxCell>
	);
}

/* -------------------------------------------------------------------------- */
/* Rate limit explanation                                                      */
/* -------------------------------------------------------------------------- */

export function PricingLimitsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center !py-8 md:!py-10",
				)}
			>
				<p className="marketing-kicker mb-4">How rate limits work</p>
				<h2 className="max-w-6xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					Three windows. One quota. Resets automatically.
				</h2>
				<p className="mt-4 max-w-6xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Every tier has a 5-hour, daily, and weekly request budget. When a window fills,
					requests pause until it resets. No overage fees, no per-token charges, no surprise
					bills at the end of the month.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-3">
					{LIMIT_CARDS.map((card, index) => (
						<LimitCard key={card.title} card={card} index={index} />
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

const LIMIT_CARDS: { title: string; description: string }[] = [
	{
		title: "5-hour window",
		description:
			"Short bursts of heavy usage. Resets every 5 hours so you can push through a debugging session without waiting for the next day.",
	},
	{
		title: "Daily cap",
		description:
			"Your total daily budget. Prevents runaway agents from burning through your weekly allocation in a single session.",
	},
	{
		title: "Weekly total",
		description:
			"The big picture. Your weekly limit is the ceiling. Daily and 5-hour windows distribute usage evenly across the week.",
	},
];

function LimitCard({
	card,
	index,
}: {
	card: { title: string; description: string };
	index: number;
}) {
	const total = LIMIT_CARDS.length;
	const isLast = index === total - 1;

	return (
		<div
			className={cn(
				marketingGridCellClass,
				"flex flex-col",
				!isLast && "border-b border-b-dotted border-grid-line md:border-b-0 md:border-r md:border-r-dotted",
			)}
		>
			<span className="font-stat text-[0.6875rem] tabular-nums tracking-[0.06em] text-muted-foreground/70">
				{String(index + 1).padStart(2, "0")}
			</span>
			<h3 className="mt-4 mb-3 text-lg font-semibold leading-snug text-foreground">
				{card.title}
			</h3>
			<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{card.description}
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* What's included                                                             */
/* -------------------------------------------------------------------------- */

const INCLUDED_CARDS: { title: string; description: string }[] = [
	{
		title: "Trumbo Agent CLI",
		description:
			"Edit files, run shell commands, search your codebase, and call MCP tools. Plan before you act, rewind with checkpoints, and resume past sessions.",
	},
	{
		title: "Quartz reasoning model",
		description:
			"Adaptive compound reasoning that scales computation to problem complexity. Confidence-guided verification and reflection on every request, so only checked answers reach synthesis.",
	},
	{
		title: "210+ hosted open models",
		description:
			"DeepSeek, Qwen, Llama, Mistral, GLM, Kimi, and more, hosted on our inference infrastructure. Route to any of them from one CLI without reconfiguring tools.",
	},
	{
		title: "Bring your own keys",
		description:
			"Use API keys from Anthropic, OpenAI, Google, OpenRouter, or any of the 50+ SDK providers. Your own keys bypass Trumbo rate limits entirely.",
	},
	{
		title: "Session persistence",
		description:
			"History, checkpoints, permissions, and tool config carry across sessions. Resume where you left off without rebuilding context or reconfiguring your agent setup.",
	},
	{
		title: "Open source CLI",
		description:
			"The CLI is published as @trumbodev/cli on npm with source on GitHub. Free to use with your own model keys, no subscription required.",
	},
];

export function PricingIncludedSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center !py-8 md:!py-10",
				)}
			>
				<p className="marketing-kicker mb-4">Every plan includes</p>
				<h2 className="max-w-6xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					The full toolkit, regardless of tier.
				</h2>
				<p className="mt-4 max-w-6xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					No feature gating on the core experience. Every tier gets the same agent, the same
					models, and the same CLI. Personal tiers differ in request limits and advanced
					features. Team tiers add shared workspaces, per-seat billing, and collaboration
					tools.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="flex flex-col">
					{INCLUDED_CARDS.map((card, index) => (
						<IncludedRow
							key={card.title}
							card={card}
							index={index}
							isLast={index === INCLUDED_CARDS.length - 1}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function IncludedRow({
	card,
	index,
	isLast,
}: {
	card: { title: string; description: string };
	index: number;
	isLast: boolean;
}) {
	return (
		<div
			className={cn(
				marketingGridCellClass,
				"flex flex-col gap-4 md:flex-row md:items-baseline md:gap-8",
				!isLast && "border-b border-b-dotted border-grid-line",
			)}
		>
			<div className="flex items-center gap-4 md:w-[14rem] md:shrink-0">
				<span className="font-stat text-[0.6875rem] tabular-nums tracking-[0.06em] text-muted-foreground/70">
					{String(index + 1).padStart(2, "0")}
				</span>
				<h3 className="text-lg font-semibold leading-snug text-foreground">
					{card.title}
				</h3>
			</div>
			<p className="flex-1 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{card.description}
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* FAQ — expandable rows                                                       */
/* -------------------------------------------------------------------------- */

const FAQ_ITEMS = [
	{
		question: "How does team per-seat billing work?",
		answer:
			"Team plans (Scaling and Premium) bill per seat each month. A seat covers each confirmed member who accepted their invite. Pending invites do not add seats until they join. Billing updates when teammates accept. Enterprise plans use custom per-seat pricing arranged through sales. Personal plans (Pro, Max, Ultra) are flat monthly fees with no seat math.",
	},
	{
		question: "What happens when I hit a rate limit?",
		answer:
			"Requests pause until the current window resets. You will not be charged extra, and your session is not terminated. The agent simply waits before sending the next request. The 5-hour window resets every 5 hours from your first request in that window, the daily window resets at midnight UTC, and the weekly window resets every 7 days from your subscription start date. If you consistently hit limits, consider upgrading to a higher tier. You can also use your own API keys for any provider, which bypasses Trumbo rate limits entirely since those requests are billed directly by the provider.",
	},
	{
		question: "Can I bring my own API keys?",
		answer:
			"Yes. The Trumbo SDK supports 50+ providers natively, including Anthropic, OpenAI, Google Gemini, Google Vertex AI, AWS Bedrock, Mistral, OpenRouter, Groq, Together AI, Cerebras, SambaNova, and many more. Set the provider's API key as an environment variable or in your Trumbo config, and the CLI routes requests directly to that provider. Requests made with your own keys are billed by the provider, not by Trumbo, and do not count against your Trumbo rate limits. This is useful when you have existing provider credits, enterprise agreements, or need a provider that Trumbo does not host directly.",
	},
	{
		question: "Is there a free tier?",
		answer:
			"The Trumbo CLI is open source and free to use with your own model keys. You can install it with npm install -g @trumbodev/cli, configure it with any supported provider's API key, and run agent sessions without a subscription. A paid subscription is required only for access to the Trumbo platform: the Quartz reasoning model, 210+ hosted open models on our inference infrastructure, session persistence, team features, and the hosted model routing layer. If you only want to use the CLI with your own Anthropic or OpenAI keys, you do not need to pay anything.",
	},
	{
		question: "Can I switch tiers mid-cycle?",
		answer:
			"Yes. Upgrades take effect immediately, and the price difference is prorated based on the remaining days in your billing cycle. For example, if you upgrade from Pro to Max halfway through the month, you pay half the difference for that cycle and the full Max price on the next renewal. Downgrades take effect at the end of your current billing cycle, so you keep access to your current tier's features and rate limits until the cycle ends. You can change tiers at any time from the platform dashboard at platform.trumbo.dev.",
	},
	{
		question: "Do unused requests roll over?",
		answer:
			"No. Rate limits reset on a fixed schedule and do not accumulate. The 5-hour window resets every 5 hours regardless of how many requests you made in the previous window. The daily cap resets at midnight UTC, and the weekly total resets every 7 days from your subscription start date. This policy keeps the system fair for all users, prevents quota hoarding during low-activity periods, and ensures that rate limits reflect your actual current usage pattern rather than accumulated credits from weeks ago.",
	},
	{
		question: "Is the CLI open source?",
		answer:
			"Yes. The Trumbo CLI is published as @trumbodev/cli on npm and the source code is available on GitHub at github.com/xedro98/Trumbo. The CLI includes the full agent loop, tool system, MCP integration, session management, permissions, and provider routing. It is free to use, modify, and distribute. The Trumbo platform (the hosted web app at platform.trumbo.dev), the Quartz reasoning model, and hosted model routing are proprietary.",
	},
	{
		question: "What models are included?",
		answer:
			"Every paid plan includes access to 210+ open models hosted on our inference infrastructure. This covers DeepSeek (V3, V4-Flash, R1, Coder, Prover, and distill variants), Qwen (Qwen3, Qwen2.5, Qwen2.5-Coder, QwQ, Qwen2.5-VL, and 50+ more), Llama (Llama 2, 3, 3.1, 3.2, 4, Code Llama, Llama Guard), Mistral (Mistral 7B, Mixtral 8x7B and 8x22B, Large 3, Nemo, Small), Zhipu GLM (4.5, 4.7, 5.2), Moonshot Kimi K2, MiniMax M1 and M2, and specialized models from NVIDIA, Google Gemma, Phi, and others. You can browse the full catalog with model IDs on the Model Library page at trumbo.dev/models.",
	},
];

export function PricingFaqSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center !py-8 md:!py-10",
				)}
			>
				<p className="marketing-kicker mb-4">FAQ</p>
				<h2 className="max-w-6xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					Common questions about pricing and limits.
				</h2>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="flex flex-col">
					{FAQ_ITEMS.map((item, index) => (
						<FaqRow
							key={item.question}
							item={item}
							isLast={index === FAQ_ITEMS.length - 1}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function FaqRow({
	item,
	isLast,
}: {
	item: { question: string; answer: string };
	isLast: boolean;
}) {
	const [open, setOpen] = useState(false);

	return (
		<div className={cn(!isLast && "border-b border-b-dotted border-grid-line")}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className={cn(
					marketingGridListRowClass,
					"flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:bg-muted/[0.03] md:py-6",
				)}
				aria-expanded={open}
			>
				<span className="text-base font-semibold leading-snug text-foreground md:text-lg">
					{item.question}
				</span>
				<span className="font-stat shrink-0 text-xs uppercase tracking-[0.08em] text-muted-foreground">
					{open ? "Close" : "Open"}
				</span>
			</button>
			{open ? (
				<div className={cn(marketingGridListRowClass, "pb-5 md:pb-6")}>
					<p className="max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
						{item.answer}
					</p>
				</div>
			) : null}
		</div>
	);
}
