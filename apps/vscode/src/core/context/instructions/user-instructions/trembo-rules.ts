import { synchronizeRuleToggles } from "@core/context/instructions/user-instructions/rule-helpers"
import { ensureRulesDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import { TremboRulesToggles } from "@shared/trembo-rules"
import path from "path"
import { Controller } from "@/core/controller"

export async function refreshTremboRulesToggles(
	controller: Controller,
	workingDirectory: string,
): Promise<{
	globalToggles: TremboRulesToggles
	localToggles: TremboRulesToggles
}> {
	// Global toggles
	const globalTremboRulesToggles = controller.stateManager.getGlobalSettingsKey("globalTremboRulesToggles")
	const globalTremboRulesFilePath = await ensureRulesDirectoryExists()
	const updatedGlobalToggles = await synchronizeRuleToggles(globalTremboRulesFilePath, globalTremboRulesToggles)
	controller.stateManager.setGlobalState("globalTremboRulesToggles", updatedGlobalToggles)

	// Local toggles
	const localTremboRulesToggles = controller.stateManager.getWorkspaceStateKey("localTremboRulesToggles")
	const localTremboRulesFilePath = path.resolve(workingDirectory, GlobalFileNames.tremboRules)
	const updatedLocalToggles = await synchronizeRuleToggles(localTremboRulesFilePath, localTremboRulesToggles, "", [
		[".tremborules", "workflows"],
		[".tremborules", "hooks"],
		[".tremborules", "skills"],
	])
	controller.stateManager.setWorkspaceState("localTremboRulesToggles", updatedLocalToggles)

	return {
		globalToggles: updatedGlobalToggles,
		localToggles: updatedLocalToggles,
	}
}
