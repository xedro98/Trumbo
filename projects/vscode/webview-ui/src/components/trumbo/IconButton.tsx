import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const trumboIconBtn = cva(
	"inline-flex items-center justify-center outline-none transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-full [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				ghost:
					"bg-transparent text-[color-mix(in_srgb,var(--vscode-foreground)_72%,transparent)] hover:bg-[color-mix(in_srgb,var(--vscode-foreground)_10%,transparent)] hover:text-[color:var(--vscode-foreground)]",
				active:
					"bg-[color-mix(in_srgb,var(--brand)_16%,transparent)] text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_24%,transparent)]",
				brand:
					"bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand-hover)]",
				outline:
					"border border-[var(--color-border)] text-[color:var(--vscode-foreground)] hover:bg-[color-mix(in_srgb,var(--brand)_8%,transparent)] hover:border-[var(--brand-ring)]",
			},
			size: {
				xs: "size-6 rounded-md p-1.5",
				sm: "size-7 rounded-md p-1.5",
				md: "size-8 rounded-lg p-2",
				lg: "size-9 rounded-lg p-2",
			},
		},
		defaultVariants: { variant: "ghost", size: "md" },
	},
)

export interface TrumboIconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof trumboIconBtn> {
	/** Accessible label (required for icon-only buttons). */
	label: string
}

/** TrumboIconButton — compact icon-only button with required accessible label. */
export const TrumboIconButton = React.forwardRef<HTMLButtonElement, TrumboIconButtonProps>(
	({ className, variant, size, label, type = "button", ...props }, ref) => (
		<button
			ref={ref}
			type={type}
			aria-label={label}
			title={label}
			className={cn(trumboIconBtn({ variant, size }), className)}
			{...props}
		/>
	),
)
TrumboIconButton.displayName = "TrumboIconButton"
