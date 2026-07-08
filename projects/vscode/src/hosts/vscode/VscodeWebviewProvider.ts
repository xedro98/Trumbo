import { sendShowWebviewEvent } from "@core/controller/ui/subscribeToShowWebview"
import { WebviewProvider } from "@core/webview"
import * as vscode from "vscode"
import { handleGrpcRequest, handleGrpcRequestCancel } from "@/core/controller/grpc-handler"
import { HostProvider } from "@/hosts/host-provider"
import { ExtensionRegistryInfo } from "@/registry"
import { telemetryService } from "@/services/telemetry"
import type { ExtensionMessage } from "@/shared/ExtensionMessage"
import { Logger } from "@/shared/services/Logger"
import { WebviewMessage } from "@/shared/WebviewMessage"

/*
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/blob/main/default/weather-webview/src/providers/WeatherViewProvider.ts
https://github.com/KumarVariable/vscode-extension-sidebar-html/blob/master/src/customSidebarViewProvider.ts
*/

export class VscodeWebviewProvider extends WebviewProvider implements vscode.WebviewViewProvider {
	// Used in package.json as the view's id. This value cannot be changed due to how vscode caches
	// views based on their id, and updating the id would break existing instances of the extension.
	public static readonly SIDEBAR_ID = ExtensionRegistryInfo.views.Sidebar
	public static readonly PANEL_VIEW_TYPE = "trumbo.Panel"

	private sidebarView?: vscode.WebviewView
	private panel?: vscode.WebviewPanel
	private disposables: vscode.Disposable[] = []
	private panelDisposables: vscode.Disposable[] = []

	getPanelViewType(): string {
		return VscodeWebviewProvider.PANEL_VIEW_TYPE
	}

	private getHostedWebview(): vscode.Webview | undefined {
		if (this.panel?.visible) {
			return this.panel.webview
		}
		return this.sidebarView?.webview
	}

	override getWebviewUrl(path: string) {
		const webview = this.getHostedWebview()
		if (!webview) {
			throw new Error("Webview not initialized")
		}
		const uri = webview.asWebviewUri(vscode.Uri.file(path))
		return uri.toString()
	}

	override getCspSource() {
		const webview = this.getHostedWebview()
		if (!webview) {
			throw new Error("Webview not initialized")
		}
		return webview.cspSource
	}

	override isVisible() {
		return (this.sidebarView?.visible ?? false) || (this.panel?.visible ?? false)
	}

	public getWebview(): vscode.WebviewView | undefined {
		return this.sidebarView
	}

	public getPanel(): vscode.WebviewPanel | undefined {
		return this.panel
	}

	public async openInSidebar(preserveEditorFocus = false): Promise<void> {
		if (this.sidebarView) {
			this.sidebarView.show(!preserveEditorFocus)
		} else {
			await vscode.commands.executeCommand(`${VscodeWebviewProvider.SIDEBAR_ID}.focus`)
		}
		await sendShowWebviewEvent(preserveEditorFocus)
	}

