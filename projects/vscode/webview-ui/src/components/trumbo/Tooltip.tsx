import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

/**
 * TrumboTooltip — a thin branded tooltip. Wrap a trigger node and pass
 * `content`. Uses Radix Tooltip under the hood (delayDuration 300ms).
 */
export function TrumboTooltip({
	content,
	children,
	side = "top",
	className,
	disabled = false,
}: {
	content: React.ReactNode
	children: React.ReactNode
	side?: "top" | "right" | "bottom" | "left"
	className?: string
	disabled?: boolean
}) {
	if (disabled) return <>{children}</>
	return (
		<TooltipPrimitive.Provider delayDuration={300}>
			<TooltipPrimitive.Root>
				<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						side={side}
						sideOffset={6}
						className={cn(
							"z-50 rounded-md border border-[var(--color-border)] bg-[var(--vscode-menu-background,var(--vscode-sideBar-background))] px-2 py-1 font-brand-sans text-[11px] font-medium text-[color:var(--vscode-foreground)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]",
							"data-[state=delayed-open]:animate-fade-in",
							className,
						)}>
						{content}
						<TooltipPrimitive.Arrow className="fill-[var(--vscode-menu-background,var(--vscode-sideBar-background))]" />
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	)
}
