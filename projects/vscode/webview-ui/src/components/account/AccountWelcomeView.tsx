import { Loader2 } from "lucide-react"
import { TrumboAuthStatus } from "@/components/account/TrumboAuthStatus"
import BrandMark from "@/components/brand/BrandMark"
import { TrumboButton } from "@/components/trumbo"
import { useTrumboSignIn } from "@/context/TrumboAuthContext"
import { useExtensionState } from "@/context/ExtensionStateContext"

export const AccountWelcomeView = () => {
	const { environment } = useExtensionState()
	const { isLoginLoading, authStatusMessage, handleSignIn } = useTrumboSignIn()

	return (
		<div className="flex flex-col items-center gap-4 px-1">
			{/* Branded sign-in card */}
			<div className="trumbo-card flex w-full max-w-md flex-col items-center gap-4 p-6">
				<div className="relative flex items-center justify-center">
					<div
						aria-hidden
						className="absolute inset-0 -m-3 rounded-full opacity-80 blur-lg"
						style={{
							background:
								"radial-gradient(circle, color-mix(in srgb, var(--brand) 40%, transparent) 0%, transparent 70%)",
						}}
					/>
					<BrandMark gradient glow environment={environment} className="relative size-14" />
				</div>

				<div className="flex flex-col items-center gap-1.5 text-center">
					<h2 className="m-0 font-heading text-base font-semibold tracking-[-0.02em]">Sign in to Trumbo</h2>
					<p className="m-0 max-w-xs text-[13px] leading-relaxed text-[color:var(--vscode-descriptionForeground)]">
						Access the latest models, manage your subscription, and track usage from a single billing dashboard.
					</p>
				</div>

				<TrumboButton
					block
					size="lg"
					disabled={isLoginLoading}
					onClick={handleSignIn}
					className="mt-1">
					{isLoginLoading ? (
						<>
							<Loader2 className="size-4 animate-spin" /> Opening browser…
						</>
					) : (
						"Continue with Trumbo"
					)}
				</TrumboButton>

				<TrumboAuthStatus message={authStatusMessage} />
			</div>

			<p className="m-0 max-w-md text-center text-[11px] text-[color:var(--vscode-descriptionForeground)]">
				By continuing, you agree to the{" "}
				<a href="https://trumbo.dev/terms" className="trumbo-brand-text hover:underline">
					Terms of Service
				</a>{" "}
				and{" "}
				<a href="https://trumbo.dev/privacy" className="trumbo-brand-text hover:underline">
					Privacy Policy
				</a>
				.
			</p>
		</div>
	)
}
