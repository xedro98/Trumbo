import { InstallCommandTabs } from "@/components/InstallCommandTabs";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { MarketingSectionHeader } from "@/components/sections/MarketingSectionHeader";
import { ProductCardVisual } from "@/components/sections/ProductCardVisual";
import {
	GridBox,
	GridBoxCell,
} from "@/components/ui/grid-box";
import { Button } from "@/components/ui/button";
import { MARKETING_ASCII_MAGIC_BG, MARKETING_CLI_CARD_IMAGE, MARKETING_QUARTZ_CARD_IMAGE, TRUMBO_LOGO_MARK } from "@/lib/brand";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";
export function HeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">Agentic coding, end to end</p>
			<h1 className="marketing-hero-heading mb-6">
				<img
					src={TRUMBO_LOGO_MARK}
					alt=""
					className="mr-2.5 inline-block h-[0.82em] w-auto align-[-0.12em] md:mr-3"
					decoding="async"
				/>
				Trumbo is where builders run agents in the terminal. Open models, real tools,
				and a platform built for your whole team.
			</h1>
			<InstallCommandTabs className="mt-1" />
		</div>
	);
}

export function HeroVisual() {
	return (
		<div className="relative min-h-64 w-full overflow-hidden md:min-h-80 lg:min-h-[24rem]">
			<img
				src={MARKETING_ASCII_MAGIC_BG}
				alt=""
				className="block h-full min-h-64 w-full object-cover object-center md:min-h-80 lg:min-h-[24rem]"
				decoding="async"
			/>
		</div>
	);
}

const PRODUCTS = [
	{
		title: "Trumbo Agent",
		subtitle: "Coding Agent",
		buttonLabel: "Trumbo Agent",
		href: "/agent",
		image: MARKETING_CLI_CARD_IMAGE,
		paragraphs: [
			"A coding agent for your workflow: edit files, run shell commands, search your codebase, and call MCP tools without leaving where you work.",
			"Stay local with offline models for day-to-day work, then connect to Trumbo when you want more capable models, shared sessions, and infrastructure your team can grow into.",
		],
	},
	{
		title: "Trumbo Quartz",
		buttonLabel: "Trumbo Quartz",
		href: platformLink("/docs"),
		image: MARKETING_QUARTZ_CARD_IMAGE,
		paragraphs: [
			"Trumbo's flagship reasoning model for software engineering, science, math, and autonomous execution. Built for work that rewards careful thought and precise tool use.",
			"Quartz scales inference to the complexity of each request, delivering accurate reasoning, reliable tool calls, and consistent performance on real production workloads.",
		],
	},
] as const;

const productColumnPadClass = {
	left: "pl-8 pr-5 md:pl-10 md:pr-6 lg:pl-12",
	right: "pl-5 pr-8 md:pl-6 md:pr-10 lg:pr-12",
} as const;

function ProductColumn({
	product,
	side,
}: {
	product: (typeof PRODUCTS)[number];
	side: keyof typeof productColumnPadClass;
}) {
	const columnPadClass = productColumnPadClass[side];

	return (
		<div className="flex min-h-full flex-col">
			<ProductCardVisual src={product.image} alt={product.title} fullBleed />
			<div className={cn(columnPadClass, "py-5 md:py-6 !pt-4 md:!pt-5")}>
				<h3 className="mb-3 text-xl font-semibold">
					{product.title}
					{"subtitle" in product ? (
						<span className="font-normal text-muted-foreground"> ({product.subtitle})</span>
					) : null}
				</h3>
				<div className="space-y-3">
					{product.paragraphs.map((paragraph) => (
						<p key={paragraph} className="text-muted-foreground">
							{paragraph}
						</p>
					))}
				</div>
			</div>
			<div className={cn(columnPadClass, "mt-auto pb-5 md:pb-6 !pt-0")}>
				<Button
					className="w-full"
					onClick={() => {
						window.location.href = product.href;
					}}
				>
					{product.buttonLabel}
				</Button>
			</div>
		</div>
	);
}

export function ProductSection() {
	return (
		<GridBox className="grid-cols-1">
			<GridBoxCell className={cn(marketingGridCellClass)}>
				<MarketingSectionHeader
					title="A coding agent for daily work. A reasoning model built for hard problems."
					description="Trumbo Agent handles the work you do every day, from edits and shell to search and MCP tools, in the terminal, your editor, or from chat. When a task needs deeper reasoning, stronger tool use, or harder problem solving, Quartz is the model built for that next level of work."
					descriptionClassName="mt-5 max-w-4xl text-lg leading-relaxed md:mt-6 md:text-xl lg:max-w-5xl"
				/>
				<p className="mt-4 max-w-4xl text-lg leading-relaxed text-muted-foreground md:mt-5 md:text-xl lg:max-w-5xl">
					Use both with the same tools and permissions, and move between daily execution
					and deeper reasoning without resetting your setup.
				</p>
			</GridBoxCell>

			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:items-stretch">
					<div className="min-h-full border-b border-grid-line md:border-b-0">
						<ProductColumn product={PRODUCTS[0]} side="left" />
					</div>
					<div className="hidden bg-foreground/15 md:block" aria-hidden="true" />
					<div className="min-h-full">
						<ProductColumn product={PRODUCTS[1]} side="right" />
					</div>
				</div>
			</GridBoxCell>
		</GridBox>
	);
}
