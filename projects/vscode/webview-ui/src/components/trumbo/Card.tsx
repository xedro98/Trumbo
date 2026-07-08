import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * TrumboCard — the branded surface: a subtle brand-tinted background, a
 * hairline border, a soft inner top hairline in brand green, and a generous
 * rounded corner. Use for grouped content across settings/account/onboarding.
 */
export const TrumboCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
	/** Add the brand top hairline accent. */
	accent?: boolean
	/** Remove padding for cards that manage their own spacing. */
	flush?: boolean
}>(({ className, accent = true, flush = false, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"rounded-xl border border-[var(--color-border-panel)] bg-[color-mix(in_srgb,var(--brand)_4%,var(--vscode-sideBar-background))]",
			accent && "shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--brand)_16%,transparent)]",
			!flush && "p-4",
			className,
		)}
		{...props}
	/>
))
TrumboCard.displayName = "TrumboCard"

/** Card section header with a title + optional description + action slot. */
export const TrumboCardHeader = ({
	title,
	description,
	action,
	className,
}: {
	title: React.ReactNode
	description?: React.ReactNode
	action?: React.ReactNode
	className?: string
}) => (
	<div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
		<div className="min-w-0">
			<h3 className="font-heading text-[13px] font-semibold tracking-tight text-[color:var(--vscode-foreground)]">
				{title}
			</h3>
			{description && (
				<p className="mt-0.5 text-xs leading-relaxed text-[color:var(--vscode-descriptionForeground)]">
					{description}
				</p>
			)}
		</div>
		{action && <div className="shrink-0">{action}</div>}
	</div>
)
