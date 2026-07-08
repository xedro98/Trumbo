import type { ExtensionMessage } from "@shared/ExtensionMessage"
import { isTrumboInternalTester } from "@shared/internal/account"
import { ResetStateRequest } from "@shared/proto/trumbo/state"
import type { UserOrganization } from "@shared/proto/index.trumbo"
import {
	CheckCheck,
	FlaskConical,
	HardDriveDownload,
	Info,
	type LucideIcon,
	SlidersHorizontal,
	SquareTerminal,
	Wrench,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useEvent } from "react-use"
import { TrumboMenuItem, TrumboTooltip } from "@/components/trumbo"
import { type TrumboUser, useTrumboAuth } from "@/context/TrumboAuthContext"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { StateServiceClient } from "@/services/grpc-client"
import { isAdminOrOwner } from "../account/helpers"
import { Tab, TabContent } from "../common/Tab"
import ViewHeader from "../common/ViewHeader"
import SectionHeader from "./SectionHeader"
import AboutSection from "./sections/AboutSection"
import ApiConfigurationSection from "./sections/ApiConfigurationSection"
import DebugSection from "./sections/DebugSection"
import FeatureSettingsSection from "./sections/FeatureSettingsSection"
import GeneralSettingsSection from "./sections/GeneralSettingsSection"
import { RemoteConfigSection } from "./sections/RemoteConfigSection"
import TerminalSettingsSection from "./sections/TerminalSettingsSection"

const IS_DEV = process.env.IS_DEV

// Tab definitions
type SettingsTabID = "api-config" | "features" | "terminal" | "general" | "about" | "debug" | "remote-config"
interface SettingsTab {
	id: SettingsTabID
	name: string
	tooltipText: string
	headerText: string
	icon: LucideIcon
	hidden?: (params?: { user: TrumboUser | null; activeOrganization: UserOrganization | null }) => boolean
}

const SETTINGS_TABS: SettingsTab[] = [
	{
		id: "api-config",
		name: "API Configuration",
		tooltipText: "API Configuration",
		headerText: "API Configuration",
		icon: SlidersHorizontal,
	},
	{
		id: "features",
		name: "Features",
		tooltipText: "Feature Settings",
		headerText: "Feature Settings",
		icon: CheckCheck,
	},
	{
		id: "terminal",
		name: "Terminal",
		tooltipText: "Terminal Settings",
		headerText: "Terminal Settings",
		icon: SquareTerminal,
	},
	{
		id: "general",
		name: "General",
		tooltipText: "General Settings",
		headerText: "General Settings",
		icon: Wrench,
	},
	{
		id: "remote-config",
		name: "Remote Config",
		tooltipText: "Remotely configured fields",
		headerText: "Remote Config",
		icon: HardDriveDownload,
		hidden: ({ activeOrganization } = { user: null, activeOrganization: null }) =>
			!activeOrganization || !isAdminOrOwner(activeOrganization),
	},
	{
		id: "about",
		name: "About",
		tooltipText: "About Trumbo",
		headerText: "About",
		icon: Info,
	},
	// Only show in dev mode
	{
		id: "debug",
		name: "Debug",
		tooltipText: "Debug Tools",
		headerText: "Debug",
		icon: FlaskConical,
		hidden: ({ user } = { user: null, activeOrganization: null }) => !IS_DEV && !isTrumboInternalTester(user?.email || ""),
	},
]

type SettingsViewProps = {
	onDone: () => void
	targetSection?: string
}

// Helper to render section header - moved outside component for better performance
const renderSectionHeader = (tabId: string) => {
	const tab = SETTINGS_TABS.find((t) => t.id === tabId)
	if (!tab) {
		return null
	}

	return (
		<SectionHeader>
			<div className="flex items-center gap-2">
				<tab.icon className="w-4" />
				<div>{tab.headerText}</div>
			</div>
		</SectionHeader>
	)
}