	public async openInPanel(preserveEditorFocus = false): Promise<void> {
		if (this.panel) {
			this.panel.reveal(undefined, !preserveEditorFocus)
			await sendShowWebviewEvent(preserveEditorFocus)
			return
		}

		const panel = vscode.window.createWebviewPanel(
			VscodeWebviewProvider.PANEL_VIEW_TYPE,
			"Trumbo",
			{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: preserveEditorFocus },
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.file(HostProvider.get().extensionFsPath)],
			},
		)
		await this.bindPanel(panel)
		telemetryService.capturePanelOpened("editor_panel")
		await sendShowWebviewEvent(preserveEditorFocus)
	}

	public async restorePanel(panel: vscode.WebviewPanel): Promise<void> {
		await this.bindPanel(panel)
		telemetryService.capturePanelOpened("editor_panel_restored")
	}

	private async bindPanel(panel: vscode.WebviewPanel): Promise<void> {
		this.panel = panel
		await this.initializeWebviewContent(panel.webview)
		this.setWebviewMessageListener(panel.webview, this.panelDisposables)

		panel.onDidChangeViewState(
			async () => {
				if (panel.visible) {
					telemetryService.capturePanelOpened("editor_panel_visible")
					await sendShowWebviewEvent(true)
				}
			},
			null,
			this.panelDisposables,
		)

		panel.onDidDispose(
			async () => {
				while (this.panelDisposables.length) {
					const disposable = this.panelDisposables.pop()
					disposable?.dispose()
				}
				this.panel = undefined
			},
			null,
			this.panelDisposables,
		)
	}

	/**
	 * Initializes and sets up the webview when it's first created.
	 *
	 * @param webviewView - The sidebar webview view instance to be resolved
	 * @returns A promise that resolves when the webview has been fully initialized
	 */
	public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
		this.sidebarView = webviewView

		await this.initializeWebviewContent(webviewView.webview)
		this.setWebviewMessageListener(webviewView.webview)
		telemetryService.capturePanelOpened("sidebar_resolved")

		webviewView.onDidChangeVisibility(
			async () => {
				if (this.sidebarView?.visible) {
					telemetryService.capturePanelOpened("sidebar_visible")
					await sendShowWebviewEvent(true)
				}
			},
			null,
			this.disposables,
		)

		webviewView.onDidDispose(
			async () => {
				this.sidebarView = undefined
				if (!this.panel) {
					await this.dispose()
				}
			},
			null,
			this.disposables,
		)

		// if the extension is starting a new session, clear previous task state
		this.controller.clearTask()

		Logger.log("[VscodeWebviewProvider] Webview view resolved")
	}

	private async initializeWebviewContent(webview: vscode.Webview): Promise<void> {
		webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(HostProvider.get().extensionFsPath)],
		}

		webview.html =
			this.context.extensionMode === vscode.ExtensionMode.Development
				? await this.getHMRHtmlContent()
				: this.getHtmlContent()
	}

	/**
	 * Sets up an event listener to listen for messages passed from the webview context and
	 * executes code based on the message that is received.
	 *
	 * @param webview The webview instance to attach the message listener to
	 */
	private setWebviewMessageListener(webview: vscode.Webview, targetDisposables: vscode.Disposable[] = this.disposables) {
		webview.onDidReceiveMessage(
			(message) => {
				this.handleWebviewMessage(message)
			},
			null,
			targetDisposables,
		)
	}

	async handleWebviewMessage(message: WebviewMessage) {
		const postMessageToWebview = (response: ExtensionMessage) => this.postMessageToWebview(response)

		switch (message.type) {
			case "grpc_request": {
				if (message.grpc_request) {
					await handleGrpcRequest(this.controller, postMessageToWebview, message.grpc_request)
				}
				break
			}
			case "grpc_request_cancel": {
				if (message.grpc_request_cancel) {
					await handleGrpcRequestCancel(postMessageToWebview, message.grpc_request_cancel)
				}
				break
			}
			default: {
				Logger.error("Received unhandled WebviewMessage type:", JSON.stringify(message))
			}
		}
	}

	private async postMessageToWebview(message: ExtensionMessage): Promise<boolean | undefined> {
		const targets: vscode.Webview[] = []
		if (this.sidebarView?.visible) {
			targets.push(this.sidebarView.webview)
		}
		if (this.panel?.visible) {
			targets.push(this.panel.webview)
		}
		if (targets.length === 0) {
			if (this.sidebarView) {
				targets.push(this.sidebarView.webview)
			} else if (this.panel) {
				targets.push(this.panel.webview)
			}
		}

		if (targets.length === 0) {
			return undefined
		}

		const results = await Promise.all(targets.map((target) => target.postMessage(message)))
		return results.some(Boolean)
	}

	override async dispose() {
		if (this.panel) {
			this.panel.dispose()
			this.panel = undefined
		}

		while (this.panelDisposables.length) {
			const disposable = this.panelDisposables.pop()
			disposable?.dispose()
		}

		while (this.disposables.length) {
			const disposable = this.disposables.pop()
			disposable?.dispose()
		}

		await super.dispose()
	}
}
