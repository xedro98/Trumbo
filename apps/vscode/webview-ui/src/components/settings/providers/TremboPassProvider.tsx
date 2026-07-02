import type { ModelInfo } from "@shared/api"
import { openAiModelInfoSafeDefaults } from "@shared/api"
import { Mode } from "@shared/storage/types"
import { buildTremboPassSubscriptionPageUrl } from "@/components/onboarding/tremboPassSubscribe"
import { useTremboAuth } from "@/context/TremboAuthContext"
import { useProviderConfig } from "@/hooks/useProviderConfig"
import { useProviderModelSelection } from "@/hooks/useProviderModelSelection"
import { useProviderModels } from "@/hooks/useProviderModels"
import { TremboAccountInfoCard } from "../TremboAccountInfoCard"
import { ModelInfoView } from "../common/ModelInfoView"
import ReasoningEffortSelector from "../ReasoningEffortSelector"
import { type ModelPickerSelection, ModelPickerWithManualEntry } from "./ModelPickerWithManualEntry"

interface TremboPassProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
}

const TREMBO_PASS_PROVIDER_ID = "trembo-pass"

function tremboPassFallbackModelInfo(modelId: string): ModelInfo {
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
 * TremboPass is a first-class SDK provider whose credentials are backed by the
 * user's Trembo OAuth account. Keep the UX close to the Trembo provider (account
 * card + model selection), but resolve and persist selections through the SDK
 * provider catalog under providerId="trembo-pass".
 */
export const TremboPassProvider = ({ showModelOptions, isPopup, currentMode }: TremboPassProviderProps) => {
	const { models, defaultModelId, isLoading, isStale, error } = useProviderModels(TREMBO_PASS_PROVIDER_ID)
	const { config, write, commitSelection } = useProviderConfig(TREMBO_PASS_PROVIDER_ID)
	const { selectedModel, commitModelSelection } = useProviderModelSelection(TREMBO_PASS_PROVIDER_ID, currentMode, {
		models,
		defaultModelId,
		config,
		commitSelection,
		customModelInfo: tremboPassFallbackModelInfo,
	})
	const { tremboUser } = useTremboAuth()

	const handleModelSelect = (selection: ModelPickerSelection) => {
		void commitModelSelection(selection).catch((err) => console.error("Failed to commit TremboPass model selection:", err))
	}

	return (
		<div>
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<TremboAccountInfoCard usageLink={buildTremboPassSubscriptionPageUrl(tremboUser?.appBaseUrl)} />
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
								}).catch((err) => console.error("Failed to update TremboPass reasoning effort:", err))
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
