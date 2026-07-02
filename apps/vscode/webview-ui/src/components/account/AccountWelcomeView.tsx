import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { TremboAuthStatus } from "@/components/account/TremboAuthStatus"
import { useTremboSignIn } from "@/context/TremboAuthContext"
import { useExtensionState } from "@/context/ExtensionStateContext"
import TremboLogoVariable from "../../assets/TremboLogoVariable"

// export const AccountWelcomeView = () => (
// 	<div className="flex flex-col items-center pr-3 gap-2.5">
// 		<TremboLogoWhite className="size-16 mb-4" />
export const AccountWelcomeView = () => {
	const { environment } = useExtensionState()
	const { isLoginLoading, authStatusMessage, handleSignIn } = useTremboSignIn()

	return (
		<div className="flex flex-col items-center gap-2.5">
			<TremboLogoVariable className="size-16 mb-4" environment={environment} />

			<p>
				Sign up for an account to get access to the latest models, billing dashboard to view usage and credits, and more
				upcoming features.
			</p>

			<VSCodeButton className="w-full mb-4" disabled={isLoginLoading} onClick={handleSignIn}>
				Sign up with Trembo
				{isLoginLoading && (
					<span className="ml-1 animate-spin">
						<span className="codicon codicon-refresh" />
					</span>
				)}
			</VSCodeButton>

			<TremboAuthStatus message={authStatusMessage} />

			<p className="text-(--vscode-descriptionForeground) text-xs text-center m-0">
				By continuing, you agree to the <VSCodeLink href="https://trembo.bot/tos">Terms of Service</VSCodeLink> and{" "}
				<VSCodeLink href="https://trembo.bot/privacy">Privacy Policy.</VSCodeLink>
			</p>
		</div>
	)
}
