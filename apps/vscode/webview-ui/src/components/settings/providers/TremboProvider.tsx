import { Mode } from "@shared/storage/types"
import { TremboAccountInfoCard } from "../TremboAccountInfoCard"
import TremboModelPicker from "../TremboModelPicker"

/**
 * Props for the TremboProvider component
 */
interface TremboProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
	initialModelTab?: "recommended" | "free"
}

/**
 * The Trembo provider configuration component
 */
export const TremboProvider = ({ showModelOptions, isPopup, currentMode, initialModelTab }: TremboProviderProps) => {
	return (
		<div>
			{/* Trembo Account Info Card */}
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<TremboAccountInfoCard />
			</div>

			{showModelOptions && (
				<TremboModelPicker
					currentMode={currentMode}
					initialTab={initialModelTab}
					isPopup={isPopup}
					showProviderRouting={true}
				/>
			)}
		</div>
	)
}
