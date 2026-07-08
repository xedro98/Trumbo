import * as React from "react";
import { useGridShellConnected } from "@/components/grid-shell-context";
import { cn, titleCase } from "@/lib/utils";

const gridLineColor = "border-grid-line";
const gridLineHorizontal = `${gridLineColor} border-b border-b-dotted`;
const gridLineHorizontalTop = `${gridLineColor} border-t border-t-dotted`;
const gridLineVertical = `${gridLineColor} border-r border-solid`;
const gridLineVerticalLeft = `${gridLineColor} border-l border-solid`;
const gridLineFrameVertical = `${gridLineColor} border-x border-solid`;
const gridLineFrameHorizontal = `${gridLineColor} border-y border-y-dotted`;

const shellGridWidthClass = "w-full min-w-0";
const shellGridRightEdgeClass = "md:border-r-0";
const shellGridConnectedClass =
	"md:divide-x md:divide-solid md:divide-grid-line md:border-l-0";
const shellGridCellConnectedClass = "md:border-r-0";

export function GridBox({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const shellConnected = useGridShellConnected();

	return (
		<div
			className={cn(
				"grid",
				shellGridWidthClass,
				gridLineHorizontalTop,
				shellConnected
					? cn(gridLineVerticalLeft, shellGridConnectedClass)
					: gridLineVerticalLeft,
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

type GridBoxCellProps =
	| (React.HTMLAttributes<HTMLDivElement> & { as?: "div" })
	| (React.ButtonHTMLAttributes<HTMLButtonElement> & { as: "button" });

export function GridBoxCell(props: GridBoxCellProps) {
	const { as = "div", className, children, ...rest } = props;
	const Tag = as;
	const shellConnected = useGridShellConnected();

	return (
		<Tag
			className={cn(
				"bg-transparent p-5 md:p-6",
				gridLineVertical,
				gridLineHorizontal,
				shellConnected && shellGridCellConnectedClass,
				Tag === "button" &&
					"h-full w-full cursor-pointer text-left transition-colors hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40",
				className,
			)}
			{...(rest as object)}
		>
			{children}
		</Tag>
	);
}

export function GridBoxStack({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const shellConnected = useGridShellConnected();

	return (
		<div
			className={cn(
				"bg-transparent",
				shellGridWidthClass,
				gridLineFrameVertical,
				gridLineFrameHorizontal,
				shellConnected ? cn("md:border-l-0", shellGridRightEdgeClass) : null,
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function GridBoxStackCell({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"bg-transparent p-5 md:p-6 last:border-b-0",
				gridLineHorizontal,
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function GridBoxHeader({
	title,
	description,
	className,
	actions,
}: {
	title: React.ReactNode;
	description?: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
}) {
	const heading = typeof title === "string" ? titleCase(title) : title;
	const subheading =
		typeof description === "string" ? titleCase(description) : description;

	return (
		<div
			className={cn(
				"flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between",
				className,
			)}
		>
			<div>
				<h2 className="text-lg font-semibold tracking-tight text-foreground">{heading}</h2>
				{subheading ? (
					<p className="mt-1 text-base text-muted-foreground">{subheading}</p>
				) : null}
			</div>
			{actions ? <div className="shrink-0">{actions}</div> : null}
		</div>
	);
}

export function GridBoxList({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn(gridLineHorizontalTop, className)} {...props}>
			{children}
		</div>
	);
}

export function GridBoxListRow({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-2 px-4 py-3 last:border-b-0",
				gridLineHorizontal,
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
