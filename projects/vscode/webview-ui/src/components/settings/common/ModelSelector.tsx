import { ModelInfo } from "@shared/api"
import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import styled from "styled-components"
import { DebouncedTextField } from "./DebouncedTextField"

/**
 * Container for dropdowns that ensures proper z-index handling
 * This is necessary to ensure dropdown opens downward
 */
export const DropdownContainer = styled.div.attrs<{ zIndex?: number }>(({ zIndex }) => ({
	style: {
		zIndex: zIndex || 1000,
	},
}))`
	position: relative;

	// Force dropdowns to open downward
	& vscode-dropdown::part(listbox) {
		position: absolute !important;
		top: 100% !important;
		bottom: auto !important;
	}
`

/**
 * Sentinel option value used when {@link ModelSelectorProps.allowCustomModel}
 * is enabled. Selecting it reveals a free-form text field for entering a
 * custom model id that is not part of the bundled catalog (e.g. a custom
 * GCP Vertex model deployed in a user's own project).
 */
const CUSTOM_MODEL_SENTINEL = "__trumbo_custom_model__"

/**
 * Props for the ModelSelector component
 */
interface ModelSelectorProps {
	models: Record<string, ModelInfo>
	selectedModelId: string | undefined
	onChange: (e: any) => void
	zIndex?: number
	label?: string
	/**
	 * When true, appends a "Custom model..." option to the dropdown and
	 * reveals a free-form text field for entering a model id that is not in
	 * the catalog. The selected custom id is reported through
	 * {@link onCustomModelChange}; the dropdown `onChange` is only fired for
	 * catalog models.
	 */
	allowCustomModel?: boolean
	/**
	 * Current value of the free-form custom model field, used as the initial
	 * value when the custom field is shown but no custom model is committed yet.
	 */
	customModelValue?: string
	/**
	 * Called with the (debounced) custom model id as the user types. The host
	 * is responsible for committing the selection.
	 */
	onCustomModelChange?: (value: string) => void
}

/*
OG Saoud Note:

	VSCodeDropdown has an open bug where dynamically rendered options don't auto select the provided value prop. You can see this for yourself by comparing  it with normal select/option elements, which work as expected.
	https://github.com/microsoft/vscode-webview-ui-toolkit/issues/433

	In our case, when the user switches between providers, we recalculate the selectedModelId depending on the provider, the default model for that provider, and a modelId that the user may have selected. Unfortunately, the VSCodeDropdown component wouldn't select this calculated value, and would default to the first "Select a model..." option instead, which makes it seem like the model was cleared out when it wasn't.

	As a workaround, we create separate instances of the dropdown for each provider, and then conditionally render the one that matches the current provider.
	*/

/**
 * A reusable component for selecting models from a dropdown
 */
export const ModelSelector = ({
	models,
	selectedModelId,
	onChange,
	zIndex,
	label = "Model",
	allowCustomModel,
	customModelValue,
	onCustomModelChange,
}: ModelSelectorProps) => {
	const modelIds = Object.keys(models)
	const isCustomSelected =
		allowCustomModel === true && !!selectedModelId && !(selectedModelId in models) && selectedModelId !== ""
	const [customMode, setCustomMode] = useState(false)

	// Leave custom mode whenever a catalog model becomes the selection.
	useEffect(() => {
		if (selectedModelId && selectedModelId in models) {
			setCustomMode(false)
		}
	}, [selectedModelId, models])

	const showCustomField = allowCustomModel === true && (customMode || isCustomSelected)
	const dropdownValue = showCustomField ? CUSTOM_MODEL_SENTINEL : (selectedModelId ?? "")
	// Force VSCodeDropdown to re-initialize after async catalog/selection hydration.
	const dropdownKey = `${dropdownValue}:${modelIds.join("\u0000")}`

	return (
		<DropdownContainer className="dropdown-container" zIndex={zIndex}>
			<label htmlFor="model-id">
				<span className="font-medium">{label}</span>
			</label>
			<VSCodeDropdown
				className="w-full"
				id="model-id"
				key={dropdownKey}
				onChange={(e: any) => {
					const value = e.target.value
					if (value === CUSTOM_MODEL_SENTINEL) {
						// Reveal the free-form field; do not commit the sentinel.
						setCustomMode(true)
						return
					}
					setCustomMode(false)
					onChange(e)
				}}
				value={dropdownValue}>
				<VSCodeOption value="">Select a model...</VSCodeOption>
				{modelIds.map((modelId) => (
					<VSCodeOption className="break-words whitespace-normal max-w-full" key={modelId} value={modelId}>
						{modelId}
					</VSCodeOption>
				))}
				{allowCustomModel && (
					<VSCodeOption className="break-words whitespace-normal max-w-full" value={CUSTOM_MODEL_SENTINEL}>
						Custom model...
					</VSCodeOption>
				)}
			</VSCodeDropdown>
			{showCustomField && (
				<DebouncedTextField
					initialValue={isCustomSelected ? (selectedModelId ?? "") : (customModelValue ?? "")}
					onChange={(value) => onCustomModelChange?.(value)}
					placeholder="Enter custom model id..."
					style={{ width: "100%", marginTop: 4 }}
				/>
			)}
		</DropdownContainer>
	)
}
