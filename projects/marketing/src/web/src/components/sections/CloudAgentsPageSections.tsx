import {
	Clock,
	Database,
	GitBranch,
	PlugsConnected,
	Users,
	Waveform,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { ChannelBrandIcon, type ChannelBrandLabel } from "@/components/ChannelBrandIcons";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import {
	MarketingComparisonTable,
	MarketingManifestRow,
	MarketingSpecRow,
} from "@/components/sections/MarketingBenchmarkPrimitives";
import { cn } from "@/lib/utils";

/**
 * Cloud Agents page â€” Agentic Cloud surface.
 * Mirrors the Agent page grid language (banner + capability grid + dotted frames)
 * and the Quartz page diagram language (numbered SVG nodes, brand accent edges).
 * Unique sections: Quartz-style hero execution graph, connector grid, benchmark comparison.
 */

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";
const CAPABILITY_STRIP_ROWS = 2;

/* -------------------------------------------------------------------------- */
/* Shared scaffolding â€” identical class patterns to AgentPageSections          */
/* -------------------------------------------------------------------------- */

function GridStrip({
	cols,
	className,
}: {
	cols: number;
	className?: string;
}) {
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

export function CloudAgentsHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">
				<span>Agentic Cloud</span>
				<span className="marketing-kicker-sep" aria-hidden="true" />
				<span>Cloud Agents</span>
			</p>
			<h1 className="marketing-hero-heading mb-6 max-w-5xl">Trumbo Cloud Agents</h1>
			<p className="mb-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none lg:text-[1.375rem] lg:leading-[1.6]">
				Most cloud agents spin up a fresh VM for every task. Trumbo Cloud Agents live in a
				Trumbo Agent Host with memory that survives days between messages. Schedule recurring jobs,
				connect eight chat channels, and resume exactly where you left off without rebuilding
				context or paying for cold boots.
			</p>
			<p className="max-w-5xl text-base leading-relaxed text-muted-foreground md:max-w-6xl md:text-lg lg:max-w-none lg:text-[1.25rem] lg:leading-[1.65]">
				Each agent keeps the same tool stack and permissions model as your local CLI. Specialist
				sub-agents work in parallel, events stream in real time, and every channel thread maps to
				one persistent session instead of a disposable sandbox.
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Hero diagram — Quartz-style execution graph                                 */
/* -------------------------------------------------------------------------- */

export function CloudAgentsHeroDiagram() {
	return (
		<div className="flex min-h-72 w-full flex-col overflow-hidden border-y border-y-dotted border-grid-line bg-marketing-content md:min-h-80 lg:min-h-96">
			<div className="relative min-h-0 flex-1 overflow-hidden">
				<CloudAgentsExecutionGraph className="absolute inset-0 h-full w-full" />
			</div>
			<div className="flex shrink-0 justify-center px-5 py-5 font-stat text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground md:py-6 md:text-xs">
				Fig. 01: Channels and triggers attach to Agent Host; streams and checkpoints exit
			</div>
		</div>
	);
}

const AGENT_NODE_H = 36;
const AGENT_NODE_HALF_H = AGENT_NODE_H / 2;
const AGENT_NODE_HALF_W = 40;
const AGENT_NODE_WIDE_HALF_W = 48;

type AgentGraphNodeDef = {
	id: string;
	x: number;
	y: number;
	label: string;
	sub: string;
	accent?: boolean;
	wide?: boolean;
};

function agentNodeHalfW(node: AgentGraphNodeDef) {
	return node.wide ? AGENT_NODE_WIDE_HALF_W : AGENT_NODE_HALF_W;
}

function agentNodeAnchor(
	node: AgentGraphNodeDef,
	side: "left" | "right" | "top" | "bottom",
	yOffset = 0,
) {
	const halfW = agentNodeHalfW(node);
	switch (side) {
		case "left":
			return { x: node.x - halfW, y: node.y + yOffset };
		case "right":
			return { x: node.x + halfW, y: node.y + yOffset };
		case "top":
			return { x: node.x, y: node.y - AGENT_NODE_HALF_H };
		case "bottom":
			return { x: node.x, y: node.y + AGENT_NODE_HALF_H };
	}
}

const CLOUD_AGENT_GRAPH_NODES: AgentGraphNodeDef[] = [
	{ id: "channels", x: 90, y: 58, label: "Channels", sub: "01" },
	{ id: "triggers", x: 90, y: 124, label: "Triggers", sub: "02" },
	{ id: "schedule", x: 90, y: 190, label: "Schedule", sub: "03" },
	{ id: "init", x: 300, y: 124, label: "Init", sub: "04" },
	{ id: "think", x: 500, y: 124, label: "Think", sub: "05", accent: true },
	{ id: "stream", x: 700, y: 124, label: "Stream", sub: "06", accent: true },
	{ id: "settle", x: 900, y: 124, label: "Settle", sub: "07" },
	{ id: "memory", x: 500, y: 214, label: "Memory", sub: "08" },
	{ id: "reply", x: 1070, y: 58, label: "Reply", sub: "09" },
	{ id: "events", x: 1070, y: 124, label: "Events", sub: "10" },
	{ id: "checkpoint", x: 1070, y: 190, label: "Checkpoint", sub: "11", wide: true },
];

function cloudAgentGraphNode(id: string) {
	const node = CLOUD_AGENT_GRAPH_NODES.find((entry) => entry.id === id);
	if (!node) {
		throw new Error(`Unknown cloud agent graph node: ${id}`);
	}
	return node;
}

/**
 * Agent-host graph: triple inputs, four-step loop with memory, triple outputs.
 * Quartz figure style with light curves and a hibernate feedback arc.
 */
function CloudAgentsExecutionGraph({ className }: { className?: string }) {
	const channels = cloudAgentGraphNode("channels");
	const triggers = cloudAgentGraphNode("triggers");
	const schedule = cloudAgentGraphNode("schedule");
	const init = cloudAgentGraphNode("init");
	const think = cloudAgentGraphNode("think");
	const stream = cloudAgentGraphNode("stream");
	const settle = cloudAgentGraphNode("settle");
	const memory = cloudAgentGraphNode("memory");
	const reply = cloudAgentGraphNode("reply");
	const events = cloudAgentGraphNode("events");
	const checkpoint = cloudAgentGraphNode("checkpoint");

	const channelsOut = agentNodeAnchor(channels, "right");
	const triggersOut = agentNodeAnchor(triggers, "right");
	const scheduleOut = agentNodeAnchor(schedule, "right");
	const initInTop = agentNodeAnchor(init, "left", -8);
	const initIn = agentNodeAnchor(init, "left");
	const initInBottom = agentNodeAnchor(init, "left", 8);
	const initOut = agentNodeAnchor(init, "right");
	const thinkIn = agentNodeAnchor(think, "left");
	const thinkOut = agentNodeAnchor(think, "right");
	const thinkInBottom = agentNodeAnchor(think, "left", 8);
	const streamIn = agentNodeAnchor(stream, "left");
	const streamOut = agentNodeAnchor(stream, "right");
	const streamTop = agentNodeAnchor(stream, "top");
	const settleIn = agentNodeAnchor(settle, "left");
	const settleOutTop = agentNodeAnchor(settle, "right", -10);
	const settleOutBottom = agentNodeAnchor(settle, "right", 10);
	const settleInBottom = agentNodeAnchor(settle, "left", 8);
	const memoryOut = agentNodeAnchor(memory, "top");
	const thinkInBottomCenter = agentNodeAnchor(think, "bottom");
	const replyIn = agentNodeAnchor(reply, "left");
	const eventsInTop = agentNodeAnchor(events, "top");
	const checkpointIn = agentNodeAnchor(checkpoint, "left");
	const overheadY = 34;
	const feedbackY = 262;

	return (
		<svg
			className={cn("text-foreground", className)}
			viewBox="0 0 1140 290"
			preserveAspectRatio="xMidYMid meet"
			fill="none"
			stroke="currentColor"
			aria-hidden="true"
		>
			<defs>
				<marker
					id="cah-arrow"
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
					id="cah-arrow-brand"
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
				<path
					d={`M ${channelsOut.x} ${channelsOut.y} C ${channelsOut.x + 45} ${channelsOut.y}, ${initInTop.x - 30} ${initInTop.y}, ${initInTop.x} ${initInTop.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${triggersOut.x} ${triggersOut.y} L ${initIn.x} ${initIn.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${scheduleOut.x} ${scheduleOut.y} C ${scheduleOut.x + 45} ${scheduleOut.y}, ${initInBottom.x - 30} ${initInBottom.y}, ${initInBottom.x} ${initInBottom.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${initOut.x} ${initOut.y} L ${thinkIn.x} ${thinkIn.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${streamOut.x} ${streamOut.y} L ${settleIn.x} ${settleIn.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${memoryOut.x} ${memoryOut.y} L ${thinkInBottomCenter.x} ${thinkInBottomCenter.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${streamTop.x} ${streamTop.y} L ${streamTop.x} ${overheadY} L ${eventsInTop.x} ${overheadY} L ${eventsInTop.x} ${eventsInTop.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${settleOutTop.x} ${settleOutTop.y} C ${settleOutTop.x + 35} ${settleOutTop.y - 20}, ${replyIn.x - 25} ${replyIn.y}, ${replyIn.x} ${replyIn.y}`}
					markerEnd="url(#cah-arrow)"
				/>
				<path
					d={`M ${settleOutBottom.x} ${settleOutBottom.y} C ${settleOutBottom.x + 35} ${settleOutBottom.y + 20}, ${checkpointIn.x - 25} ${checkpointIn.y}, ${checkpointIn.x} ${checkpointIn.y}`}
					markerEnd="url(#cah-arrow)"
				/>
			</g>

			<g stroke="var(--brand)" strokeWidth="1.1" opacity="0.8">
				<path
					d={`M ${thinkOut.x} ${thinkOut.y} L ${streamIn.x} ${streamIn.y}`}
					markerEnd="url(#cah-arrow-brand)"
				/>
			</g>

			<g stroke="var(--brand)" strokeWidth="1" strokeDasharray="4 3" opacity="0.65">
				<path
					d={`M ${settleInBottom.x} ${settleInBottom.y} C ${settleInBottom.x - 110} ${feedbackY}, ${thinkInBottom.x + 110} ${feedbackY}, ${thinkInBottom.x} ${thinkInBottom.y}`}
					markerEnd="url(#cah-arrow-brand)"
				/>
			</g>

			<g>
				{CLOUD_AGENT_GRAPH_NODES.map((node) => (
					<AgentGraphNode
						key={node.id}
						x={node.x}
						y={node.y}
						label={node.label}
						sub={node.sub}
						accent={node.accent}
						wide={node.wide}
					/>
				))}
			</g>
		</svg>
	);
}

function AgentGraphNode({
	x,
	y,
	label,
	sub,
	accent,
	wide,
}: {
	x: number;
	y: number;
	label: string;
	sub: string;
	accent?: boolean;
	wide?: boolean;
}) {
	const halfW = wide ? 48 : 40;
	const width = halfW * 2;

	return (
		<g>
			<rect
				x={x - halfW}
				y={y - 18}
				width={width}
				height="36"
				rx="2"
				stroke="currentColor"
				strokeWidth="1"
				fill="var(--marketing-content)"
				opacity="0.95"
			/>
			{accent ? (
				<rect
					x={x - halfW}
					y={y - 18}
					width={width}
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
				x={x - halfW + 6}
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
/* Architecture â€” Think DO lifecycle diagram + spec table                        */
/* -------------------------------------------------------------------------- */

function CloudAgentsLifecycleDiagram() {
	const W = 112;
	const H = 32;
	const RX = 6;
	const y = 92;

	const nodes = [
		{ label: "Init", index: 1, x: 138, y },
		{ label: "Think", index: 2, x: 266, y, accent: true },
		{ label: "Stream", index: 3, x: 394, y },
		{ label: "Settle", index: 4, x: 522, y, accent: true },
	];

	return (
		<div className="border-t border-t-dotted border-grid-line bg-marketing-content px-5 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
			<svg viewBox="0 0 660 200" className="w-full text-foreground" fill="none" aria-hidden="true">
				<defs>
					<marker
						id="ca-arrow"
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
						id="ca-arrow-brand"
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

				{nodes.slice(0, -1).map((node, i) => {
					const next = nodes[i + 1];
					if (!next) return null;
					const isAccent = next.index === 2;
					return (
						<path
							key={`fwd-${i}`}
							d={`M ${node.x + W / 2} ${node.y} L ${next.x - W / 2} ${next.y}`}
							stroke={isAccent ? "var(--brand)" : "currentColor"}
							strokeWidth={isAccent ? 1.5 : 1}
							opacity={isAccent ? 0.9 : 0.5}
							markerEnd={`url(#${isAccent ? "ca-arrow-brand" : "ca-arrow"})`}
						/>
					);
				})}

				<path
					d={`M ${nodes[3].x} ${y + H / 2} C ${nodes[3].x} ${y + 72}, ${nodes[1].x} ${y + 72}, ${nodes[1].x} ${y + H / 2}`}
					stroke="var(--brand)"
					strokeWidth="1.25"
					strokeDasharray="4 3"
					opacity="0.65"
					markerEnd="url(#ca-arrow-brand)"
				/>

				<text
					x={330}
					y={184}
					textAnchor="middle"
					fontSize="8"
					fontFamily="var(--font-stat)"
					letterSpacing="1.5"
					fill="var(--color-muted-foreground)"
					stroke="none"
					opacity="0.5"
				>
					AGENT HOST
				</text>

				{nodes.map((node) => {
					const isAccent = Boolean(node.accent);
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
				Fig. 02: Trumbo Agent Host lifecycle
			</div>
		</div>
	);
}

const LIFECYCLE_SPECS: {
	specKey: string;
	value: string;
	note: string;
}[] = [
	{
		specKey: "Init",
		value: "Bootstraps tools, permissions, channel bindings",
		note: "Loads manifest, secrets, and connector credentials into the agent host before the first turn.",
	},
	{
		specKey: "Think",
		value: "Runs the agent loop against persistent memory",
		note: "Reads conversation history, tool state, and team context without provisioning a new VM.",
	},
	{
		specKey: "Stream",
		value: "Pushes live events to subscribers",
		note: "Tokens, tool calls, approvals, and reasoning stream over WebSocket while the loop runs.",
	},
	{
		specKey: "Settle",
		value: "Persists state before hibernation",
		note: "Writes memory checkpoints so the next message or schedule tick resumes the same context.",
	},
];

export function CloudAgentsArchitectureSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Architecture</p>
				<h2 className="max-w-6xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					One Trumbo Agent Host per agent. A four-stage loop that never loses state.
				</h2>
				<p className="mt-4 max-w-6xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Each cloud agent lives in a Trumbo Agent Host. Init bootstraps tools and
					permissions, Think runs the agent loop, Stream pushes events to subscribers, and Settle
					persists memory before the object hibernates. The loop continues on the next message
					or scheduled tick, picking up the same context without a cold start.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<CloudAgentsLifecycleDiagram />
				<div className="grid grid-cols-1 border-t border-t-dotted border-grid-line md:grid-cols-2">
					{LIFECYCLE_SPECS.map((spec, index) => (
						<MarketingSpecRow
							key={spec.specKey}
							specKey={spec.specKey}
							value={spec.value}
							note={spec.note}
							index={index}
							total={LIFECYCLE_SPECS.length}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Operations â€” manifest rows                                                  */
/* -------------------------------------------------------------------------- */

const CLOUD_AGENT_OPERATIONS: {
	tag: string;
	description: string;
}[] = [
	{
		tag: "Deploy",
		description:
			"Create a cloud agent in your team workspace with tool permissions, model routing, and environment secrets. One agent host per agent, configured once from platform.trumbo.dev.",
	},
	{
		tag: "Connect channel",
		description:
			"Bind Slack, Discord, Email, or any of eight built-in connectors to the agent's persistent session. Every thread maps to the same memory store, not a one-off reply.",
	},
	{
		tag: "Schedule",
		description:
			"Add cron-style jobs for recurring reviews, dependency scans, and PR summaries. Scheduled ticks wake the same object and post results to the channel you choose.",
	},
	{
		tag: "Stream events",
		description:
			"Subscribe to live tokens, tool calls, and reasoning over WebSocket. Frontends, CI pipelines, and dashboards render progress without polling.",
	},
	{
		tag: "Resume",
		description:
			"Pick up any session days or weeks later without cold-booting a VM. The agent host reloads memory checkpoints and continues the agent loop from the last settled state.",
	},
];

export function CloudAgentsOperationsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-5">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center md:col-span-2",
					"md:!border-r md:!border-solid md:!border-grid-line",
				)}
			>
				<p className="marketing-kicker mb-3">Operations</p>
				<h2 className="font-heading text-[1.5rem] font-normal leading-[1.35] tracking-[-0.02em] text-foreground md:text-[1.75rem] lg:text-[2rem]">
					Deploy once. Connect channels. Let the agent run.
				</h2>
				<p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
					Five steps from workspace setup to a long-running agent that survives between messages.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!p-0 md:col-span-3 md:!border-r-0">
				{CLOUD_AGENT_OPERATIONS.map((operation, index) => (
					<MarketingManifestRow
						key={operation.tag}
						index={index}
						tag={operation.tag}
						description={operation.description}
					/>
				))}
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                                */
/* -------------------------------------------------------------------------- */

const CLOUD_AGENT_CAPABILITIES: {
	icon: Icon;
	title: string;
	description: string;
}[] = [
	{
		icon: Database,
		title: "Persistent state",
		description:
			"Each cloud agent stores memory, tool state, and conversation history in a Trumbo Agent Host that survives restarts and hibernation. Resume any session exactly where it left off, hours or weeks later, without rebuilding context from scratch.",
	},
	{
		icon: Clock,
		title: "Scheduled tasks",
		description:
			"Run recurring agent jobs with cron-style schedules. Daily reviews, dependency scans, and PR summaries fire on their own, wake the same agent host, and post results to the channel you choose.",
	},
	{
		icon: Users,
		title: "Multi-agent teams",
		description:
			"Spawn specialist sub-agents with isolated context for parallel workstreams. Team state persists across runs, so a reviewer, a planner, and a builder can collaborate without stepping on each other's memory.",
	},
	{
		icon: PlugsConnected,
		title: "Channel connectors",
		description:
			"Bridge Slack, Discord, Email, Webhook, Linear, WhatsApp, Telegram, and Google Chat into full agent sessions. Each thread maps to persistent context, not a disposable VM that forgets the conversation when it shuts down.",
	},
	{
		icon: Waveform,
		title: "Real-time streaming",
		description:
			"Stream tokens, tool calls, and reasoning events as they happen over a live WebSocket. Frontends, dashboards, and CI pipelines render progress, approvals, and partial output without polling.",
	},
	{
		icon: GitBranch,
		title: "CI and webhooks",
		description:
			"Trigger agents from CI pipelines, inbound webhooks, and scheduled jobs. Results stream back to the channel or endpoint you configure, with the same tool permissions enforced server-side.",
	},
];

export function CloudAgentsCapabilitiesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Capabilities"
					heading="Everything a long-running agent needs, hosted on Trumbo."
					lead="Six primitives power every cloud agent. They share the same tool stack and permissions model as the local CLI, so a session behaves the same whether it runs on your laptop or in an agent host."
				/>
				<GridFrame edge="top" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{CLOUD_AGENT_CAPABILITIES.map((capability, index) => (
						<div
							key={capability.title}
							className={cn("flex flex-col", capabilitySeparatorClass(index, CLOUD_AGENT_CAPABILITIES.length))}
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
/* Connector strip â€” 4x2 grid with icon, label, description                    */
/* -------------------------------------------------------------------------- */

const CLOUD_AGENT_CONNECTORS: {
	label: ChannelBrandLabel;
	description: string;
}[] = [
	{
		label: "Slack",
		description: "Thread replies map to one persistent session per channel.",
	},
	{
		label: "Discord",
		description: "Bot messages continue the same agent context across turns.",
	},
	{
		label: "Email",
		description: "Inbound mail opens or resumes a persistent agent thread.",
	},
	{
		label: "Webhook",
		description: "HTTP payloads trigger agents with stored credentials.",
	},
	{
		label: "Linear",
		description: "Issue comments and updates route into agent workflows.",
	},
	{
		label: "WhatsApp",
		description: "Chat messages attach to long-lived cloud sessions.",
	},
	{
		label: "Telegram",
		description: "Group and DM threads share one agent memory store.",
	},
	{
		label: "Google Chat",
		description: "Space messages feed the same agent host loop.",
	},
];

export function CloudAgentsConnectorStrip() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Channels"
					heading="Eight channels, one persistent agent."
					lead="Every connector maps a thread or inbox to a cloud agent session. Replies continue the same context, tool calls, and permissions, no matter which surface the message arrived on."
				/>
				<div className="grid grid-cols-1 gap-px bg-grid-line sm:grid-cols-2 md:grid-cols-4">
					{CLOUD_AGENT_CONNECTORS.map((connector) => (
						<div
							key={connector.label}
							className={cn(
								marketingGridCellClass,
								"flex flex-col gap-3 bg-marketing-content !py-6 md:!py-7",
							)}
						>
							<div className="flex items-center gap-3">
								<ChannelBrandIcon
									label={connector.label}
									size={24}
									className="shrink-0 text-brand"
								/>
								<span className="font-stat text-xs uppercase tracking-[0.1em] text-brand">
									{connector.label}
								</span>
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
								{connector.description}
							</p>
						</div>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Benchmark â€” comparison table with sourced footnote                            */
/* -------------------------------------------------------------------------- */

const BENCHMARK_COLUMNS = [
	{ name: "Trumbo Cloud Agents", featured: true },
	{ name: "Cursor Cloud Agents" },
	{ name: "Claude Code" },
] as const;

const BENCHMARK_ROWS = [
	{
		label: "Persistent memory across days",
		values: ["Yes (Trumbo Agent Host)", "Per-VM session", "Local or worktree"],
	},
	{
		label: "Resume without cold boot",
		values: ["Yes", "VM restart", "N/A"],
	},
	{
		label: "Built-in channel connectors",
		values: ["8", "Slack-focused", "Remote control"],
	},
	{
		label: "Same tool stack as local agent",
		values: ["Yes", "Cursor IDE tools", "Claude Code tools"],
	},
	{
		label: "Parallel background agents",
		values: ["Tier-based", "Plan-based (8+ concurrent)", "Worktree mode"],
	},
] as const;

export function CloudAgentsBenchmarkSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Comparison"
					heading="Persistent agent hosts, not disposable VMs."
					lead="How Trumbo Cloud Agents compare to VM-per-task cloud agents and local-first coding assistants on the dimensions that matter for long-running work."
				/>
				<MarketingComparisonTable
					idPrefix="cloud-agents"
					columns={BENCHMARK_COLUMNS}
					rows={BENCHMARK_ROWS}
				/>
			</GridBoxCell>
		</GridBox>
	);
}
