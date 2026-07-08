import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * TrumboButton — the bespoke primary button of the Trumbo design system.
 * Solid brand-green for primary actions, subtle surfaces for secondary, and
 * quiet ghosts for chrome. Branded focus ring + soft press feedback.
 */
const trumboButton = cva(
	"inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium font-brand-sans select-none outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				primary:
					"bg-[var(--brand)] text-[var(--brand-foreground)] shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset] hover:bg-[var(--brand-hover)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vscode-sideBar-background)]",
				secondary:
					"bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_20%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
				outline:
					"border border-[var(--color-border)] bg-transparent text-[color:var(--vscode-foreground)] hover:bg-[color-mix(in_srgb,var(--brand)_8%,transparent)] hover:border-[var(--brand-ring)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
				ghost:
					"bg-transparent text-[color:var(--vscode-foreground)] hover:bg-[color-mix(in_srgb,var(--vscode-foreground)_8%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
				danger:
					"bg-[var(--vscode-errorForeground,#c42b2b)] text-white hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--vscode-errorForeground,#c42b2b)]/50",
				subtle:
					"bg-[color-mix(in_srgb,var(--vscode-foreground)_6%,transparent)] text-[color:var(--vscode-foreground)] hover:bg-[color-mix(in_srgb,var(--vscode-foreground)_12%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
			},
			size: {
				xs: "h-6 rounded-md px-2 text-[11px] [&_svg]:size-3.5",
				sm: "h-7 rounded-md px-2.5 text-xs [&_svg]:size-4",
				md: "h-8 rounded-lg px-3 text-[13px] [&_svg]:size-4",
				lg: "h-10 rounded-lg px-4 text-sm [&_svg]:size-[18px]",
				icon: "size-8 rounded-lg [&_svg]:size-4",
				"icon-sm": "size-7 rounded-md [&_svg]:size-4",
				"icon-xs": "size-6 rounded-md [&_svg]:size-3.5",
			},
			block: { true: "w-full" },
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
)

export interface TrumboButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof trumboButton> {
	/** Stretch to fill the parent width. */
	block?: boolean
}

export const TrumboButton = React.forwardRef<HTMLButtonElement, TrumboButtonProps>(
	({ className, variant, size, block, type = "button", ...props }, ref) => (
		<button ref={ref} type={type} className={cn(trumboButton({ variant, size, block }), className)} {...props} />
	),
)
TrumboButton.displayName = "TrumboButton"
