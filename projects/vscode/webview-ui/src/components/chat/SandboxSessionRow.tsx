import type { TrumboMessage } from "@shared/ExtensionMessage"
import { ChevronDownIcon, ChevronRightIcon, TerminalIcon } from "lucide-react"
import { memo, useMemo, useState } from "react"
import CodeBlock, { CODE_BLOCK_BG_COLOR } from "@/components/common/CodeBlock"
import { formatToolLabel, parseMcpToolPayload } from "@/utils/platformMcpSession"

interface SandboxSessionRowProps {
	messages: TrumboMessage[]
	isLast: boolean
}

interface SandboxStep {
	toolName: string
	arguments?: string
	result?: string
	ts: number
}

function parseSteps(messages: TrumboMessage[]): SandboxStep[] {
	const steps: SandboxStep[] = []
	for (let i = 0; i < messages.length; i++) {
		const message = messages[i]
		const payload = parseMcpToolPayload(message)
		if (!payload?.toolName) continue

		const next = messages[i + 1]
		const result = next?.say === "mcp_server_response" && typeof next.text === "string" ? next.text : undefined

		steps.push({
			toolName: payload.toolName,
			arguments: payload.arguments,
			result,
			ts: message.ts,
		})
		if (result) i++
	}
	return steps
}

function extractSandboxId(steps: SandboxStep[]): string | undefined {
	for (const step of steps) {
		if (!step.arguments) continue
		try {
			const args = JSON.parse(step.arguments) as { sandboxId?: string }
			if (args.sandboxId) return args.sandboxId
		} catch {
			// ignore
		}
		if (step.result) {
			const match = step.result.match(/sandboxId:\s*([^\s\n]+)/i)
			if (match?.[1]) return match[1]
		}
	}
	return undefined
}

const SandboxSessionRow = memo(({ messages, isLast }: SandboxSessionRowProps) => {
	const [expanded, setExpanded] = useState(true)
	const [page, setPage] = useState(0)

	const steps = useMemo(() => parseSteps(messages), [messages])
	const sandboxId = useMemo(() => extractSandboxId(steps), [steps])
	const pageSize = 4
	const totalPages = Math.max(1, Math.ceil(steps.length / pageSize))
	const pageSteps = steps.slice(page * pageSize, (page + 1) * pageSize)

	return (
		<div
			className="mb-2.5 rounded-sm border border-[var(--vscode-editorGroup-border)] overflow-hidden"
			style={{ backgroundColor: CODE_BLOCK_BG_COLOR }}>
			<button
				className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--vscode-list-hoverBackground)]"
				onClick={() => setExpanded((v) => !v)}
				type="button">
				{expanded ? (
					<ChevronDownIcon className="size-3 shrink-0 opacity-70" />
				) : (
					<ChevronRightIcon className="size-3 shrink-0 opacity-70" />
				)}
				<TerminalIcon className="size-3.5 shrink-0 text-brand" />
				<span className="text-sm font-medium">Trumbo Sandbox</span>
				{sandboxId ? (
					<span className="ml-1 truncate font-mono text-xs text-muted-foreground">{sandboxId.slice(0, 8)}…</span>
				) : null}
				{isLast ? <span className="ml-auto text-xs text-muted-foreground">active</span> : null}
			</button>

			{expanded ? (
				<div className="border-t border-[var(--vscode-editorGroup-border)] px-3 py-2 space-y-3">
					<p className="text-xs text-muted-foreground">
						Remote Linux VM on Cloudflare Containers. Commands and code run in an isolated sandbox, billed by
						CPU-seconds.
					</p>

					{steps.length === 0 ? (
						<p className="text-xs text-muted-foreground">Waiting for sandbox activity…</p>
					) : (
						<>
							{pageSteps.map((step) => (
								<div
									className="rounded-xs border border-[var(--vscode-editorGroup-border)] bg-[var(--vscode-editor-background)] p-2.5"
									key={step.ts}>
									<div className="mb-1.5 flex items-center gap-2">
										<TerminalIcon className="size-3 shrink-0 opacity-80" />
										<span className="text-xs font-medium capitalize">{formatToolLabel(step.toolName)}</span>
									</div>
									{step.arguments && step.arguments !== "{}" ? (
										<div className="mb-2">
											<p className="mb-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
												Input
											</p>
											<CodeBlock source={step.arguments} />
										</div>
									) : null}
									{step.result ? (
										<div>
											<p className="mb-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
												Output
											</p>
											<CodeBlock source={step.result} />
										</div>
									) : null}
								</div>
							))}

							{totalPages > 1 ? (
								<div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
									<span>
										{page + 1} / {totalPages}
									</span>
									<div className="flex gap-1">
										<button
											className="rounded-xs border border-[var(--vscode-editorGroup-border)] px-2 py-0.5 disabled:opacity-40"
											disabled={page === 0}
											onClick={() => setPage((p) => Math.max(0, p - 1))}
											type="button">
											Prev
										</button>
										<button
											className="rounded-xs border border-[var(--vscode-editorGroup-border)] px-2 py-0.5 disabled:opacity-40"
											disabled={page >= totalPages - 1}
											onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
											type="button">
											Next
										</button>
									</div>
								</div>
							) : null}
						</>
					)}
				</div>
			) : null}
		</div>
	)
})

SandboxSessionRow.displayName = "SandboxSessionRow"

export default SandboxSessionRow
