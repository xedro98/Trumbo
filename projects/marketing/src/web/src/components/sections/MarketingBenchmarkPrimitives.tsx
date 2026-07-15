import type { ReactNode } from "react";
import { marketingGridCellClass, marketingGridListRowClass } from "@/components/grid-shell-context";
import { Button } from "@/components/ui/button";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";

const specKeyClass =
	"font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground md:text-xs";
const specValueClass =
	"font-stat text-[0.8125rem] tabular-nums text-foreground md:text-sm";

export function MarketingManifestRow({
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
			<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{description}
			</p>
		</div>
	);
}

export function MarketingComparisonRow({
	label,
	values,
	columns,
	index,
	total,
}: {
	label: string;
	values: readonly string[];
	columns: readonly { name: string; featured?: boolean }[];
	index: number;
	total: number;
}) {
	const gridTemplateClass =
		columns.length === 3
			? "md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
			: "md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]";

	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-2 px-5 py-4 md:items-center md:gap-6 md:px-8 md:py-5 lg:px-10",
				gridTemplateClass,
				index < total - 1 && "border-b border-b-dotted border-grid-line",
			)}
		>
			<span className={specKeyClass}>{label}</span>
			<div className="flex flex-col gap-2 md:contents">
				{values.map((value, valueIndex) => (
					<div
						key={columns[valueIndex]?.name ?? valueIndex}
						className="flex items-center justify-between gap-4 md:justify-end"
					>
						<span className={cn(specKeyClass, "md:hidden")}>
							{columns[valueIndex]?.name}
						</span>
						<span
							className={cn(
								specValueClass,
								"md:text-right",
								columns[valueIndex]?.featured && "text-brand",
							)}
						>
							{value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function MarketingComparisonTable({
	columns,
	rows,
	idPrefix,
}: {
	columns: readonly { name: string; featured?: boolean }[];
	rows: readonly { label: string; values: readonly string[] }[];
	idPrefix: string;
}) {
	const gridTemplateClass =
		columns.length === 3
			? "md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
			: "md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]";

	return (
		<div className="border-t border-t-dotted border-grid-line">
			<div
				className={cn(
					marketingGridCellClass,
					"hidden gap-6 !py-5 md:grid md:items-center md:!py-6",
					gridTemplateClass,
				)}
			>
				<span className={specKeyClass}>Dimension</span>
				{columns.map((column) => (
					<span
						key={`${idPrefix}-col-${column.name}`}
						className={cn(specKeyClass, "md:text-right", column.featured && "text-brand")}
					>
						{column.name}
					</span>
				))}
			</div>
			<div className={cn(marketingGridCellClass, "border-t border-t-dotted border-grid-line !py-5 md:hidden")}>
				<p className={specKeyClass}>Comparison by dimension</p>
			</div>
			{rows.map((row, index) => (
				<MarketingComparisonRow
					key={`${idPrefix}-row-${row.label}`}
					label={row.label}
					values={row.values}
					columns={columns}
					index={index}
					total={rows.length}
				/>
			))}
		</div>
	);
}

export function MarketingSpecRow({
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
	return (
		<div
			className={cn(
				marketingGridCellClass,
				"flex flex-col gap-2 !py-5 md:!py-6",
				index % 2 === 0 && "md:border-r md:border-r-dotted md:border-grid-line",
				index < total - 2 && "border-b border-b-dotted border-grid-line",
				index === total - 2 && total % 2 === 0 && "md:border-b-0",
				index === total - 1 && "border-b-0",
			)}
		>
			<span className={specKeyClass}>{specKey}</span>
			<span className={specValueClass}>{value}</span>
			{note ? (
				<p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
					{note}
				</p>
			) : null}
		</div>
	);
}

export function MarketingBenchmarkFootnote({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className={cn(marketingGridCellClass, "border-t border-t-dotted border-grid-line !py-5 md:!py-6")}>
			<p className="max-w-5xl text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{children}
			</p>
		</div>
	);
}

export function MarketingCtaRow({
	copy,
	primaryLabel = "Get started",
	primaryHref = platformLink("/signup"),
	secondaryLabel,
	secondaryHref,
}: {
	copy: string;
	primaryLabel?: string;
	primaryHref?: string;
	secondaryLabel?: string;
	secondaryHref?: string;
}) {
	return (
		<div
			className={cn(
				marketingGridCellClass,
				"flex flex-col gap-4 !py-5 md:flex-row md:items-center md:justify-between md:!py-6",
			)}
		>
			<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
				{copy}
			</p>
			<div className="flex flex-wrap gap-3">
				<Button
					onClick={() => {
						window.location.href = primaryHref;
					}}
				>
					{primaryLabel}
				</Button>
				{secondaryLabel && secondaryHref ? (
					<Button
						variant="outline"
						onClick={() => {
							window.location.href = secondaryHref;
						}}
					>
						{secondaryLabel}
					</Button>
				) : null}
			</div>
		</div>
	);
}
