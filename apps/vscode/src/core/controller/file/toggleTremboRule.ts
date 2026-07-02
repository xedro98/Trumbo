import { getWorkspaceBasename } from "@core/workspace"
import type { ToggleTremboRuleRequest } from "@shared/proto/trembo/file"
import { RuleScope, ToggleTremboRules } from "@shared/proto/trembo/file"
import { telemetryService } from "@/services/telemetry"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

/**
 * Toggles a Trembo rule (enable or disable)
 * @param controller The controller instance
 * @param request The toggle request
 * @returns The updated Trembo rule toggles
 */
export async function toggleTremboRule(controller: Controller, request: ToggleTremboRuleRequest): Promise<ToggleTremboRules> {
	const { scope, rulePath, enabled } = request

	if (!rulePath || typeof enabled !== "boolean" || scope === undefined) {
		Logger.error("toggleTremboRule: Missing or invalid parameters", {
			rulePath,
			scope,
			enabled: typeof enabled === "boolean" ? enabled : `Invalid: ${typeof enabled}`,
		})
		throw new Error("Missing or invalid parameters for toggleTremboRule")
	}

	// Handle the three different scopes
	switch (scope) {
		case RuleScope.GLOBAL: {
			const toggles = controller.stateManager.getGlobalSettingsKey("globalTremboRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("globalTremboRulesToggles", toggles)
			break
		}
		case RuleScope.LOCAL: {
			const toggles = controller.stateManager.getWorkspaceStateKey("localTremboRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setWorkspaceState("localTremboRulesToggles", toggles)
			break
		}
		case RuleScope.REMOTE: {
			const toggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("remoteRulesToggles", toggles)
			break
		}
		default:
			throw new Error(`Invalid scope: ${scope}`)
	}

	// Track rule toggle telemetry with current task context
	if (controller.task?.ulid) {
		// Extract just the filename for privacy (no full paths)
		const ruleFileName = getWorkspaceBasename(rulePath, "Controller.toggleTremboRule")
		const isGlobal = scope === RuleScope.GLOBAL
		telemetryService.captureTremboRuleToggled(controller.task.ulid, ruleFileName, enabled, isGlobal)
	}

	// Get the current state to return in the response
	const globalToggles = controller.stateManager.getGlobalSettingsKey("globalTremboRulesToggles")
	const localToggles = controller.stateManager.getWorkspaceStateKey("localTremboRulesToggles")
	const remoteToggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")

	return ToggleTremboRules.create({
		globalTremboRulesToggles: { toggles: globalToggles },
		localTremboRulesToggles: { toggles: localToggles },
		remoteRulesToggles: { toggles: remoteToggles },
	})
}
