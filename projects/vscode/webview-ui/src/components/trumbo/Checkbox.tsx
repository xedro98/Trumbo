import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TrumboCheckboxProps {
	checked: boolean
	onChange: (checked: boolean) => void
	label?: React.ReactNode
	description?: React.ReactNode
	disabled?: boolean
	className?: string
	id?: string
}

/**
 * TrumboCheckbox — bespoke square checkbox with a brand-green fill + white
 * check when checked, a brand focus ring, and an optional label/description
 * row that toggles on click. Replaces VSCodeCheckbox across settings.
 */
export const TrumboCheckbox = React.forwardRef<HTMLButtonElement, TrumboCheckboxProps>(
	({ checked, onChange, label, description, disabled = false, className, id }, ref) => {
		const handleToggle = () => {
			if (!disabled) onChange(!checked)
		}
		return (
			<div className={cn("flex items-start gap-2.5", disabled && "opacity-55", className)}>
				<button
					ref={ref}
					type="button"
					role="checkbox"
					id={id}
					aria-checked={checked}
					aria-label={typeof label === "string" ? label : undefined}
					disabled={disabled}
					onClick={handleToggle}
					className={cn(
						"mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border outline-none transition-[background-color,border-color,box-shadow] duration-150",
						checked
							? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
							: "border-[var(--color-border)] bg-transparent hover:border-[var(--brand-ring)]",
						"focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--vscode-sideBar-background)]",
					)}>
					{checked && <CheckIcon className="size-3" strokeWidth={3.5} />}
				</button>
				{(label || description) && (
					<label
						htmlFor={id}
						onClick={handleToggle}
						className="cursor-pointer select-none text-[13px] leading-tight text-[color:var(--vscode-foreground)]">
						{label && <div className="font-medium font-brand-sans">{label}</div>}
						{description && (
							<div className="mt-0.5 text-xs leading-relaxed text-[color:var(--vscode-descriptionForeground)]">
								{description}
							</div>
						)}
					</label>
				)}
			</div>
		)
	},
)
TrumboCheckbox.displayName = "TrumboCheckbox"
