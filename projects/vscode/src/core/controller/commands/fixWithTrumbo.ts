import { getFileMentionFromPath } from "@/core/mentions"
import { singleFileDiagnosticsToProblemsString } from "@/integrations/diagnostics"
import { telemetryService } from "@/services/telemetry"
import { CommandContext, Empty } from "@/shared/proto/index.trumbo"
import { Logger } from "@/shared/services/Logger"
import { Controller } from "../index"

export async function fixWithTrumbo(controller: Controller, request: CommandContext): Promise<Empty> {
	const filePath = request.filePath || ""
	const fileMention = await getFileMentionFromPath(filePath)
	const problemsString = await singleFileDiagnosticsToProblemsString(filePath, request.diagnostics)

	await controller.initTask(
		`Fix the following code in ${fileMention}
\`\`\`\n${request.selectedText}\n\`\`\`\n\nProblems:\n${problemsString}`,
	)
	Logger.log("fixWithTrumbo", request.selectedText, request.filePath, request.language, problemsString)

	telemetryService.captureButtonClick("codeAction_fixWithTrumbo", controller.task?.ulid)
	return {}
}
