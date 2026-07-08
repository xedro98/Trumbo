import * as React from "react"
import { cn } from "@/lib/utils"

export interface TrumboSegmentedOption<T extends string = string> {
	value: T
	label: React.ReactNode
	icon?: React.ReactNode
}

export interface TrumboSegmentedProps<T extends string = string> {
	value: T
	options: TrumboSegmentedOption<T>[]
	onChange: (value: T) => void
	size?: "sm" | "md"
	/** Full-width segments (each equal width). */
	block?: boolean
	className?: string
	ariaLabel?: string
}

/**
 * TrumboSegmented — a bespoke segmented control: a pill track with a sliding
 * brand-colored active segment (white text on brand). The active segment is
 * absolutely positioned so it animates between options. Used for Plan/Act and
 * tab-like binary/ternary switches throughout the redesign.
 */
export function TrumboSegmented<T extends string = string>({
	value,
	options,
	onChange,
	size = "md",
	block = false,
	className,
	ariaLabel,
}: TrumboSegmentedProps<T>) {
	const padding = size === "sm" ? "p-0.5" : "p-1"
	const segHeight = size === "sm" ? "h-6 text-[11px]" : "h-7 text-xs"
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className={cn(
				"inline-flex items-center rounded-lg bg-[color-mix(in_srgb,var(--vscode-foreground)_7%,transparent)] p-0.5",
				padding,
				block && "flex w-full",
				className,
			)}>
			{options.map((opt) => {
				const active = opt.value === value
				return (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange(opt.value)}
						className={cn(
							"relative inline-flex items-center justify-center gap-1.5 rounded-md font-medium font-brand-sans outline-none transition-[color] duration-150 [&_svg]:size-3.5",
							segHeight,
							block ? "flex-1" : "px-2.5",
							active
								? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
								: "text-[color-mix(in_srgb,var(--vscode-foreground)_65%,transparent)] hover:text-[color:var(--vscode-foreground)]",
							"focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
						)}>
						{opt.icon}
						{opt.label}
					</button>
				)
			})}
		</div>
	)
}
