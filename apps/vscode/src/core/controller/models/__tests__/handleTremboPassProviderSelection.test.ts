import * as assert from "assert"
import { afterEach, beforeEach, describe, it } from "mocha"
import sinon from "sinon"
import { Logger } from "@/shared/services/Logger"
import type { Controller } from "../../index"
import { clearOrganizationForTremboPassProviderSelection } from "../handleTremboPassProviderSelection"

describe("clearOrganizationForTremboPassProviderSelection", () => {
	let sandbox: sinon.SinonSandbox
	let switchAccount: sinon.SinonStub

	beforeEach(() => {
		sandbox = sinon.createSandbox()
		switchAccount = sandbox.stub().resolves()
		sandbox.stub(Logger, "debug")
	})

	afterEach(() => {
		sandbox.restore()
	})

	function createController(): Controller {
		return {
			accountService: { switchAccount },
		} as unknown as Controller
	}

	it("does nothing when TremboPass is not selected", async () => {
		await clearOrganizationForTremboPassProviderSelection(createController(), {
			planModeApiProvider: "trembo",
			actModeApiProvider: "openrouter",
		})

		assert.strictEqual(switchAccount.callCount, 0)
	})

	it("switches to the personal account when TremboPass is selected", async () => {
		await clearOrganizationForTremboPassProviderSelection(createController(), {
			planModeApiProvider: "trembo-pass",
			actModeApiProvider: "openrouter",
		})

		assert.strictEqual(switchAccount.callCount, 1)
		assert.strictEqual(switchAccount.firstCall.args[0], null)
	})

	it("logs and swallows account switch failures", async () => {
		const error = new Error("not signed in")
		switchAccount.rejects(error)

		await clearOrganizationForTremboPassProviderSelection(createController(), {
			planModeApiProvider: "trembo",
			actModeApiProvider: "trembo-pass",
		})

		assert.strictEqual(switchAccount.callCount, 1)
		assert.strictEqual(switchAccount.firstCall.args[0], null)
		assert.ok((Logger.debug as sinon.SinonStub).calledOnce)
	})
})
