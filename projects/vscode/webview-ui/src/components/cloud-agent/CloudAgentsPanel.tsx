import type {
	PlatformAgentRow,
	PlatformAgentsUsage,
	PlatformSandboxRow,
	PlatformSandboxUsage,
} from "@shared/platform-infrastructure"
import { PlatformInfrastructureResponse } from "@shared/proto/trumbo/account"
import { EmptyRequest } from "@shared/proto/trumbo/common"
import { VSCodeButton, VSCodeDivider } from "@vscode/webview-ui-toolkit/react"
import { CloudIcon, RefreshCwIcon, TerminalIcon } from "lucide-react"
import { memo, useCallback, useEffect, useState } from "react"
import { AccountServiceClient } from "@/services/grpc-client"

function parseJson<T>(raw: string | undefined, fallback: T): T {
	if (!raw) return fallback
	try {
		return JSON.parse(raw) as T
	} catch {
		return fallback
	}
}

function formatHours(value: number): string {
	if (value >= 100) return value.toFixed(0)
	if (value >= 10) return value.toFixed(1)
	return value.toFixed(2)
}

function formatCpuSeconds(value: number): string {
	if (value >= 3600) return `${(value / 3600).toFixed(1)}h`
	if (value >= 60) return `${(value / 60).toFixed(1)}m`
	return `${value}s`
}

const CloudAgentsPanel = memo(() => {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [agents, setAgents] = useState<PlatformAgentRow[]>([])
	const [sandboxes, setSandboxes] = useState<PlatformSandboxRow[]>([])
	const [agentsUsage, setAgentsUsage] = useState<PlatformAgentsUsage | null>(null)
	const [sandboxUsage, setSandboxUsage] = useState<PlatformSandboxUsage | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const response: PlatformInfrastructureResponse = await AccountServiceClient.getPlatformInfrastructure(
				EmptyRequest.create({}),
			)
			if (response.error) {
				setError(response.error)
				return
			}
			setAgents(parseJson<PlatformAgentRow[]>(response.agentsJson, []))
			setSandboxes(parseJson<PlatformSandboxRow[]>(response.sandboxesJson, []))
			setAgentsUsage(parseJson<PlatformAgentsUsage | null>(response.agentsUsageJson, null))
			setSandboxUsage(parseJson<PlatformSandboxUsage | null>(response.sandboxUsageJson, null))
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load platform data")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void load()
	}, [load])

	return (
		<div className="px-5 py-4 space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2 className="text-sm font-semibold text-foreground">Platform Infrastructure</h2>
					<p className="mt-1 text-xs text-muted-foreground max-w-xl">
						Cloud Agents and Sandbox run on Trumbo&apos;s Cloudflare-hosted platform. Sessions sync automatically when
						the agent uses trumbo-platform MCP tools in chat.
					</p>
				</div>
				<VSCodeButton appearance="secondary" disabled={loading} onClick={() => void load()}>
					<span className="inline-flex items-center gap-1.5">
						<RefreshCwIcon className={`size-3 ${loading ? "animate-spin" : ""}`} />
						Refresh
					</span>
				</VSCodeButton>
			</div>

			{error ? <p className="text-xs text-[var(--vscode-errorForeground)]">{error}</p> : null}

			<section className="space-y-3">
				<div className="flex items-center gap-2">
					<CloudIcon className="size-4 text-brand" />
					<h3 className="text-sm font-medium">Cloud Agents</h3>
				</div>
				{agentsUsage?.enabled ? (
					<p className="text-xs text-muted-foreground">
						{formatHours(agentsUsage.hoursUsed)} / {formatHours(agentsUsage.hoursMonthly)} h this month ·{" "}
						{agentsUsage.concurrentUsed} / {agentsUsage.concurrentAgents} concurrent
					</p>
				) : (
					<p className="text-xs text-muted-foreground">Agents not enabled on your current plan.</p>
				)}
				{loading ? (
					<p className="text-xs text-muted-foreground">Loading agents…</p>
				) : agents.length === 0 ? (
					<p className="text-xs text-muted-foreground">No active cloud agents. Ask the agent to create one via MCP.</p>
				) : (
					<ul className="divide-y divide-[var(--vscode-editorGroup-border)] border border-[var(--vscode-editorGroup-border)] rounded-sm">
						{agents.map((agent) => (
							<li className="px-3 py-2 text-xs flex items-center justify-between gap-3" key={agent.id}>
								<div className="min-w-0">
									<p className="font-medium truncate">{agent.name}</p>
									<p className="font-mono text-muted-foreground truncate">{agent.id}</p>
								</div>
								<span className="shrink-0 capitalize text-muted-foreground">{agent.status}</span>
							</li>
						))}
					</ul>
				)}
				<VSCodeButton
					appearance="secondary"
					onClick={() => {
						void AccountServiceClient.getRedirectUrl(EmptyRequest.create({})).then((url) => {
							if (url.value) window.open(`${url.value.replace(/\/$/, "")}/agents`, "_blank")
						})
					}}>
					Open platform dashboard
				</VSCodeButton>
			</section>

			<VSCodeDivider />

			<section className="space-y-3">
				<div className="flex items-center gap-2">
					<TerminalIcon className="size-4 text-brand" />
					<h3 className="text-sm font-medium">Sandbox</h3>
				</div>
				{sandboxUsage?.enabled ? (
					<p className="text-xs text-muted-foreground">
						{formatCpuSeconds(sandboxUsage.cpuSecondsUsed)} / {formatCpuSeconds(sandboxUsage.cpuSecondsMonthly)}{" "}
						CPU-sec this month · {sandboxUsage.concurrentUsed} / {sandboxUsage.concurrentSandboxes} concurrent
					</p>
				) : (
					<p className="text-xs text-muted-foreground">Sandbox not enabled on your current plan.</p>
				)}
				{loading ? (
					<p className="text-xs text-muted-foreground">Loading sandboxes…</p>
				) : sandboxes.length === 0 ? (
					<p className="text-xs text-muted-foreground">No active sandboxes.</p>
				) : (
					<ul className="divide-y divide-[var(--vscode-editorGroup-border)] border border-[var(--vscode-editorGroup-border)] rounded-sm">
						{sandboxes.map((sandbox) => (
							<li className="px-3 py-2 text-xs flex items-center justify-between gap-3" key={sandbox.id}>
								<p className="font-mono truncate">{sandbox.id}</p>
								<span className="shrink-0 capitalize text-muted-foreground">{sandbox.status}</span>
							</li>
						))}
					</ul>
				)}
				<VSCodeButton
					appearance="secondary"
					onClick={() => {
						void AccountServiceClient.getRedirectUrl(EmptyRequest.create({})).then((url) => {
							if (url.value) window.open(`${url.value.replace(/\/$/, "")}/sandbox`, "_blank")
						})
					}}>
					Open sandbox dashboard
				</VSCodeButton>
			</section>
		</div>
	)
})

CloudAgentsPanel.displayName = "CloudAgentsPanel"

export default CloudAgentsPanel
