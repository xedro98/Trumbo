import {
	ArrowsLeftRight,
	MagnifyingGlass,
	PencilSimple,
	PlugsConnected,
	ShieldCheck,
	Terminal,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { InstallCommandTabs } from "@/components/InstallCommandTabs";
import { marketingGridCellClass, marketingGridListRowClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { MARKETING_CLI_CARD_IMAGE } from "@/lib/brand";
import { cn } from "@/lib/utils";

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";

const CAPABILITY_STRIP_ROWS = 2;

function AgentUnifiedGridStrip({
	cols,
	className,
}: {
	cols: number;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid w-full border-grid-line",
				className,
			)}
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
			aria-hidden="true"
		>
			{Array.from({ length: cols * CAPABILITY_STRIP_ROWS }).map((_, index) => {
				const row = Math.floor(index / cols);
				const col = index % cols;

				return (
					<div
						key={index}
						className={cn(
							"min-h-11 bg-muted/[0.06] md:min-h-12 lg:min-h-14",
							col < cols - 1 && "border-r border-r-dotted border-grid-line",
							row < CAPABILITY_STRIP_ROWS - 1 && "border-b border-b-dotted border-grid-line",
						)}
					/>
				);
			})}
		</div>
	);
}

function AgentCapabilitiesGridFrame({
	edge = "top",
}: {
	edge?: "top" | "bottom";
}) {
	const edgeClass =
		edge === "top" ? "border-b border-b-dotted border-grid-line" : "border-t border-t-dotted border-grid-line";

	return (
		<>
			<AgentUnifiedGridStrip cols={3} className={cn(edgeClass, "md:hidden")} />
			<AgentUnifiedGridStrip cols={8} className={cn(edgeClass, "hidden md:grid lg:hidden")} />
			<AgentUnifiedGridStrip cols={12} className={cn(edgeClass, "hidden lg:grid")} />
		</>
	);
}

function AgentCapabilityCard({
	icon: Icon,
	title,
	description,
}: {
	icon: Icon;
	title: string;
	description: string;
}) {
	return (
		<div className={cn(marketingGridCellClass, "flex h-full flex-col")}>
			<Icon size={22} weight="duotone" className="mb-4 shrink-0 text-brand" aria-hidden="true" />
			<h3 className="mb-3 text-lg font-semibold leading-snug">{title}</h3>
			<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{description}
			</p>
		</div>
	);
}
function AgentGridCell({
	className,
	sizeClass = gridCellSizeClass,
}: {
	className?: string;
	sizeClass?: string;
}) {
	return (
		<div
			className={cn(
				sizeClass,
				"border-b border-r border-dotted bg-muted/[0.06]",
				sideGridLineClass,
				className,
			)}
		/>
	);
}

function AgentGridPanel({
	className,
	rows = GRID_ROWS,
	cols = GRID_COLS,
	cellSizeClass = gridCellSizeClass,
}: {
	className?: string;
	rows?: number;
	cols?: number;
	cellSizeClass?: string;
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
					<AgentGridCell
						key={index}
						sizeClass={cellSizeClass}
						className={cn(col === cols - 1 && "border-r-0", row === rows - 1 && "border-b-0")}
					/>
				);
			})}
		</div>
	);
}

const AGENT_CAPABILITIES: {
	icon: Icon;
	title: string;
	description: string;
}[] = [
	{
		icon: PencilSimple,
		title: "Edit files in place",
		description:
			"Apply reviewable search-and-replace edits before any change lands in your tree. Keep every diff tight, scoped, and faithful to your existing repository conventions.",
	},
	{
		icon: Terminal,
		title: "Run shell commands",
		description:
			"Run tests, builds, and scripts in the same session without losing any state. Each command pauses for your approval before anything executes on your machine.",
	},
	{
		icon: MagnifyingGlass,
		title: "Search your codebase",
		description:
			"Find symbols, files, and references with semantic search and fast ripgrep. Gather the right context before the agent proposes changes to your codebase.",
	},
	{
		icon: PlugsConnected,
		title: "Call MCP tools",
		description:
			"Connect browsers, databases, and APIs through MCP tools you configure once per team. Reuse the same integrations across sessions without redefining your stack.",
	},
	{
		icon: ArrowsLeftRight,
		title: "Work offline or routed",
		description:
			"Run local models for speed, privacy, or offline work on sensitive code. Switch to Trumbo when you need stronger models without resetting tools or session.",
	},
	{
		icon: ShieldCheck,
		title: "Permissions that stick",
		description:
			"Set allow rules and per-tool approvals once per repository in your workspace. They stick across sessions and shape every tool call your team allows.",
	},
];

