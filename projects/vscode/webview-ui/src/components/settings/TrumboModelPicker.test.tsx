import { toProtobufModelInfo } from "@shared/proto-conversions/models/typeConversion"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useDynamicProviderSelection } from "@/hooks/useDynamicProviderSelection"
import { useProviderConfig } from "@/hooks/useProviderConfig"
import { useProviderModels } from "@/hooks/useProviderModels"
import TrumboModelPicker from "./TrumboModelPicker"

const mocks = vi.hoisted(() => ({
	commitSelection: vi.fn(async () => undefined),
	writeProviderConfig: vi.fn(async () => undefined),
	updateApiConfigurationProto: vi.fn(async () => undefined),
	makeUnaryRequest: vi.fn(async () => ({
		recommended: [
			{
				id: "trumbo-next",
				description: "Next Trumbo model",
				tags: ["recommended"],
			},
		],
		free: [],
	})),
	toggleFavoriteModel: vi.fn(async () => undefined),
}))

vi.mock("@/context/ExtensionStateContext", () => ({
	useExtensionState: vi.fn(),
}))

vi.mock("@/hooks/useDynamicProviderSelection", () => ({
	useDynamicProviderSelection: vi.fn(),
}))

vi.mock("@/hooks/useProviderModels", () => ({
	useProviderModels: vi.fn(),
}))

vi.mock("@/hooks/useProviderConfig", () => ({
	useProviderConfig: vi.fn(),
}))

vi.mock("@/services/grpc-client", () => ({
	ModelsServiceClient: {
		makeUnaryRequest: mocks.makeUnaryRequest,
		updateApiConfigurationProto: mocks.updateApiConfigurationProto,
	},
	StateServiceClient: {
		toggleFavoriteModel: mocks.toggleFavoriteModel,
	},
}))

describe("TrumboModelPicker", () => {
	beforeEach(() => {
		vi.clearAllMocks()

		vi.mocked(useExtensionState).mockReturnValue({
			apiConfiguration: {
				actModeTrumboModelId: "trumbo-default",
				actModeTrumboModelInfo: {
					name: "Trumbo Default",
					supportsPromptCache: true,
				},
			},
			favoritedModelIds: [],
			planActSeparateModelsSetting: true,
		} as ReturnType<typeof useExtensionState>)

		vi.mocked(useProviderModels).mockReturnValue({
			models: {
				"trumbo-default": { name: "Trumbo Default", supportsPromptCache: true },
				"trumbo-next": {
					name: "Trumbo Next",
					supportsPromptCache: true,
					contextWindow: 128_000,
				},
			},
			defaultModelId: "trumbo-default",
			isLoading: false,
			isStale: false,
			error: undefined,
			refresh: vi.fn(),
			fingerprint: "fingerprint",
		})

		vi.mocked(useProviderConfig).mockReturnValue({
			config: undefined,
			write: mocks.writeProviderConfig,
			commitSelection: mocks.commitSelection,
		})

		vi.mocked(useDynamicProviderSelection).mockReturnValue({
			selectedModelId: "trumbo-default",
			selectedModelInfo: { name: "Trumbo Default", supportsPromptCache: true },
			hideUsageCost: false,
		})
	})

	it("commits Trumbo model selections through provider config so providers.json is updated", async () => {
		render(<TrumboModelPicker currentMode="act" />)

		fireEvent.click(await screen.findByText("trumbo-next"))

		await waitFor(() => expect(mocks.commitSelection).toHaveBeenCalledTimes(1))
		expect(mocks.commitSelection).toHaveBeenCalledWith("act", {
			providerId: "trumbo",
			modelId: "trumbo-next",
			modelInfo: {
				name: "Trumbo Next",
				supportsPromptCache: true,
				contextWindow: 128_000,
			},
		})
	})

	it("hydrates the selected Trumbo model from provider config when legacy settings are empty", () => {
		vi.mocked(useExtensionState).mockReturnValue({
			apiConfiguration: {},
			favoritedModelIds: [],
			planActSeparateModelsSetting: true,
		} as ReturnType<typeof useExtensionState>)
		vi.mocked(useProviderConfig).mockReturnValue({
			config: {
				providerId: "trumbo",
				actSelection: {
					providerId: "trumbo",
					modelId: "trumbo-next",
					modelInfo: toProtobufModelInfo({
						name: "Trumbo Next",
						supportsPromptCache: true,
						contextWindow: 128_000,
					}),
				},
			},
			write: mocks.writeProviderConfig,
			commitSelection: mocks.commitSelection,
		})

		render(<TrumboModelPicker currentMode="act" />)

		expect(screen.getByRole("combobox")).toHaveValue("trumbo-next")
	})

	it("uses live catalog reasoning support when the saved Trumbo model snapshot is stale", () => {
		vi.mocked(useExtensionState).mockReturnValue({
			apiConfiguration: {
				actModeTrumboModelId: "glm-5.2",
				actModeTrumboModelInfo: {
					name: "GLM 5.2",
					supportsPromptCache: true,
				},
			},
			favoritedModelIds: [],
			planActSeparateModelsSetting: true,
		} as ReturnType<typeof useExtensionState>)
		vi.mocked(useProviderModels).mockReturnValue({
			models: {
				"glm-5.2": {
					name: "GLM 5.2",
					supportsPromptCache: true,
					contextWindow: 1_048_576,
					supportsReasoning: true,
				},
			},
			defaultModelId: "glm-5.2",
			isLoading: false,
			isStale: false,
			error: undefined,
			refresh: vi.fn(),
			fingerprint: "fingerprint",
		})
		vi.mocked(useProviderConfig).mockReturnValue({
			config: {
				providerId: "trumbo",
				actSelection: {
					providerId: "trumbo",
					modelId: "glm-5.2",
					modelInfo: toProtobufModelInfo({
						name: "GLM 5.2",
						supportsPromptCache: true,
					}),
				},
			},
			write: mocks.writeProviderConfig,
			commitSelection: mocks.commitSelection,
		})
		vi.mocked(useDynamicProviderSelection).mockReturnValue({
			selectedModelId: "glm-5.2",
			selectedModelInfo: { name: "GLM 5.2", supportsPromptCache: true },
			hideUsageCost: false,
		})

		render(<TrumboModelPicker currentMode="act" />)

		expect(screen.getByText("Reasoning Effort")).toBeInTheDocument()
	})
})
