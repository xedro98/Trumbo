import { useCallback, useState } from "react";
import { LatestBlogPosts } from "@/components/blog/LatestBlogPosts";
import { ProviderLogo } from "@/components/ProviderLogo";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { MODEL_PROVIDERS, type ModelProvider } from "@/lib/model-providers";
import { MARKETING_TESTIMONIAL_BG } from "@/lib/brand";
import { cn } from "@/lib/utils";

const GRID_ROWS = 4;
const GRID_COLS = 3;
const gridCellSizeClass = "size-14 md:size-[3.75rem] lg:size-[4.25rem]";
const sideGridLineClass = "border-foreground/30";

function DevelopersGridCell({ className }: { className?: string }) {
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

function DevelopersGridPanel({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"grid w-fit shrink-0 grid-cols-3 grid-rows-4 border-foreground/30",
				className,
			)}
			aria-hidden="true"
		>
			{Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, index) => {
				const row = Math.floor(index / GRID_COLS);
				const col = index % GRID_COLS;

				return (
					<DevelopersGridCell
						key={index}
						className={cn(col === GRID_COLS - 1 && "border-r-0", row === GRID_ROWS - 1 && "border-b-0")}
					/>
				);
			})}
		</div>
	);
}

function ModelsBannerHeading({ className }: { className?: string }) {
	return (
		<div className={cn("flex flex-col", className)}>
			<p className="marketing-kicker mb-3">Models</p>
			<h2 className="max-w-5xl font-heading text-[1.75rem] font-normal leading-[1.34] tracking-[-0.02em] text-foreground md:text-[2.125rem] lg:text-[2.375rem]">
				Quartz unites the leading model labs, from DeepSeek and Qwen to Kimi and GLM, and the
				open models you can route from one single CLI.
			</h2>
		</div>
	);
}

function ModelsBanner() {
	return (
		<>
			<div className="hidden md:flex md:items-stretch">
				<div className={cn(marketingGridCellClass, "flex flex-1 flex-col justify-center !py-8")}>
					<ModelsBannerHeading />
				</div>
				<DevelopersGridPanel className="border-l border-dotted" />
			</div>
			<div className="md:hidden">
				<div className={cn(marketingGridCellClass, "!py-5")}>
					<ModelsBannerHeading />
				</div>
				<div className={cn("flex justify-end border-t border-dotted", sideGridLineClass)}>
					<DevelopersGridPanel />
				</div>
			</div>
		</>
	);
}

function ProviderTile({
	provider,
	onLogoError,
}: {
	provider: ModelProvider;
	onLogoError: (name: string) => void;
}) {
	return (
		<GridBoxCell className="flex min-h-[5.5rem] items-center justify-center px-3 py-4 md:min-h-24">
			<div className="flex flex-col items-center gap-2.5 text-center">
				<ProviderLogo
					logoUrl={provider.logoUrl}
					className="size-7 md:size-8"
					onError={() => onLogoError(provider.name)}
				/>
				<span className="font-stat text-[0.62rem] uppercase leading-snug tracking-[0.06em] text-foreground/80 md:text-[0.68rem]">
					{provider.name}
				</span>
			</div>
		</GridBoxCell>
	);
}

function ProviderGrid() {
	const [providers, setProviders] = useState(MODEL_PROVIDERS);

	const handleLogoError = useCallback((name: string) => {
		setProviders((current) => current.filter((provider) => provider.name !== name));
	}, []);

	return (
		<GridBox className="grid-cols-2 !border-t-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
			{providers.map((provider) => (
				<ProviderTile key={provider.name} provider={provider} onLogoError={handleLogoError} />
			))}
		</GridBox>
	);
}

const ROUTING_STATS = [
	{ value: "<120ms", label: "P50 routing overhead" },
	{ value: "<450ms", label: "P50 time to first token" },
	{ value: "30+", label: "Models from one CLI" },
	{ value: "50+", label: "SDK providers in one CLI" },
] as const;

