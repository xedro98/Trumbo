import * as React from "react"
import { cn } from "@/lib/utils"

export interface TrumboToggleProps {
	checked: boolean
	onChange: (checked: boolean) => void
	label?: React.ReactNode
	disabled?: boolean
	size?: "sm" | "md"
	className?: string
	/** Accessible label when no visible label is provided. */
	ariaLabel?: string
}

/**
 * TrumboToggle — a bespoke pill switch: brand-green track + white knob when
 * on, muted track when off. Branded focus ring. Optional inline label.
 */
export const TrumboToggle = React.forwardRef<HTMLButtonElement, TrumboToggleProps>(
	({ checked, onChange, label, disabled = false, size = "md", className, ariaLabel }, ref) => {
		const dims =
			size === "sm"
				? { track: "h-4 w-7", knob: "size-3", travel: "translate-x-3" }
				: { track: "h-5 w-9", knob: "size-4", travel: "translate-x-4" }
		const toggle = (
			<button
				ref={ref}
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
				disabled={disabled}
				onClick={() => !disabled && onChange(!checked)}
				className={cn(
					"relative inline-flex shrink-0 items-center rounded-full outline-none transition-[background-color,box-shadow] duration-200",
					dims.track,
					checked ? "bg-[var(--brand)]" : "bg-[color-mix(in_srgb,var(--vscode-foreground)_22%,transparent)]",
					"focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vscode-sideBar-background)]",
					disabled && "opacity-50",
				)}>
				<span
					className={cn(
						"inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200",
						dims.knob,
						checked ? dims.travel : "translate-x-0.5",
					)}
				/>
			</button>
		)
		if (!label) return <div className={className}>{toggle}</div>
		return (
			<div className={cn("flex items-center gap-2.5", disabled && "opacity-55", className)}>
				{toggle}
				<span className="text-[13px] font-medium font-brand-sans text-[color:var(--vscode-foreground)]">
					{label}
				</span>
			</div>
		)
	},
)
TrumboToggle.displayName = "TrumboToggle"
