import type { TrumboPlanRateLimitWindow, TrumboSubscription } from "@trumbo-code/contracts";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { memo, useCallback } from "react";

import { openSettingsModal } from "~/settingsModalBus";
import { cn } from "~/lib/utils";
import {
	getDesktopTrumboAuthBridge,
	isTrumboSignedIn,
	useTrumboAuthState,
} from "~/components/trumbo-auth/useTrumboAuthState";
import { useTrumboConnectAuthPrompt } from "~/components/trumbo-auth/useTrumboConnectAuthPrompt";
import { BoringAvatar } from "~/components/ui/boring-avatar";
import { Button } from "~/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "~/components/ui/menu";

const TIER_LABELS: Readonly<Record<TrumboSubscription["tier"], string>> = {
	free: "Free",
	pro: "Pro",
	max: "Max",
	ultra: "Ultra",
};

const TIER_BADGE_CLASS: Readonly<Record<TrumboSubscription["tier"], string>> = {
	free: "bg-border/60 text-muted-foreground",
	pro: "bg-brand/15 text-brand",
	max: "bg-brand/15 text-brand",
	ultra: "bg-brand/20 text-brand",
};

const USAGE_WINDOWS: ReadonlyArray<{
	readonly key: keyof NonNullable<TrumboSubscription["usage"]>;
	readonly label: string;
}> = [
	{ key: "fiveHour", label: "5h" },
	{ key: "daily", label: "Daily" },
	{ key: "weekly", label: "Weekly" },
];

function formatRenewalDate(periodEnd: string): string {
	const date = new Date(periodEnd);
	if (Number.isNaN(date.getTime())) return periodEnd;
	return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const USAGE_BLOCK_COUNT = 10;

/**
 * Block-based usage bar. All windows use the same number of blocks so the
 * bars are visually comparable. Each filled block is lightly tinted brand
 * green, shifting to amber then red as usage climbs past thresholds.
 */
function UsageBlocks({ pct }: { readonly pct: number }) {
	const filled = Math.round((pct / 100) * USAGE_BLOCK_COUNT);
	return (
		<div className="flex gap-1">
			{Array.from({ length: USAGE_BLOCK_COUNT }, (_, i) => {
				const isFilled = i < filled;
				const tone = !isFilled
					? "bg-border/40"
					: pct >= 90
						? "bg-red-400/50"
						: pct >= 70
							? "bg-amber-400/50"
							: "bg-brand/40";
				return (
					<span
						key={i}
						className={cn("h-2 flex-1 rounded-sm transition-colors", tone)}
					/>
				);
			})}
		</div>
	);
}

function UsagePill({ label, window }: {
	readonly label: string;
	readonly window: TrumboPlanRateLimitWindow | undefined;
}) {
	const hasData =
		typeof window?.used === "number" && typeof window?.limit === "number" && window.limit > 0;
	const used = hasData ? window.used : 0;
	const limit = hasData ? window.limit : 0;
	const pct = hasData ? Math.min(100, Math.round((used / limit) * 100)) : 0;
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between text-[11px]">
				<span className="text-muted-foreground">{label}</span>
				<span className="tabular-nums font-medium text-foreground/80">
					{hasData ? `${used} / ${limit}` : "—"}
				</span>
			</div>
			<UsageBlocks pct={pct} />
		</div>
	);
}

/**
 * UserAvatarMenu — replaces the bare settings gear in the top-right chrome.
 *
 * When signed in, shows the user's avatar as a dropdown trigger. The dropdown
 * surfaces the full Trumbo account details: name, email, avatar, subscription
 * tier, live usage windows, and renewal date, plus Settings and Sign out
 * actions. When signed out, shows a "Sign in" button. Falls back to a
 * settings gear on non-native (hosted web) builds.
 */
export const UserAvatarMenu = memo(function UserAvatarMenu() {
	const authState = useTrumboAuthState();
	const { openAuthPrompt } = useTrumboConnectAuthPrompt();

	const handleSettings = useCallback(() => {
		openSettingsModal();
	}, []);

	const handleSignOut = useCallback(() => {
		const desktop = getDesktopTrumboAuthBridge() as { signOut?: () => Promise<void> } | undefined;
		void desktop?.signOut?.();
	}, []);

	// Hosted web (no native desktop auth bridge) — keep the plain gear icon.
	if (authState === undefined) {
		return (
			<Button variant="ghost" size="icon-xs" aria-label="Settings" onClick={handleSettings}>
				<SettingsIcon />
			</Button>
		);
	}

	if (!isTrumboSignedIn(authState)) {
		return (
			<Button
				variant="ghost"
				size="xs"
				className="h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
				onClick={() => void openAuthPrompt()}
			>
				Sign in
			</Button>
		);
	}

	const user = authState.user;
	const displayName = user?.name?.trim() || user?.email?.trim() || "Account";
	const email = user?.email?.trim();
	const avatarUrl = user?.avatarUrl?.trim() || null;
	const subscription = authState.subscription;
	const tierLabel = subscription ? TIER_LABELS[subscription.tier] : null;
	const tierBadgeClass = subscription ? TIER_BADGE_CLASS[subscription.tier] : "bg-border/60 text-muted-foreground";
	const renewal = subscription?.periodEnd ? formatRenewalDate(subscription.periodEnd) : null;
	const usage = subscription?.usage;

	return (
		<Menu>
			<MenuTrigger
				render={
					<button
						type="button"
						aria-label="Account menu"
						className={cn(
							"flex size-7 items-center justify-center rounded-full outline-none transition-opacity",
							"hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring",
						)}
					>
						<BoringAvatar name={displayName} avatarUrl={avatarUrl} size={28} />
					</button>
				}
			/>
			<MenuPopup align="end" side="bottom" sideOffset={6} className="w-72 p-0">
				{/* User identity header */}
				<div className="flex items-center gap-3 px-3 py-3">
					<BoringAvatar name={displayName} avatarUrl={avatarUrl} size={40} className="size-10" />
					<div className="flex min-w-0 flex-col gap-0.5">
						<div className="flex items-center gap-1.5">
							<span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
							{tierLabel ? (
								<span
									className={cn(
										"inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
										tierBadgeClass,
									)}
								>
									{tierLabel}
								</span>
							) : null}
						</div>
					{email ? (
						<span className="truncate text-xs text-muted-foreground">{email}</span>
					) : null}
				</div>
					</div>

				{/* Usage section */}
				{usage ? (
					<>
						<div className="h-px bg-border/60" />
						<div className="flex flex-col gap-2.5 px-3 py-3">
							<span className="text-[10px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
								Usage
							</span>
							{USAGE_WINDOWS.map(({ key, label }) => (
								<UsagePill key={key} label={label} window={usage[key]} />
							))}
							{renewal ? (
								<span className="mt-0.5 text-[10px] text-muted-foreground/60">
									Renews {renewal}
								</span>
							) : null}
						</div>
					</>
				) : null}

				<div className="h-px bg-border/60" />
				<div className="p-1">
					<MenuItem onClick={handleSettings} className="gap-2">
						<SettingsIcon className="size-4" />
						Settings
					</MenuItem>
					<MenuSeparator />
					<MenuItem onClick={handleSignOut} className="gap-2 text-muted-foreground">
						<LogOutIcon className="size-4" />
						Sign out
					</MenuItem>
				</div>
			</MenuPopup>
		</Menu>
	);
});
