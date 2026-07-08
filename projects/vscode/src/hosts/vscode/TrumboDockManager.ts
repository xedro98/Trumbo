import type { ExtensionContext } from "vscode"
import * as vscode from "vscode"
import { ExtensionRegistryInfo } from "@/registry"
import type { VscodeWebviewProvider } from "./VscodeWebviewProvider"
import { persistPreferredDockLocation, readPreferredDockLocation, type TrumboDockLocation } from "./trumbo-dock-location"

let dockManagerInstance: TrumboDockManager | undefined

export function getTrumboDockManager(): TrumboDockManager {
	if (!dockManagerInstance) {
		throw new Error("TrumboDockManager is not initialized")
	}
	return dockManagerInstance
}

export class TrumboDockManager {
	private statusBarItem?: vscode.StatusBarItem

	constructor(
		private readonly context: ExtensionContext,
		private readonly webview: VscodeWebviewProvider,
	) {
		dockManagerInstance = this
	}

	register(): void {
		this.registerStatusBar()
		this.registerPanelSerializer()
		this.registerCommands()
	}

	dispose(): void {
		this.statusBarItem?.dispose()
		if (dockManagerInstance === this) {
			dockManagerInstance = undefined
		}
	}

	getPreferredLocation(): TrumboDockLocation {
		return readPreferredDockLocation()
	}

	async focusTrumbo(preserveEditorFocus = false): Promise<void> {
		const location = this.getPreferredLocation()
		await this.revealLocation(location, preserveEditorFocus)
	}

	async revealLocation(location: TrumboDockLocation, preserveEditorFocus = false): Promise<void> {
		switch (location) {
			case "panel":
				await this.webview.openInPanel(preserveEditorFocus)
				break
			case "activitybar":
				await this.moveViewToPrimarySidebar()
				await this.webview.openInSidebar(preserveEditorFocus)
				break
			default:
				await this.ensureSecondarySidebarVisible()
				await this.webview.openInSidebar(preserveEditorFocus)
				break
		}
	}

	async openInSidebar(preserveEditorFocus = false): Promise<void> {
		await persistPreferredDockLocation("sidebar")
		await this.revealLocation("sidebar", preserveEditorFocus)
	}

	async openInPanel(preserveEditorFocus = false): Promise<void> {
		await persistPreferredDockLocation("panel")
		await this.revealLocation("panel", preserveEditorFocus)
	}

	async openInActivityBar(preserveEditorFocus = false): Promise<void> {
		await persistPreferredDockLocation("activitybar")
		await this.revealLocation("activitybar", preserveEditorFocus)
	}

	private registerStatusBar(): void {
		const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50)
		item.text = "$(sparkle) Trumbo"
		item.tooltip = "Open Trumbo chat"
		item.command = ExtensionRegistryInfo.commands.FocusChatInput
		item.show()
		this.statusBarItem = item
		this.context.subscriptions.push(item)
	}

	private registerPanelSerializer(): void {
		this.context.subscriptions.push(
			vscode.window.registerWebviewPanelSerializer(this.webview.getPanelViewType(), {
				deserializeWebviewPanel: async (panel, _state) => {
					await this.webview.restorePanel(panel)
				},
			}),
		)
	}

	private registerCommands(): void {
		const { commands } = ExtensionRegistryInfo
		this.context.subscriptions.push(
			vscode.commands.registerCommand(commands.OpenInSidebar, () => this.openInSidebar(false)),
			vscode.commands.registerCommand(commands.OpenInPanel, () => this.openInPanel(false)),
			vscode.commands.registerCommand(commands.OpenInActivityBar, () => this.openInActivityBar(false)),
		)
	}

	private async ensureSecondarySidebarVisible(): Promise<void> {
		try {
			await vscode.commands.executeCommand("workbench.action.focusAuxiliaryBar")
		} catch {
			// Older hosts may not expose auxiliary bar commands; fall back to view focus.
		}
		await vscode.commands.executeCommand(`${ExtensionRegistryInfo.views.Sidebar}.focus`)
	}

	private async moveViewToPrimarySidebar(): Promise<void> {
		try {
			await vscode.commands.executeCommand("workbench.action.moveViewToPrimarySideBar", {
				id: ExtensionRegistryInfo.views.Sidebar,
			})
		} catch {
			await vscode.commands.executeCommand(`${ExtensionRegistryInfo.views.Sidebar}.focus`)
		}
	}
}

export async function focusTrumboChat(preserveEditorFocus = false): Promise<void> {
	await getTrumboDockManager().focusTrumbo(preserveEditorFocus)
}