/** Full-width row dividers + column dividers between capability cards. */
function agentCapabilitySeparatorClass(index: number): string {
	const total = AGENT_CAPABILITIES.length;

	return cn(
		"border-grid-line",
		// Mobile stack: horizontal divider under every card except the last
		index < total - 1 && "border-b border-b-dotted",
		// md 2-col: drop bottom border on last row (indices 4–5)
		index >= total - 2 && "md:border-b-0",
		// lg 3-col: drop bottom border on last row (indices 3–5)
		index >= total - 3 && "lg:border-b-0",
		// md/lg: vertical divider on cells that are not the last in their row
		(index + 1) % 2 !== 0 && "md:border-r md:border-r-solid",
		(index + 1) % 3 !== 0 && "lg:border-r lg:border-r-solid",
	);
}

const AGENT_PILLARS = [
	{
		tag: "Terminal",
		description:
			"Work in the shell, your editor, and your repo — no browser tab or context switch required.",
	},
	{
		tag: "MCP",
		description:
			"Configure browsers, databases, and APIs once. The same tool stack follows you across every repo.",
	},
	{
		tag: "Local",
		description:
			"Run Ollama or LM Studio on sensitive code, or bring your own keys from Anthropic, OpenAI, and OpenRouter.",
	},
	{
		tag: "Team",
		description:
			"Share sessions on the platform without resetting permissions, history, or your tool setup.",
	},
] as const;

function AgentManifestRow({
	index,
	tag,
	description,
}: {
	index: number;
	tag: string;
	description: string;
}) {
	return (
		<div
			className={cn(
				marketingGridListRowClass,
				"grid grid-cols-1 gap-3 border-grid-line py-5 last:border-b-0 md:grid-cols-[3rem_7rem_minmax(0,1fr)] md:items-baseline md:gap-x-6 md:py-6",
				index > 0 && "border-t border-t-dotted",
			)}
		>
			<span className="font-stat text-[0.6875rem] tabular-nums tracking-[0.06em] text-muted-foreground/70">
				{String(index + 1).padStart(2, "0")}
			</span>
			<span className="font-stat text-xs uppercase tracking-[0.1em] text-brand">{tag}</span>
			<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">{description}</p>
		</div>
	);
}

const BENTO_MOSAIC_CELL = "min-h-0 min-w-0";
const BENTO_MOSAIC_FRAME = "bg-grid-line";

type MosaicCutout = {
	index: number;
	label: string;
	colSpan?: number;
	rowSpan?: number;
};

function resolveMosaicCutouts(cols: number, cutouts: readonly MosaicCutout[]) {
	const originByIndex = new Map<number, MosaicCutout>();
	const coveredIndices = new Set<number>();

	for (const cutout of cutouts) {
		const startCol = cutout.index % cols;
		const startRow = Math.floor(cutout.index / cols);
		const colSpan = clampCutoutSpan(
			startCol,
			cutout.colSpan ?? defaultCutoutColSpan(cutout.label, cols),
			cols,
		);
		const rowSpan = cutout.rowSpan ?? 1;

		originByIndex.set(cutout.index, cutout);

		for (let row = 0; row < rowSpan; row += 1) {
			for (let col = 0; col < colSpan; col += 1) {
				const index = (startRow + row) * cols + (startCol + col);
				if (index !== cutout.index) {
					coveredIndices.add(index);
				}
			}
		}
	}

	return { originByIndex, coveredIndices };
}

