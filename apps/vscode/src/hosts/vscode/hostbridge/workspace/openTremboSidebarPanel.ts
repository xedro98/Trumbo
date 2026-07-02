import * as vscode from "vscode"
import { ExtensionRegistryInfo } from "@/registry"
import { OpenTremboSidebarPanelRequest, OpenTremboSidebarPanelResponse } from "@/shared/proto/index.host"

export async function openTremboSidebarPanel(_: OpenTremboSidebarPanelRequest): Promise<OpenTremboSidebarPanelResponse> {
	await vscode.commands.executeCommand(`${ExtensionRegistryInfo.views.Sidebar}.focus`)
	return {}
}
