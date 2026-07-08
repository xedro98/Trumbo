import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * TrumboSelect — a bespoke dropdown built on Radix Select for accessibility,
 * with a fully custom Trumbo-styled trigger, content, and items. Branded
 * focus ring, brand check on the selected item, soft elevation on the panel.
 */
export const TrumboSelect = SelectPrimitive.Root

export const TrumboSelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
		/** Optional leading icon. */
		leadingIcon?: React.ReactNode
	}
>(({ className, leadingIcon, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			"flex h-8 w-full items-center gap-2 rounded-lg border border-[var(--color-input-border,var(--color-border))] bg-[var(--vscode-input-background)] px-2.5 font-brand-sans text-[13px] text-[var(--vscode-input-foreground,var(--vscode-foreground))] outline-none transition-[border-color,box-shadow] duration-150",
			"data-[placeholder]:text-[var(--vscode-input-placeholderForeground,var(--vscode-descriptionForeground))]",
			"focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)]",
			"disabled:cursor-not-allowed disabled:opacity-50",
			className,
		)}
		{...props}>
		{leadingIcon && (
			<span className="flex size-4 shrink-0 items-center justify-center text-[color-mix(in_srgb,var(--vscode-foreground)_55%,transparent)] [&_svg]:size-4">
				{leadingIcon}
			</span>
		)}
		<span className="min-w-0 flex-1 truncate text-left">{children}</span>
		<SelectPrimitive.Icon asChild>
			<ChevronDownIcon className="size-3.5 shrink-0 text-[color-mix(in_srgb,var(--vscode-foreground)_55%,transparent)] transition-transform duration-150 data-[state=open]:rotate-180" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
))
TrumboSelectTrigger.displayName = "TrumboSelectTrigger"

export const TrumboSelectValue = SelectPrimitive.Value

export const TrumboSelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			ref={ref}
			position={position}
			className={cn(
				"relative z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--vscode-menu-background,var(--vscode-sideBar-background))] py-1 font-brand-sans text-[13px] shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)]",
				"data-[state=open]:animate-fade-in",
				className,
			)}
			{...props}>
			<SelectPrimitive.Viewport className="p-0">{children}</SelectPrimitive.Viewport>
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
))
TrumboSelectContent.displayName = "TrumboSelectContent"

export const TrumboSelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			"relative flex w-full cursor-pointer select-none items-center gap-2 py-1.5 pl-2.5 pr-7 text-[color:var(--vscode-foreground)] outline-none",
			"data-[highlighted]:bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] data-[highlighted]:text-[var(--brand)]",
			"data-[state=checked]:text-[var(--brand)]",
			className,
		)}
		{...props}>
		<span className="min-w-0 flex-1 truncate">{children}</span>
		<SelectPrimitive.ItemIndicator className="absolute right-2 flex size-3.5 items-center justify-center text-[var(--brand)]">
			<CheckIcon className="size-3.5" strokeWidth={3} />
		</SelectPrimitive.ItemIndicator>
	</SelectPrimitive.Item>
))
TrumboSelectItem.displayName = "TrumboSelectItem"
