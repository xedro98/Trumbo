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
	if (sdkRestoreCheckpoint) {
		if (request.number) {
			await sdkRestoreCheckpoint.call(controller, {
				checkpointRunCount: Number(request.number),
				restoreType: request.restoreType as TrumboCheckpointRestore,
			})
		}
		return Empty.create({})
	}

	return Empty.create({})
}
