import { describe, it } from "bun:test"
import "should"
import { TremboError, TremboErrorType } from "../TremboError"

describe("TremboError", () => {
	describe("getErrorType", () => {
		it("should return QuotaExceeded when code is INFERENCE_CAP_ERROR", () => {
			const err = new TremboError({ message: "Inference cap reached", code: "INFERENCE_CAP_ERROR" })
			TremboError.getErrorType(err)!.should.equal(TremboErrorType.QuotaExceeded)
		})

		it("should return Entitlement for the SDK TremboPass subscription message", () => {
			const err = new TremboError(
				"No access to TremboPass subscription models yet. Subscribe to TremboPass, the low cost open weights model coding plan: http://0.0.0.0:0/promo?code=CLI-8OFF&personal=true",
			)

			TremboError.getErrorType(err)!.should.equal(TremboErrorType.Entitlement)
		})

		it("should return Entitlement for the SDK TremboPass subscription message with a different app URL", () => {
			const err = new TremboError(
				"No access to TremboPass subscription models yet. Subscribe to TremboPass, the low cost open weights model coding plan: http://0.0.0.0:0/promo?code=CLI-8OFF&personal=true",
			)

			TremboError.getErrorType(err)!.should.equal(TremboErrorType.Entitlement)
		})

		it("should return Entitlement for the raw required-plan message", () => {
			const err = new TremboError("403 Error 403: the user is not subscribed to required model plan")

			TremboError.getErrorType(err)!.should.equal(TremboErrorType.Entitlement)
		})

		it("should classify the SDK org individual subscription message separately", () => {
			const err = new TremboError(
				"Organization accounts cannot use TremboPass subscriptions. Go to /account -> change account to switch to your personal account for TremboPass",
			)

			TremboError.getErrorType(err)!.should.equal(TremboErrorType.OrgTremboPassRestriction)
		})

		it("should classify the raw organization individual subscription message separately", () => {
			const err = new TremboError(
				"403 Error 403: organization accounts cannot use individual model inference subscriptions",
			)

			TremboError.getErrorType(err)!.should.equal(TremboErrorType.OrgTremboPassRestriction)
		})
	})
})
