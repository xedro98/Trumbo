import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const trumboBadge = cva(
	"inline-flex items-center gap-1 font-medium font-brand-sans leading-none whitespace-nowrap [&_svg]:size-3",
	{
		variants: {
			variant: {
				brand:
					"bg-[color-mix(in_srgb,var(--brand)_16%,transparent)] text-[var(--brand)]",
				neutral:
					"bg-[color-mix(in_srgb,var(--vscode-foreground)_10%,transparent)] text-[color:var(--vscode-foreground)]",
				outline:
					"border border-[var(--color-border)] text-[color-mix(in_srgb,var(--vscode-foreground)_80%,transparent)]",
				success:
					"bg-[color-mix(in_srgb,var(--vscode-charts-green)_18%,transparent)] text-[var(--vscode-charts-green)]",
				warning:
					"bg-[color-mix(in_srgb,var(--vscode-charts-yellow)_18%,transparent)] text-[var(--vscode-charts-yellow)]",
				danger:
					"bg-[color-mix(in_srgb,var(--vscode-errorForeground)_16%,transparent)] text-[var(--vscode-errorForeground)]",
			},
			size: {
				xs: "h-4 rounded px-1.5 text-[10px]",
				sm: "h-5 rounded px-1.5 text-[11px]",
				md: "h-6 rounded-md px-2 text-xs",
			},
		},
		defaultVariants: { variant: "brand", size: "sm" },
	},
)

export interface TrumboBadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof trumboBadge> {}

/** TrumboBadge — compact status/plan pill. */
export const TrumboBadge = React.forwardRef<HTMLSpanElement, TrumboBadgeProps>(
	({ className, variant, size, ...props }, ref) => (
		<span ref={ref} className={cn(trumboBadge({ variant, size }), className)} {...props} />
	),
)
TrumboBadge.displayName = "TrumboBadge"
