import { GetCurrentPlanResponse, PlanRateLimitWindow } from "@shared/proto/trumbo/account"
import type { EmptyRequest } from "@shared/proto/trumbo/common"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../index"

/**
 * Handles fetching the current user's subscription plan + live rate-limit usage
 * (5h / daily / weekly). Trumbo is subscription-based: there is no credit
 * balance. Returns an empty response when the user/team has no active paid
 * subscription.
 * @param controller The controller instance
 * @param request Empty request
 * @returns Current plan + rate-limit usage response
 */
export async function getCurrentPlan(controller: Controller, _request: EmptyRequest): Promise<GetCurrentPlanResponse> {
	try {
		if (!controller.accountService) {
			throw new Error("Account service not available")
		}

		const plan = await controller.accountService.fetchCurrentUserPlanRPC()

		// undefined => auth/fetch failure; surface as an error.
		if (plan === undefined) {
			throw new Error("Failed to fetch current plan")
		}

		// null => no active paid subscription. Return an empty plan so the UI can
		// show a "subscribe" state instead of legacy credits.
		if (plan === null) {
			return GetCurrentPlanResponse.create({})
		}

		const sub = plan.subscription
		const rl = plan.rateLimits
		const billing = plan.billing

		return GetCurrentPlanResponse.create({
			planTier: plan.planTier ?? plan.plan?.tier,
			planName: plan.plan?.name,
			displayName: plan.plan?.displayName ?? plan.plan?.name,
			interval: plan.plan?.interval,
			currentPeriodStart: sub?.currentPeriodStart,
			currentPeriodEnd: sub?.currentPeriodEnd,
			subscriptionId: sub?.id,
			billingModel: billing?.model,
			seatCount: billing?.seatCount ?? undefined,
			memberCount: billing?.memberCount ?? undefined,
			pendingInviteCount: billing?.pendingInviteCount ?? undefined,
			fiveHour: toWindow(rl?.fiveHour),
			daily: toWindow(rl?.daily),
			weekly: toWindow(rl?.weekly),
		})
	} catch (error) {
		Logger.error(`Failed to fetch current plan: ${error}`)
		throw error
	}
}

function toWindow(w?: { used: number; limit: number; resetsAtSec: number } | null): PlanRateLimitWindow | undefined {
	if (!w) {
		return undefined
	}
	return PlanRateLimitWindow.create({ used: w.used, limit: w.limit, resetsAtSec: w.resetsAtSec })
}