function defaultCutoutColSpan(label: string, cols: number): number {
	if (label.length >= 13) {
		return Math.min(3, cols);
	}
	if (label.length >= 9) {
		return Math.min(2, cols);
	}
	return 1;
}

function clampCutoutSpan(start: number, span: number, max: number): number {
	return Math.max(1, Math.min(span, max - start));
}

function mosaicCellPosition(index: number, cols: number) {
	const col = index % cols;
	const row = Math.floor(index / cols);
	return { col: col + 1, row: row + 1, startCol: col, startRow: row };
}

type MosaicGridConfig = {
	cols: number;
	rows: number;
	cutouts: readonly MosaicCutout[];
};

function AgentWorkflowBentoGrid({
	cols,
	rows,
	cutouts,
	className,
}: {
	cols: number;
	rows: number;
	cutouts: readonly MosaicCutout[];
	className?: string;
}) {
	const { originByIndex, coveredIndices } = resolveMosaicCutouts(cols, cutouts);
	const total = cols * rows;

	return (
		<div
			className={cn("grid h-full w-full min-h-0 min-w-0 gap-px", BENTO_MOSAIC_FRAME, className)}
			style={{
				gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
			}}
			aria-hidden="true"
		>
			{Array.from({ length: total }).map((_, index) => {
				if (coveredIndices.has(index)) {
					return null;
				}

				const { col, row, startCol } = mosaicCellPosition(index, cols);
				const cutout = originByIndex.get(index);

				if (cutout) {
					const colSpan = clampCutoutSpan(
						startCol,
						cutout.colSpan ?? defaultCutoutColSpan(cutout.label, cols),
						cols,
					);
					const rowSpan = cutout.rowSpan ?? 1;

					return (
						<div
							key={index}
							className={cn(BENTO_MOSAIC_CELL, "flex bg-marketing-content")}
							style={{
								gridColumn: `${col} / span ${colSpan}`,
								gridRow: `${row} / span ${rowSpan}`,
							}}
						>
							<span className="flex h-full w-full items-center justify-center px-1.5 text-center font-stat text-[0.5rem] uppercase leading-tight tracking-[0.05em] !text-foreground sm:px-2 sm:text-[0.5625rem] sm:tracking-[0.06em] md:px-3 md:text-[0.625rem] lg:text-[0.6875rem]">
								{cutout.label}
							</span>
						</div>
					);
				}

				return (
					<div
						key={index}
						className={cn(BENTO_MOSAIC_CELL, "bg-marketing-content")}
						style={{ gridColumn: col, gridRow: row }}
					/>
				);
			})}
		</div>
	);
}

