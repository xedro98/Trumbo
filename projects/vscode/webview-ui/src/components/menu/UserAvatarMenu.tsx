import { LogOutIcon, SettingsIcon, UserCircleIcon } from "lucide-react"
import { memo, useCallback } from "react"

import BrandMark from "@/components/brand/BrandMark"
import { TrumboButton, TrumboIconButton, TrumboTooltip } from "@/components/trumbo"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { handleSignOut, useTrumboAuth } from "@/context/TrumboAuthContext"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { cn } from "@/lib/utils"

/**
 * UserAvatarMenu — replaces the generic Account icon in the navbar with the
 * signed-in user's avatar + a dropdown (Settings, Sign out), matching the
 * Trumbo Desktop app's avatar menu. When signed out, falls back to the
 * generic UserCircleIcon that opens the account/sign-in view.
 */
export const UserAvatarMenu = memo(function UserAvatarMenu() {
	const { trumboUser } = useTrumboAuth()
	const { navigateToSettings, navigateToAccount } = useExtensionState()

	const handleSettings = useCallback(() => {
		navigateToSettings()
	}, [navigateToSettings])

	const handleSignOutClick = useCallback(() => {
		void handleSignOut()
	}, [])

	// Signed out — generic icon that opens the account/sign-in view.
	if (!trumboUser) {
		return (
			<TrumboTooltip content="Account" side="bottom">
				<TrumboIconButton
					aria-label="Account"
					label="Account"
					data-testid="tab-account"
					variant="ghost"
					size="sm"
					onClick={() => navigateToAccount()}>
					<UserCircleIcon className="size-4" />
				</TrumboIconButton>
			</TrumboTooltip>
		)
	}

	const displayName = trumboUser.displayName?.trim() || trumboUser.email?.trim() || "Account"
	const email = trumboUser.email?.trim()
	const photoUrl = trumboUser.photoUrl?.trim() || ""

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label="Account menu"
					data-testid="tab-account"
					className={cn(
						"flex size-7 items-center justify-center rounded-full outline-none transition-opacity",
						"hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
					)}>
					{photoUrl ? (
						<img
							src={photoUrl}
							alt=""
							className="size-6 shrink-0 rounded-full object-cover"
						/>
					) : (
						/* Generative avatar: brand-tinted circle with initials */
						<span
							className={cn(
								"flex size-6 shrink-0 items-center justify-center rounded-full",
								"bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] text-[10px] font-semibold text-[var(--brand)]",
							)}>
							{displayName.slice(0, 1).toUpperCase()}
						</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				side="bottom"
				sideOffset={6}
				className="w-64 gap-0 rounded-xl border-[var(--color-border)] bg-[var(--vscode-sideBarBackground)] p-0 shadow-lg">
				{/* User identity header */}
				<div className="flex items-center gap-2.5 px-3 py-3">
					{photoUrl ? (
						<img
							src={photoUrl}
							alt=""
							className="size-9 shrink-0 rounded-full object-cover"
						/>
					) : (
						<span
							className={cn(
								"flex size-9 shrink-0 items-center justify-center rounded-full",
								"bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] text-sm font-semibold text-[var(--brand)]",
							)}>
							{displayName.slice(0, 1).toUpperCase()}
						</span>
					)}
					<div className="flex min-w-0 flex-col gap-0.5">
						<span className="truncate font-heading text-sm font-semibold text-[color:var(--vscode-foreground)]">
							{displayName}
						</span>
						{email ? (
							<span className="truncate text-xs text-[color:var(--vscode-descriptionForeground)]">
								{email}
							</span>
						) : null}
					</div>
				</div>

				<div className="h-px bg-[color-mix(in_srgb,var(--vscode-foreground)_10%,transparent)]" />

				{/* Menu items */}
				<div className="flex flex-col p-1.5">
					<button
						type="button"
						onClick={handleSettings}
						className={cn(
							"flex h-8 items-center gap-2 rounded-lg px-2 text-left text-[13px]",
							"text-[color:var(--vscode-foreground)] hover:bg-[color-mix(in_srgb,var(--vscode-foreground)_8%,transparent)]",
							"transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
						)}>
						<SettingsIcon className="size-4 shrink-0 text-[color-mix(in_srgb,var(--vscode-foreground)_60%,transparent)]" />
						Settings
					</button>
					<button
						type="button"
						onClick={handleSignOutClick}
						className={cn(
							"flex h-8 items-center gap-2 rounded-lg px-2 text-left text-[13px]",
							"text-[color-mix(in_srgb,var(--vscode-foreground)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--vscode-foreground)_8%,transparent)] hover:text-[color:var(--vscode-foreground)]",
							"transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]",
						)}>
						<LogOutIcon className="size-4 shrink-0 text-[color-mix(in_srgb,var(--vscode-foreground)_60%,transparent)]" />
						Sign out
					</button>
				</div>
			</PopoverContent>
		</Popover>
	)
})
