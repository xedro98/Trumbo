import { Empty, StringRequest } from "@shared/proto/trembo/common"
import * as vscode from "vscode"

const TREMBO_OUTPUT_CHANNEL = vscode.window.createOutputChannel("Trembo")

// Appends a log message to all Trembo output channels.
export async function debugLog(request: StringRequest): Promise<Empty> {
	TREMBO_OUTPUT_CHANNEL.appendLine(request.value)
	return Empty.create({})
}

// Register the Trembo output channel within the VSCode extension context.
export function registerTremboOutputChannel(context: vscode.ExtensionContext): vscode.OutputChannel {
	context.subscriptions.push(TREMBO_OUTPUT_CHANNEL)
	return TREMBO_OUTPUT_CHANNEL
}
