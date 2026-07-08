import { Mode } from "@shared/storage/types"
import { TrumboAccountInfoCard } from "../TrumboAccountInfoCard"
import TrumboModelPicker from "../TrumboModelPicker"

/**
 * Props for the TrumboProvider component
 */
interface TrumboProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
	initialModelTab?: "recommended" | "free"
}

/**
 * The Trumbo provider configuration component
 */
export const TrumboProvider = ({ showModelOptions, isPopup, currentMode, initialModelTab }: TrumboProviderProps) => {
	return (
		<div>
			{/* Trumbo Account Info Card */}
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<TrumboAccountInfoCard />
			</div>

			{showModelOptions && (
				<TrumboModelPicker
					currentMode={currentMode}
					initialTab={initialModelTab}
					isPopup={isPopup}
					showProviderRouting={true}
				/>
			)}
		</div>
	)
}
