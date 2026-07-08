import { describe, it } from "bun:test"
import "should"
import { TrumboError, TrumboErrorType } from "../TrumboError"

describe("TrumboError", () => {
	describe("getErrorType", () => {
		it("should return QuotaExceeded when code is INFERENCE_CAP_ERROR", () => {
			const err = new TrumboError({ message: "Inference cap reached", code: "INFERENCE_CAP_ERROR" })
			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.QuotaExceeded)
		})

		it("should return Entitlement for the SDK TrumboPass subscription message", () => {
			const err = new TrumboError(
				"No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan: https://platform.trumbo.dev/promo?code=CLI-8OFF&personal=true",
			)

			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.Entitlement)
		})

		it("should return Entitlement for the SDK TrumboPass subscription message with a different app URL", () => {
			const err = new TrumboError(
				"No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan: https://staging-app.trumbo.dev/promo?code=CLI-8OFF&personal=true",
			)

			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.Entitlement)
		})

		it("should return Entitlement for the raw required-plan message", () => {
			const err = new TrumboError("403 Error 403: the user is not subscribed to required model plan")

			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.Entitlement)
		})

		it("should classify the SDK org individual subscription message separately", () => {
			const err = new TrumboError(
				"Organization accounts cannot use TrumboPass subscriptions. Go to /account -> change account to switch to your personal account for TrumboPass",
			)

			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.OrgTrumboPassRestriction)
		})

		it("should classify the raw organization individual subscription message separately", () => {
			const err = new TrumboError("403 Error 403: organization accounts cannot use individual model inference subscriptions")

			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.OrgTrumboPassRestriction)
		})

		it("should return SubscriptionRequired when code is subscription_required", () => {
			const err = new TrumboError({
				message: "An active paid subscription is required to use the Trumbo provider.",
				code: "subscription_required",
				status: 403,
			})

			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.SubscriptionRequired)
		})

		it("should return SubscriptionRequired for a 403 active-paid-subscription message (not Auth)", () => {
			const err = new TrumboError({
				message: "An active paid subscription is required to use the Trumbo provider. Subscribe at https://platform.trumbo.dev/billing",
				status: 403,
			})

			const type = TrumboError.getErrorType(err)
			type!.should.equal(TrumboErrorType.SubscriptionRequired)
			type!.should.not.equal(TrumboErrorType.Auth)
		})

		it("should return SubscriptionRequired when details.code is subscription_required", () => {
			const err = new TrumboError({
				message: "subscription required",
				status: 403,
				details: { code: "subscription_required", message: "Subscribe at /billing" },
			})

			TrumboError.getErrorType(err)!.should.equal(TrumboErrorType.SubscriptionRequired)
		})
	})
})
