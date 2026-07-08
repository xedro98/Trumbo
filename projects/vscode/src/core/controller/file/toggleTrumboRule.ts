import { getWorkspaceBasename } from "@core/workspace"
import type { ToggleTrumboRuleRequest } from "@shared/proto/trumbo/file"
import { RuleScope, ToggleTrumboRules } from "@shared/proto/trumbo/file"
import { telemetryService } from "@/services/telemetry"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

/**
 * Toggles a Trumbo rule (enable or disable)
 * @param controller The controller instance
 * @param request The toggle request
 * @returns The updated Trumbo rule toggles
 */
export async function toggleTrumboRule(controller: Controller, request: ToggleTrumboRuleRequest): Promise<ToggleTrumboRules> {
	const { scope, rulePath, enabled } = request

	if (!rulePath || typeof enabled !== "boolean" || scope === undefined) {
		Logger.error("toggleTrumboRule: Missing or invalid parameters", {
			rulePath,
			scope,
			enabled: typeof enabled === "boolean" ? enabled : `Invalid: ${typeof enabled}`,
		})
		throw new Error("Missing or invalid parameters for toggleTrumboRule")
	}

	// Handle the three different scopes
	switch (scope) {
		case RuleScope.GLOBAL: {
			const toggles = controller.stateManager.getGlobalSettingsKey("globalTrumboRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setGlobalState("globalTrumboRulesToggles", toggles)
			break
		}
		case RuleScope.LOCAL: {
			const toggles = controller.stateManager.getWorkspaceStateKey("localTrumboRulesToggles")
			toggles[rulePath] = enabled
			controller.stateManager.setWorkspaceState("localTrumboRulesToggles", toggles)
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
		const ruleFileName = getWorkspaceBasename(rulePath, "Controller.toggleTrumboRule")
		const isGlobal = scope === RuleScope.GLOBAL
		telemetryService.captureTrumboRuleToggled(controller.task.ulid, ruleFileName, enabled, isGlobal)
	}

	// Get the current state to return in the response
	const globalToggles = controller.stateManager.getGlobalSettingsKey("globalTrumboRulesToggles")
	const localToggles = controller.stateManager.getWorkspaceStateKey("localTrumboRulesToggles")
	const remoteToggles = controller.stateManager.getGlobalStateKey("remoteRulesToggles")

	return ToggleTrumboRules.create({
		globalTrumboRulesToggles: { toggles: globalToggles },
		localTrumboRulesToggles: { toggles: localToggles },
		remoteRulesToggles: { toggles: remoteToggles },
	})
}
