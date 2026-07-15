import {
	ArrowsClockwise,
	FileCode,
	GitBranch,
	Globe,
	Lightning,
	ListChecks,
	Code,
	Monitor,
	Package,
	TerminalWindow,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import {
	marketingGridCellClass,
	marketingGridListRowClass,
} from "@/components/grid-shell-context";
import {
	MarketingComparisonTable,
	MarketingCtaRow,
	MarketingSpecRow,
} from "@/components/sections/MarketingBenchmarkPrimitives";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";

/**
 * Sandbox page — Agentic Cloud surface.
 * Mirrors the Agent page grid language and the Quartz page diagram language.
 * Unique sections: vertical lifecycle timeline, benchmark table, bento use cases.
 */

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";
const CAPABILITY_STRIP_ROWS = 2;

const SANDBOX_BENCHMARK_COLUMNS = [
	{ name: "Trumbo Sandbox", featured: true },
	{ name: "E2B" },
	{ name: "Daytona" },
] as const;

const SANDBOX_BENCHMARK_ROWS = [
	{
		label: "Cold start",
		values: [
			"~2-3s cold, ~2s warm restore",
			"~150ms",
			"~90ms",
		],
	},
	{
		label: "Isolation model",
		values: [
			"Linux VM on Trumbo Sandbox",
			"Firecracker microVM",
			"Docker container",
		],
	},
	{
		label: "Agent toolchain integration",
		values: [
			"Built-in CLI and VS Code tools",
			"Standalone API and SDK",
			"Standalone API and SDK",
		],
	},
	{
		label: "Persistence",
		values: [
			"Auto-sleep + backup/restore warm starts",
			"Ephemeral per session",
			"Native pause and resume",
		],
	},
	{
		label: "Best fit",
		values: [
			"Trumbo agent tool calls end to end",
			"Third-party agent SDKs",
			"Low-latency standalone sandboxes",
		],
	},
] as const;

const SANDBOX_SPECS = [
	{
		specKey: "Runtime image",
		value: "Pinned Linux image with bun, node, pip, and apt",
		note: "Same image across CLI, VS Code, and platform sessions.",
	},
	{
		specKey: "Egress policy",
		value: "Allowlisted endpoints per session",
		note: "Fetch dependencies, call APIs, and clone git remotes without opening your laptop.",
	},
	{
		specKey: "Streamed I/O",
		value: "stdout, stderr, and exit codes in real time",
		note: "The agent reads partial output before a command finishes.",
	},
	{
		specKey: "Persistence",
		value: "Auto-sleep plus R2-backed backup and restore",
		note: "Sandboxes sleep when idle (no CPU billing) and restore workspace state in ~2s on wake.",
	},
	{
		specKey: "Ports and preview URLs",
		value: "Expose any port as a public trycloudflare.com URL",
		note: "Agents start a dev server and share a live preview link without leaving the chat.",
	},
	{
		specKey: "Background processes",
		value: "Start, monitor, and kill long-running processes",
		note: "Run a dev server, a test watcher, or a build pipeline in the background.",
	},
	{
		specKey: "Code contexts",
		value: "Persistent Python, JavaScript, and TypeScript interpreters",
		note: "Variables and imports persist across calls like a Jupyter notebook.",
	},
	{
		specKey: "CLI tool parity",
		value: "sandbox_exec, sandbox_run_code, sandbox_git_clone, sandbox_expose_port, and more",
		note: "24 MCP tools with identical names and schemas in headless and interactive modes.",
	},
	{
		specKey: "VS Code parity",
		value: "Same sandbox tools in the extension webview",
		note: "Plan and Act modes call the same remote VM your CLI session would.",
	},
] as const;

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

export function SandboxHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">
				<span>Agentic Cloud</span>
				<span className="marketing-kicker-sep" aria-hidden="true" />
				<span>Sandbox</span>
			</p>
			<h1 className="marketing-hero-heading mb-6 max-w-5xl">
				Isolated Linux VMs for agent tool calls
			</h1>
			<p className="mb-5 max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:max-w-none lg:text-[1.375rem] lg:leading-[1.6]">
				Every sandbox is a fresh Linux virtual machine on Trumbo infrastructure. The agent
				provisions it, clones your repo, installs dependencies, runs shell commands, and
				streams stdout and stderr back in real time. Your laptop stays untouched.
			</p>
			<p className="max-w-5xl text-base leading-relaxed text-muted-foreground md:max-w-6xl md:text-lg lg:max-w-none lg:text-[1.25rem] lg:leading-[1.65]">
				The same sandbox tools ship in the CLI and VS Code extension. No separate SDK to wire
				up, no local Docker daemon, and no orphaned containers when the task ends.
			</p>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Lifecycle timeline — unique to this page                                    */
/* -------------------------------------------------------------------------- */

const SANDBOX_LIFECYCLE_STEPS: { tag: string; description: string }[] = [
	{
		tag: "Provision",
		description:
			"A fresh Linux VM boots on Trumbo infrastructure with a pinned runtime image, isolated filesystem, and scoped egress allowlist. The agent receives a session handle in seconds, with no local Docker or VM setup on your machine.",
	},
	{
		tag: "Clone repo",
		description:
			"Your repository is cloned into the sandbox over the egress allowlist. Branch, SHA, or PR ref, checked out exactly as CI would. The agent reads the tree before it writes or runs anything.",
	},
	{
		tag: "Install deps",
		description:
			"Package managers run inside the sandbox with network egress enabled. Lockfiles are respected so pip, npm, bun, and apt installs stay reproducible across runs and surfaces.",
	},
	{
		tag: "Execute",
		description:
			"The agent runs shell commands, scripts, and builds against the cloned tree. Each invocation streams stdout, stderr, and exit codes back in real time so the model can react to partial output.",
	},
	{
		tag: "Capture output",
		description:
			"Artifacts, logs, and exit codes are collected before teardown. The agent reads them back to decide the next step, surface a diff, or report CI results to your team.",
	},
	{
		tag: "Cleanup",
		description:
			"The sandbox is torn down and its disk is wiped. Only the artifacts you explicitly surface persist, so nothing stale leaks into the next run or back to your laptop.",
	},
];

function SandboxLifecycleTimeline() {
	const total = SANDBOX_LIFECYCLE_STEPS.length;

	return (
		<div className="border-t border-t-dotted border-grid-line">
			<ol className="flex flex-col">
				{SANDBOX_LIFECYCLE_STEPS.map((step, index) => {
					const isLast = index === total - 1;
					const lineClass =
						index === 0
							? "top-8 md:top-9 bottom-0"
							: isLast
								? "top-0 h-8 md:h-9"
								: "top-0 bottom-0";

					return (
						<li
							key={step.tag}
							className={cn(
								marketingGridListRowClass,
								"relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4 md:gap-x-6",
							)}
						>
							<div className="relative flex flex-col items-center pt-5 md:pt-6">
								<span
									className={cn(
										"absolute left-1/2 w-px -translate-x-1/2 bg-brand/40",
										lineClass,
									)}
									aria-hidden="true"
								/>
								<span className="relative z-[1] inline-flex size-6 items-center justify-center rounded-full border border-brand/50 bg-marketing-content font-stat text-[0.625rem] tabular-nums text-brand">
									{String(index + 1).padStart(2, "0")}
								</span>
							</div>
							<div className="flex flex-col gap-1 py-5 md:flex-row md:items-baseline md:gap-x-6 md:py-6">
								<span className="font-stat text-xs uppercase tracking-[0.1em] text-brand md:w-32 md:shrink-0">
									{step.tag}
								</span>
								<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
									{step.description}
								</p>
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

export function SandboxLifecycleSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Lifecycle"
					heading="Six steps from boot to wipe, every session."
					lead="Each sandbox runs the same deterministic lifecycle. The agent drives every step, and the vertical rail tracks exactly where the session is."
				/>
				<SandboxLifecycleTimeline />
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Benchmark comparison — unique to this page                                    */
/* -------------------------------------------------------------------------- */

export function SandboxBenchmarkSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Benchmarks"
					heading="Honest numbers against the sandbox market."
					lead="Trumbo Sandbox is built for agent tool calls, not raw cold-start races. E2B and Daytona provision faster when you bring your own SDK. Trumbo wins when you want the same sandbox tools in CLI, VS Code, and the platform without wiring a third-party API."
				/>
				<MarketingComparisonTable
					idPrefix="sandbox-benchmark"
					columns={SANDBOX_BENCHMARK_COLUMNS}
					rows={SANDBOX_BENCHMARK_ROWS}
				/>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                                */
/* -------------------------------------------------------------------------- */

const SANDBOX_CAPABILITIES: {
	icon: Icon;
	title: string;
	description: string;
}[] = [
	{
		icon: TerminalWindow,
		title: "Isolated Linux VM",
		description:
			"Each sandbox is a fresh Linux virtual machine with its own filesystem, process tree, and network namespace. Nothing it runs can reach your machine, your secrets, or other sessions.",
	},
	{
		icon: Lightning,
		title: "Real-time exec",
		description:
			"Stream stdout, stderr, and exit codes as they happen. The agent reads partial output to decide the next step instead of waiting for a long-running command to finish.",
	},
	{
		icon: FileCode,
		title: "File I/O",
		description:
			"Read, write, and edit files inside the sandbox. Clone a repo, apply patches, run a build, and collect artifacts, all against an isolated tree the agent controls.",
	},
	{
		icon: Package,
		title: "Package install",
		description:
			"Run pip, npm, bun, and apt inside the sandbox with network egress enabled. Lockfiles are respected so installs stay reproducible across CLI, VS Code, and platform runs.",
	},
	{
		icon: Globe,
		title: "Network egress",
		description:
			"Sandboxed processes can reach allowlisted endpoints to fetch dependencies, call APIs, and pull git remotes. Egress is scoped per session, not opened to the public internet.",
	},
	{
		icon: ArrowsClockwise,
		title: "Clean teardown",
		description:
			"Sandboxes tear down automatically when the task completes. No orphaned containers, no stale processes, and no cleanup scripts left on your machine.",
	},
];

export function SandboxCapabilitiesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Capabilities"
					heading="A real Linux environment, without the setup tax."
					lead="Six primitives cover every sandbox session. The same tool names work from the CLI, VS Code, and the platform, so scripts and CI pipelines behave identically across surfaces."
				/>
				<GridFrame edge="top" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{SANDBOX_CAPABILITIES.map((capability, index) => (
						<div
							key={capability.title}
							className={cn("flex flex-col", capabilitySeparatorClass(index, SANDBOX_CAPABILITIES.length))}
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
/* Use cases — bento layout, unique to this page                                 */
/* -------------------------------------------------------------------------- */

const SANDBOX_USE_CASES: {
	icon: Icon;
	title: string;
	description: string;
	bentoClass: string;
	featured?: boolean;
	accentLabels: readonly string[];
	accentCols?: number;
}[] = [
	{
		icon: GitBranch,
		title: "CI/CD runner",
		description:
			"Run build, test, and deploy steps on Trumbo infrastructure without provisioning runners. Clone, install, execute, and capture artifacts in one sandbox session that mirrors your pipeline.",
		featured: true,
		bentoClass: "md:col-span-2 md:row-span-2",
		accentLabels: ["Clone", "Install", "Test", "Deploy", "Artifacts", "Teardown"],
		accentCols: 3,
	},
	{
		icon: Code,
		title: "Code interpreter",
		description:
			"Give an agent a Python or Node runtime and let it execute generated code to verify answers. Each run is isolated, so a bad script never touches your machine.",
		bentoClass: "md:col-span-2",
		accentLabels: ["Python", "Node"],
	},
	{
		icon: ListChecks,
		title: "Test runner",
		description:
			"Execute test suites in a clean VM on every PR. Reproducible installs, real filesystem isolation, and captured logs for every run.",
		bentoClass: "md:col-span-2",
		accentLabels: ["JUnit", "Vitest"],
	},
	{
		icon: Monitor,
		title: "Interactive dev environment",
		description:
			"Spin up a Linux environment the agent can shell into, install packages in, and iterate against, then tear down when the task is done.",
		bentoClass: "md:col-span-4",
		accentLabels: ["Shell", "Packages", "Iterate", "Wipe"],
		accentCols: 4,
	},
];

function SandboxUseCaseBentoAccent({
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
			className={cn(
				"grid h-full w-full min-h-0 min-w-0 gap-px bg-grid-line",
				className,
			)}
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

function SandboxUseCaseBentoCard({
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
				<SandboxUseCaseBentoAccent
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
						<Icon size={featured ? 20 : 18} weight="duotone" className="shrink-0 text-brand" aria-hidden="true" />
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

export function SandboxUseCasesSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!p-0 md:!border-r-0">
				<SectionBanner
					kicker="Use cases"
					heading="What teams run inside a sandbox."
					lead="Four patterns cover most sandbox workloads. Each one maps to the same six-step lifecycle, just with different inputs and artifacts."
				/>
				<div className="grid min-w-0 grid-cols-1 gap-px bg-grid-line md:grid-cols-6 md:auto-rows-[minmax(18rem,1fr)] lg:auto-rows-[minmax(20rem,1fr)]">
					{SANDBOX_USE_CASES.map((useCase) => (
						<div
							key={useCase.title}
							className={cn("flex h-full min-w-0 flex-col bg-marketing-content", useCase.bentoClass)}
						>
							<SandboxUseCaseBentoCard
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
/* Specifications                                                              */
/* -------------------------------------------------------------------------- */

export function SandboxSpecsSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className={cn(marketingGridCellClass, "flex flex-col justify-center !py-8 md:!py-10")}>
				<p className="marketing-kicker mb-4">Specifications</p>
				<h2 className="max-w-5xl font-heading text-[1.625rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2rem] lg:text-[2.25rem]">
					What every sandbox session guarantees across surfaces.
				</h2>
				<p className="mt-4 max-w-5xl text-lg leading-relaxed text-muted-foreground md:text-xl">
					Runtime image, egress, streaming I/O, teardown, and tool parity are fixed contracts.
					Your agent gets the same environment whether it runs from the terminal or the
					extension.
				</p>
			</GridBoxCell>
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="grid grid-cols-1 md:grid-cols-2">
					{SANDBOX_SPECS.map((spec, index) => (
						<MarketingSpecRow
							key={spec.specKey}
							specKey={spec.specKey}
							value={spec.value}
							note={spec.note}
							index={index}
							total={SANDBOX_SPECS.length}
						/>
					))}
				</div>
			</GridBoxCell>
		</GridBox>
	);
}

/* -------------------------------------------------------------------------- */
/* CTA                                                                         */
/* -------------------------------------------------------------------------- */

export function SandboxCtaSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0">
			<GridBoxCell className="!border-r-0 !p-0">
				<MarketingCtaRow
					copy="Spin up an isolated Linux VM on your next agent task. Same sandbox tools in the CLI, VS Code, and the platform."
					primaryLabel="Get started"
					primaryHref={platformLink("/signup")}
					secondaryLabel="Trumbo Agent"
					secondaryHref="/agent"
				/>
			</GridBoxCell>
		</GridBox>
	);
}
