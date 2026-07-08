import {
	Brain,
	Crosshair,
	Graph,
	Lightbulb,
	ListChecks,
	Stack,
	Waves,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { TRUMBO_LOGO_MARK } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Quartz page — research brief aesthetic.
 * Editorial, paper-like, with hand-drafted SVG diagrams.
 * Distinct from Agent's bento-mosaic: numbered sections, pipeline diagrams,
 * adaptive computation curve, monospace spec table.
 */

const specKeyClass =
	"font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground md:text-xs";
const specValueClass =
	"font-stat text-[0.8125rem] tabular-nums text-foreground md:text-sm";

/* -------------------------------------------------------------------------- */
/* Hero — abstract + execution graph diagram                                   */
/* -------------------------------------------------------------------------- */

export function QuartzHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">
				<span>Quartz 1.0</span>
				<span className="marketing-kicker-sep" aria-hidden="true" />
				<span>Technical brief</span>
			</p>
			<h1 className="marketing-hero-heading mb-7 max-w-5xl">
				Trumbo Quartz
			</h1>
			<p className="mb-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
				Quartz 1.0 ships as two models on one architecture. Quartz Hyper pushes maximum
				reasoning depth for the hardest work. Quartz Lite keeps the same adaptive stack
				fast and economical for everyday agent loops. Both build a per-request execution
				graph that adjusts depth, memory, and verification in flight.
			</p>
			<p className="max-w-5xl text-base leading-relaxed text-muted-foreground md:max-w-6xl md:text-lg lg:text-[1.25rem] lg:leading-[1.65]">
				Route Hyper when the problem demands frontier-level reasoning. Route Lite when
				latency, volume, and cost matter more than maximum depth. The CLI and platform
				pick the right variant for the task, or you choose explicitly.
			</p>
		</div>
	);
}

export function QuartzHeroDiagram() {
	return (
		<div className="flex min-h-96 w-full flex-col overflow-hidden border-y border-y-dotted border-grid-line bg-marketing-content md:min-h-[28rem] lg:min-h-[32rem]">
			<div className="relative min-h-0 flex-1 overflow-hidden">
				<QuartzExecutionGraph className="absolute inset-0 h-full w-full" />
			</div>
			<div className="flex shrink-0 justify-center pt-10 pb-4 font-stat text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground md:pt-14 md:pb-5 md:text-xs">
				Fig. 01 — Adaptive execution graph (per request)
			</div>
		</div>
	);
}

/**
 * Hand-drafted DAG of the cognitive subsystems.
 * Reads as a research figure, not a marketing card.
 */
