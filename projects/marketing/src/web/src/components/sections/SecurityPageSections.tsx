import {
	Bell,
	BellRinging,
	BugBeetle,
	Cpu,
	Eye,
	FileCode,
	FlowArrow,
	GitBranch,
	GitPullRequest,
	Lock,
	Path,
	Robot,
	Scales,
	Scan,
	Shield,
	ShieldCheck,
	TreeStructure,
	Wrench,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import {
	MarketingManifestRow,
	MarketingSpecRow,
} from "@/components/sections/MarketingBenchmarkPrimitives";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

/**
 * Trumbo Security — flagship product page.
 * Full feature suite: scan modes, SAST, DAST, supply chain, remediation,
 * integrations, posture, alerting, threat models, and check categories.
 */

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";
const CAPABILITY_STRIP_ROWS = 2;

/* -------------------------------------------------------------------------- */
/* Shared scaffolding                                                          */
/* -------------------------------------------------------------------------- */

function GridStrip({ cols, className }: { cols: number; className?: string }) {
	return (
		<div className={cn("grid w-full border-grid-line", className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-hidden="true">
			{Array.from({ length: cols * CAPABILITY_STRIP_ROWS }).map((_, index) => {
				const row = Math.floor(index / cols);
				const col = index % cols;
				return (
					<div key={index} className={cn("min-h-11 bg-muted/[0.06] md:min-h-12 lg:min-h-14", col < cols - 1 && "border-r border-r-dotted border-grid-line", row < CAPABILITY_STRIP_ROWS - 1 && "border-b border-b-dotted border-grid-line")} />
				);
			})}
		</div>
	);
}

function GridFrame({ edge = "top" }: { edge?: "top" | "bottom" }) {
	const edgeClass = edge === "top" ? "border-b border-b-dotted border-grid-line" : "border-t border-t-dotted border-grid-line";
	return (
		<>
			<GridStrip cols={3} className={cn(edgeClass, "md:hidden")} />
			<GridStrip cols={8} className={cn(edgeClass, "hidden md:grid lg:hidden")} />
			<GridStrip cols={12} className={cn(edgeClass, "hidden lg:grid")} />
		</>
	);
}

function DecorGridCell({ className, sizeClass = gridCellSizeClass }: { className?: string; sizeClass?: string }) {
	return <div className={cn(sizeClass, "border-b border-r border-dotted bg-muted/[0.06]", sideGridLineClass, className)} />;
}

function DecorGridPanel({ className, rows = GRID_ROWS, cols = GRID_COLS }: { className?: string; rows?: number; cols?: number }) {
	return (
		<div className={cn("grid w-fit shrink-0 border-foreground/30", className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-hidden="true">
			{Array.from({ length: rows * cols }).map((_, index) => {
				const row = Math.floor(index / cols);
				const col = index % cols;
				return <DecorGridCell key={index} className={cn(col === cols - 1 && "border-r-0", row === rows - 1 && "border-b-0")} />;
			})}
		</div>
	);
}

function SectionBanner({ kicker, heading, lead }: { kicker: string; heading: string; lead: string }) {
	const content = (
		<div className="flex flex-col">
			<p className="marketing-kicker mb-3">{kicker}</p>
			<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">{heading}</h2>
			<p className="mt-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none">{lead}</p>
		</div>
	);
	return (
		<>
			<div className="hidden border-b border-b-dotted border-grid-line md:flex md:items-stretch">
				<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>{content}</div>
				<DecorGridPanel className="border-l border-dotted" rows={GRID_ROWS} cols={GRID_COLS} />
			</div>
			<div className="border-b border-b-dotted border-grid-line md:hidden">
				<div className={cn(marketingGridCellClass, "!py-5")}>{content}</div>
			</div>
		</>
	);
}

function CapabilityCard({ icon: Icon, title, description }: { icon: Icon; title: string; description: string }) {
	return (
		<div className={cn(marketingGridCellClass, "flex h-full flex-col")}>
			<Icon size={22} weight="duotone" className="mb-4 shrink-0 text-brand" aria-hidden="true" />
			<h3 className="mb-3 text-lg font-semibold leading-snug">{title}</h3>
			<p className="min-h-[5.75rem] text-sm leading-relaxed text-muted-foreground md:min-h-[6.125rem] md:text-[0.9375rem]">
				{description}
			</p>
		</div>
	);
}

function capabilitySeparatorClass(index: number, total: number): string {
	return cn("border-grid-line", index < total - 1 && "border-b border-b-dotted", index >= total - 2 && "md:border-b-0", index >= total - 3 && "lg:border-b-0", (index + 1) % 2 !== 0 && "md:border-r md:border-r-solid", (index + 1) % 3 !== 0 && "lg:border-r lg:border-r-solid");
}

function ManifestSection({
	kicker,
	heading,
	lead,
	items,
}: {
	kicker: string;
	heading: string;
	lead: string;
	items: { tag: string; description: string }[];
}) {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-5">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center md:col-span-2", "md:!border-r md:!border-solid md:!border-grid-line")}>
				<p className="marketing-kicker mb-3">{kicker}</p>
				<h2 className="font-heading text-[1.5rem] font-normal leading-[1.35] tracking-[-0.02em] text-foreground md:text-[1.75rem] lg:text-[2rem]">{heading}</h2>
				<p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">{lead}</p>
			</GridBoxCell>
			<GridBoxCell className="!p-0 md:col-span-3 md:!border-r-0">
				{items.map((item, index) => (
					<MarketingManifestRow key={item.tag} index={index} tag={item.tag} description={item.description} />
				))}
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

export function SecurityHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">Trumbo Security</p>
			<h1 className="marketing-hero-heading mb-6 max-w-5xl">Security that investigates your code, not just pattern-matches it</h1>
			<p className="mb-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none lg:text-[1.375rem] lg:leading-[1.6]">
				Sentinel clones your repo in an isolated sandbox, sweeps 200-plus vulnerability patterns, and digs into every high-signal target with full context. It traces data flow, constructs exploit scenarios, and sends each draft past a skeptic model before anything reaches your dashboard.
			</p>
			<p className="max-w-5xl text-base leading-relaxed text-muted-foreground md:max-w-6xl md:text-lg lg:max-w-none lg:text-[1.25rem] lg:leading-[1.65]">
				Diff-aware scans run on every PR. Runtime protection probes your deployed app. AI remediation opens the fix from the same dashboard. One posture score, one remediation queue, confirmed findings only.
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Hero illustration — three-zone airlock: triggers → sandbox → deliverables   */
/* -------------------------------------------------------------------------- */

function SecurityAirlockDiagram({ className }: { className?: string }) {
	const nodeHalfW = 54;
	const nodeHalfH = 15;
	const leftX = 118;
	const rightX = 782;
	const centerX = 450;
	const centerY = 200;
	const hubHalfW = 92;
	const hubHalfH = 96;

	const triggers = [
		{ label: "GitHub", y: 104 },
		{ label: "GitLab", y: 164 },
		{ label: "PR scan", y: 224 },
		{ label: "Full scan", y: 284 },
	];

	const deliverables = [
		{ label: "Posture", y: 104 },
		{ label: "SARIF", y: 164 },
		{ label: "Slack", y: 224 },
		{ label: "Remediate", y: 284 },
	];

	const runtimeY = 352;
	const hubLeft = centerX - hubHalfW;
	const hubRight = centerX + hubHalfW;

	return (
		<svg
			className={cn("text-foreground", className)}
			viewBox="0 0 900 400"
			preserveAspectRatio="xMidYMid meet"
			fill="none"
			aria-hidden="true"
		>
			<defs>
				<marker
					id="sec-air-arrow"
					markerWidth="6"
					markerHeight="6"
					refX="5"
					refY="3"
					orient="auto"
					markerUnits="userSpaceOnUse"
				>
					<path d="M0,0.5 L5,3 L0,5.5 Z" fill="currentColor" opacity="0.45" />
				</marker>
				<marker
					id="sec-air-arrow-brand"
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

			<text
				x={leftX}
				y={48}
				textAnchor="middle"
				fontSize="8"
				fontFamily="var(--font-stat)"
				letterSpacing="1.8"
				fill="var(--color-muted-foreground)"
				stroke="none"
				opacity="0.55"
			>
				TRIGGERS
			</text>
			<text
				x={rightX}
				y={48}
				textAnchor="middle"
				fontSize="8"
				fontFamily="var(--font-stat)"
				letterSpacing="1.8"
				fill="var(--color-muted-foreground)"
				stroke="none"
				opacity="0.55"
			>
				DELIVERABLES
			</text>

			<rect
				x={centerX - hubHalfW - 14}
				y={centerY - hubHalfH - 14}
				width={(hubHalfW + 14) * 2}
				height={(hubHalfH + 14) * 2}
				rx={12}
				stroke="currentColor"
				strokeWidth="0.75"
				strokeDasharray="5 4"
				opacity="0.18"
			/>

			{triggers.map((node) => (
				<path
					key={`in-${node.label}`}
					d={`M ${leftX + nodeHalfW} ${node.y} L ${hubLeft} ${node.y}`}
					stroke="currentColor"
					strokeWidth="1"
					opacity="0.38"
					markerEnd="url(#sec-air-arrow)"
				/>
			))}

			{deliverables.map((node) => (
				<path
					key={`out-${node.label}`}
					d={`M ${hubRight} ${node.y} L ${rightX - nodeHalfW} ${node.y}`}
					stroke="currentColor"
					strokeWidth="1"
					opacity="0.38"
					markerEnd="url(#sec-air-arrow)"
				/>
			))}

			<path
				d={`M ${centerX} ${runtimeY - nodeHalfH} L ${centerX} ${centerY + hubHalfH}`}
				stroke="var(--brand)"
				strokeWidth="1.25"
				strokeDasharray="4 3"
				opacity="0.65"
				markerEnd="url(#sec-air-arrow-brand)"
			/>

			<rect
				x={centerX - hubHalfW}
				y={centerY - hubHalfH}
				width={hubHalfW * 2}
				height={hubHalfH * 2}
				rx={9}
				fill="var(--marketing-content)"
				stroke="var(--brand)"
				strokeWidth="1.5"
			/>
			<rect
				x={centerX - hubHalfW + 10}
				y={centerY - hubHalfH + 10}
				width={hubHalfW * 2 - 20}
				height={hubHalfH * 2 - 20}
				rx={6}
				stroke="var(--brand)"
				strokeWidth="0.75"
				opacity="0.35"
			/>
			<text
				x={centerX}
				y={centerY - 6}
				textAnchor="middle"
				fontSize="13"
				fontFamily="var(--font-stat)"
				fontWeight="500"
				fill="currentColor"
				stroke="none"
			>
				Sentinel
			</text>
			<text
				x={centerX}
				y={centerY + 14}
				textAnchor="middle"
				fontSize="8"
				fontFamily="var(--font-stat)"
				letterSpacing="1.5"
				fill="var(--color-muted-foreground)"
				stroke="none"
				opacity="0.65"
			>
				ISOLATED SANDBOX
			</text>
			<text
				x={centerX}
				y={centerY + 38}
				textAnchor="middle"
				fontSize="7"
				fontFamily="var(--font-stat)"
				letterSpacing="1.2"
				fill="var(--color-muted-foreground)"
				stroke="none"
				opacity="0.5"
			>
				NO NETWORK EGRESS
			</text>

			{triggers.map((node) => (
				<g key={node.label}>
					<rect
						x={leftX - nodeHalfW}
						y={node.y - nodeHalfH}
						width={nodeHalfW * 2}
						height={nodeHalfH * 2}
						rx={5}
						fill="var(--marketing-content)"
						stroke="currentColor"
						strokeWidth="1"
						opacity="0.92"
					/>
					<text
						x={leftX}
						y={node.y + 4}
						textAnchor="middle"
						fontSize="10"
						fontFamily="var(--font-stat)"
						fill="currentColor"
						stroke="none"
					>
						{node.label}
					</text>
				</g>
			))}

			{deliverables.map((node) => (
				<g key={node.label}>
					<rect
						x={rightX - nodeHalfW}
						y={node.y - nodeHalfH}
						width={nodeHalfW * 2}
						height={nodeHalfH * 2}
						rx={5}
						fill="var(--marketing-content)"
						stroke="currentColor"
						strokeWidth="1"
						opacity="0.92"
					/>
					<text
						x={rightX}
						y={node.y + 4}
						textAnchor="middle"
						fontSize="10"
						fontFamily="var(--font-stat)"
						fill="currentColor"
						stroke="none"
					>
						{node.label}
					</text>
				</g>
			))}

			<g>
				<rect
					x={centerX - nodeHalfW}
					y={runtimeY - nodeHalfH}
					width={nodeHalfW * 2}
					height={nodeHalfH * 2}
					rx={5}
					fill="var(--marketing-content)"
					stroke="var(--brand)"
					strokeWidth="1.25"
				/>
				<text
					x={centerX}
					y={runtimeY + 4}
					textAnchor="middle"
					fontSize="10"
					fontFamily="var(--font-stat)"
					fontWeight="500"
					fill="currentColor"
					stroke="none"
				>
					Runtime
				</text>
			</g>
		</svg>
	);
}

export function SecurityHeroIllustration() {
	return (
		<div className="flex min-h-[22rem] w-full flex-col overflow-hidden border-y border-y-dotted border-grid-line bg-marketing-content sm:min-h-[26rem] md:min-h-[32rem] lg:min-h-[38rem]">
			<div className="relative min-h-0 flex-1 overflow-hidden px-4 py-6 md:px-8 md:py-10 lg:px-12 lg:py-12">
				<SecurityAirlockDiagram className="h-full w-full" />
			</div>
			<div className="flex shrink-0 justify-center pt-8 pb-5 font-stat text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground md:pt-10 md:pb-6 md:text-xs">
				Fig. 01 — Triggers enter Sentinel; confirmed findings exit to your stack
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Architecture — pipeline diagram + specs                                     */
/* -------------------------------------------------------------------------- */

const SECURITY_SPECS = [
	{
		specKey: "Recon",
		value: "Clone, detect stack, inventory",
		note: "Clone repo, detect stack, inventory files, and run static scanners before any LLM work begins.",
	},
	{
		specKey: "Signals",
		value: "200+ pattern sweep",
		note: "Sweep 200-plus vulnerability patterns across every file. Deterministic hits feed triage with full context.",
	},
	{
		specKey: "Triage",
		value: "Rank by exploit likelihood",
		note: "LLM ranks signals by exploit likelihood and reachability. Diff scans expand changed files to callers first.",
	},
	{
		specKey: "Investigate",
		value: "Data-flow and exploit paths",
		note: "Deep code reading, data-flow tracing, and exploit construction on the highest-ranked targets.",
	},
	{
		specKey: "Verify",
		value: "Adversarial skeptic",
		note: "A separate model attempts to refute each draft finding. Refuted items loop back for re-investigation.",
	},
	{
		specKey: "Synthesize",
		value: "Merge confirmed findings",
		note: "Merge verified findings with high-confidence scanner hits. Only confirmed items reach your dashboard.",
	},
] as const;

export function SecurityArchitectureSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Architecture</p>
				<h2 className="max-w-6xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					Six stages. A skeptic refutes every draft before it lands.
				</h2>
				<p className="mt-4 max-w-6xl text-lg leading-relaxed text-muted-foreground md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
					Deterministic signals run first so the LLM never starts blind. Triage ranks by exploit
					likelihood. Investigation reads code and traces data flow. Verification attempts to refute.
					Only confirmed findings reach your dashboard.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<SecurityPipelineDiagram />
				<div className="grid grid-cols-1 border-t border-t-dotted border-grid-line md:grid-cols-2">
					{SECURITY_SPECS.map((spec, index) => (
						<MarketingSpecRow
							key={spec.specKey}
							specKey={spec.specKey}
							value={spec.value}
							note={spec.note}
							index={index}
							total={SECURITY_SPECS.length}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

function SecurityPipelineDiagram() {
	const W = 100;
	const H = 34;
	const RX = 7;
	const topY = 80;
	const bottomY = 170;

	const topNodes = [
		{ label: "Recon", index: 1, x: 140, y: topY },
		{ label: "Signals", index: 2, x: 300, y: topY },
	];

	const bottomNodes = [
		{ label: "Triage", index: 3, x: 300, y: bottomY, accent: true },
		{ label: "Investigate", index: 4, x: 460, y: bottomY, accent: true },
		{ label: "Verify", index: 5, x: 620, y: bottomY, accent: true },
		{ label: "Synthesize", index: 6, x: 780, y: bottomY },
	];

	const allNodes = [...topNodes, ...bottomNodes];
	const accentSet = new Set([3, 4, 5]);

	const topPanel = { x: 80, y: 52, w: 280, h: 60, rx: 10 };
	const bottomPanel = { x: 240, y: 142, w: 600, h: 60, rx: 10 };

	return (
		<div className="border-t border-t-dotted border-grid-line bg-marketing-content px-5 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
			<svg viewBox="0 0 880 262" className="w-full text-foreground" fill="none" aria-hidden="true">
				<defs>
					<marker
						id="sec-arch-arrow"
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
						id="sec-arch-arrow-brand"
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

				<rect
					x={topPanel.x}
					y={topPanel.y}
					width={topPanel.w}
					height={topPanel.h}
					rx={topPanel.rx}
					stroke="currentColor"
					strokeWidth="0.6"
					strokeDasharray="4 3"
					opacity="0.15"
				/>
				<text
					x={topPanel.x + 14}
					y={topPanel.y - 8}
					fontSize="7"
					fontFamily="var(--font-stat)"
					letterSpacing="1.6"
					fill="var(--color-muted-foreground)"
					stroke="none"
					opacity="0.5"
				>
					DETERMINISTIC
				</text>

				<rect
					x={bottomPanel.x}
					y={bottomPanel.y}
					width={bottomPanel.w}
					height={bottomPanel.h}
					rx={bottomPanel.rx}
					stroke="currentColor"
					strokeWidth="0.6"
					strokeDasharray="4 3"
					opacity="0.15"
				/>
			<path
				d={`M ${topNodes[0].x + W / 2} ${topY} L ${topNodes[1].x - W / 2} ${topY}`}
				stroke="currentColor"
				strokeWidth="1"
				opacity="0.5"
				markerEnd="url(#sec-arch-arrow)"
			/>

			<path
				d={`M ${topNodes[1].x} ${topY + H / 2} L ${bottomNodes[0].x} ${bottomY - H / 2}`}
				stroke="var(--brand)"
				strokeWidth="1.5"
				opacity="0.75"
				markerEnd="url(#sec-arch-arrow-brand)"
			/>

			{bottomNodes.slice(0, -1).map((node, i) => {
				const next = bottomNodes[i + 1];
				if (!next) return null;
				const isAccent = accentSet.has(next.index);
				return (
					<path
						key={`bottom-${i}`}
						d={`M ${node.x + W / 2} ${bottomY} L ${next.x - W / 2} ${bottomY}`}
						stroke={isAccent ? "var(--brand)" : "currentColor"}
						strokeWidth={isAccent ? 1.5 : 1}
						opacity={isAccent ? 0.9 : 0.5}
						markerEnd={`url(#${isAccent ? "sec-arch-arrow-brand" : "sec-arch-arrow"})`}
					/>
				);
			})}

			<path
				d={`M ${bottomNodes[2].x} ${bottomY + H / 2} C ${bottomNodes[2].x} ${bottomY + H / 2 + 34}, ${bottomNodes[0].x} ${bottomY + H / 2 + 34}, ${bottomNodes[0].x} ${bottomY + H / 2}`}
				stroke="var(--brand)"
				strokeWidth="1.25"
				strokeDasharray="4 3"
				opacity="0.6"
				markerEnd="url(#sec-arch-arrow-brand)"
			/>

			<text
				x={(bottomNodes[0].x + bottomNodes[2].x) / 2}
				y={bottomY + H / 2 + 48}
				textAnchor="middle"
				fontSize="7"
				fontFamily="var(--font-stat)"
				letterSpacing="1.4"
				fill="var(--color-muted-foreground)"
				stroke="none"
				opacity="0.5"
			>
				SKEPTIC LOOP — REFUTE AND RE-INVESTIGATE
			</text>

			<rect
				x={bottomPanel.x + 8}
				y={bottomPanel.y - 15}
				width={116}
				height={13}
				fill="var(--marketing-content)"
				stroke="none"
			/>
			<text
				x={bottomPanel.x + 14}
				y={bottomPanel.y - 8}
				fontSize="7"
				fontFamily="var(--font-stat)"
				letterSpacing="1.6"
				fill="var(--color-muted-foreground)"
				stroke="none"
				opacity="0.5"
			>
				LLM INVESTIGATION
			</text>

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
				Fig. 02 — Sentinel scan pipeline (per repo)
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Scan modes — 3-col cards                                                    */
/* -------------------------------------------------------------------------- */

const SCAN_MODES: { icon: Icon; name: string; tagline: string; description: string }[] = [
	{
		icon: Scan,
		name: "Full scan",
		tagline: "Whole-repo baseline",
		description: "Clone the entire repo, sweep every file, and investigate up to 40 targets. Run manually, on a schedule, or as a release gate. Establishes your posture baseline and trend.",
	},
	{
		icon: GitBranch,
		name: "Diff-aware",
		tagline: "PR and push scans",
		description: "Webhook-driven on every push or PR. Expands changed files to impacted callers and importers, triages 12 targets, and finishes in under a minute on small PRs. Same skeptic verification.",
	},
	{
		icon: BugBeetle,
		name: "Runtime DAST",
		tagline: "Live app probing",
		description: "Crawl a deployed target, inject payloads across eight vulnerability classes, observe responses, and correlate runtime findings with code-level issues in one posture view.",
	},
];

export function SecurityScanModesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Scan modes"
					heading="One engine. Three ways to trigger it."
					lead="Full scans establish your baseline. Diff-aware scans run on every PR. Runtime DAST probes your live app. All three feed the same posture score, finding model, and remediation queue."
				/>
				<GridFrame edge="top" />
				<div className="grid grid-cols-1 md:grid-cols-3">
					{SCAN_MODES.map((mode, index) => (
						<div key={mode.name} className={cn("flex flex-col", capabilitySeparatorClass(index, SCAN_MODES.length))}>
							<CapabilityCard icon={mode.icon} title={mode.name} description={mode.description} />
						</div>
					))}
				</div>
				<GridFrame edge="bottom" />
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Capabilities — expanded to 9 cards                                          */
/* -------------------------------------------------------------------------- */

const SECURITY_CAPABILITIES: { icon: Icon; title: string; description: string }[] = [
	{
		icon: ShieldCheck,
		title: "Sentinel SAST",
		description:
			"Deep code analysis with data-flow tracing, exploit construction, and adversarial verification. Nothing ships until a skeptic refutes it first.",
	},
	{
		icon: Eye,
		title: "Runtime protection",
		description:
			"Crawl live routes and inject payloads across eight vulnerability classes on deploys. Correlate runtime hits with code findings in one posture view.",
	},
	{
		icon: TreeStructure,
		title: "Supply chain",
		description:
			"Stored SBOMs and continuous advisory monitoring between releases, not just scans. Lockfile and CVE changes surface as regressions before production.",
	},
	{
		icon: Wrench,
		title: "AI remediation",
		description:
			"Patches from confirmed findings with reviewed diffs and provider pull requests. Bulk-remediate up to 25 findings without leaving the dashboard.",
	},
	{
		icon: GitBranch,
		title: "Diff-aware PR scans",
		description:
			"Webhook scans expand changed files to impacted callers on every push. Triage ranks what moved, not the whole monorepo, per PR.",
	},
	{
		icon: Scales,
		title: "Posture scoring",
		description:
			"A through F grade and 0-100 score with trends and category breakdowns. SARIF export keeps CI gates aligned with your posture.",
	},
	{
		icon: Robot,
		title: "Threat models",
		description:
			"Generated per repo from README, routes, and SECURITY.md, editable in-dashboard. Fed into scan prioritization for your riskiest surfaces.",
	},
	{
		icon: ShieldCheck,
		title: "Cross-scan dedup",
		description:
			"Ignore a false positive once and it stays ignored on future scans. Reappearing fixes flag as regressions, not duplicate noise.",
	},
	{
		icon: FileCode,
		title: "Scan logs",
		description:
			"Persistent logs replayable in every scan detail view. See what the investigator read, traced, verified, and synthesized.",
	},
];

export function SecurityCapabilitiesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Capabilities"
					heading="The full security loop, from clone to merged fix."
					lead="Nine pillars cover everything from deep code analysis to supply chain monitoring to AI-generated patches. Every scan runs server-side with authoritative tier and credit enforcement."
				/>
				<GridFrame edge="top" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{SECURITY_CAPABILITIES.map((cap, index) => (
						<div key={cap.title} className={cn("flex flex-col", capabilitySeparatorClass(index, SECURITY_CAPABILITIES.length))}>
							<CapabilityCard icon={cap.icon} title={cap.title} description={cap.description} />
						</div>
					))}
				</div>
				<GridFrame edge="bottom" />
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Check categories — 4-col strip                                              */
/* -------------------------------------------------------------------------- */

const SECURITY_CATEGORIES: { icon: Icon; label: string; description: string }[] = [
	{ icon: Shield, label: "General Security", description: "Injection, authZ regressions, privilege escalation, and secret exposure." },
	{ icon: Robot, label: "AI & Agent Trust", description: "Prompt injection, unsafe tool auto-approval, and fail-open agent infrastructure." },
	{ icon: Path, label: "Filesystem Access", description: "Path traversal, sandbox escape, symlink attacks, and resource exhaustion." },
	{ icon: Lock, label: "Privacy & Data", description: "Unauthorized egress, plaintext PII, and missing consent checks." },
	{ icon: Cpu, label: "Product & Platform", description: "Unauthenticated endpoints, weak TLS, CSP bypasses, and missing headers." },
	{ icon: FlowArrow, label: "API & RPC Privilege", description: "Net-new endpoints missing access controls, rate limits, or tenant isolation." },
	{ icon: FileCode, label: "Config & Templates", description: "Unsafe template rendering, env injection, and deserialization of untrusted data." },
	{ icon: GitPullRequest, label: "Remediation", description: "AI patches to PR, bulk remediate up to 25 findings, auto-PR on Ultra." },
];

export function SecurityCategoriesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Check categories"
					heading="Seven scopes you toggle per team, plus remediation."
					lead="Each category injects targeted instructions into the Sentinel investigator. Disable what you do not need, keep AI agent trust on for agent-built code."
				/>
				<div className="grid grid-cols-1 gap-px bg-grid-line sm:grid-cols-2 md:grid-cols-4">
					{SECURITY_CATEGORIES.map((cat) => (
						<div key={cat.label} className={cn(marketingGridCellClass, "flex flex-col gap-3 bg-marketing-content !py-6 md:!py-7")}>
							<div className="flex items-center gap-3">
								<cat.icon size={22} weight="duotone" className="shrink-0 text-brand" aria-hidden="true" />
								<span className="font-stat text-xs uppercase tracking-[0.1em] text-brand">{cat.label}</span>
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">{cat.description}</p>
						</div>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Runtime protection — manifest rows                                          */
/* -------------------------------------------------------------------------- */

const DAST_FEATURES: { tag: string; description: string }[] = [
	{ tag: "Route crawl", description: "Discover routes from sitemap, robots, and homepage links. Crawl up to 100 routes per target with configurable depth." },
	{ tag: "Payload injection", description: "Probe eight vulnerability classes: SQLi, XSS, auth bypass, IDOR, SSRF, path traversal, open redirect, and missing headers." },
	{ tag: "Response analysis", description: "Observe HTTP responses for vulnerability indicators. The LLM triages observations to filter false positives before publishing." },
	{ tag: "Correlation", description: "Runtime findings cross-reference with SAST results in one posture view. See both the code-level cause and the live exploit evidence side by side." },
];

export function SecurityRuntimeSection() {
	return <ManifestSection kicker="Runtime protection" heading="Probe your live app, not just your repo." lead="DAST crawls a deployed target, injects payloads, and correlates runtime evidence with code-level findings." items={DAST_FEATURES} />;
}

/* -------------------------------------------------------------------------- */
/* Supply chain — 2x2 icon card grid                                           */
/* -------------------------------------------------------------------------- */

const SUPPLY_CHAIN_FEATURES: { icon: Icon; tag: string; description: string }[] = [
	{
		icon: TreeStructure,
		tag: "SBOM storage",
		description:
			"A software bill of materials is stored per repo on every scan and versioned over time. Query your full dependency tree at any point, not just at build time or release.",
	},
	{
		icon: Scan,
		tag: "OSV monitoring",
		description:
			"Continuous advisory monitoring watches your stored SBOMs between releases and scheduled scans. New CVEs surface as findings the moment advisories land, without waiting for the next full scan.",
	},
	{
		icon: GitBranch,
		tag: "Dependency regressions",
		description:
			"Lockfile changes trigger targeted dependency checks on the packages that moved. Upgrading a package re-evaluates its advisory status in the context of your project and flags regressions before merge.",
	},
	{
		icon: FileCode,
		tag: "npm and pip advisories",
		description:
			"Manifest-level advisories run when package.json or Python manifests are detected in the repo. They complement the continuous OSV watch with manifest-specific risk signals at scan time.",
	},
];

export function SecuritySupplyChainSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Supply chain"
					heading="Dependencies tracked between releases, not just scan day."
					lead="Stored SBOMs, continuous OSV advisories, and lockfile-aware checks surface CVEs and regressions without waiting for the next scan."
				/>
				<GridFrame edge="top" />
				<div className="grid grid-cols-1 md:grid-cols-2">
					{SUPPLY_CHAIN_FEATURES.map((feature, index) => (
						<div
							key={feature.tag}
							className={cn(
								"flex flex-col",
								"border-grid-line",
								index < SUPPLY_CHAIN_FEATURES.length - 2 && "border-b border-b-dotted",
								(index + 1) % 2 !== 0 && "md:border-r md:border-r-solid",
							)}
						>
							<CapabilityCard icon={feature.icon} title={feature.tag} description={feature.description} />
						</div>
					))}
				</div>
				<GridFrame edge="bottom" />
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Remediation — 2x2 spec row grid                                             */
/* -------------------------------------------------------------------------- */

const REMEDIATION_SPECS: { specKey: string; value: string; note: string }[] = [
	{
		specKey: "Approve",
		value: "Patch from confirmed finding",
		note: "Approve a proposed patch from any confirmed finding. Ultra tiers support auto-PR when policy allows.",
	},
	{
		specKey: "Generate",
		value: "Diff in isolated sandbox",
		note: "The sandbox agent generates a diff in isolation. Jobs survive HTTP 202 and poll until the patch is ready.",
	},
	{
		specKey: "Review",
		value: "Inline diff before merge",
		note: "Review the diff inline before any merge. Up to 25 findings per pass, patched in parallel and reviewed individually.",
	},
	{
		specKey: "Merge",
		value: "PR on your provider",
		note: "Trumbo opens a PR on your provider. Manifest patches target manifests, not lockfiles, for reproducible upgrades.",
	},
];

export function SecurityRemediationSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Remediation"
					heading="Findings ship with fixes, not just filenames."
					lead="From verified finding to reviewed patch to merged PR, without leaving the dashboard."
				/>
				<div className="grid grid-cols-1 border-t border-t-dotted border-grid-line md:grid-cols-2">
					{REMEDIATION_SPECS.map((spec, index) => (
						<MarketingSpecRow
							key={spec.specKey}
							specKey={spec.specKey}
							value={spec.value}
							note={spec.note}
							index={index}
							total={REMEDIATION_SPECS.length}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Integrations — 4-col strip                                                  */
/* -------------------------------------------------------------------------- */

const SECURITY_INTEGRATIONS: { icon: Icon; label: string; description: string }[] = [
	{
		icon: GitBranch,
		label: "GitHub",
		description: "OAuth, webhook scans on push and PR, and PR-based remediation.",
	},
	{
		icon: GitBranch,
		label: "GitLab",
		description: "OAuth, webhook scans on push and MR, and MR-based remediation.",
	},
	{
		icon: GitBranch,
		label: "Bitbucket",
		description: "Webhook scans on push and pull request through your workspace connection.",
	},
	{
		icon: Bell,
		label: "Slack",
		description: "Critical and high alerts routed to your security channel in real time.",
	},
	{
		icon: Bell,
		label: "Email",
		description: "Digest alerts delivered to your distribution list on a schedule you control.",
	},
	{
		icon: FlowArrow,
		label: "Webhook",
		description: "Custom HTTP endpoint with signed payloads, configurable per org.",
	},
	{
		icon: FileCode,
		label: "SARIF",
		description: "2.1.0 export for GitHub code scanning, GitLab SAST, and CI gates.",
	},
	{
		icon: BellRinging,
		label: "CI gates",
		description: "Block merges on critical findings with SARIF-integrated CI checks.",
	},
];

export function SecurityIntegrationsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Integrations"
					heading="Where you already work, wired in."
					lead="Connect Git providers, route alerts to chat and email, export SARIF for CI, and block merges on critical findings. All configurable per org from security settings."
				/>
				<div className="grid grid-cols-1 gap-px bg-grid-line sm:grid-cols-2 md:grid-cols-4">
					{SECURITY_INTEGRATIONS.map((integration) => (
						<div key={integration.label} className={cn(marketingGridCellClass, "flex flex-col gap-3 bg-marketing-content !py-6 md:!py-7")}>
							<div className="flex items-center gap-3">
								<integration.icon size={22} weight="duotone" className="shrink-0 text-brand" aria-hidden="true" />
								<span className="font-stat text-xs uppercase tracking-[0.1em] text-brand">{integration.label}</span>
							</div>
							<p className="min-h-[4.375rem] text-sm leading-relaxed text-muted-foreground md:min-h-[4.625rem] md:text-[0.9375rem]">
								{integration.description}
							</p>
						</div>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Operations — 5/3 manifest rows                                              */
/* -------------------------------------------------------------------------- */

const SECURITY_OPERATIONS: { tag: string; description: string }[] = [
	{ tag: "Connect", description: "OAuth to GitHub or GitLab, pick repos, and enable webhook scans. Each repo gets an auto-generated threat model you can edit." },
	{ tag: "Scan", description: "Manual, scheduled, or on every push. One active scan per repo, queued through a Trumbo Scan Host with persistent logs." },
	{ tag: "Review", description: "Every confirmed finding ships with severity, data-flow trace, exploit scenario, and verification status. Ignore once, deduped forever." },
	{ tag: "Fix", description: "Generate a patch, review the diff, approve, and open a PR. Bulk remediate up to 25 findings per request." },
	{ tag: "Export", description: "Download SARIF for CI gates. Route critical alerts to Slack, email, or a custom webhook. Watch posture trends over time." },
];

export function SecurityOperationsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-5">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center md:col-span-2", "md:!border-r md:!border-solid md:!border-grid-line")}>
				<p className="marketing-kicker mb-3">Operations</p>
				<h2 className="font-heading text-[1.5rem] font-normal leading-[1.35] tracking-[-0.02em] text-foreground md:text-[1.75rem] lg:text-[2rem]">Connect once. Scan on push. Fix from one dashboard.</h2>
				<p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">Five steps from repo to remediation, enforced server-side.</p>
			</GridBoxCell>
			<GridBoxCell className="!p-0 md:col-span-3 md:!border-r-0">
				{SECURITY_OPERATIONS.map((op, index) => (
					<MarketingManifestRow key={op.tag} index={index} tag={op.tag} description={op.description} />
				))}
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Testimonial                                                                 */
/* -------------------------------------------------------------------------- */

const SECURITY_TESTIMONIAL = {
	quote: "We had a PR open for three days because nobody could agree whether the sanitization held. It read the whole call chain in under a minute, wrote the exact payload that would bypass it, and pointed at the line. I stopped arguing with it after the third time it was right and I was wrong.",
	company: "Datadog",
	companyLogoUrl: "https://www.datadoghq.com/favicon.ico",
	name: "Guillaume Fournier",
	role: "Staff Security Engineer",
} as const;

export function SecurityTestimonialsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell
				className={cn(
					marketingGridCellClass,
					"flex flex-col justify-center !py-10 md:!py-14 lg:!py-16",
				)}
			>
				<figure className="w-full max-w-7xl">
					<blockquote className="max-w-6xl text-pretty font-heading text-2xl font-normal leading-[1.35] tracking-[-0.02em] text-foreground md:text-[1.75rem] md:leading-[1.34] lg:max-w-none lg:text-[2.375rem] lg:leading-[1.3]">
						&ldquo;{SECURITY_TESTIMONIAL.quote}&rdquo;
					</blockquote>
					<figcaption className="mt-6 flex items-center gap-4 md:mt-8 md:gap-5">
						<div className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-border md:size-10">
							<img
								src={SECURITY_TESTIMONIAL.companyLogoUrl}
								alt={SECURITY_TESTIMONIAL.company}
								className="size-full object-cover"
								decoding="async"
								loading="lazy"
							/>
						</div>
						<div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
							<span className="font-stat text-xs uppercase tracking-[0.08em] text-foreground">
								{SECURITY_TESTIMONIAL.name}
							</span>
							<span
								className="hidden h-3 w-px shrink-0 bg-border sm:block"
								aria-hidden="true"
							/>
							<span className="font-stat text-xs uppercase tracking-[0.08em] text-muted-foreground">
								{SECURITY_TESTIMONIAL.role}, {SECURITY_TESTIMONIAL.company}
							</span>
						</div>
					</figcaption>
				</figure>
			</GridBoxCell>
		</GridBox>
	);
}

