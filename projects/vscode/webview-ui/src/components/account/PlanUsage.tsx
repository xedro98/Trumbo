import type { GetCurrentPlanResponse, PlanRateLimitWindow } from "@shared/proto/trumbo/account"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import VSCodeButtonLink from "../common/VSCodeButtonLink"

type PlanUsageProps = {
	plan: GetCurrentPlanResponse | null
	fetchPlan: () => void
	billingUrl: URL
	lastFetchTime: number
	isLoading: boolean
	canManageBilling: boolean
}

const WINDOW_LABELS: { key: "fiveHour" | "daily" | "weekly"; label: string }[] = [
	{ key: "fiveHour", label: "5-hour" },
	{ key: "daily", label: "Daily" },
	{ key: "weekly", label: "Weekly" },
]

function formatResetsIn(resetsAtSec: number | undefined): string | null {
	if (typeof resetsAtSec !== "number" || !Number.isFinite(resetsAtSec)) {
		return null
	}
	const seconds = resetsAtSec - Math.floor(Date.now() / 1000)
	if (seconds <= 0) {
		return "now"
	}
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	if (h >= 1) {
		return `${h}h ${m}m`
	}
	if (m >= 1) {
		return `${m}m`
	}
	return `${Math.max(1, Math.floor(seconds))}s`
}

const WindowBar = ({ label, window: w }: { label: string; window: PlanRateLimitWindow | undefined }) => {
	const hasData = typeof w?.used === "number" && typeof w?.limit === "number" && w.limit > 0
	const used = hasData ? (w?.used ?? 0) : 0
	const limit = hasData ? (w?.limit ?? 0) : 0
	const pct = hasData ? Math.min(100, Math.round((used / limit) * 100)) : 0
	const resetsIn = formatResetsIn(w?.resetsAtSec)
	const isHigh = hasData && pct >= 80

	return (
		<div className="w-full mb-3 last:mb-0">
			<div className="mb-1.5 flex justify-between items-baseline text-xs">
				<span className="text-(--vscode-descriptionForeground)">{label}</span>
				<span className="font-brand-mono tabular-nums text-foreground/80">{hasData ? `${used} / ${limit}` : "—"}</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-(--vscode-editorWidget-background) overflow-hidden">
				<div
					className={`h-full rounded-full transition-[width] duration-500 ease-out ${isHigh ? "bg-(--vscode-statusBarItem-errorBackground)" : "trumbo-bar-fill"}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
			{resetsIn && <div className="mt-1 text-[11px] text-(--vscode-descriptionForeground)">Resets in {resetsIn}</div>}
		</div>
	)
}

export const PlanUsage = ({ plan, fetchPlan, billingUrl, lastFetchTime, isLoading, canManageBilling }: PlanUsageProps) => {
	const tier = plan?.planTier || plan?.displayName || plan?.planName
	const hasPlan = Boolean(tier)
	const periodEnd = plan?.currentPeriodEnd
	const isPerSeat = plan?.billingModel === "per_seat"
	const seatCount = plan?.seatCount
	const memberCount = plan?.memberCount

	return (
		<div
			className="trumbo-card w-full flex flex-col gap-4 p-4"
			title={`Last updated: ${new Date(lastFetchTime).toLocaleTimeString()}`}>
			<div className="flex items-center justify-between">
				<div className="flex flex-col">
					<span className="font-brand-mono text-[10px] uppercase tracking-[0.12em] trumbo-brand-text font-medium">
						Current plan
					</span>
					<span className="font-heading text-xl font-semibold capitalize tracking-[-0.02em] mt-0.5">
						{hasPlan ? tier : "No active plan"}
					</span>
					{periodEnd && (
						<span className="text-xs text-(--vscode-descriptionForeground) mt-0.5">
							Renews {new Date(periodEnd).toLocaleDateString()}
						</span>
					)}
					{isPerSeat && typeof seatCount === "number" && (
						<span className="text-xs text-(--vscode-descriptionForeground) mt-0.5">
							{typeof memberCount === "number"
								? `${memberCount} members / ${seatCount} licensed seats`
								: `${seatCount} licensed seats`}
						</span>
					)}
				</div>
				<VSCodeButton
					appearance="icon"
					className={`shrink-0 ${isLoading ? "animate-spin" : ""}`}
					disabled={isLoading}
					onClick={fetchPlan}>
					<span className="codicon codicon-refresh" />
				</VSCodeButton>
			</div>

			{hasPlan ? (
				<div className="flex flex-col">
					<span className="font-brand-mono text-[10px] uppercase tracking-[0.12em] text-(--vscode-descriptionForeground) font-medium mb-2">
						Request usage
					</span>
					{WINDOW_LABELS.map(({ key, label }) => (
						<WindowBar key={key} label={label} window={plan?.[key]} />
					))}
				</div>
			) : (
				<p className="text-sm text-(--vscode-descriptionForeground) m-0 text-center py-2">
					Subscribe to use the Trumbo provider.
				</p>
			)}

			{canManageBilling ? (
				<VSCodeButtonLink className="w-full" href={billingUrl.href}>
					{hasPlan ? "Manage Subscription" : "Choose a Plan"}
				</VSCodeButtonLink>
			) : (
				<p className="text-sm text-(--vscode-descriptionForeground) m-0 text-center py-2">
					Contact a team owner or admin to manage billing.
				</p>
			)}
		</div>
	)
}
