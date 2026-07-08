import {
	ArrowsLeftRight,
	GitBranch,
	Key,
	Scales,
	Tag,
	Wrench,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { MARKETING_COMPANY_BG } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/**
 * Company page — blended with the existing design system.
 * Same typography, borders, cell padding, and visual rhythm as
 * the home, agent, quartz, and pricing pages.
 */

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";

function CompanyGridCell({ className }: { className?: string }) {
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

function CompanyGridPanel({
	className,
	rows = GRID_ROWS,
	cols = GRID_COLS,
}: {
	className?: string;
	rows?: number;
	cols?: number;
}) {
	return (
		<div
			className={cn("grid w-fit shrink-0 border-foreground/30", className)}
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
			aria-hidden="true"
		>
			{Array.from({ length: rows * cols }).map((_, index) => {
				const row = Math.floor(index / cols);
				const col = index % cols;
				return (
					<CompanyGridCell
						key={index}
						className={cn(col === cols - 1 && "border-r-0", row === rows - 1 && "border-b-0")}
					/>
				);
			})}
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

export function CompanyHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">
				<span>About Trumbo</span>
				<span className="marketing-kicker-sep" aria-hidden="true" />
				<span>Model research to product</span>
			</p>
			<h1 className="marketing-hero-heading mb-7 max-w-5xl">
				We research adaptive reasoning, build the models and systems behind it, and ship
				what holds up in production.
			</h1>
			<p className="max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
				Trumbo is an AI company built around foundation model research. We train and ship
				Quartz, our adaptive reasoning model, and build the infrastructure around it, from
				the provider routing SDK and coding agent to the inference platform developers use
				in production. Research, infrastructure, and product sit under one roof, so each
				layer evolves with the rest. One team owns the work from first principles to
				production.
			</p>
		</div>
	);
}

export function CompanyHeroVisual() {
	return (
		<div className="relative min-h-64 w-full overflow-hidden md:min-h-80 lg:min-h-[24rem]">
			<img
				src={MARKETING_COMPANY_BG}
				alt=""
				className="block h-full min-h-64 w-full object-cover object-center md:min-h-80 lg:min-h-[24rem]"
				decoding="async"
			/>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Mission / Vision                                                            */
/* -------------------------------------------------------------------------- */

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
	const ref = useRef<T | null>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.15, rootMargin: "-80px", ...options },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [options]);

	return { ref, inView };
}

const VISION_PILLARS = [
	{
		title: "Publish what we build",
		description:
			"The CLI is MIT licensed and the research direction is public. Models, tooling, and infrastructure should be inspectable, not hidden behind a product login.",
	},
	{
		title: "Run models at scale",
		description:
			"We operate our own inference stack for Quartz and 210+ open models, so developers can use frontier intelligence without assembling a provider patchwork.",
	},
	{
		title: "Fund the work honestly",
		description:
			"Rate-limited plans keep access to our models and platform predictable. The goal is sustainable research and compute, not metering every token.",
	},
];

export function CompanyMissionSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
					<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
						<p className="marketing-kicker mb-3">Vision</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							Three decisions that shape everything we build.
						</h2>
						<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
							Our work starts with a research question and ends in software people rely
							on. Every choice traces back to whether it advances useful intelligence and
							gives developers more control, not less.
						</p>
					</div>
					<CompanyGridPanel className="border-l border-dotted" />
				</div>
				<div className="border-b border-b-dotted border-grid-line md:hidden">
					<div className={cn(marketingGridCellClass, "!py-5")}>
						<p className="marketing-kicker mb-3">Vision</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							Three decisions that shape everything we build.
						</h2>
						<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
							Our work starts with a research question and ends in software people rely
							on. Every choice traces back to whether it advances useful intelligence and
							gives developers more control, not less.
						</p>
					</div>
					<div className={cn("flex justify-end border-t border-dotted", sideGridLineClass)}>
						<CompanyGridPanel rows={GRID_ROWS} cols={GRID_COLS} />
					</div>
				</div>
			</GridBoxCell>

			{/* Vision pillars — 3-column grid with scroll reveal stagger */}
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-3">
					{VISION_PILLARS.map((pillar, index) => (
						<VisionPillar
							key={pillar.title}
							pillar={pillar}
							index={index}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function VisionPillar({
	pillar,
	index,
}: {
	pillar: { title: string; description: string };
	index: number;
}) {
	const { ref, inView } = useInView<HTMLDivElement>();
	const staggerDelay = index * 80;

	return (
		<div
			ref={ref}
			className={cn(
				marketingGridCellClass,
				"flex flex-col !py-8 md:!py-10",
				"transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
				inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
				index < 2 && "border-b border-b-dotted border-grid-line md:border-b-0 md:border-r md:border-r-dotted md:border-grid-line",
			)}
			style={{ transitionDelay: inView ? `${staggerDelay}ms` : "0ms" }}
		>
			<span
				className={cn(
					"font-stat text-[3rem] font-light leading-none tabular-nums tracking-tight transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:text-[3.5rem]",
					"text-muted-foreground/25 hover:text-brand",
				)}
			>
				{String(index + 1).padStart(2, "0")}
			</span>
			<h3 className="mt-5 max-w-xs font-heading text-[1.25rem] font-normal leading-[1.35] tracking-[-0.01em] text-foreground md:text-[1.5rem]">
				{pillar.title}
			</h3>
			<p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{pillar.description}
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Story                                                                       */
/* -------------------------------------------------------------------------- */

export function CompanyStorySection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				{/* Banner heading with grid panel on right */}
				<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
					<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
						<p className="marketing-kicker mb-4">Story</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							The best model for the job shouldn't depend on whose API key you have.
						</h2>
					</div>
					<CompanyGridPanel className="border-l border-dotted" />
				</div>
				<div className="border-b border-b-dotted border-grid-line md:hidden">
					<div className={cn(marketingGridCellClass, "!py-5")}>
						<p className="marketing-kicker mb-4">Story</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							The best model for the job shouldn't depend on whose API key you have.
						</h2>
					</div>
					<div className={cn("flex justify-end border-t border-dotted", sideGridLineClass)}>
						<CompanyGridPanel rows={GRID_ROWS} cols={GRID_COLS} />
					</div>
				</div>
			</GridBoxCell>

			{/* Paragraph 1 — The problem */}
			<GridBoxCell className={cn(marketingGridCellClass, "!py-6 md:!py-8")}>
				<p className="max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					When we started using AI coding agents, something felt wrong. The tools were
					powerful, but they came with strings attached. You pick a provider, you live with
					that provider. You pay per token, and every prompt feels like spending money. The
					agent logic is closed, so you can't audit what it does, can't modify how it works,
					and can't trust it fully. You're not the owner of the workflow. You're a tenant.
				</p>
				<p className="mt-4 max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					The worst part wasn't the cost or the lock-in. It was the feeling of not being in
					control. Every session was a negotiation with a black box. You send a prompt, hope
					it works, and pay whatever it costs. If the tool changes its behavior, you adapt.
					If the price goes up, you pay more. There is no leverage, no alternative, no
					recourse. The relationship is one-directional.
				</p>
			</GridBoxCell>

			{/* Divider — The belief */}
			<GridBoxCell className="!border-r-0 !p-0">
				<StoryDivider label="The belief" />
			</GridBoxCell>

			{/* Paragraph 2 — The belief */}
			<GridBoxCell className={cn(marketingGridCellClass, "!py-6 md:!py-8")}>
				<p className="max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					We believed something different. The agent that reads your code, runs your commands,
					and edits your files should be code you can read yourself. Not a black box you trust
					on faith, but a tool you can audit, fork, modify, and understand. If it edits a
					file, you should be able to see exactly how it decides what to edit. If it runs a
					shell command, you should know the logic behind the decision before it executes.
				</p>
				<p className="mt-4 max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					The model is the engine, not the product. You should be able to swap engines
					without rebuilding the car. Anthropic today, OpenAI tomorrow, a local model next
					week. The agent's tools, permissions, session history, and workflow should survive
					the switch. And pricing should be predictable, not a meter running in the
					background of every session, turning every prompt into a financial decision.
				</p>
			</GridBoxCell>

			{/* Divider — The build */}
			<GridBoxCell className="!border-r-0 !p-0">
				<StoryDivider label="The build" />
			</GridBoxCell>

			{/* Paragraph 3 — The build */}
			<GridBoxCell className={cn(marketingGridCellClass, "!py-6 md:!py-8")}>
				<p className="max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					So we started building. Quartz came first, a reasoning model that scales compute
					to problem complexity. Then the infrastructure to run it, the SDK for routing
					across 50+ model providers, the open-source coding agent, and the inference
					platform that puts the stack in developers' hands.
				</p>
				<p className="mt-4 max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Quartz spends compute where the problem actually needs it, not on a fixed schedule
					designed to burn your budget. A one-line question gets a fast answer. A multi-file
					refactor gets the depth it requires. The model adapts to the work, not the other way
					around. We build the model, the infrastructure, and the products that carry it into
					production.
				</p>
			</GridBoxCell>

			{/* Divider — The result */}
			<GridBoxCell className="!border-r-0 !p-0">
				<StoryDivider label="The result" />
			</GridBoxCell>

			{/* Paragraph 4 — The result */}
			<GridBoxCell className={cn(marketingGridCellClass, "!py-6 md:!py-8")}>
				<p className="max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					The result is a company that owns its models and the systems around them. Quartz
					is ours. The inference stack is ours. The agent is open source. And the defaults
					are honest, open where it matters, predictable where people depend on us, and
					grounded in research that respects the difference between a one-line question and
					a multi-file refactor.
				</p>
				<p className="mt-4 max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					We don't think Trumbo is the only way to advance useful AI. But we do think the
					principles, serious model research, open systems, honest access, and adaptive
					computation, are the right ones. If the field moves in this direction, we'll
					consider that a win, whether or not you use Trumbo to get there.
				</p>
			</GridBoxCell>
		</GridBox>
	);
}

function StoryDivider({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-4 border-y border-y-dotted border-grid-line px-5 py-4 md:px-8 md:py-5 lg:px-10">
			<span className="font-stat text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground/60 md:text-xs">
				{label}
			</span>
			<div className="h-px flex-1 bg-grid-line" />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Values                                                                      */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Values                                                                      */
/* -------------------------------------------------------------------------- */

const VALUES: { icon: Icon; title: string; description: string }[] = [
	{
		icon: GitBranch,
		title: "Default to open",
		description:
			"We share what we build, what we learn, and what we break. The CLI is MIT licensed, the roadmap is public. Open source is not a marketing strategy. It is the default, and closing something requires a better reason than opening it.",
	},
	{
		icon: Key,
		title: "Respect the user's time",
		description:
			"If a workflow takes three clicks, we ask why it can't take one. Every millisecond of latency is a tax on the developer's attention. Performance is not a feature we add later. It is a constraint we design around from the start.",
	},
	{
		icon: Tag,
		title: "Fund research honestly",
		description:
			"Rate-limited access, not per-token billing or expiring credits. We could optimize for extraction on every request. We optimize for sustainable model research and compute instead.",
	},
	{
		icon: Wrench,
		title: "Meet developers where they work",
		description:
			"Same agent in the terminal, your editor, the platform, scheduled jobs, and Slack threads. One core, every surface. No second-class interfaces.",
	},
	{
		icon: Scales,
		title: "Honest about what AI can't do",
		description:
			"We don't oversell, don't demo with cherry-picked examples, and don't pretend the model is smarter than it is. AI agents hallucinate APIs and confidently write code that doesn't compile. The agent sharpens your judgment, not replaces it.",
	},
	{
		icon: ArrowsLeftRight,
		title: "Ship small, ship often",
		description:
			"Small releases, frequent updates, no big-bang launches. We prefer a Tuesday patch over a quarterly overhaul. Bugs get fixed while they're still small. Big releases are stressful for the user. Small releases are reliable. We choose reliable.",
	},
];

export function CompanyValuesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
					<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
						<p className="marketing-kicker mb-4">Values</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							What we care about, and what we will not do.
						</h2>
					</div>
					<CompanyGridPanel className="border-l border-dotted" />
				</div>
				<div className="border-b border-b-dotted border-grid-line md:hidden">
					<div className={cn(marketingGridCellClass, "!py-5")}>
						<p className="marketing-kicker mb-4">Values</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							What we care about, and what we will not do.
						</h2>
					</div>
					<div className={cn("flex justify-end border-t border-dotted", sideGridLineClass)}>
						<CompanyGridPanel rows={GRID_ROWS} cols={GRID_COLS} />
					</div>
				</div>
			</GridBoxCell>

			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-2">
					{VALUES.map((value, index) => {
						const Icon = value.icon;
						const isLast = index === VALUES.length - 1;
						const isRightCol = (index + 1) % 2 === 0;
						const isLastRowMd = index >= VALUES.length - 2;
						return (
							<div
								key={value.title}
								className={cn(
									marketingGridCellClass,
									"flex items-start gap-5 !py-6 md:!py-8",
									!isLast && "border-b border-b-dotted border-grid-line md:border-b-0",
									!isLastRowMd && "md:border-b md:border-b-dotted md:border-grid-line",
									!isRightCol && "md:border-r md:border-r-dotted md:border-grid-line",
								)}
							>
								<Icon
									size={24}
									weight="duotone"
									className="mt-0.5 shrink-0 text-brand"
									aria-hidden="true"
								/>
								<div className="flex min-w-0 flex-1 flex-col gap-2.5">
									<h3 className="text-lg font-semibold leading-snug text-foreground md:text-xl">
										{value.title}
									</h3>
									<p className="text-base leading-relaxed text-muted-foreground md:text-lg lg:text-[1.0625rem] lg:leading-[1.6]">
										{value.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Team                                                                        */
/* -------------------------------------------------------------------------- */

export function CompanyTeamSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
					<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
						<p className="marketing-kicker mb-4">Team</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							The people building Trumbo.
						</h2>
						<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
							Three co-founders leading AI research, engineering, and product. The team
							behind Trumbo's models, inference infrastructure, and developer products.
						</p>
					</div>
					<CompanyGridPanel className="border-l border-dotted" />
				</div>
				<div className="border-b border-b-dotted border-grid-line md:hidden">
					<div className={cn(marketingGridCellClass, "!py-5")}>
						<p className="marketing-kicker mb-4">Team</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							The people building Trumbo.
						</h2>
						<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
							Three co-founders leading AI research, engineering, and product. The team
							behind Trumbo's models, inference infrastructure, and developer products.
						</p>
					</div>
					<div className={cn("flex justify-end border-t border-dotted", sideGridLineClass)}>
						<CompanyGridPanel rows={GRID_ROWS} cols={GRID_COLS} />
					</div>
				</div>
			</GridBoxCell>

			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 gap-px bg-grid-line md:grid-cols-3">
					{TEAM_MEMBERS.map((member) => (
						<div
							key={member.name}
							className="flex flex-col bg-marketing-content"
						>
							<div className="px-5 pt-5 md:px-6 md:pt-6 lg:px-8 lg:pt-8">
								<div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/10">
									<img
										src={member.image}
										alt={member.name}
										className="absolute inset-0 h-full w-full object-cover object-center"
										decoding="async"
										loading="lazy"
									/>
								</div>
							</div>
							<div className={cn(marketingGridCellClass, "flex flex-col !pt-3 !pb-5")}>
								<h3 className="text-lg font-semibold leading-snug text-foreground">
									{member.name}
								</h3>
								<p className="font-stat mt-1.5 text-xs uppercase tracking-[0.08em] text-brand">
									{member.role}
								</p>
							</div>
						</div>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

const TEAM_MEMBERS = [
	{
		name: "Shubhankar Kahali",
		role: "CEO & Co-Founder",
		image: "https://talanture.b-cdn.net/shubhankar-team.webp",
	},
	{
		name: "Kai Keskitalo",
		role: "CTO & Co-Founder",
		image: "https://talanture.b-cdn.net/kai-team.webp",
	},
	{
		name: "Zuzanna Kowalczyk",
		role: "Chief AI Scientist & Co-Founder",
		image: "https://talanture.b-cdn.net/zuzanna-team.webp",
	},
];

/* -------------------------------------------------------------------------- */
/* Careers                                                                     */
/* -------------------------------------------------------------------------- */

export function CompanyCareersSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
					<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
						<p className="marketing-kicker mb-4">Careers</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							Join the research.
						</h2>
						<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
							We hire for taste and ownership, not credentials and headcount. If you can
							advance model research, write production systems, and care about details
							that most people skip, we want to talk.
						</p>
					</div>
					<CompanyGridPanel className="border-l border-dotted" />
				</div>
				<div className="border-b border-b-dotted border-grid-line md:hidden">
					<div className={cn(marketingGridCellClass, "!py-5")}>
						<p className="marketing-kicker mb-4">Careers</p>
						<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
							Join the research.
						</h2>
						<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
							We hire for taste and ownership, not credentials and headcount. If you can
							advance model research, write production systems, and care about details
							that most people skip, we want to talk.
						</p>
					</div>
					<div className={cn("flex justify-end border-t border-dotted", sideGridLineClass)}>
						<CompanyGridPanel rows={GRID_ROWS} cols={GRID_COLS} />
					</div>
				</div>
			</GridBoxCell>

			{/* Job listings — none open */}
			<GridBoxCell className="!border-r-0 !p-0">
				<div className={cn(marketingGridCellClass, "flex flex-col items-center justify-center !py-12 md:!py-16")}>
					<p className="font-stat text-sm uppercase tracking-[0.1em] text-muted-foreground">
						Nothing open at this time
					</p>
					<p className="mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground/70 md:text-base">
						We post new positions here and on GitHub first. No recruiters, no six-hour
						take-home tests. We look at what you have shipped and talk about how you think.
					</p>
				</div>
			</GridBoxCell>
		</GridBox>
	);
}
