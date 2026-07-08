import { CheckpointRestoreRequest } from "@shared/proto/trumbo/checkpoints"
import { Empty } from "@shared/proto/trumbo/common"
import { TrumboCheckpointRestore } from "../../../shared/WebviewMessage"
import { Controller } from ".."

export async function checkpointRestore(controller: Controller, request: CheckpointRestoreRequest): Promise<Empty> {
	const sdkRestoreCheckpoint = (
		controller as Controller & {
			restoreCheckpoint?: (input: { checkpointRunCount: number; restoreType: TrumboCheckpointRestore }) => Promise<void>
		}
	).restoreCheckpoint
	if (!sdkRestoreCheckpoint) {
		throw new Error("Checkpoint restore is unavailable")
	}

	const checkpointRunCount = Number(request.number)
	if (!Number.isInteger(checkpointRunCount) || checkpointRunCount < 1) {
		throw new Error("checkpointRunCount must be a positive integer")
	}

	await sdkRestoreCheckpoint.call(controller, {
		checkpointRunCount,
		restoreType: request.restoreType as TrumboCheckpointRestore,
	})
	return Empty.create({})
}
