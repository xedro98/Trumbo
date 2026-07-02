import * as proto from "@/shared/proto"
import { Controller } from "../index"

export async function updateTerminalReuseEnabled(
	controller: Controller,
	request: proto.trembo.BooleanRequest,
): Promise<proto.trembo.Empty> {
	const enabled = request.value

	// Update the terminal reuse setting in the state
	controller.stateManager.setGlobalState("terminalReuseEnabled", enabled)

	// Broadcast state update to all webviews
	await controller.postStateToWebview()

	return proto.trembo.Empty.create({})
}
