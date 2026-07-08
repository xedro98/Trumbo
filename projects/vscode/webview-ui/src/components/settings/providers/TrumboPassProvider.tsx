import type { ModelInfo } from "@shared/api"
import { openAiModelInfoSafeDefaults } from "@shared/api"
import { Mode } from "@shared/storage/types"
import { buildTrumboPassSubscriptionPageUrl } from "@/components/onboarding/trumboPassSubscribe"
import { useTrumboAuth } from "@/context/TrumboAuthContext"
import { useProviderConfig } from "@/hooks/useProviderConfig"
import { useProviderModelSelection } from "@/hooks/useProviderModelSelection"
import { useProviderModels } from "@/hooks/useProviderModels"
import { TrumboAccountInfoCard } from "../TrumboAccountInfoCard"
import { ModelInfoView } from "../common/ModelInfoView"
import ReasoningEffortSelector from "../ReasoningEffortSelector"
import { type ModelPickerSelection, ModelPickerWithManualEntry } from "./ModelPickerWithManualEntry"

interface TrumboPassProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
}

const TRUMBO_PASS_PROVIDER_ID = "trumbo-pass"

function trumboPassFallbackModelInfo(modelId: string): ModelInfo {
	return {
		...openAiModelInfoSafeDefaults,
		name: modelId,
		inputPrice: 0,
		outputPrice: 0,
		cacheReadsPrice: 0,
		cacheWritesPrice: 0,
	}
}

/**
 * TrumboPass is a first-class SDK provider whose credentials are backed by the
 * user's Trumbo OAuth account. Keep the UX close to the Trumbo provider (account
 * card + model selection), but resolve and persist selections through the SDK
 * provider catalog under providerId="trumbo-pass".
 */
export const TrumboPassProvider = ({ showModelOptions, isPopup, currentMode }: TrumboPassProviderProps) => {
	const { models, defaultModelId, isLoading, isStale, error } = useProviderModels(TRUMBO_PASS_PROVIDER_ID)
	const { config, write, commitSelection } = useProviderConfig(TRUMBO_PASS_PROVIDER_ID)
	const { selectedModel, commitModelSelection } = useProviderModelSelection(TRUMBO_PASS_PROVIDER_ID, currentMode, {
		models,
		defaultModelId,
		config,
		commitSelection,
		customModelInfo: trumboPassFallbackModelInfo,
	})
	const { trumboUser } = useTrumboAuth()

	const handleModelSelect = (selection: ModelPickerSelection) => {
		void commitModelSelection(selection).catch((err) => console.error("Failed to commit TrumboPass model selection:", err))
	}

	return (
		<div>
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<TrumboAccountInfoCard usageLink={buildTrumboPassSubscriptionPageUrl(trumboUser?.appBaseUrl)} />
			</div>

			{showModelOptions && (
				<>
					<ModelPickerWithManualEntry
						allowsCustomIds={false}
						error={error}
						isLoading={isLoading}
						isStale={isStale}
						models={models}
						onSelect={handleModelSelect}
						selectedModel={selectedModel}
					/>

					{selectedModel.modelInfo.supportsReasoning === true && (
						<ReasoningEffortSelector
							currentMode={currentMode}
							onEffortChange={(effort) => {
								void write({
									reasoning: {
										enabled: effort !== "none",
										effort: effort !== "none" ? effort : undefined,
									},
								}).catch((err) => console.error("Failed to update TrumboPass reasoning effort:", err))
							}}
						/>
					)}

					<ModelInfoView
						hideUsageCost={true}
						isPopup={isPopup}
						modelInfo={selectedModel.modelInfo}
						selectedModelId={selectedModel.modelId}
					/>
				</>
			)}
		</div>
	)
}
