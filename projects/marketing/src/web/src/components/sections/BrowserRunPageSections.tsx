import {
	Article,
	ArrowsDownUp,
	Camera,
	Code,
	Compass,
	Cursor,
	Eye,
	FilePdf,
	Heartbeat,
	Keyboard,
	ListChecks,
	Mouse,
	ShoppingCart,
	SignIn,
	TextAa,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import {
	MarketingComparisonTable,
	MarketingCtaRow,
} from "@/components/sections/MarketingBenchmarkPrimitives";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

/**
 * Browser Run page — Agentic Cloud surface.
 * Mirrors the Agent page grid language and the Quartz page diagram language.
 * Unique sections: MCP tool mosaic, Trumbo Browser Host lifecycle diagram.
 */

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";
const CAPABILITY_STRIP_ROWS = 2;

/* -------------------------------------------------------------------------- */
/* Shared scaffolding — identical class patterns to AgentPageSections          */
/* -------------------------------------------------------------------------- */

function GridStrip({ cols, className }: { cols: number; className?: string }) {
	return (
		<div
			className={cn("grid w-full border-grid-line", className)}
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

function GridFrame({ edge = "top" }: { edge?: "top" | "bottom" }) {
	const edgeClass =
		edge === "top"
			? "border-b border-b-dotted border-grid-line"
			: "border-t border-t-dotted border-grid-line";

	return (
		<>
			<GridStrip cols={3} className={cn(edgeClass, "md:hidden")} />
			<GridStrip cols={8} className={cn(edgeClass, "hidden md:grid lg:hidden")} />
			<GridStrip cols={12} className={cn(edgeClass, "hidden lg:grid")} />
		</>
	);
}

function DecorGridCell({
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

function DecorGridPanel({
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
					<DecorGridCell
						key={index}
						className={cn(col === cols - 1 && "border-r-0", row === rows - 1 && "border-b-0")}
					/>
				);
			})}
		</div>
	);
}

function CapabilityCard({
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

function capabilitySeparatorClass(index: number, total: number): string {
	return cn(
		"border-grid-line",
		index < total - 1 && "border-b border-b-dotted",
		index >= total - 2 && "md:border-b-0",
		index >= total - 3 && "lg:border-b-0",
		(index + 1) % 2 !== 0 && "md:border-r md:border-r-solid",
		(index + 1) % 3 !== 0 && "lg:border-r lg:border-r-solid",
	);
}

function SectionBanner({
	kicker,
	heading,
	lead,
}: {
	kicker: string;
	heading: string;
	lead: string;
}) {
	const content = (
		<div className="flex flex-col">
			<p className="marketing-kicker mb-3">{kicker}</p>
			<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
				{heading}
			</h2>
			<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">
				{lead}
			</p>
		</div>
	);

	return (
		<>
			<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
				<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
					{content}
				</div>
				<DecorGridPanel className="border-l border-dotted" rows={GRID_ROWS} cols={GRID_COLS} />
			</div>
			<div className="border-b border-b-dotted border-grid-line md:hidden">
				<div className={cn(marketingGridCellClass, "!py-5")}>{content}</div>
			</div>
		</>
	);
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

export function BrowserRunHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">
				<span>Agentic Cloud</span>
				<span className="marketing-kicker-sep" aria-hidden="true" />
				<span>Browser Run</span>
			</p>
			<h1 className="marketing-hero-heading mb-6 max-w-5xl">
				Cloud browsers wired for CDP, not screenshots
			</h1>
			<p className="mb-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none lg:text-[1.375rem] lg:leading-[1.6]">
				Trumbo Agent drives real Chromium sessions over the Chrome DevTools Protocol. Every
				interaction is a deterministic tool call: navigate by URL, click by element ref,
				type into inputs, scroll regions, and snapshot the DOM. No coordinate guessing and no
				vision model in the loop.
			</p>
			<p className="max-w-5xl text-base leading-relaxed text-muted-foreground md:max-w-6xl md:text-lg lg:max-w-none lg:text-[1.25rem] lg:leading-[1.65]">
				Each session runs in a Trumbo Browser Host with a keepalive alarm, so multi-step
				reasoning does not drop the page or force a re-login. Live view URLs let you watch the
				agent browse, share a session with a teammate, or take over manually when you need to.
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Hero diagram — browser session execution graph (Quartz-style DAG)           */
/* -------------------------------------------------------------------------- */

function BrowserRunGraphNode({
	x,
	y,
	label,
	sub,
	accent,
}: {
	x: number;
	y: number;
	label: string;
	sub: string;
	accent?: boolean;
}) {
	return (
		<g>
			<rect
				x={x - 40}
				y={y - 18}
				width="80"
				height="36"
				rx="2"
				stroke="currentColor"
				strokeWidth="1"
				fill="var(--marketing-content)"
				opacity="0.95"
			/>
			{accent ? (
				<rect
					x={x - 40}
					y={y - 18}
					width="80"
					height="36"
					rx="2"
					stroke="var(--brand)"
					strokeWidth="1.25"
					fill="none"
				/>
			) : null}
			<text
				x={x}
				y={y - 1}
				textAnchor="middle"
				fontSize="9"
				fontFamily="var(--font-stat)"
				fill="currentColor"
				stroke="none"
			>
				{label}
			</text>
			<text
				x={x - 34}
				y={y + 13}
				fontSize="7"
				fontFamily="var(--font-stat)"
				fill="var(--color-muted-foreground)"
				stroke="none"
				opacity="0.8"
			>
				{sub}
			</text>
		</g>
	);
}

/**
 * Hand-drafted DAG of one browser tool-call turn.
 * Mirrors Quartz execution graph language: numbered nodes, curved edges, feedback loops.
 */
function BrowserRunExecutionGraph({ className }: { className?: string }) {
	return (
		<svg
			className={cn("text-foreground", className)}
			viewBox="0 0 900 340"
			preserveAspectRatio="xMidYMid meet"
			fill="none"
			stroke="currentColor"
			aria-hidden="true"
		>
			<defs>
				<marker
					id="br-graph-arrow"
					markerWidth="6"
					markerHeight="6"
					refX="5"
					refY="3"
					orient="auto"
					markerUnits="userSpaceOnUse"
				>
					<path d="M0,0.5 L5,3 L0,5.5 Z" fill="currentColor" opacity="0.5" />
				</marker>
				<marker
					id="br-graph-arrow-brand"
					markerWidth="6"
					markerHeight="6"
					refX="5"
					refY="3"
					orient="auto"
					markerUnits="userSpaceOnUse"
				>
					<path d="M0,0.5 L5,3 L0,5.5 Z" fill="var(--brand)" />
				</marker>
			</defs>

			<g stroke="currentColor" strokeWidth="0.9" opacity="0.5">
				<path d="M 110 170 C 160 170, 170 80, 180 80" markerEnd="url(#br-graph-arrow)" />
				<path d="M 220 98 C 240 98, 240 242, 220 242" markerEnd="url(#br-graph-arrow)" />
				<path d="M 260 260 C 320 260, 330 80, 350 80" markerEnd="url(#br-graph-arrow)" />
				<path d="M 390 98 C 410 98, 410 170, 390 170" markerEnd="url(#br-graph-arrow)" />
				<path d="M 430 170 C 480 170, 490 80, 520 80" markerEnd="url(#br-graph-arrow)" />
				<path d="M 430 170 C 480 170, 490 260, 520 260" markerEnd="url(#br-graph-arrow)" />
				<path d="M 600 80 C 650 80, 660 170, 690 170" markerEnd="url(#br-graph-arrow)" />
				<path d="M 600 260 C 650 260, 660 170, 690 170" markerEnd="url(#br-graph-arrow)" />
				<path d="M 730 188 C 750 188, 750 242, 730 242" markerEnd="url(#br-graph-arrow)" />
			</g>

			<g stroke="var(--brand)" strokeWidth="1.1" opacity="0.8">
				<path d="M 770 260 C 805 260, 805 170, 800 170" markerEnd="url(#br-graph-arrow-brand)" />
			</g>

			<g stroke="var(--brand)" strokeWidth="1" strokeDasharray="4 3" opacity="0.65">
				<path d="M 690 170 C 640 170, 640 80, 600 80" markerEnd="url(#br-graph-arrow-brand)" />
				<path d="M 520 260 C 470 260, 470 170, 430 170" markerEnd="url(#br-graph-arrow-brand)" />
				<path d="M 390 170 C 320 170, 320 260, 260 260" markerEnd="url(#br-graph-arrow-brand)" />
			</g>

			<g>
				<BrowserRunGraphNode x={70} y={170} label="Request" sub="01" />
				<BrowserRunGraphNode x={220} y={80} label="MCP" sub="02" />
				<BrowserRunGraphNode x={220} y={260} label="Navigate" sub="03" />
				<BrowserRunGraphNode x={390} y={80} label="CDP" sub="04" />
				<BrowserRunGraphNode x={390} y={170} label="Session" sub="05" accent />
				<BrowserRunGraphNode x={560} y={80} label="Chromium" sub="06" />
				<BrowserRunGraphNode x={560} y={260} label="Interact" sub="07" />
				<BrowserRunGraphNode x={730} y={170} label="Snapshot" sub="08" accent />
				<BrowserRunGraphNode x={730} y={260} label="Reason" sub="09" accent />
				<BrowserRunGraphNode x={840} y={170} label="Output" sub="10" />
			</g>
		</svg>
	);
}

export function BrowserRunHeroVisual() {
	return (
		<div className="flex min-h-96 w-full flex-col overflow-hidden border-y border-y-dotted border-grid-line bg-marketing-content md:min-h-[28rem] lg:min-h-[32rem]">
			<div className="relative min-h-0 flex-1 overflow-hidden">
				<BrowserRunExecutionGraph className="absolute inset-0 h-full w-full" />
			</div>
			<div className="flex shrink-0 justify-center pt-10 pb-4 font-stat text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground md:pt-14 md:pb-5 md:text-xs">
				Fig. 00 — Browser session execution graph (per tool call)
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                                */
/* -------------------------------------------------------------------------- */

const BROWSER_RUN_CAPABILITIES: {
	icon: Icon;
	title: string;
	description: string;
}[] = [
	{
		icon: Mouse,
		title: "CDP control",
		description:
			"Drive Chromium over the Chrome DevTools Protocol. Navigate, click, type, scroll, and snapshot from agent tool calls on CLI or VS Code, with element refs from the latest accessibility tree.",
	},
	{
		icon: Camera,
		title: "Screenshots",
		description:
			"Capture full-page or viewport PNGs on demand. The agent verifies layout, confirms an interaction landed, or shares visual state without round-tripping through a vision model.",
	},
	{
		icon: TextAa,
		title: "Markdown extraction",
		description:
			"Fetch any page as clean Markdown after JavaScript runs. Structured enough to cite in an answer, clean enough to drop straight into a report or diff.",
	},
	{
		icon: FilePdf,
		title: "PDF export",
		description:
			"Generate PDFs from live pages with the same session that drove them. Receipts, invoices, and archives without a local print stack or headless Chrome install.",
	},
	{
		icon: Eye,
		title: "Live view URLs",
		description:
			"Each session exposes a shareable live view URL. Watch the agent browse in real time, hand off to a teammate, or take over manually when a flow needs human judgment.",
	},
	{
		icon: Heartbeat,
		title: "Session keepalive",
		description:
			"A Trumbo Browser Host alarm keeps the browser alive between tool calls. Long reasoning chains, approval pauses, and multi-page flows do not lose cookies or force a re-login.",
	},
];

export function BrowserRunCapabilitiesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Capabilities"
					heading="A real browser, driven like a tool."
					lead="Six CDP primitives cover every cloud session. The same MCP tool names work from the CLI, VS Code, and the platform API, so automations behave identically whether you are scripting a scrape or debugging a checkout flow."
				/>
				<GridFrame edge="top" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{BROWSER_RUN_CAPABILITIES.map((capability, index) => (
						<div
							key={capability.title}
							className={cn("flex flex-col", capabilitySeparatorClass(index, BROWSER_RUN_CAPABILITIES.length))}
						>
							<CapabilityCard
								icon={capability.icon}
								title={capability.title}
								description={capability.description}
							/>
						</div>
					))}
				</div>
				<GridFrame edge="bottom" />
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Use cases — bento layout, unique to this page                               */
/* -------------------------------------------------------------------------- */

const BROWSER_RUN_USE_CASES: {
	icon: Icon;
	title: string;
	description: string;
	bentoClass: string;
	featured?: boolean;
	accentLabels: readonly string[];
	accentCols?: number;
}[] = [
	{
		icon: SignIn,
		title: "Authenticated flows",
		description:
			"Drive login walls, MFA prompts, and multi-page wizards without losing cookies between tool calls. The Trumbo Browser Host keepalive holds session state while the agent pauses for approval or reasoning.",
		featured: true,
		bentoClass: "md:col-span-2 md:row-span-2",
		accentLabels: ["Login", "MFA", "Cookies", "Redirect", "Resume", "Handoff"],
		accentCols: 3,
	},
	{
		icon: Article,
		title: "Docs extraction",
		description:
			"Pull API references, changelogs, and support articles as Markdown after JavaScript renders. The agent cites structured headings and code blocks instead of re-scraping on every turn.",
		bentoClass: "md:col-span-2",
		accentLabels: ["Navigate", "Render", "Markdown"],
	},
	{
		icon: ShoppingCart,
		title: "Checkout and forms",
		description:
			"Fill address fields, toggle plans, and validate submit flows with CDP element refs. Screenshots confirm layout; PDF export archives the receipt page when the flow completes.",
		bentoClass: "md:col-span-2",
		accentLabels: ["Fill", "Submit", "Validate"],
	},
	{
		icon: ListChecks,
		title: "Regression checks",
		description:
			"Capture viewport screenshots after each deploy and compare against baselines. CDP clicks land on the same element refs every run, so flaky coordinate drift does not break the suite.",
		bentoClass: "md:col-span-4",
		accentLabels: ["Baseline", "Navigate", "Screenshot", "Diff"],
		accentCols: 4,
	},
];

function BrowserRunUseCaseBentoAccent({
	labels,
	cols = 2,
	featured = false,
	className,
}: {
	labels: readonly string[];
	cols?: number;
	featured?: boolean;
	className?: string;
}) {
	const rows = Math.ceil(labels.length / cols);

	return (
		<div
			className={cn("grid h-full w-full min-h-0 min-w-0 gap-px bg-grid-line", className)}
			style={{
				gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
			}}
			aria-hidden="true"
		>
			{labels.map((label) => (
				<div
					key={label}
					className={cn(
						"flex min-h-0 items-center justify-center bg-marketing-content px-2 text-center font-stat uppercase tracking-[0.06em] text-muted-foreground/80",
						featured
							? "text-[0.5625rem] sm:text-[0.625rem] md:text-[0.6875rem]"
							: "text-[0.5625rem] sm:text-[0.625rem]",
					)}
				>
					{label}
				</div>
			))}
		</div>
	);
}

function BrowserRunUseCaseBentoCard({
	icon: Icon,
	title,
	description,
	featured = false,
	accentLabels,
	accentCols,
}: {
	icon: Icon;
	title: string;
	description: string;
	featured?: boolean;
	accentLabels: readonly string[];
	accentCols?: number;
}) {
	return (
		<div
			className={cn(
				"flex h-full min-w-0 flex-col",
				featured
					? "min-h-[17rem] sm:min-h-[18rem] md:min-h-full"
					: "min-h-[15rem] sm:min-h-[16rem] md:min-h-[18rem]",
			)}
		>
			<div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
				<BrowserRunUseCaseBentoAccent
					className="absolute inset-0"
					labels={accentLabels}
					cols={accentCols ?? Math.min(accentLabels.length, featured ? 3 : 2)}
					featured={featured}
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
					<div className="flex items-center gap-2.5">
						<Icon
							size={featured ? 20 : 18}
							weight="duotone"
							className="shrink-0 text-brand"
							aria-hidden="true"
						/>
						<h3
							className={cn(
								"font-semibold leading-snug text-foreground",
								featured ? "text-xl md:text-[1.375rem]" : "text-base",
							)}
						>
							{title}
						</h3>
					</div>
					<p
						className={cn(
							"leading-relaxed text-muted-foreground",
							featured
								? "mt-4 text-base md:text-[1.0625rem]"
								: "mt-2.5 text-[0.9375rem] md:text-base",
						)}
					>
						{description}
					</p>
				</div>
			</div>
		</div>
	);
}

export function BrowserRunUseCasesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Use cases"
					heading="Where CDP beats guessing coordinates."
					lead="Four patterns cover most agent-driven browsing. Each one runs in the same persistent browser session, so auth state and page context survive between tool calls."
				/>
				<div className="grid min-w-0 grid-cols-1 gap-px bg-grid-line md:grid-cols-6 md:auto-rows-[minmax(18rem,1fr)] lg:auto-rows-[minmax(20rem,1fr)]">
					{BROWSER_RUN_USE_CASES.map((useCase) => (
						<div
							key={useCase.title}
							className={cn("flex h-full min-w-0 flex-col bg-marketing-content", useCase.bentoClass)}
						>
							<BrowserRunUseCaseBentoCard
								icon={useCase.icon}
								title={useCase.title}
								description={useCase.description}
								featured={useCase.featured}
								accentLabels={useCase.accentLabels}
								accentCols={useCase.accentCols}
							/>
						</div>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Tool mosaic — unique to this page                                           */
/* -------------------------------------------------------------------------- */

const BROWSER_RUN_TOOLS: { icon: Icon; name: string; description: string }[] = [
	{
		icon: Compass,
		name: "browser_navigate",
		description: "Open a URL and wait for the page to settle before interaction.",
	},
	{
		icon: Cursor,
		name: "browser_click",
		description: "Click elements by ref, text, or coordinates from the latest snapshot.",
	},
	{
		icon: Keyboard,
		name: "browser_type",
		description: "Type into inputs and textareas, with optional fill and clear semantics.",
	},
	{
		icon: ArrowsDownUp,
		name: "browser_scroll",
		description: "Scroll the page or a specific element in any direction.",
	},
	{
		icon: Camera,
		name: "browser_screenshot",
		description: "Capture a full-page or viewport screenshot as a PNG.",
	},
	{
		icon: Article,
		name: "browser_markdown",
		description: "Extract the rendered page as clean Markdown after JavaScript runs.",
	},
	{
		icon: Code,
		name: "browser_content",
		description: "Pull fully rendered HTML content from the live DOM.",
	},
	{
		icon: FilePdf,
		name: "browser_pdf",
		description: "Generate a PDF of the page with the same cloud browser session.",
	},
];

function BrowserRunToolCard({
	icon: Icon,
	name,
	description,
}: {
	icon: Icon;
	name: string;
	description: string;
}) {
	return (
		<div className={cn(marketingGridCellClass, "flex h-full flex-col bg-marketing-content !py-5 md:!py-6")}>
			<Icon size={22} weight="duotone" className="mb-4 shrink-0 text-brand" aria-hidden="true" />
			<code className="mb-3 font-mono text-sm text-foreground">{name}</code>
			<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{description}
			</p>
		</div>
	);
}

export function BrowserRunToolMosaic() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="MCP tools"
					heading="Eight browser tools, one session, every surface."
					lead="The same tool names in the CLI and VS Code extension. Your agent calls them over MCP while you stay in Plan or Act mode, and every call runs in the same cloud browser session."
				/>
				<div className="grid grid-cols-2 gap-px bg-grid-line md:grid-cols-3 lg:grid-cols-4">
					{BROWSER_RUN_TOOLS.map((tool) => (
						<BrowserRunToolCard
							key={tool.name}
							icon={tool.icon}
							name={tool.name}
							description={tool.description}
						/>
					))}
				</div>
				<div className={cn(marketingGridCellClass, "flex items-center gap-3 border-t border-t-dotted border-grid-line !py-5 md:!py-6")}>
					<span className="font-stat text-[0.625rem] uppercase tracking-[0.1em] text-brand">
						One endpoint
					</span>
					<div className="h-px flex-1 bg-grid-line" aria-hidden="true" />
					<span className="font-stat text-[0.625rem] tabular-nums tracking-[0.1em] text-muted-foreground">
						api.trumbo.dev/v1/mcp
					</span>
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Benchmark — sourced comparison table                                          */
/* -------------------------------------------------------------------------- */

const BROWSER_RUN_BENCHMARK_COLUMNS = [
	{ name: "Trumbo Browser Run", featured: true },
	{ name: "Playwright local" },
	{ name: "Vision agents (Computer Use)" },
] as const;

const BROWSER_RUN_BENCHMARK_ROWS = [
	{
		label: "Common-task reliability",
		values: ["~92% (CDP cited)", "~98% hand-written", "~75-78% vision"],
	},
	{
		label: "Per-action latency",
		values: ["Sub-100ms", "Sub-100ms", "Seconds"],
	},
	{
		label: "Session persistence",
		values: ["DO keepalive", "Per process", "Varies"],
	},
	{
		label: "Setup required",
		values: ["None (cloud)", "Local Chrome", "API keys"],
	},
] as const;

export function BrowserRunBenchmarkSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Benchmark"
					heading="CDP beats vision for repeatable agent tasks."
					lead="Hand-written Playwright still wins on scripted flows you control end to end. For agent-driven browsing, CDP tool calls land closer to that bar than vision-based Computer Use, with less setup and faster per-action latency."
				/>
				<MarketingComparisonTable
					idPrefix="browser-run"
					columns={BROWSER_RUN_BENCHMARK_COLUMNS}
					rows={BROWSER_RUN_BENCHMARK_ROWS}
				/>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Architecture — Trumbo Browser Host lifecycle diagram                          */
/* -------------------------------------------------------------------------- */

function BrowserRunLifecycleDiagram() {
	const W = 130;
	const H = 34;
	const RX = 6;
	const topY = 60;
	const bottomY = 170;

	const topNodes = [
		{ label: "Launch", index: 1, x: 95, y: topY },
		{ label: "CDP connect", index: 2, x: 265, y: topY },
		{ label: "Navigate", index: 3, x: 435, y: topY, accent: true },
	];

	const bottomNodes = [
		{ label: "Screenshot", index: 4, x: 435, y: bottomY, accent: true },
		{ label: "Keepalive", index: 5, x: 265, y: bottomY },
		{ label: "Close", index: 6, x: 95, y: bottomY },
	];

	const allNodes = [...topNodes, ...bottomNodes];
	const accentSet = new Set([3, 4]);

	return (
		<div className="border-t border-t-dotted border-grid-line bg-marketing-content px-5 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
			<svg viewBox="0 0 560 220" className="w-full text-foreground" fill="none" aria-hidden="true">
				<defs>
					<marker
						id="br-arrow"
						markerWidth="7"
						markerHeight="7"
						refX="5"
						refY="3.5"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<path d="M0,0.5 L6,3.5 L0,6.5 Z" fill="currentColor" opacity="0.55" />
					</marker>
					<marker
						id="br-arrow-brand"
						markerWidth="7"
						markerHeight="7"
						refX="5"
						refY="3.5"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<path d="M0,0.5 L6,3.5 L0,6.5 Z" fill="var(--brand)" />
					</marker>
				</defs>

				{/* top row connectors (left to right) */}
				{topNodes.slice(0, -1).map((node, i) => {
					const next = topNodes[i + 1];
					if (!next) return null;
					const isAccent = next.index === 3;
					return (
						<path
							key={`top-${i}`}
							d={`M ${node.x + W / 2} ${node.y} L ${next.x - W / 2} ${next.y}`}
							stroke={isAccent ? "var(--brand)" : "currentColor"}
							strokeWidth={isAccent ? 1.5 : 1}
							opacity={isAccent ? 0.9 : 0.5}
							markerEnd={`url(#${isAccent ? "br-arrow-brand" : "br-arrow"})`}
						/>
					);
				})}

				{/* right curve: Navigate -> Screenshot (brand) */}
				<path
					d={`M ${topNodes[2].x} ${topY + H / 2} C ${topNodes[2].x + 44} ${topY + H / 2}, ${topNodes[2].x + 44} ${bottomY - H / 2}, ${bottomNodes[0].x} ${bottomY - H / 2}`}
					stroke="var(--brand)"
					strokeWidth="1.5"
					opacity="0.9"
					markerEnd="url(#br-arrow-brand)"
				/>

				{/* bottom row connectors (right to left) */}
				{bottomNodes.slice(0, -1).map((node, i) => {
					const next = bottomNodes[i + 1];
					if (!next) return null;
					return (
						<path
							key={`bottom-${i}`}
							d={`M ${node.x - W / 2} ${node.y} L ${next.x + W / 2} ${next.y}`}
							stroke="currentColor"
							strokeWidth="1"
							opacity="0.5"
							markerEnd="url(#br-arrow)"
						/>
					);
				})}

				{/* left curve: Close -> Launch (cycle close) */}
				<path
					d={`M ${bottomNodes[2].x} ${bottomY - H / 2} C ${bottomNodes[2].x - 60} ${bottomY - H / 2}, ${bottomNodes[2].x - 60} ${topY + H / 2}, ${topNodes[0].x} ${topY + H / 2}`}
					stroke="currentColor"
					strokeWidth="1"
					opacity="0.5"
					markerEnd="url(#br-arrow)"
				/>

				{/* keepalive loop: Keepalive -> Navigate (dashed brand) */}
				<path
					d={`M ${bottomNodes[1].x} ${bottomY - H / 2} C ${bottomNodes[1].x + 90} ${bottomY - H / 2 - 44}, ${topNodes[2].x - 44} ${topY + H / 2 + 44}, ${topNodes[2].x} ${topY + H / 2}`}
					stroke="var(--brand)"
					strokeWidth="1.25"
					strokeDasharray="4 3"
					opacity="0.65"
					markerEnd="url(#br-arrow-brand)"
				/>

				{/* center label */}
				<text
					x={265}
					y={117}
					textAnchor="middle"
					fontSize="8"
					fontFamily="var(--font-stat)"
					letterSpacing="1.5"
					fill="var(--color-muted-foreground)"
					stroke="none"
					opacity="0.5"
				>
					BROWSER HOST
				</text>

				{/* nodes */}
				{allNodes.map((node) => {
					const isAccent = accentSet.has(node.index);
					return (
						<g key={node.label}>
							<rect
								x={node.x - W / 2}
								y={node.y - H / 2}
								width={W}
								height={H}
								rx={RX}
								fill="var(--marketing-content)"
								stroke={isAccent ? "var(--brand)" : "currentColor"}
								strokeWidth={isAccent ? 1.25 : 1}
								opacity={isAccent ? 1 : 0.85}
							/>
							<text
								x={node.x}
								y={node.y + 4}
								textAnchor="middle"
								fontSize="10"
								fontFamily="var(--font-stat)"
								fontWeight="500"
								fill="currentColor"
								stroke="none"
							>
								{String(node.index).padStart(2, "0")} {node.label}
							</text>
						</g>
					);
				})}
			</svg>

			<div className="mt-6 flex justify-center pt-5 font-stat text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground md:text-xs">
				Fig. 01: Trumbo Browser Host lifecycle
			</div>

			<div className="mt-8 border-t border-t-dotted border-grid-line pt-6">
				<div className="grid grid-cols-1 gap-y-3 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-6 md:gap-y-4">
					<span className="font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground md:text-xs">
						URL
					</span>
					<p className="font-stat text-[0.8125rem] leading-relaxed text-foreground md:text-sm">
						https://docs.stripe.com/api/prices
					</p>

					<span className="font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground md:text-xs">
						Tool
					</span>
					<code className="font-mono text-[0.8125rem] text-foreground md:text-sm">
						browser_markdown(url)
					</code>

					<span className="font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground md:text-xs">
						Result
					</span>
					<p className="font-stat text-[0.8125rem] leading-relaxed text-foreground md:text-sm">
						Pricing API reference returned as Markdown with headings, code blocks, and anchor
						links preserved. The agent cites the page in its answer without re-scraping on the
						next turn.
					</p>
				</div>
			</div>
		</div>
	);
}

export function BrowserRunArchitectureSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Architecture</p>
				<h2 className="max-w-6xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					One Trumbo Browser Host per browser session. A keepalive alarm keeps it alive.
				</h2>
				<p className="mt-4 max-w-6xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Each browser session lives in a Trumbo Browser Host. Launch spins up
					Chromium, CDP connect attaches the agent, and Navigate and Screenshot drive the
					page. A keepalive alarm re-enters the interaction loop between tool calls so cookies
					and DOM state survive long reasoning steps. Close settles the session when the run
					is done.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<BrowserRunLifecycleDiagram />
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* CTA                                                                         */
/* -------------------------------------------------------------------------- */

export function BrowserRunCtaSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<MarketingCtaRow
					copy="Browser Run is included on Pro, Max, and Ultra. Spin up a cloud session from the CLI or VS Code, or call the same MCP tools from your own agent over api.trumbo.dev."
					secondaryLabel="Local browser tools"
					secondaryHref="/agent#browser"
				/>
			</GridBoxCell>
		</GridBox>
	);
}
