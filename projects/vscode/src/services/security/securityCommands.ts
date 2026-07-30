/**
 * VS Code command palette handlers for Security Agent findings, suppressions,
 * and compliance packs (SOC2 CC8 / PCI Req 6).
 */

import * as vscode from "vscode"
import {
	TrumboAccountService,
	type SecurityComplianceReport,
	type SecurityFindingSummary,
	type SecuritySuppression,
} from "@/sdk/account-service"
import { Logger } from "@/shared/services/Logger"

function requireAccountService(): TrumboAccountService | undefined {
	try {
		return TrumboAccountService.getInstance()
	} catch (error) {
		Logger.error("Security commands: account service unavailable", error)
		void vscode.window.showErrorMessage("Trumbo account service is not available. Sign in and try again.")
		return undefined
	}
}

function findingLabel(f: SecurityFindingSummary): string {
	const loc = f.line_start != null ? `${f.file_path}:${f.line_start}` : f.file_path
	return `${f.severity.toUpperCase()}  ${f.title}`
}

function findingDescription(f: SecurityFindingSummary): string {
	const loc = f.line_start != null ? `${f.file_path}:${f.line_start}` : f.file_path
	return `${f.status} · ${loc} · ${f.category}`
}

async function openFindingInEditor(finding: SecurityFindingSummary): Promise<void> {
	const folders = vscode.workspace.workspaceFolders
	if (!folders?.length || !finding.file_path) {
		return
	}
	const relative = finding.file_path.replace(/^\.?\//, "")
	for (const folder of folders) {
		const uri = vscode.Uri.joinPath(folder.uri, relative)
		try {
			await vscode.workspace.fs.stat(uri)
			const doc = await vscode.workspace.openTextDocument(uri)
			const editor = await vscode.window.showTextDocument(doc)
			if (finding.line_start != null && finding.line_start > 0) {
				const line = Math.max(0, finding.line_start - 1)
				const pos = new vscode.Position(line, 0)
				editor.selection = new vscode.Selection(pos, pos)
				editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter)
			}
			return
		} catch {
			// try next workspace folder
		}
	}
}

/**
 * Command: Trumbo: Security Findings
 * QuickPick of open findings with Suppress / Open file actions.
 */
export async function showSecurityFindingsCommand(): Promise<void> {
	const service = requireAccountService()
	if (!service) return

	await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: "Loading security findings…" },
		async () => {
			const data = await service.listSecurityFindings({ status: "open", pageSize: 50 })
			if (!data) {
				void vscode.window.showErrorMessage(
					"Could not load security findings. Sign in to Trumbo and ensure Security Agent is enabled for your team.",
				)
				return
			}

			const findings = data.findings ?? []
			if (findings.length === 0) {
				void vscode.window.showInformationMessage(
					`No open findings${data.total ? ` (${data.total} total with other statuses)` : ""}.`,
				)
				return
			}

			type FindingItem = vscode.QuickPickItem & { finding: SecurityFindingSummary }
			const items: FindingItem[] = findings.map((f) => ({
				label: findingLabel(f),
				description: findingDescription(f),
				detail: f.id,
				finding: f,
			}))

			const picked = await vscode.window.showQuickPick(items, {
				title: `Security findings (${findings.length} of ${data.total})`,
				placeHolder: "Select a finding to open or suppress",
				matchOnDescription: true,
				matchOnDetail: true,
			})
			if (!picked) return

			const action = await vscode.window.showQuickPick(
				[
					{ label: "$(file-code) Open file", id: "open" as const },
					{ label: "$(circle-slash) Suppress finding", id: "suppress" as const },
					{ label: "$(copy) Copy finding id", id: "copy" as const },
				],
				{ title: picked.finding.title, placeHolder: "Choose an action" },
			)
			if (!action) return

			if (action.id === "open") {
				await openFindingInEditor(picked.finding)
				return
			}
			if (action.id === "copy") {
				await vscode.env.clipboard.writeText(picked.finding.id)
				void vscode.window.showInformationMessage("Finding id copied to clipboard.")
				return
			}
			if (action.id === "suppress") {
				const reason = await vscode.window.showInputBox({
					title: "Suppress finding",
					prompt: "Reason for org-wide suppression",
					value: "Accepted risk / false positive",
					ignoreFocusOut: true,
				})
				if (reason === undefined) return
				try {
					const created = await service.createSecuritySuppression({
						findingId: picked.finding.id,
						reason: reason.trim() || "Suppressed via VS Code",
					})
					void vscode.window.showInformationMessage(
						created?.id ? `Suppression created (${created.id.slice(0, 8)}…)` : "Suppression created.",
					)
				} catch (error) {
					void vscode.window.showErrorMessage(
						error instanceof Error ? error.message : "Failed to create suppression",
					)
				}
			}
		},
	)
}

