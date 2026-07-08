import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildSdkProviderConfig } from "./sdk-api-handler"

const mocks = vi.hoisted(() => {
	const providerSettingsManager = {
		getProviderSettings: vi.fn(),
	}
	return {
		getProviderSettingsManager: vi.fn(() => providerSettingsManager),
		providerSettingsManager,
	}
})

vi.mock("./provider-migration", () => ({
	getProviderSettingsManager: mocks.getProviderSettingsManager,
}))

vi.mock("@shared/services/Logger", () => ({
	Logger: {
		warn: vi.fn(),
	},
}))

describe("buildSdkProviderConfig", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("uses shared Trumbo OAuth credentials for TrumboPass direct handlers", () => {
		mocks.providerSettingsManager.getProviderSettings.mockImplementation((providerId: string) => {
			if (providerId !== "trumbo") {
				return undefined
			}
			return {
				provider: "trumbo",
				auth: {
					accessToken: "workos:shared-trumbo-token",
					refreshToken: "refresh-token",
				},
			}
		})

		const providerConfig = buildSdkProviderConfig(
			{
				actModeApiProvider: "trumbo-pass",
				actModeTrumboPassModelId: "trumbo-pass/glm-5.1",
			},
			"act",
		)

		expect(providerConfig).toMatchObject({
			providerId: "trumbo-pass",
			modelId: "trumbo-pass/glm-5.1",
			apiKey: "workos:shared-trumbo-token",
		})
		expect(mocks.providerSettingsManager.getProviderSettings).toHaveBeenCalledWith("trumbo")
	})

	it("uses provider-specific settings for SDK-backed direct handlers", () => {
		mocks.providerSettingsManager.getProviderSettings.mockImplementation((providerId: string) => {
			if (providerId !== "v0") {
				return undefined
			}
			return {
				provider: "v0",
				apiKey: "v0-key",
			}
		})

		const providerConfig = buildSdkProviderConfig(
			{
				actModeApiProvider: "v0",
				actModeApiModelId: "v0-1.5-md",
			},
			"act",
		)

		expect(providerConfig).toMatchObject({
			providerId: "v0",
			modelId: "v0-1.5-md",
			apiKey: "v0-key",
		})
		expect(mocks.providerSettingsManager.getProviderSettings).toHaveBeenCalledWith("v0")
	})
})
