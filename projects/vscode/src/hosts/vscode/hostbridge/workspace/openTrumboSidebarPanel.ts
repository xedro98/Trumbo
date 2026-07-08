import * as vscode from "vscode"
import { ExtensionRegistryInfo } from "@/registry"
import { OpenTrumboSidebarPanelRequest, OpenTrumboSidebarPanelResponse } from "@/shared/proto/index.host"

export async function openTrumboSidebarPanel(_: OpenTrumboSidebarPanelRequest): Promise<OpenTrumboSidebarPanelResponse> {
	await vscode.commands.executeCommand(ExtensionRegistryInfo.commands.FocusChatInput)
	return {}
}
