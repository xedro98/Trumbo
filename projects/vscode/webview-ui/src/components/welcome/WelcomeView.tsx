import { BooleanRequest } from "@shared/proto/trumbo/common"
import { memo, useEffect, useState } from "react"
import BrandMark from "@/components/brand/BrandMark"
import { TrumboButton } from "@/components/trumbo"
import ApiOptions from "@/components/settings/ApiOptions"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { StateServiceClient } from "@/services/grpc-client"
import { validateApiConfiguration } from "@/utils/validate"

const WelcomeView = memo(() => {
	const { apiConfiguration, mode } = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [showApiOptions, setShowApiOptions] = useState(false)

	const disableLetsGoButton = apiErrorMessage != null

	const handleSubmit = async () => {
		try {
			await StateServiceClient.setWelcomeViewCompleted(BooleanRequest.create({ value: true }))
		} catch (error) {
			console.error("Failed to update API configuration or complete welcome view:", error)
		}
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(mode, apiConfiguration))
	}, [apiConfiguration, mode])

	return (
		<div className="fixed inset-0 flex flex-col p-0">
			<div className="flex h-full flex-col items-center justify-center gap-5 overflow-auto px-5">
				{/* Brand hero */}
				<div className="flex flex-col items-center gap-4">
					<div className="relative flex items-center justify-center">
						<div
							aria-hidden
							className="absolute inset-0 -m-4 rounded-full opacity-80 blur-lg"
							style={{
								background:
									"radial-gradient(circle, color-mix(in srgb, var(--brand) 40%, transparent) 0%, transparent 70%)",
							}}
						/>
						<BrandMark gradient glow className="relative size-16" />
					</div>
					<div className="flex flex-col items-center gap-1.5 text-center">
						<h2 className="m-0 font-heading text-lg font-semibold tracking-[-0.02em]">Your AI coding partner</h2>
						<p className="trumbo-brand-text m-0 font-heading text-sm font-medium tracking-[-0.01em]">
							Powered by Trumbo Quartz
						</p>
					</div>
				</div>

				<p className="m-0 max-w-md text-center text-[13px] leading-relaxed text-[color:var(--vscode-descriptionForeground)]">
					I read, write, and refactor code across your whole repo. I run commands, browse the web, and wire up new
					tools through MCP. You stay in control of every change.
				</p>

				{!showApiOptions && (
					<TrumboButton
						block
						size="lg"
						className="mt-1 max-w-md"
						onClick={() => setShowApiOptions(!showApiOptions)}>
						Use your own API key
					</TrumboButton>
				)}

				<div className="mt-2 w-full max-w-md">
					{showApiOptions && (
						<div className="flex flex-col gap-3">
							<ApiOptions currentMode={mode} showModelOptions={false} />
							<TrumboButton block size="lg" disabled={disableLetsGoButton} onClick={handleSubmit}>
								Start coding
							</TrumboButton>
							{apiErrorMessage && (
								<p className="m-0 text-center text-xs text-[color:var(--vscode-errorForeground)]">
									{apiErrorMessage}
								</p>
							)}
						</div>
					)}
				</div>

				<p className="m-0 max-w-md text-center text-[11px] text-[color:var(--vscode-descriptionForeground)]">
					Prefer the hosted experience?{" "}
					<a href="https://platform.trumbo.dev/login" className="trumbo-brand-text hover:underline">
						Sign in with Trumbo
					</a>{" "}
					for quota-based access on every plan.
				</p>
			</div>
		</div>
	)
})

export default WelcomeView