const SettingsView = ({ onDone, targetSection }: SettingsViewProps) => {
	// Memoize to avoid recreation
	const TAB_CONTENT_MAP: Record<SettingsTabID, React.FC<any>> = useMemo(
		() => ({
			"api-config": ApiConfigurationSection,
			general: GeneralSettingsSection,
			features: FeatureSettingsSection,
			terminal: TerminalSettingsSection,
			"remote-config": RemoteConfigSection,
			about: AboutSection,
			debug: DebugSection,
		}),
		[],
	) // Empty deps - these imports never change

	const { version, environment, settingsInitialModelTab } = useExtensionState()
	const { activeOrganization, trumboUser } = useTrumboAuth()

	const [activeTab, setActiveTab] = useState<string>(targetSection || SETTINGS_TABS[0].id)

	// Optimized message handler with early returns
	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		if (message.type !== "grpc_response") {
			return
		}

		const grpcMessage = message.grpc_response?.message
		if (grpcMessage?.key !== "scrollToSettings") {
			return
		}

		const tabId = grpcMessage.value
		if (!tabId) {
			return
		}

		// Check if valid tab ID
		if (SETTINGS_TABS.some((tab) => tab.id === tabId)) {
			setActiveTab(tabId)
			return
		}

		// Fallback to element scrolling
		requestAnimationFrame(() => {
			const element = document.getElementById(tabId)
			if (!element) {
				return
			}

			element.scrollIntoView({ behavior: "smooth" })
			element.style.transition = "background-color 0.5s ease"
			element.style.backgroundColor = "var(--vscode-textPreformat-background)"

			setTimeout(() => {
				element.style.backgroundColor = "transparent"
			}, 1200)
		})
	}, [])

	useEvent("message", handleMessage)

	// Memoized reset state handler
	const handleResetState = useCallback(async (resetGlobalState?: boolean) => {
		try {
			await StateServiceClient.resetState(ResetStateRequest.create({ global: resetGlobalState }))
		} catch (error) {
			console.error("Failed to reset state:", error)
		}
	}, [])

	// Update active tab when targetSection changes
	useEffect(() => {
		if (targetSection) {
			setActiveTab(targetSection)
		}
	}, [targetSection])

	// Memoized tab item renderer
	const renderTabItem = useCallback(
		(tab: (typeof SETTINGS_TABS)[0]) => (
			<TrumboTooltip key={tab.id} content={tab.tooltipText} side="right">
				<TrumboMenuItem
					active={activeTab === tab.id}
					data-testid={`tab-${tab.id}`}
					icon={<tab.icon className="size-4" />}
					onClick={() => setActiveTab(tab.id)}>
					{tab.name}
				</TrumboMenuItem>
			</TrumboTooltip>
		),
		[activeTab],
	)

	// Memoized active content component
	const ActiveContent = useMemo(() => {
		const Component = TAB_CONTENT_MAP[activeTab as keyof typeof TAB_CONTENT_MAP]
		if (!Component) {
			return null
		}

		// Special props for specific components
		const props: any = { renderSectionHeader }
		if (activeTab === "debug") {
			props.onResetState = handleResetState
		} else if (activeTab === "about") {
			props.version = version
		} else if (activeTab === "api-config") {
			props.initialModelTab = settingsInitialModelTab
		}

		return <Component {...props} />
	}, [activeTab, handleResetState, settingsInitialModelTab, version, TAB_CONTENT_MAP])

	return (
		<Tab>
			<ViewHeader environment={environment} onDone={onDone} title="Settings" />

		<div className="flex flex-1 overflow-hidden">
			<nav className="flex w-[176px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-[var(--color-border-panel)] p-2">
				{SETTINGS_TABS.filter((tab) => !tab.hidden?.({ user: trumboUser, activeOrganization })).map(renderTabItem)}
			</nav>

			<TabContent className="flex-1 overflow-auto">{ActiveContent}</TabContent>
		</div>
		</Tab>
	)
}

export default SettingsView
