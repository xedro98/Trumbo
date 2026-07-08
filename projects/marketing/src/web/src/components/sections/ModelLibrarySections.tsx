import { MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { ProviderLogo } from "@/components/ProviderLogo";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import {
	MODEL_LIBRARY_PROVIDERS,
	TOTAL_MODEL_COUNT,
	providerLogoUrl,
	type ProviderGroup,
} from "@/lib/model-library";
import { cn } from "@/lib/utils";

export function ModelLibraryHeroSection() {
	return (
		<div className="mt-2 md:mt-4">
			<p className="marketing-kicker mb-6">Model Library</p>
			<h1 className="marketing-hero-heading mb-7 max-w-5xl">
				Every open model you can run through Trumbo today, one CLI.
			</h1>
			<p className="max-w-5xl text-lg leading-relaxed text-muted-foreground md:max-w-6xl md:text-xl lg:text-[1.375rem] lg:leading-[1.6]">
				{MODEL_LIBRARY_PROVIDERS.length} model families and {TOTAL_MODEL_COUNT}+ models
				supported by Trumbo. Search for a specific model or browse by family. Route any of
				them from one CLI without resetting your session.
			</p>
		</div>
	);
}

export function ModelLibraryListSection() {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return MODEL_LIBRARY_PROVIDERS;
		return MODEL_LIBRARY_PROVIDERS.map((provider) => {
			if (
				provider.name.toLowerCase().includes(q) ||
				provider.description.toLowerCase().includes(q)
			) {
				return provider;
			}
			const matchingModels = provider.models.filter(
				(m) =>
					m.id.toLowerCase().includes(q) ||
					m.name.toLowerCase().includes(q),
			);
			if (matchingModels.length === 0) return null;
			return { ...provider, models: matchingModels };
		}).filter((p): p is ProviderGroup => p !== null);
	}, [query]);

	const visibleCount = filtered.reduce((sum, p) => sum + p.models.length, 0);

	return (
		<GridBox className="grid-cols-1 !border-t-0">
			{/* Search input — full width, edge to end */}
			<GridBoxCell className="!border-r-0 !p-0">
				<div className="relative w-full">
					<MagnifyingGlass
						size={20}
						className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground md:left-6"
						aria-hidden="true"
					/>
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search models, providers, or modalities..."
						className="font-stat w-full border-b border-b-dotted border-grid-line bg-transparent py-5 pl-14 pr-5 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none focus:ring-0 md:py-6 md:pl-16 md:pr-6 md:text-lg"
					/>
				</div>
			</GridBoxCell>

			{/* Result count strip */}
			<GridBoxCell className={cn(marketingGridCellClass, "!py-3 !border-r-0")}>
				<p className="font-stat text-xs uppercase tracking-[0.08em] text-muted-foreground">
					{visibleCount} {visibleCount === 1 ? "model" : "models"}
					{query ? ` matching "${query}"` : " available"}
				</p>
			</GridBoxCell>

			{/* Model list */}
			<GridBoxCell className="!border-r-0 !p-0">
				{filtered.length === 0 ? (
					<div className={cn(marketingGridCellClass, "!py-16 text-center")}>
						<p className="font-stat text-sm uppercase tracking-[0.08em] text-muted-foreground">
							No models found. Try a different search.
						</p>
					</div>
				) : (
					<div className="flex flex-col">
						{filtered.map((provider, index) => (
							<ModelProviderSection
								key={provider.name}
								provider={provider}
								isLast={index === filtered.length - 1}
							/>
						))}
					</div>
				)}
			</GridBoxCell>
		</GridBox>
	);
}

function ModelProviderSection({
	provider,
	isLast,
}: {
	provider: ProviderGroup;
	isLast: boolean;
}) {
	return (
		<div className={cn("flex flex-col", !isLast && "border-b border-b-dotted border-grid-line")}>
			{/* Provider header */}
			<div className={cn(marketingGridCellClass, "flex items-center gap-4 !py-5 md:!py-6")}>
				<ProviderLogo
					logoUrl={providerLogoUrl(provider.labId)}
					className="size-8 md:size-9"
				/>
				<div className="flex flex-col gap-0.5">
					<h3 className="font-heading text-lg font-semibold leading-snug text-foreground md:text-xl">
						{provider.name}
					</h3>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{provider.description}
					</p>
				</div>
				<span className="font-stat ml-auto shrink-0 text-xs uppercase tracking-[0.08em] text-muted-foreground">
					{provider.models.length} {provider.models.length === 1 ? "model" : "models"}
				</span>
			</div>

			{/* Model rows */}
			<div className="flex flex-col">
				{provider.models.map((model, i) => (
					<ModelRow
						key={model.id}
						model={model}
						isLast={i === provider.models.length - 1}
					/>
				))}
			</div>
		</div>
	);
}

function ModelRow({
	model,
	isLast,
}: {
	model: { id: string; name: string };
	isLast: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-4 px-5 py-3.5 md:px-8 md:py-4 lg:px-10 lg:py-4",
				!isLast && "border-b border-b-dotted border-grid-line",
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="text-sm font-medium leading-snug text-foreground md:text-[0.9375rem]">
					{model.name}
				</span>
				<span className="font-stat truncate text-[0.75rem] tracking-[0.02em] text-muted-foreground">
					{model.id}
				</span>
			</div>
		</div>
	);
}
