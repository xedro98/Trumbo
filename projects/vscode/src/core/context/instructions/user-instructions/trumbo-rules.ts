import { synchronizeRuleToggles } from "@core/context/instructions/user-instructions/rule-helpers"
import { ensureRulesDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import { TrumboRulesToggles } from "@shared/trumbo-rules"
import path from "path"
import { Controller } from "@/core/controller"

export async function refreshTrumboRulesToggles(
	controller: Controller,
	workingDirectory: string,
): Promise<{
	globalToggles: TrumboRulesToggles
	localToggles: TrumboRulesToggles
}> {
	// Global toggles
	const globalTrumboRulesToggles = controller.stateManager.getGlobalSettingsKey("globalTrumboRulesToggles")
	const globalTrumboRulesFilePath = await ensureRulesDirectoryExists()
	const updatedGlobalToggles = await synchronizeRuleToggles(globalTrumboRulesFilePath, globalTrumboRulesToggles)
	controller.stateManager.setGlobalState("globalTrumboRulesToggles", updatedGlobalToggles)

	// Local toggles
	const localTrumboRulesToggles = controller.stateManager.getWorkspaceStateKey("localTrumboRulesToggles")
	const localTrumboRulesFilePath = path.resolve(workingDirectory, GlobalFileNames.trumboRules)
	const updatedLocalToggles = await synchronizeRuleToggles(localTrumboRulesFilePath, localTrumboRulesToggles, "", [
		[".trumborules", "workflows"],
		[".trumborules", "hooks"],
		[".trumborules", "skills"],
	])
	controller.stateManager.setWorkspaceState("localTrumboRulesToggles", updatedLocalToggles)

	return {
		globalToggles: updatedGlobalToggles,
		localToggles: updatedLocalToggles,
	}
}
