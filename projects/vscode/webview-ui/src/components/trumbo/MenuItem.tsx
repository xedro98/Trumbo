import * as React from "react"
import { cn } from "@/lib/utils"

export interface TrumboMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** Leading icon node. */
	icon?: React.ReactNode
	/** Whether this item is the active/selected one. */
	active?: boolean
	/** Trailing badge or count. */
	trailing?: React.ReactNode
}

/**
 * TrumboMenuItem — a vertical-nav row: icon + label, with a brand left bar,
 * soft brand-tinted active background, and brand-colored active label. Used
 * for the redesigned settings sidebar and the new top-level menu.
 */
export const TrumboMenuItem = React.forwardRef<HTMLButtonElement, TrumboMenuItemProps>(
	({ icon, active = false, trailing, className, children, type = "button", ...props }, ref) => (
		<button
			ref={ref}
			type={type}
			aria-current={active ? "page" : undefined}
			className={cn(
				"group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium font-brand-sans outline-none transition-[background-color,color] duration-150",
				active
					? "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-[var(--brand)]"
					: "text-[color-mix(in_srgb,var(--vscode-foreground)_78%,transparent)] hover:bg-[color-mix(in_srgb,var(--vscode-foreground)_7%,transparent)] hover:text-[color:var(--vscode-foreground)]",
				"focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
				className,
			)}
			{...props}>
			{active && (
				<span
					aria-hidden
					className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--brand)]"
				/>
			)}
			{icon && (
				<span
					className={cn(
						"flex size-4 shrink-0 items-center justify-center [&_svg]:size-4",
						active ? "text-[var(--brand)]" : "text-[color-mix(in_srgb,var(--vscode-foreground)_60%,transparent)]",
					)}>
					{icon}
				</span>
			)}
			<span className="min-w-0 flex-1 truncate">{children}</span>
			{trailing && <span className="shrink-0">{trailing}</span>}
		</button>
	),
)
TrumboMenuItem.displayName = "TrumboMenuItem"
