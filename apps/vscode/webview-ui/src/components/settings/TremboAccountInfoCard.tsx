import { StringRequest } from "@shared/proto/trembo/common"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import { TremboAuthStatus } from "@/components/account/TremboAuthStatus"
import { useTremboAuth, useTremboSignIn } from "@/context/TremboAuthContext"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { UiServiceClient } from "@/services/grpc-client"

export const TremboAccountInfoCard = ({ usageLink }: { usageLink?: string }) => {
	const { tremboUser } = useTremboAuth()
	const { navigateToAccount } = useExtensionState()
	const { isLoginLoading, authStatusMessage, handleSignIn } = useTremboSignIn()
	const [didStartLogin, setDidStartLogin] = useState(false)

	const user = tremboUser || undefined

	const handleLogin = () => {
		setDidStartLogin(true)
		handleSignIn()
	}

	useEffect(() => {
		if (didStartLogin && user) {
			navigateToAccount()
		}
	}, [didStartLogin, navigateToAccount, user])

	const handleShowAccount = () => {
		if (!usageLink) {
			return navigateToAccount()
		}

		UiServiceClient.openUrl(StringRequest.create({ value: usageLink })).catch((err) => {
			console.error("Failed to open usage link:", err)
		})
	}

	return (
		<div className="max-w-[600px]">
			{user ? (
				<VSCodeButton appearance="secondary" onClick={handleShowAccount}>
					View Billing & Usage
				</VSCodeButton>
			) : (
				<div className="flex flex-col gap-3">
					<VSCodeButton className="mt-0" disabled={isLoginLoading} onClick={handleLogin}>
						Sign Up with Trembo
						{isLoginLoading && (
							<span className="ml-1 animate-spin">
								<span className="codicon codicon-refresh" />
							</span>
						)}
					</VSCodeButton>
					<TremboAuthStatus message={authStatusMessage} />
				</div>
			)}
		</div>
	)
}