/**
 * Command: Trumbo: Security Suppressions
 * List suppressions; pick one to delete.
 */
export async function showSecuritySuppressionsCommand(): Promise<void> {
	const service = requireAccountService()
	if (!service) return

	await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: "Loading suppressions…" },
		async () => {
			const data = await service.listSecuritySuppressions()
			if (!data) {
				void vscode.window.showErrorMessage(
					"Could not load suppressions. Sign in to Trumbo and try again.",
				)
				return
			}

			const rows = data.suppressions ?? []
			if (rows.length === 0) {
				void vscode.window.showInformationMessage("No org suppressions.")
				return
			}

			type SuppressionItem = vscode.QuickPickItem & { suppression: SecuritySuppression }
			const items: SuppressionItem[] = rows.map((s) => ({
				label: s.filePath ?? s.ruleId ?? s.fingerprint.slice(0, 16),
				description: s.ruleId ?? s.fingerprint.slice(0, 12),
				detail: s.reason ?? s.id,
				suppression: s,
			}))

			const picked = await vscode.window.showQuickPick(items, {
				title: `Suppressions (${rows.length})`,
				placeHolder: "Select a suppression to delete",
				matchOnDescription: true,
				matchOnDetail: true,
			})
			if (!picked) return

			const confirm = await vscode.window.showWarningMessage(
				`Delete suppression for ${picked.suppression.filePath ?? picked.suppression.fingerprint}?`,
				{ modal: true },
				"Delete",
			)
			if (confirm !== "Delete") return

			try {
				await service.deleteSecuritySuppression(picked.suppression.id)
				void vscode.window.showInformationMessage("Suppression deleted.")
			} catch (error) {
				void vscode.window.showErrorMessage(
					error instanceof Error ? error.message : "Failed to delete suppression",
				)
			}
		},
	)
}

function formatComplianceReport(report: SecurityComplianceReport): string {
	const lines = [
		`# ${report.name}`,
		``,
		`Status: **${report.overallStatus}** (${report.controlsMet}/${report.controlsTotal} controls met)`,
		``,
		`| Control | Status | Summary |`,
		`| --- | --- | --- |`,
		...report.controls.map(
			(c) => `| ${c.id} ${c.title} | ${c.status} | ${c.summary.replace(/\|/g, "/")} |`,
		),
	]
	return lines.join("\n")
}

/**
 * Command: Trumbo: Security Compliance
 * Show SOC2 CC8 / PCI Req 6 pack status; optional refresh.
 */
export async function showSecurityComplianceCommand(): Promise<void> {
	const service = requireAccountService()
	if (!service) return

	const mode = await vscode.window.showQuickPick(
		[
			{ label: "View compliance packs", id: "view" as const },
			{ label: "Refresh evidence from latest scans", id: "refresh" as const },
		],
		{ title: "Security compliance", placeHolder: "SOC2 CC8 / PCI Req 6" },
	)
	if (!mode) return

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: mode.id === "refresh" ? "Refreshing compliance evidence…" : "Loading compliance packs…",
		},
		async () => {
			try {
				const data =
					mode.id === "refresh"
						? await service.refreshSecurityCompliance()
						: await service.getSecurityCompliancePacks()
				if (!data?.reports?.length) {
					void vscode.window.showWarningMessage("No compliance reports returned.")
					return
				}

				const packPick = await vscode.window.showQuickPick(
					data.reports.map((r) => ({
						label: r.name,
						description: `${r.overallStatus} · ${r.controlsMet}/${r.controlsTotal}`,
						report: r,
					})),
					{ title: "Compliance packs", placeHolder: "Open a pack report" },
				)
				if (!packPick) return

				const doc = await vscode.workspace.openTextDocument({
					content: formatComplianceReport(packPick.report),
					language: "markdown",
				})
				await vscode.window.showTextDocument(doc, { preview: true })
			} catch (error) {
				void vscode.window.showErrorMessage(
					error instanceof Error ? error.message : "Failed to load compliance packs",
				)
			}
		},
	)
}