function QuartzExecutionGraph({ className }: { className?: string }) {
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
					id="qgraph-arrow"
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
					id="qgraph-arrow-brand"
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

			{/* standard edges — forward inference flow */}
			<g stroke="currentColor" strokeWidth="0.9" opacity="0.5">
				{/* Request → Semantic */}
				<path d="M 110 170 C 160 170, 170 80, 180 80" markerEnd="url(#qgraph-arrow)" />
				{/* Semantic → Intent (decomposition feeds intent graph) */}
				<path d="M 220 98 C 240 98, 240 242, 220 242" markerEnd="url(#qgraph-arrow)" />
				{/* Intent → Planner (intent graph feeds execution plan) */}
				<path d="M 260 260 C 320 260, 330 80, 350 80" markerEnd="url(#qgraph-arrow)" />
				{/* Planner → Memory (allocate working memory) */}
				<path d="M 390 98 C 410 98, 410 242, 390 242" markerEnd="url(#qgraph-arrow)" />
				{/* Planner → Reasoning (dispatch reasoning engine) */}
				<path d="M 430 80 C 480 80, 490 80, 520 80" markerEnd="url(#qgraph-arrow)" />
				{/* Planner → Knowledge (set retrieval requirements) */}
				<path d="M 430 80 C 480 80, 490 170, 520 170" markerEnd="url(#qgraph-arrow)" />
				{/* Memory → Reasoning (working memory supports reasoning) */}
				<path d="M 430 260 C 480 260, 490 80, 520 80" markerEnd="url(#qgraph-arrow)" />
				{/* Knowledge → Confidence (knowledge contributes to confidence) */}
				<path d="M 560 188 C 580 188, 580 242, 560 242" markerEnd="url(#qgraph-arrow)" />
				{/* Reasoning → Verify (reasoning outputs go to verification) */}
				<path d="M 600 80 C 650 80, 660 80, 690 80" markerEnd="url(#qgraph-arrow)" />
				{/* Confidence → Verify (confidence signal feeds verification) */}
				<path d="M 600 260 C 650 260, 660 80, 690 80" markerEnd="url(#qgraph-arrow)" />
				{/* Verify → Reflect (verification triggers reflection) */}
				<path d="M 730 98 C 750 98, 750 152, 730 152" markerEnd="url(#qgraph-arrow)" />
			</g>

			{/* brand accent edges — verified reasoning → synthesis → response */}
			<g stroke="var(--brand)" strokeWidth="1.1" opacity="0.8">
				{/* Reflect → Synth. (reflected outputs feed synthesis) */}
				<path d="M 730 188 C 750 188, 750 242, 730 242" markerEnd="url(#qgraph-arrow-brand)" />
				{/* Synth. → Response (final synthesized response) */}
				<path d="M 770 260 C 805 260, 805 170, 800 170" markerEnd="url(#qgraph-arrow-brand)" />
			</g>

			{/* brand dashed edges — feedback loops */}
			<g stroke="var(--brand)" strokeWidth="1" strokeDasharray="4 3" opacity="0.65">
				{/* Reflect → Reasoning (reflection recomputes inconsistent branches) */}
				<path d="M 690 170 C 640 170, 640 80, 600 80" markerEnd="url(#qgraph-arrow-brand)" />
				{/* Confidence → Planner (confidence feedback adjusts execution plan) */}
				<path d="M 520 260 C 470 260, 470 80, 430 80" markerEnd="url(#qgraph-arrow-brand)" />
			</g>

			{/* nodes */}
			<g>
				<GraphNode x={70} y={170} label="Request" sub="01" />
				<GraphNode x={220} y={80} label="Semantic" sub="02" />
				<GraphNode x={220} y={260} label="Intent" sub="03" />
				<GraphNode x={390} y={80} label="Planner" sub="04" accent />
				<GraphNode x={390} y={260} label="Memory" sub="05" />
				<GraphNode x={560} y={80} label="Reasoning" sub="06" />
				<GraphNode x={560} y={170} label="Knowledge" sub="07" />
				<GraphNode x={560} y={260} label="Confidence" sub="08" />
				<GraphNode x={730} y={80} label="Verify" sub="09" accent />
				<GraphNode x={730} y={170} label="Reflect" sub="10" accent />
				<GraphNode x={730} y={260} label="Synth." sub="11" />
				<GraphNode x={840} y={170} label="Response" sub="12" />
			</g>
		</svg>
	);
}