function RoutingPerformanceStats() {
	return (
		<GridBox className="grid-cols-2 !border-t-0 md:grid-cols-4">
			{ROUTING_STATS.map((stat) => (
				<GridBoxCell
					key={stat.label}
					className={cn(marketingGridCellClass, "flex flex-col justify-center !py-6 md:!py-7")}
				>
					<p className="font-heading text-[1.75rem] font-normal tracking-[-0.02em] text-foreground tabular-nums md:text-[2rem] lg:text-[2.125rem]">
						{stat.value}
					</p>
					<p className="marketing-kicker mt-4 max-w-[14rem] leading-snug md:mt-5">{stat.label}</p>
				</GridBoxCell>
			))}
		</GridBox>
	);
}

const MODELS_TESTIMONIAL = {
	company: "Linear",
	companyLogoUrl: "https://linear.app/static/apple-touch-icon.png",
	name: "Jasdev Singh",
	role: "Staff Software Engineer",
} as const;

function ModelsCoverVisual() {
	return (
		<div className="relative flex min-h-[24rem] w-full flex-col justify-end overflow-hidden md:min-h-[34rem] lg:min-h-[42rem]">
			<img
				src={MARKETING_TESTIMONIAL_BG}
				alt=""
				className="absolute inset-0 block h-full w-full object-cover object-center"
				decoding="async"
			/>
			<div
				className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/5"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-[1px] [mask-image:linear-gradient(to_top,black,transparent)]"
				aria-hidden="true"
			/>
			<figure className="relative z-10 w-full max-w-7xl pl-8 pr-6 py-8 md:pl-10 md:pr-8 md:py-10 lg:pl-12 lg:pr-10 lg:py-12">
				<blockquote className="max-w-6xl text-pretty font-heading text-2xl font-normal leading-[1.35] tracking-[-0.02em] text-white md:text-[1.75rem] md:leading-[1.34] lg:max-w-none lg:text-[2.375rem] lg:leading-[1.3]">
					&ldquo;We switched models three times in one session fixing a migration. Same context,
					same permissions — no reconfig. That&apos;s when routing stopped being a feature and
					became the workflow.&rdquo;
				</blockquote>
				<figcaption className="mt-6 flex items-center gap-4 md:gap-5">
					<div className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/25 md:size-10">
						<img
							src={MODELS_TESTIMONIAL.companyLogoUrl}
							alt={MODELS_TESTIMONIAL.company}
							className="size-full object-cover"
							decoding="async"
							loading="lazy"
						/>
					</div>
					<div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
						<span className="font-stat text-xs uppercase tracking-[0.08em] text-white/85">
							{MODELS_TESTIMONIAL.name}
						</span>
						<span
							className="hidden h-3 w-px shrink-0 bg-white/25 sm:block"
							aria-hidden="true"
						/>
						<span className="font-stat text-xs uppercase tracking-[0.08em] text-white/55">
							{MODELS_TESTIMONIAL.role}, {MODELS_TESTIMONIAL.company}
						</span>
					</div>
				</figcaption>
			</figure>
		</div>
	);
}

export function DevelopersSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-6">
			<GridBoxCell className="!p-0 md:col-span-6">
				<ModelsBanner />
			</GridBoxCell>

			<GridBoxCell className="!p-0 md:col-span-6">
				<ProviderGrid />
			</GridBoxCell>

			<GridBoxCell className={cn("md:col-span-6", marketingGridCellClass)}>
				<p className="max-w-5xl text-base leading-relaxed text-muted-foreground md:text-lg">
					Route each request to the model that fits the work. Reach for a fast model when you
					need quick edits, a reasoning model when the problem is hard, or a provider your
					team has already approved when policy matters.
				</p>
				<p className="mt-4 max-w-5xl text-base leading-relaxed text-muted-foreground md:text-lg">
					Switch by task, latency, cost, or org rules without leaving the CLI, reconfiguring
					tools, or rebuilding your agent setup. The same workflow, permissions, and session
					carry across every provider in the library.
				</p>
			</GridBoxCell>

			<GridBoxCell className="!p-0 md:col-span-6">
				<RoutingPerformanceStats />
			</GridBoxCell>

			<GridBoxCell className="!p-0 md:col-span-6">
				<ModelsCoverVisual />
			</GridBoxCell>

			<GridBoxCell className="!p-0 md:col-span-6">
				<LatestBlogPosts />
			</GridBoxCell>
		</GridBox>
	);
}
