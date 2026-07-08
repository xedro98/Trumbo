import { Empty, StringRequest } from "@shared/proto/trumbo/common"
import * as vscode from "vscode"

const TRUMBO_OUTPUT_CHANNEL = vscode.window.createOutputChannel("Trumbo")

// Appends a log message to all Trumbo output channels.
export async function debugLog(request: StringRequest): Promise<Empty> {
	TRUMBO_OUTPUT_CHANNEL.appendLine(request.value)
	return Empty.create({})
}

// Register the Trumbo output channel within the VSCode extension context.
export function registerTrumboOutputChannel(context: vscode.ExtensionContext): vscode.OutputChannel {
	context.subscriptions.push(TRUMBO_OUTPUT_CHANNEL)
	return TRUMBO_OUTPUT_CHANNEL
}
