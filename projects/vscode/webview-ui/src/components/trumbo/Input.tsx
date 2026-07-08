import * as React from "react"
import { cn } from "@/lib/utils"

export interface TrumboInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	/** Optional leading icon node. */
	leadingIcon?: React.ReactNode
	/** Optional trailing adornment (e.g. a unit, clear button). */
	trailing?: React.ReactNode
}

/**
 * TrumboInput — bordered text field with a brand focus ring, optional leading
 * icon and trailing adornment. Tracks VS Code input bg/foreground and tints
 * the focus state brand-green.
 */
export const TrumboInput = React.forwardRef<HTMLInputElement, TrumboInputProps>(
	({ className, leadingIcon, trailing, type = "text", ...props }, ref) => {
		const hasLeading = Boolean(leadingIcon)
		const hasTrailing = Boolean(trailing)
		return (
			<div
				className={cn(
					"group relative flex items-center rounded-lg border border-[var(--color-input-border,var(--color-border))] bg-[var(--vscode-input-background)] transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand-ring)]",
					className,
				)}>
				{hasLeading && (
					<span className="pointer-events-none flex size-4 shrink-0 items-center justify-center pl-2.5 text-[color-mix(in_srgb,var(--vscode-foreground)_55%,transparent)] [&_svg]:size-4">
						{leadingIcon}
					</span>
				)}
				<input
					ref={ref}
					type={type}
					className={cn(
						"h-8 w-full bg-transparent font-brand-sans text-[13px] text-[var(--vscode-input-foreground,var(--vscode-foreground))] outline-none placeholder:text-[var(--vscode-input-placeholderForeground,var(--vscode-descriptionForeground))]",
						hasLeading ? "pl-2" : "pl-2.5",
						hasTrailing ? "pr-2" : "pr-2.5",
					)}
					{...props}
				/>
				{hasTrailing && <span className="flex shrink-0 items-center pr-2.5">{trailing}</span>}
			</div>
		)
	},
)
TrumboInput.displayName = "TrumboInput"

/** TrumboTextarea — multiline companion to TrumboInput with the same focus ring. */
export const TrumboTextarea = React.forwardRef<
	HTMLTextAreaElement,
	React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
	<textarea
		ref={ref}
		className={cn(
			"w-full rounded-lg border border-[var(--color-input-border,var(--color-border))] bg-[var(--vscode-input-background)] px-2.5 py-2 font-brand-sans text-[13px] leading-relaxed text-[var(--vscode-input-foreground,var(--vscode-foreground))] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--vscode-input-placeholderForeground,var(--vscode-descriptionForeground))] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)]",
			className,
		)}
		{...props}
	/>
))
TrumboTextarea.displayName = "TrumboTextarea"
