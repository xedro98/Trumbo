import { IntentEvent } from "@shared/proto/trumbo/ui"
import { HistoryIcon, PlusIcon, PuzzleIcon, SettingsIcon, UserCircleIcon } from "lucide-react"
import { useMemo } from "react"
import BrandMark from "@/components/brand/BrandMark"
import { TrumboIconButton, TrumboTooltip } from "@/components/trumbo"
import { TaskServiceClient, UiServiceClient } from "@/services/grpc-client"
import { useExtensionState } from "../../context/ExtensionStateContext"

/**
 * Navbar — the persistent top chrome of the Trumbo panel. New geometric "T"
 * mark + wordmark on the left, a tight icon-nav cluster on the right, sitting
 * on a hairline brand edge so the panel reads as Trumbo at a glance.
 */
export const Navbar = () => {
	const { navigateToHistory, navigateToSettings, navigateToAccount, navigateToMarketplace, navigateToChat } =
		useExtensionState()

	const navItems = useMemo(
		() => [
			{
				id: "chat",
				tooltip: "New Task",
				icon: PlusIcon,
				navigate: () => {
					UiServiceClient.trackIntent(
						IntentEvent.create({ action: "new_task_clicked", source: "navbar" }),
					).catch((error) => console.error("Failed to track new task click:", error))
					TaskServiceClient.clearTask({})
						.catch((error) => console.error("Failed to clear task:", error))
						.finally(() => navigateToChat())
				},
			},
			{ id: "customize", tooltip: "Customize", icon: PuzzleIcon, navigate: navigateToMarketplace },
			{ id: "history", tooltip: "History", icon: HistoryIcon, navigate: navigateToHistory },
			{ id: "account", tooltip: "Account", icon: UserCircleIcon, navigate: navigateToAccount },
			{ id: "settings", tooltip: "Settings", icon: SettingsIcon, navigate: navigateToSettings },
		],
		[navigateToAccount, navigateToChat, navigateToHistory, navigateToMarketplace, navigateToSettings],
	)

	return (
		<nav
			className="trumbo-edge-top flex-none flex items-center justify-between gap-2 bg-transparent px-2 py-1.5"
			id="trumbo-navbar-container">
			<div className="flex items-center gap-1.5 pl-0.5 select-none">
				<BrandMark className="size-[18px]" />
				<span className="font-heading text-[13px] font-semibold tracking-[-0.02em] text-foreground/90 hidden min-[260px]:inline">
					Trumbo
				</span>
			</div>
			<div className="flex items-center gap-0.5">
				{navItems.map((tab, index) => (
					<TrumboTooltip key={`navbar-tooltip-${tab.id}`} content={tab.tooltip} side="bottom">
						<TrumboIconButton
							aria-label={tab.tooltip}
							label={tab.tooltip}
							data-testid={`tab-${tab.id}`}
							variant={index === 0 ? "active" : "ghost"}
							size="sm"
							onClick={() => tab.navigate()}>
							<tab.icon className="stroke-[1.75]" size={15} />
						</TrumboIconButton>
					</TrumboTooltip>
				))}
			</div>
		</nav>
	)
}