function GraphNode({
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

/* -------------------------------------------------------------------------- */
/* Quartz 1.0 — Hyper vs Lite                                                  */
/* -------------------------------------------------------------------------- */

type QuartzVariant = {
	id: "hyper" | "lite";
	name: string;
	tagline: string;
	featured?: boolean;
	totalParams: string;
	activeParams: string;
	summary: string;
	strengths: readonly string[];
	bestFor: readonly string[];
};

const QUARTZ_VARIANTS: QuartzVariant[] = [
	{
		id: "hyper",
		name: "Quartz Hyper",
		tagline: "Flagship reasoning",
		featured: true,
		totalParams: "1.6T",
		activeParams: "48B",
		summary:
			"Maximum reasoning depth on the Quartz architecture, with the widest active parameter budget and the deepest reflection cycles we ship. Built to match the strongest closed models on hard engineering, research, and long-horizon agent work where shallow answers are not an option.",
		strengths: [
			"Deepest reflection and verification loops",
			"Long-horizon planning and multi-step synthesis",
			"Highest confidence on novel technical problems",
		],
		bestFor: ["Research workflows", "Complex refactors", "Autonomous agent runs"],
	},
	{
		id: "lite",
		name: "Quartz Lite",
		tagline: "Fast and economical",
		totalParams: "280B",
		activeParams: "13B",
		summary:
			"The efficient default on the Quartz architecture, with a tighter depth budget tuned for speed and cost at scale. Same adaptive execution graph and verification pipeline, scaled for low latency on everyday prompts, inline edits, and agent loops that run continuously through the day.",
		strengths: [
			"Low time-to-first-token on routine tasks",
			"Lower compute per request at scale",
			"Same verification stack, tighter depth budget",
		],
		bestFor: ["Daily coding sessions", "Inline edits and search", "High-throughput routing"],
	},
];

const QUARTZ_COMPARISON_ROWS: { label: string; hyper: string; lite: string }[] = [
	{ label: "Total parameters", hyper: "1.6T", lite: "280B" },
	{ label: "Active parameters", hyper: "48B", lite: "13B" },
	{ label: "Reasoning depth", hyper: "Maximum", lite: "Task-scaled" },
	{ label: "Latency profile", hyper: "Depth-first", lite: "Speed-first" },
	{ label: "Typical routing", hyper: "Hard problems", lite: "Default agent loop" },
];

export function QuartzLineupSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">The lineup</p>
				<h2 className="max-w-5xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					One architecture. Two depth profiles.
				</h2>
				<p className="mt-4 max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Quartz Hyper and Quartz Lite share the full inference stack, from semantic
					decomposition through verification. Hyper allocates a larger active parameter
					budget and longer reflection cycles for frontier work. Lite keeps the same graph,
					with a tighter depth cap so high-volume prompts and agent loops stay fast and
					economical.
				</p>
			</GridBoxCell>

			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-2">
					{QUARTZ_VARIANTS.map((variant, index) => (
						<QuartzVariantColumn
							key={variant.id}
							variant={variant}
							isLast={index === QUARTZ_VARIANTS.length - 1}
						/>
					))}
				</div>
			</GridBoxCell>

			<GridBoxCell className="!border-r-0 !p-0">
				<div className="border-t border-t-dotted border-grid-line">
					<div
						className={cn(
							marketingGridCellClass,
							"hidden gap-6 !py-5 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:!py-6",
						)}
					>
						<span className={specKeyClass}>Side by side</span>
						<span className={cn(specKeyClass, "md:text-right")}>Quartz Hyper</span>
						<span className={cn(specKeyClass, "md:text-right")}>Quartz Lite</span>
					</div>
					<div className={cn(marketingGridCellClass, "border-t border-t-dotted border-grid-line !py-5 md:hidden")}>
						<p className={specKeyClass}>Side by side</p>
					</div>
					{QUARTZ_COMPARISON_ROWS.map((row, index) => (
						<QuartzComparisonRow
							key={row.label}
							label={row.label}
							hyper={row.hyper}
							lite={row.lite}
							index={index}
							total={QUARTZ_COMPARISON_ROWS.length}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function QuartzVariantColumn({
	variant,
	isLast,
}: {
	variant: QuartzVariant;
	isLast: boolean;
}) {
	return (
		<div
			className={cn(
				marketingGridCellClass,
				"flex flex-col !py-8 md:!py-10",
				!isLast && "border-b border-b-dotted border-grid-line md:border-b-0 md:border-r md:border-r-dotted md:border-grid-line",
			)}
		>
			<div className="flex min-h-[1.125rem] items-center gap-3.5">
				<h3 className="font-heading text-xl font-semibold leading-none text-foreground md:text-2xl">
					{variant.name}
				</h3>
				{variant.featured ? (
					<span className="font-stat inline-flex h-[1.125rem] shrink-0 items-center rounded-full border border-brand/40 bg-brand/10 px-2.5 text-[0.5625rem] font-medium uppercase leading-none tracking-[0.08em] text-brand">
						Flagship
					</span>
				) : null}
			</div>
			<p className="font-stat mt-3 text-xs uppercase tracking-[0.08em] text-muted-foreground">
				{variant.tagline}
			</p>

			<div className="mt-6 flex flex-col gap-2.5 border-y border-y-dotted border-grid-line py-4">
				<div className="flex items-center justify-between gap-4">
					<span className={specKeyClass}>Total params</span>
					<span className={specValueClass}>{variant.totalParams}</span>
				</div>
				<div className="flex items-center justify-between gap-4">
					<span className={specKeyClass}>Active params</span>
					<span className={specValueClass}>{variant.activeParams}</span>
				</div>
			</div>

			<p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{variant.summary}
			</p>

			<div className="mt-6 flex items-center gap-3">
				<span className={specKeyClass}>Strengths</span>
				<div className="h-px flex-1 bg-grid-line" />
			</div>
			<ul className="mt-4 flex flex-col gap-2.5">
				{variant.strengths.map((item) => (
					<li
						key={item}
						className="flex gap-2.5 text-sm leading-relaxed text-foreground md:text-[0.9375rem]"
					>
						<span className="marketing-feature-dash mt-2 shrink-0 bg-brand" aria-hidden="true" />
						<span>{item}</span>
					</li>
				))}
			</ul>

			<div className="mt-6 flex items-center gap-3">
				<span className={specKeyClass}>Best for</span>
				<div className="h-px flex-1 bg-grid-line" />
			</div>
			<ul className="mt-4 flex flex-col gap-2">
				{variant.bestFor.map((item) => (
					<li
						key={item}
						className="font-stat text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground md:text-[0.8125rem]"
					>
						{item}
					</li>
				))}
			</ul>
		</div>
	);
}

function QuartzComparisonRow({
	label,
	hyper,
	lite,
	index,
	total,
}: {
	label: string;
	hyper: string;
	lite: string;
	index: number;
	total: number;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-6 md:px-8 md:py-5 lg:px-10",
				index < total - 1 && "border-b border-b-dotted border-grid-line",
			)}
		>
			<span className={specKeyClass}>{label}</span>
			<span className={cn(specValueClass, "md:text-right")}>{hyper}</span>
			<span className={cn(specValueClass, "md:text-right")}>{lite}</span>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Pipeline — multi-stage inference flow                                       */
/* -------------------------------------------------------------------------- */

export function QuartzPipelineSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Multi-stage inference</p>
				<h2 className="max-w-6xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					Nine adaptive stages. The number of iterations depends entirely on problem complexity.
				</h2>
				<p className="mt-4 max-w-6xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Simple requests complete after a single reasoning cycle. Complex engineering and
					research tasks may run dozens of internal refinement iterations, with reflection
					and verification recomputing branches until confidence meets the target threshold
					before synthesis.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<QuartzPipelineDiagram />
			</GridBoxCell>
		</GridBox>
	);
}

function QuartzPipelineDiagram() {
	const W = 112;
	const H = 32;
	const RX = 6;
	const topY = 50;
	const bottomY = 170;

	const topNodes = [
		{ label: "Understand", index: 1, x: 76, y: topY },
		{ label: "Represent", index: 2, x: 204, y: topY },
		{ label: "Plan", index: 3, x: 332, y: topY },
		{ label: "Reason", index: 4, x: 460, y: topY },
		{ label: "Evaluate", index: 5, x: 588, y: topY },
	];

	const bottomNodes = [
		{ label: "Reflect", index: 6, x: 588, y: bottomY },
		{ label: "Verify", index: 7, x: 460, y: bottomY },
		{ label: "Synthesize", index: 8, x: 332, y: bottomY },
		{ label: "Respond", index: 9, x: 204, y: bottomY },
	];

	const allNodes = [...topNodes, ...bottomNodes];
	const reflectionSet = new Set([4, 5, 6]); // Reason, Evaluate, Reflect

	return (
		<div className="border-t border-t-dotted border-grid-line bg-marketing-content px-5 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
			<svg viewBox="0 0 660 220" className="w-full text-foreground" fill="none" aria-hidden="true">
				<defs>
					<marker
						id="qpipe-arrow"
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
						id="qpipe-arrow-brand"
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

				{/* top row connectors (left → right) */}
				{topNodes.slice(0, -1).map((node, i) => {
					const next = topNodes[i + 1];
					const isReflection = node.index === 4; // Reason → Evaluate
					return (
						<path
							key={`top-${i}`}
							d={`M ${node.x + W / 2} ${node.y} L ${next.x - W / 2} ${next.y}`}
							stroke={isReflection ? "var(--brand)" : "currentColor"}
							strokeWidth={isReflection ? 1.5 : 1}
							opacity={isReflection ? 0.9 : 0.5}
							markerEnd={`url(#${isReflection ? "qpipe-arrow-brand" : "qpipe-arrow"})`}
						/>
					);
				})}

				{/* right curve: Evaluate → Reflect (brand) */}
				<path
					d={`M ${topNodes[4].x} ${topY + H / 2} C ${topNodes[4].x + 40} ${topY + H / 2}, ${topNodes[4].x + 40} ${bottomY - H / 2}, ${bottomNodes[0].x} ${bottomY - H / 2}`}
					stroke="var(--brand)"
					strokeWidth="1.5"
					opacity="0.9"
					markerEnd="url(#qpipe-arrow-brand)"
				/>

				{/* bottom row connectors (right → left) */}
				{bottomNodes.slice(0, -1).map((node, i) => {
					const next = bottomNodes[i + 1];
					return (
						<path
							key={`bottom-${i}`}
							d={`M ${node.x - W / 2} ${node.y} L ${next.x + W / 2} ${next.y}`}
							stroke="currentColor"
							strokeWidth="1"
							opacity="0.5"
							markerEnd="url(#qpipe-arrow)"
						/>
					);
				})}

				{/* left curve: Respond → Understand (cycle close) */}
				<path
					d={`M ${bottomNodes[3].x} ${bottomY - H / 2} C ${bottomNodes[3].x - 60} ${bottomY - H / 2}, ${bottomNodes[3].x - 60} ${topY + H / 2}, ${topNodes[0].x} ${topY + H / 2}`}
					stroke="currentColor"
					strokeWidth="1"
					opacity="0.5"
					markerEnd="url(#qpipe-arrow)"
				/>

				{/* reflection loop: Reflect → Reason (dashed brand) */}
				<path
					d={`M ${bottomNodes[0].x} ${bottomY - H / 2} C ${bottomNodes[0].x - 60} ${bottomY - H / 2 - 20}, ${topNodes[3].x + 40} ${topY + H / 2 + 20}, ${topNodes[3].x} ${topY + H / 2}`}
					stroke="var(--brand)"
					strokeWidth="1.25"
					strokeDasharray="4 3"
					opacity="0.65"
					markerEnd="url(#qpipe-arrow-brand)"
				/>

				{/* center label */}
				<text
					x={332}
					y={112}
					textAnchor="middle"
					fontSize="8"
					fontFamily="var(--font-stat)"
					letterSpacing="1.5"
					fill="var(--color-muted-foreground)"
					stroke="none"
					opacity="0.5"
				>
					ADAPTIVE CYCLE
				</text>

				{/* nodes */}
				{allNodes.map((node) => {
					const isReflection = reflectionSet.has(node.index);
					return (
						<g key={node.label}>
							<rect
								x={node.x - W / 2}
								y={node.y - H / 2}
								width={W}
								height={H}
								rx={RX}
								fill="var(--marketing-content)"
								stroke={isReflection ? "var(--brand)" : "currentColor"}
								strokeWidth={isReflection ? 1.25 : 1}
								opacity={isReflection ? 1 : 0.85}
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

			<div className="mt-6 flex items-center gap-3 pt-5">
				<span className="font-stat text-[0.625rem] uppercase tracking-[0.1em] text-brand">
					Reflection loop
				</span>
				<div className="h-px flex-1 bg-grid-line" />
				<span className="font-stat text-[0.625rem] tabular-nums tracking-[0.1em] text-muted-foreground">
					Evaluate → Reflect → Reason
				</span>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Numbered research sections — architecture subsystems                        */
/* -------------------------------------------------------------------------- */

const QUARTZ_SUBSYSTEMS: {
	icon: Icon;
	title: string;
	summary: string;
	bullets: readonly string[];
}[] = [
	{
		icon: Graph,
		title: "Semantic understanding",
		summary:
			"Natural language is decomposed into a structured semantic representation before reasoning begins.",
		bullets: [
			"Primary and implicit objectives",
			"Task category and domain classification",
			"Uncertainty estimation and execution budget",
		],
	},
	{
		icon: Brain,
		title: "Intent graph construction",
		summary:
			"A contextual graph describes relationships between concepts rather than storing linear history.",
		bullets: [
			"Objectives, assumptions, variables, constraints",
			"Edges describe dependencies between entities",
			"Reasoning operates over concepts, not token positions",
		],
	},
	{
		icon: Stack,
		title: "Adaptive execution planner",
		summary:
			"An execution strategy is generated before reasoning begins and continuously updated through inference.",
		bullets: [
			"Reasoning depth and computational allocation",
			"Decomposition strategy and verification frequency",
			"Planning horizon and confidence targets",
		],
	},
	{
		icon: Lightbulb,
		title: "Hierarchical reasoning engine",
		summary:
			"Complex objectives are recursively decomposed and continuously re-synthesized at higher levels.",
		bullets: [
			"Deductive, inductive, abductive, causal strategies",
			"Recursive decomposition and constraint propagation",
			"Strategy may switch multiple times per session",
		],
	},
	{
		icon: Waves,
		title: "Dynamic working memory",
		summary:
			"Structured memory independent of conversation history, with temporal lifetimes per object.",
		bullets: [
			"Active entities, variables, intermediate conclusions",
			"Low-value information decays; critical concepts persist",
			"Reduces context fragmentation on long sessions",
		],
	},
	{
		icon: Crosshair,
		title: "Verification & reflection",
		summary:
			"An independent computational phase. Outputs are checked against objective correctness metrics.",
		bullets: [
			"Logical, computational, structural, execution checks",
			"Reflection recomputes inconsistent reasoning branches",
			"Only verified reasoning progresses to synthesis",
		],
	},
];

export function QuartzArchitectureSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Architecture</p>
				<h2 className="max-w-5xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					Six tightly integrated cognitive subsystems inside one inference engine.
				</h2>
				<p className="mt-4 max-w-4xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Inference is represented internally as a directed computational graph rather than a
					single sequential forward pass. Each graph is generated independently for every request.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1">
					{QUARTZ_SUBSYSTEMS.map((subsystem, index) => (
						<QuartzSubsystemRow key={subsystem.title} index={index} {...subsystem} />
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function QuartzSubsystemRow({
	icon: Icon,
	index,
	title,
	summary,
	bullets,
}: {
	icon: Icon;
	index: number;
	title: string;
	summary: string;
	bullets: readonly string[];
}) {
	const total = QUARTZ_SUBSYSTEMS.length;
	const isLast = index === total - 1;

	return (
		<div
			className={cn(
				marketingGridCellClass,
				"flex flex-col",
				!isLast && "border-b border-b-dotted border-grid-line",
			)}
		>
			<div className="mb-5 flex items-center gap-3">
				<span className="font-stat text-[0.6875rem] tabular-nums tracking-[0.1em] text-muted-foreground">
					{String(index + 1).padStart(2, "0")}
				</span>
				<div className="h-px flex-1 bg-grid-line" />
				<Icon size={18} weight="duotone" className="shrink-0 text-brand" aria-hidden="true" />
			</div>
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
				<div className="md:max-w-md md:flex-1">
					<h3 className="mb-3 text-lg font-semibold leading-snug text-foreground md:text-xl">
						{title}
					</h3>
					<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
						{summary}
					</p>
				</div>
				<ul className="flex flex-col gap-2 md:flex-1 md:gap-2.5">
					{bullets.map((bullet) => (
						<li
							key={bullet}
							className="flex gap-2 font-stat text-[0.75rem] leading-relaxed text-muted-foreground md:text-[0.8125rem]"
						>
							<span className="mt-2 h-px w-3 shrink-0 bg-grid-line" aria-hidden="true" />
							<span>{bullet}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Adaptive computation — compute scales with complexity                       */
/* -------------------------------------------------------------------------- */

export function QuartzAdaptiveSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-2">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center",
					"md:!border-r md:!border-r-dotted md:!border-grid-line",
				)}
			>
				<p className="marketing-kicker mb-4">Adaptive computation</p>
				<h2 className="max-w-3xl font-heading text-[1.5rem] font-normal leading-[1.35] tracking-[-0.02em] text-foreground md:text-[1.75rem] lg:text-[2rem]">
					Compute scales with difficulty, not prompt length.
				</h2>
				<p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Lightweight for casual chat. Deeper for engineering and science. Confidence drives the depth.
				</p>
				<div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
					<div className="flex flex-col">
						<span className={specKeyClass}>Low confidence</span>
						<span className={cn(specValueClass, "mt-1")}>→ more compute</span>
					</div>
					<div className="flex flex-col">
						<span className={specKeyClass}>High confidence</span>
						<span className={cn(specValueClass, "mt-1")}>→ faster response</span>
					</div>
				</div>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<QuartzAdaptiveCurve />
			</GridBoxCell>
		</GridBox>
	);
}

function QuartzAdaptiveCurve() {
	// Each tier shows the sequence of activated reasoning stages.
	// Repeated stages (e.g. "rea" ×3) represent iterative refinement.
	// Bar length = total compute. Reflection stages highlighted in brand green.
	const TIERS = [
		{ label: "Simple", stages: ["und", "pln", "syn"] },
		{ label: "Moderate", stages: ["und", "pln", "rea", "syn"] },
		{
			label: "Engineering",
			stages: ["und", "pln", "rea", "rea", "evl", "ver", "syn"],
		},
		{
			label: "Research",
			stages: ["und", "pln", "rea", "rea", "rea", "evl", "evl", "ver", "ver", "syn"],
		},
	] as const;

	const STAGE_LABELS: Record<string, string> = {
		und: "Und",
		pln: "Pln",
		rea: "Rea",
		evl: "Evl",
		ver: "Ver",
		syn: "Syn",
	};

	const REFLECTION_STAGES = new Set(["rea", "evl", "ver"]);

	return (
		<div className="flex h-full min-h-72 flex-col bg-marketing-content px-5 py-8 md:min-h-80 md:px-8 md:py-10 lg:px-10 lg:py-12">
			<div className="mb-5 flex items-baseline justify-between">
				<span className={specKeyClass}>Compute allocation by stage</span>
				<span className="font-stat text-[0.625rem] tabular-nums tracking-[0.1em] text-muted-foreground">
					Fig. 02
				</span>
			</div>

			{/* Bars — one per complexity tier */}
			<div className="flex flex-1 flex-col justify-center gap-4 md:gap-5">
				{TIERS.map((tier) => (
					<div key={tier.label} className="flex items-center gap-3">
						<span
							className={cn(
								"w-20 shrink-0 font-stat text-[0.625rem] uppercase tracking-[0.08em] md:w-24 md:text-[0.6875rem]",
								tier.label === "Research" ? "text-brand" : "text-muted-foreground",
							)}
						>
							{tier.label}
						</span>
						<div className="flex flex-1 flex-wrap gap-px">
							{tier.stages.map((stage, i) => (
								<div
									key={`${stage}-${i}`}
									className={cn(
										"flex h-7 items-center justify-center border px-1 md:h-8 md:px-1.5",
										REFLECTION_STAGES.has(stage)
											? "border-brand/40 bg-brand/12"
											: "border-grid-line bg-muted/25",
									)}
								>
									<span className="font-stat text-[0.5rem] uppercase tracking-[0.04em] text-muted-foreground md:text-[0.5625rem]">
										{STAGE_LABELS[stage]}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Legend */}
			<div className="mt-6 flex flex-wrap items-center gap-4 border-t border-dotted border-grid-line pt-4">
				<div className="flex items-center gap-2">
					<div className="flex h-5 w-6 items-center justify-center border border-brand/40 bg-brand/12">
						<span className="font-stat text-[0.5rem] uppercase text-muted-foreground">Rea</span>
					</div>
					<span className={specKeyClass}>Reflection stages</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex h-5 w-6 items-center justify-center border border-grid-line bg-muted/25">
						<span className="font-stat text-[0.5rem] uppercase text-muted-foreground">Und</span>
					</div>
					<span className={specKeyClass}>Standard stages</span>
				</div>
				<div className="ml-auto">
					<span className={specKeyClass}>Bar length = total compute</span>
				</div>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Specifications — research-style key/value table                             */
/* -------------------------------------------------------------------------- */

const QUARTZ_SPECS: { specKey: string; value: string; note?: string }[] = [
	{ specKey: "release", value: "Quartz 1.0", note: "Hyper + Lite" },
	{ specKey: "model.class", value: "Adaptive compound reasoning" },
	{ specKey: "inference.path", value: "Directed execution graph", note: "per request" },
	{ specKey: "reasoning.depth", value: "Dynamic, complexity-scaled" },
	{ specKey: "reasoning.strategies", value: "Deductive · Inductive · Abductive · Causal" },
	{ specKey: "context.format", value: "Semantic knowledge graph" },
	{ specKey: "memory.model", value: "Structured working memory", note: "temporal lifetimes" },
	{ specKey: "verification", value: "Independent phase", note: "logical · computational · structural" },
	{ specKey: "confidence.signal", value: "Convergence · certainty · verification success" },
	{ specKey: "context.retrieval", value: "Semantic similarity + dependency graph" },
	{ specKey: "long_horizon", value: "Persistent reasoning across checkpoints" },
	{ specKey: "synthesis", value: "Multi-candidate, verified artifacts unified" },
	{ specKey: "workloads", value: "Conversation → engineering → research" },
];

export function QuartzSpecsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Specifications</p>
				<h2 className="max-w-5xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					A reference for what the engine actually does at each stage of inference.
				</h2>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-2">
					{QUARTZ_SPECS.map((spec, index) => (
						<QuartzSpecRow
							key={spec.specKey}
							specKey={spec.specKey}
							value={spec.value}
							note={spec.note}
							index={index}
							total={QUARTZ_SPECS.length}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function QuartzSpecRow({
	specKey,
	value,
	note,
	index,
	total,
}: {
	specKey: string;
	value: string;
	note?: string;
	index: number;
	total: number;
}) {
	const isLastRowMd = index >= total - 2;
	const isRightColMd = (index + 1) % 2 === 0;

	return (
		<div
			className={cn(
				"flex flex-col gap-1 px-5 py-4 md:px-8 md:py-5 lg:px-10 lg:py-6",
				"border-b border-b-dotted border-grid-line",
				!isLastRowMd && "md:border-b md:border-b-dotted",
				isLastRowMd && "md:border-b-0",
				!isRightColMd && "md:border-r md:border-r-dotted",
				index === total - 1 && "border-b-0",
			)}
		>
			<span className={specKeyClass}>{specKey}</span>
			<span className={specValueClass}>{value}</span>
			{note ? (
				<span className="font-stat text-[0.6875rem] tracking-[0.04em] text-muted-foreground/80">
					{note}
				</span>
			) : null}
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Design philosophy pull-quote                                                */
/* -------------------------------------------------------------------------- */

export function QuartzPhilosophySection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center !py-10 md:!py-14 lg:!py-16",
				)}
			>
				<p className="marketing-kicker mb-5">From the team</p>
				<blockquote className="max-w-5xl font-heading text-[1.5rem] font-normal leading-[1.4] tracking-[-0.01em] text-foreground md:text-[1.875rem] lg:text-[2.25rem] lg:leading-[1.35]">
					“We didn't want another model that guesses and hopes. Quartz plans before it thinks,
					verifies before it answers, and loops back when something doesn't hold up. The
					diagram above looks complex, but it's just honesty. Every box is a real decision
					the model makes on every request.”
				</blockquote>
				<p className="mt-5 flex items-center gap-2 font-stat text-sm uppercase tracking-[0.08em] text-muted-foreground">
					<img
						src={TRUMBO_LOGO_MARK}
						alt=""
						className="h-3.5 w-auto opacity-70"
						decoding="async"
					/>
					Shubhankar Kahali (CEO & Co-Founder)
				</p>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Capability strip — shared with Agent grid aesthetic                         */
/* -------------------------------------------------------------------------- */

const QUARTZ_CAPABILITIES: { icon: Icon; title: string; description: string }[] = [
	{
		icon: ListChecks,
		title: "Long-horizon reasoning",
		description:
			"Persistent reasoning across extended computational horizons, with checkpoints, dependency graphs, and evolving objectives.",
	},
	{
		icon: Crosshair,
		title: "Recursive verification",
		description:
			"Independent verification phase checks logical, computational, structural, and execution correctness before synthesis.",
	},
	{
		icon: Graph,
		title: "Semantic context",
		description:
			"Context as a semantic knowledge space, not a token stream. Retrieval by similarity and dependency, not proximity.",
	},
	{
		icon: Brain,
		title: "Confidence-guided",
		description:
			"Continuous confidence estimation drives reasoning depth. Low confidence adds compute; high confidence accelerates output.",
	},
	{
		icon: Stack,
		title: "Hierarchical decomposition",
		description:
			"Complex objectives recursively split into smaller reasoning units, each evaluated before integration upward.",
	},
	{
		icon: Lightbulb,
		title: "Reflection in flight",
		description:
			"Self-evaluation runs throughout inference, recomputing inconsistent branches before they reach synthesis.",
	},
];

export function QuartzCapabilitiesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Capabilities</p>
				<h2 className="max-w-5xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					What adaptive compound reasoning unlocks in practice.
				</h2>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{QUARTZ_CAPABILITIES.map((cap, index) => (
						<QuartzCapabilityCell key={cap.title} index={index} {...cap} />
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function QuartzCapabilityCell({
	icon: Icon,
	index,
	title,
	description,
}: {
	icon: Icon;
	index: number;
	title: string;
	description: string;
}) {
	const total = QUARTZ_CAPABILITIES.length;
	const isLastRowLg = index >= total - 3;
	const isLastRowMd = index >= total - 2;
	const isRightColLg = (index + 1) % 3 === 0;
	const isRightColMd = (index + 1) % 2 === 0;

	return (
		<div
			className={cn(
				marketingGridCellClass,
				"flex flex-col",
				!isLastRowLg && "lg:border-b lg:border-b-dotted",
				!isLastRowMd && "md:border-b md:border-b-dotted lg:border-b-0",
				index < total - 1 && "border-b border-b-dotted md:border-b-0",
				!isRightColMd && "md:border-r md:border-r-dotted",
				!isRightColLg && "lg:border-r lg:border-r-dotted",
			)}
		>
			<Icon size={22} weight="duotone" className="mb-4 shrink-0 text-brand" aria-hidden="true" />
			<h3 className="mb-3 text-lg font-semibold leading-snug text-foreground">{title}</h3>
			<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{description}
			</p>
		</div>
	);
}
