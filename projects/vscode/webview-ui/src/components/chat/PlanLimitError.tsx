import { AskResponseRequest } from "@shared/proto/trumbo/task"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import React, { useEffect, useMemo, useState } from "react"
import VSCodeButtonLink from "@/components/common/VSCodeButtonLink"
import { useTrumboAuth } from "@/context/TrumboAuthContext"
import { AccountServiceClient, TaskServiceClient } from "@/services/grpc-client"

interface PlanLimitErrorProps {
	message: string
	/** Rate-limit window that was hit: "5h" | "daily" | "weekly" */
	window?: string
	used?: number
	limit?: number
	/** Unix seconds when the window resets. */
	resetsAtSec?: number
	upgradeUrl?: string
	/** Hide the upgrade CTA (e.g. when the user is already on the top tier). */
	hideUpgrade?: boolean
	/** Optional request ID for support/debugging. */
	requestId?: string
}

const DEFAULT_UPGRADE_URL = "https://platform.trumbo.dev/billing"

function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) {
		return "soon"
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

// Subscription/rate-limit error card. Replaces the legacy "Buy Credits" card:
// Trumbo has no credit balance, only per-seat subscription plans (Pro/Max/Ultra)
// with 5h / daily / weekly request caps. Shown when the platform returns
// `subscription_required` (403), `rate_limit_exceeded` (429), or a legacy
// `insufficient_credits` shape that we map to "upgrade your plan".
const PlanLimitError: React.FC<PlanLimitErrorProps> = ({
	message,
	window: windowName,
	used,
	limit,
	resetsAtSec,
	upgradeUrl,
	hideUpgrade,
	requestId,
}) => {
	const { trumboUser } = useTrumboAuth()
	const [fullUpgradeUrl, setFullUpgradeUrl] = useState<string>("")

	const baseUpgradeUrl = useMemo(() => {
		if (upgradeUrl) {
			return upgradeUrl
		}
		const appBase = trumboUser?.appBaseUrl || DEFAULT_UPGRADE_URL
		// The active personal-vs-org scope is resolved server-side from the
		// session, so /billing alone is correct for both scopes.
		return `${appBase}/billing`
	}, [upgradeUrl, trumboUser?.appBaseUrl])

	useEffect(() => {
		let cancelled = false
		const fetchCallbackUrl = async () => {
			try {
				const callbackUrl = (await AccountServiceClient.getRedirectUrl({})).value
				const url = new URL(baseUpgradeUrl)
				url.searchParams.set("callback_url", callbackUrl)
				if (!cancelled) {
					setFullUpgradeUrl(url.toString())
				}
			} catch (error) {
				console.error("Error fetching callback URL:", error)
				if (!cancelled) {
					setFullUpgradeUrl(baseUpgradeUrl)
				}
			}
		}
		fetchCallbackUrl()
		return () => {
			cancelled = true
		}
	}, [baseUpgradeUrl])

	const resetsIn =
		typeof resetsAtSec === "number"
			? formatDuration(resetsAtSec - Math.floor(Date.now() / 1000))
			: undefined
	const hasUsage =
		typeof used === "number" && typeof limit === "number" && limit > 0
	const pct = hasUsage ? Math.min(100, Math.round((used / limit) * 100)) : 100

	return (
		<div className="p-2 border-none rounded-md mb-2 bg-(--vscode-textBlockQuote-background)">
			<div className="mb-3 font-azeret-mono">
				<div className="text-error mb-2">{message}</div>
				{requestId && <div className="mb-2 text-xs text-description">Request ID: {requestId}</div>}
				{hasUsage && (
					<div className="mb-3 text-foreground">
						<div className="mb-1 flex justify-between text-xs">
							<span>{windowName ?? "current"} usage</span>
							<span>
								{used} / {limit}
							</span>
						</div>
						<div className="h-1.5 w-full rounded bg-(--vscode-editorWidget-background) overflow-hidden">
							<div
								className="h-full bg-(--vscode-statusBarItem-errorBackground)"
								style={{ width: `${pct}%` }}
							/>
						</div>
						{resetsIn && <div className="mt-1 text-xs text-description">Resets in {resetsIn}</div>}
					</div>
				)}
			</div>

			{!hideUpgrade && (
				<VSCodeButtonLink className="w-full mb-2" href={fullUpgradeUrl}>
					<span className="codicon codicon-arrow-up mr-[6px] text-[14px]" />
					Upgrade Plan
				</VSCodeButtonLink>
			)}

			<VSCodeButton
				appearance="secondary"
				className="w-full"
				onClick={async () => {
					try {
						await TaskServiceClient.askResponse(
							AskResponseRequest.create({
								responseType: "yesButtonClicked",
							}),
						)
					} catch (error) {
						console.error("Error invoking action:", error)
					}
				}}>
				<span className="codicon codicon-refresh mr-1.5" />
				Retry Request
			</VSCodeButton>
		</div>
	)
}

export default PlanLimitError
