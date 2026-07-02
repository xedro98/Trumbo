import { CheckpointRestoreRequest } from "@shared/proto/trembo/checkpoints"
import { Empty } from "@shared/proto/trembo/common"
import { TremboCheckpointRestore } from "../../../shared/WebviewMessage"
import { Controller } from ".."

export async function checkpointRestore(controller: Controller, request: CheckpointRestoreRequest): Promise<Empty> {
	const sdkRestoreCheckpoint = (
		controller as Controller & {
			restoreCheckpoint?: (input: { checkpointRunCount: number; restoreType: TremboCheckpointRestore }) => Promise<void>
		}
	).restoreCheckpoint
	if (sdkRestoreCheckpoint) {
		if (request.number) {
			await sdkRestoreCheckpoint.call(controller, {
				checkpointRunCount: Number(request.number),
				restoreType: request.restoreType as TremboCheckpointRestore,
			})
		}
		return Empty.create({})
	}

	return Empty.create({})
}
