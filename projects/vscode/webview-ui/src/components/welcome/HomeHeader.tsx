import { EmptyRequest } from "@shared/proto/trumbo/common"
import { PlayIcon } from "lucide-react"
import TrumboLogoSanta from "@/assets/TrumboLogoSanta"
import trumboLogoUrl from "@/assets/trumbo-logo.svg?url"
import { TrumboButton } from "@/components/trumbo"
import { UiServiceClient } from "@/services/grpc-client"

interface HomeHeaderProps {
	shouldShowQuickWins?: boolean
}

const HomeHeader = ({ shouldShowQuickWins = false }: HomeHeaderProps) => {
	const handleTakeATour = async () => {
		try {
			await UiServiceClient.openWalkthrough(EmptyRequest.create())
		} catch (error) {
			console.error("Error opening walkthrough:", error)
		}
	}

	const isDecember = new Date().getMonth() === 11 // 11 = December (0-indexed)

	return (
		<div className="mb-5 flex flex-col items-center">
			<div className="my-7 flex items-center justify-center">
				{isDecember ? (
					<TrumboLogoSanta className="size-20" />
				) : (
					<img alt="" aria-hidden className="size-20" src={trumboLogoUrl} />
				)}
			</div>
			<div className="flex items-center justify-center px-4 text-center">
				<h1 className="m-0 font-heading text-xl font-semibold tracking-[-0.02em]">What can I do for you?</h1>
			</div>
			{shouldShowQuickWins && (
				<TrumboButton
					variant="outline"
					size="md"
					onClick={handleTakeATour}
					className="mt-4 rounded-full">
					Take a Tour
					<PlayIcon className="size-3.5 trumbo-brand-text" />
				</TrumboButton>
			)}
		</div>
	)
}

export default HomeHeader