const AGENT_WORKFLOW_ITEMS: readonly {
	title: string;
	description: string;
	bentoClass: string;
	featured?: boolean;
	grid: MosaicGridConfig;
	mobileGrid: MosaicGridConfig;
}[] = [
	{
		title: "Plan / Act",
		description:
			"Explore in read-only Plan mode before anything mutates your tree. Switch to Act when you are ready to patch, run, and ship.",
		featured: true,
		bentoClass: "md:col-span-2 md:row-span-2",
		grid: {
			cols: 5,
			rows: 8,
			cutouts: [
				{ index: 2, label: "Explore first", colSpan: 3 },
				{ index: 7, label: "Read-only", colSpan: 2 },
				{ index: 16, label: "Plan mode", colSpan: 2 },
				{ index: 27, label: "Act & ship", colSpan: 3, rowSpan: 2 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 7,
			cutouts: [
				{ index: 1, label: "Explore", colSpan: 2 },
				{ index: 6, label: "Plan", colSpan: 2 },
				{ index: 13, label: "Act & ship", colSpan: 2, rowSpan: 2 },
			],
		},
	},
	{
		title: "Checkpoints",
		description:
			"Snapshot workspace state as the agent works through a task. Rewind chat and files with /undo when a step goes sideways.",
		bentoClass: "md:col-span-2",
		grid: {
			cols: 4,
			rows: 5,
			cutouts: [
				{ index: 0, label: "Rewind state", colSpan: 3 },
				{ index: 14, label: "Snapshots", colSpan: 2, rowSpan: 2 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 5,
			cutouts: [
				{ index: 0, label: "Rewind", colSpan: 2 },
				{ index: 10, label: "Snapshots", colSpan: 2, rowSpan: 2 },
			],
		},
	},
	{
		title: "Sessions",
		description:
			"List, resume, and inspect past runs without rebuilding context. Permissions, history, and tool config carry into the next prompt.",
		bentoClass: "md:col-span-2",
		grid: {
			cols: 4,
			rows: 5,
			cutouts: [
				{ index: 1, label: "Resume run", colSpan: 2 },
				{ index: 13, label: "Past context", colSpan: 3, rowSpan: 2 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 5,
			cutouts: [
				{ index: 1, label: "Resume", colSpan: 2 },
				{ index: 9, label: "Context", colSpan: 2, rowSpan: 2 },
			],
		},
	},
	{
		title: "Rules",
		description:
			"Add .trumborules/ for project rules, packaged skills, and workflows. Trumbo loads them automatically at the start of every session.",
		bentoClass: "md:col-span-2",
		grid: {
			cols: 4,
			rows: 5,
			cutouts: [
				{ index: 0, label: "Repo rules", colSpan: 2 },
				{ index: 8, label: "Team skills", colSpan: 3 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 4,
			cutouts: [
				{ index: 0, label: "Repo rules", colSpan: 2 },
				{ index: 6, label: "Skills", colSpan: 2 },
			],
		},
	},
	{
		title: "Teams",
		description:
			"Spawn specialist sub-agents with isolated context for parallel workstreams. Team state persists across sessions with --team-name.",
		bentoClass: "md:col-span-2",
		grid: {
			cols: 4,
			rows: 5,
			cutouts: [
				{ index: 0, label: "Sub-agents", colSpan: 2 },
				{ index: 12, label: "Parallel work", colSpan: 3 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 4,
			cutouts: [
				{ index: 0, label: "Sub-agents", colSpan: 2 },
				{ index: 6, label: "Parallel", colSpan: 2 },
			],
		},
	},
	{
		title: "Schedules",
		description:
			"Run recurring agent jobs — daily reviews, dependency scans, PR summaries — with cron-style schedules and optional chat delivery.",
		bentoClass: "md:col-span-2",
		grid: {
			cols: 4,
			rows: 5,
			cutouts: [
				{ index: 0, label: "Recurring jobs", colSpan: 3 },
				{ index: 12, label: "Daily review", colSpan: 3 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 4,
			cutouts: [
				{ index: 0, label: "Cron jobs", colSpan: 2 },
				{ index: 6, label: "Daily", colSpan: 2 },
			],
		},
	},
	{
		title: "Headless",
		description:
			"Run one-shot prompts, stream NDJSON with --json, or auto-approve with --yolo for scripts, pipes, and CI pipelines.",
		bentoClass: "md:col-span-2",
		grid: {
			cols: 4,
			rows: 5,
			cutouts: [
				{ index: 0, label: "CI & scripts", colSpan: 3 },
				{ index: 14, label: "No prompts", colSpan: 2, rowSpan: 2 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 5,
			cutouts: [
				{ index: 0, label: "CI scripts", colSpan: 2 },
				{ index: 10, label: "No prompts", colSpan: 2, rowSpan: 2 },
			],
		},
	},
	{
		title: "Connectors",
		description:
			"Bridge Slack, Telegram, Discord, and Linear into full agent sessions. Each thread maps to persistent context, not a one-off reply.",
		bentoClass: "md:col-span-2",
		grid: {
			cols: 4,
			rows: 5,
			cutouts: [
				{ index: 0, label: "Chat in Slack", colSpan: 3 },
				{ index: 12, label: "Same session", colSpan: 3 },
			],
		},
		mobileGrid: {
			cols: 3,
			rows: 4,
			cutouts: [
				{ index: 0, label: "Slack", colSpan: 2 },
				{ index: 6, label: "Same session", colSpan: 2 },
			],
		},
	},
];

function AgentWorkflowBanner() {
	return (
		<>
			<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
				<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
					<p className="marketing-kicker mb-3">Workflow</p>
					<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
						Install once. Run in your repo. Ship without resetting context.
					</h2>
					<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
						The interactive TUI, headless CI, scheduled jobs, and chat connectors share one
						agent core — plan before you act, rewind when needed, and resume where you left off.
					</p>
				</div>
				<AgentGridPanel className="border-l border-dotted" rows={GRID_ROWS} cols={GRID_COLS} />
			</div>
			<div className="border-b border-b-dotted border-grid-line md:hidden">
				<div className={cn(marketingGridCellClass, "!py-5")}>
					<p className="marketing-kicker mb-3">Workflow</p>
					<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
						Install once. Run in your repo. Ship without resetting context.
					</h2>
					<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
						The interactive TUI, headless CI, scheduled jobs, and chat connectors share one agent
						core — plan before you act, rewind when needed, and resume where you left off.
					</p>
				</div>
			</div>
		</>
	);
}

function AgentWorkflowBentoCard({
	title,
	description,
	featured = false,
	grid,
	mobileGrid,
}: {
	title: string;
	description: string;
	featured?: boolean;
	grid: MosaicGridConfig;
	mobileGrid: MosaicGridConfig;
}) {
	return (
		<div
			className={cn(
				"flex h-full min-w-0 flex-col",
				featured
					? "min-h-[17rem] sm:min-h-[18rem] md:min-h-full"
					: "min-h-[15rem] sm:min-h-[16rem] md:min-h-[18rem] lg:min-h-[20rem]",
			)}
		>
			<div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
				<AgentWorkflowBentoGrid
					className="absolute inset-0 md:hidden"
					cols={mobileGrid.cols}
					rows={mobileGrid.rows}
					cutouts={mobileGrid.cutouts}
				/>
				<AgentWorkflowBentoGrid
					className="absolute inset-0 hidden md:grid"
					cols={grid.cols}
					rows={grid.rows}
					cutouts={grid.cutouts}
				/>
			</div>
			<div
				className={cn(
					marketingGridCellClass,
					"shrink-0 border-t border-t-dotted border-grid-line !py-0 !pt-3 md:!pt-4",
					"!pl-4 !pr-4 md:!pl-5 md:!pr-5 lg:!pl-6 lg:!pr-6",
					featured ? "!pb-6 md:!pb-7" : "!pb-4 md:!pb-5",
				)}
			>
				<div className={featured ? "max-w-md" : undefined}>
					<h3
						className={cn(
							"font-semibold leading-snug text-foreground",
							featured ? "text-xl md:text-[1.375rem]" : "text-base",
						)}
					>
						{title}
					</h3>
					<p
						className={cn(
							"mt-2.5 leading-relaxed text-muted-foreground",
							featured
								? "mt-4 text-base md:text-[1.0625rem]"
								: "text-[0.9375rem] md:text-base",
						)}
					>
						{description}
					</p>
				</div>
			</div>
		</div>
	);
}

export function AgentHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">Coding Agent</p>
			<h1 className="marketing-hero-heading mb-6 max-w-5xl">
				Trumbo Agent
			</h1>
			<p className="mb-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none lg:text-[1.375rem] lg:leading-[1.6]">
				Edit files, run shell commands, search your codebase, and call MCP tools without leaving
				your workflow. Stay local with offline models, then connect to Trumbo when you want more
				capable models, shared sessions, and infrastructure your team can grow into.
			</p>
			<p className="mb-6 max-w-5xl text-base leading-relaxed text-muted-foreground md:max-w-6xl md:text-lg lg:max-w-none lg:text-[1.25rem] lg:leading-[1.65]">
				Plan before you act, rewind with checkpoints, resume sessions, and run headless in CI.
				Same agent core in the TUI, your terminal, scheduled jobs, and Slack or Discord threads.
			</p>
			<InstallCommandTabs className="mt-1" />
		</div>
	);
}

export function AgentHeroVisual() {
	return (
		<div className="relative min-h-64 w-full overflow-hidden md:min-h-80 lg:min-h-[24rem]">
			<img
				src={MARKETING_CLI_CARD_IMAGE}
				alt=""
				className="block h-full min-h-64 w-full object-cover object-center md:min-h-80 lg:min-h-[24rem]"
				decoding="async"
			/>
		</div>
	);
}

function AgentBannerHeading() {
	return (
		<div className="flex flex-col">
			<p className="marketing-kicker mb-3">Capabilities</p>
			<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
				Everything you need to ship, with tools the agent can actually use.
			</h2>
			<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
				Six core tools in the agent loop. The sections below cover how you run them — modes,
				sessions, teams, schedules, headless CI, and chat connectors.
			</p>
		</div>
	);
}

function AgentCapabilitiesBanner() {
	return (
		<>
			<div className="hidden md:flex md:items-stretch">
				<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
					<AgentBannerHeading />
				</div>
				<AgentGridPanel className="border-l border-dotted" rows={GRID_ROWS} cols={GRID_COLS} />
			</div>
			<div className="md:hidden">
				<div className={cn(marketingGridCellClass, "!py-5")}>
					<AgentBannerHeading />
				</div>
			</div>
		</>
	);
}

export function AgentCapabilitiesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<AgentCapabilitiesBanner />
			</GridBoxCell>
			<GridBoxCell className="!p-0 md:!border-r-0">
				<AgentCapabilitiesGridFrame edge="top" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{AGENT_CAPABILITIES.map((capability, index) => (
						<div
							key={capability.title}
							className={cn("flex flex-col", agentCapabilitySeparatorClass(index))}
						>
							<AgentCapabilityCard
								icon={capability.icon}
								title={capability.title}
								description={capability.description}
							/>
						</div>
					))}
				</div>
				<AgentCapabilitiesGridFrame edge="bottom" />
			</GridBoxCell>
		</GridBox>
	);
}

export function AgentStatsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-5">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center md:col-span-2",
					"md:!border-r md:!border-solid md:!border-grid-line",
				)}
			>
				<p className="marketing-kicker mb-3">Built for</p>
				<h2 className="font-heading text-[1.5rem] font-normal leading-[1.35] tracking-[-0.02em] text-foreground md:text-[1.75rem] lg:text-[2rem]">
					Solo work that scales to your whole team.
				</h2>
				<p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
					Four layers — runtime, tools, models, and teams — configured once, not per switch.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!p-0 md:col-span-3 md:!border-r-0">
				{AGENT_PILLARS.map((pillar, index) => (
					<AgentManifestRow
						key={pillar.tag}
						index={index}
						tag={pillar.tag}
						description={pillar.description}
					/>
				))}
			</GridBoxCell>
		</GridBox>
	);
}

export function AgentWorkflowSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<AgentWorkflowBanner />
				<div className="grid min-w-0 grid-cols-1 gap-px bg-grid-line md:grid-cols-6 md:auto-rows-[minmax(18rem,1fr)] lg:auto-rows-[minmax(20rem,1fr)]">
					{AGENT_WORKFLOW_ITEMS.map((item) => (
						<div
							key={item.title}
							className={cn("flex h-full min-w-0 flex-col bg-marketing-content", item.bentoClass)}
						>
							<AgentWorkflowBentoCard
								title={item.title}
								description={item.description}
								featured={item.featured}
								grid={item.grid}
								mobileGrid={item.mobileGrid}
							/>
						</div>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}
