import { isTrumboInternalTester } from "@shared/internal/account"
import type { GetCurrentPlanResponse, UserOrganization } from "@shared/proto/trumbo/account"
import { EmptyRequest } from "@shared/proto/trumbo/common"
import { VSCodeButton, VSCodeDivider, VSCodeDropdown, VSCodeOption, VSCodeTag } from "@vscode/webview-ui-toolkit/react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useInterval } from "react-use"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { handleSignOut, type TrumboUser } from "@/context/TrumboAuthContext"
import { AccountServiceClient } from "@/services/grpc-client"
import ViewHeader from "../common/ViewHeader"
import VSCodeButtonLink from "../common/VSCodeButtonLink"
import { updateSetting } from "../settings/utils/settingsHandlers"
import { AccountWelcomeView } from "./AccountWelcomeView"
import { getMainRole, getTrumboUris, isAdminOrOwner } from "./helpers"
import { PlanUsage } from "./PlanUsage"
import { RemoteConfigToggle } from "./RemoteConfigToggle"

type AccountViewProps = {
	trumboUser: TrumboUser | null
	organizations: UserOrganization[] | null
	activeOrganization: UserOrganization | null
	onDone: () => void
}

type TrumboAccountViewProps = {
	trumboUser: TrumboUser
	userOrganizations: UserOrganization[] | null
	activeOrganization: UserOrganization | null
	trumboEnv: "Production" | "Staging" | "Local"
}

type CachedData = {
	plan: GetCurrentPlanResponse | null
	lastFetchTime: number
}

const TrumboEnvOptions = ["Production", "Staging", "Local"] as const

const AccountView = ({ onDone, trumboUser, organizations, activeOrganization }: AccountViewProps) => {
	const { environment } = useExtensionState()

	return (
		<div className="fixed inset-0 flex flex-col overflow-hidden">
			<ViewHeader environment={environment} onDone={onDone} showEnvironmentSuffix title="Account" />
			<div className="grow flex flex-col px-5 overflow-y-auto">
				{trumboUser?.uid ? (
					<TrumboAccountView
						activeOrganization={activeOrganization}
						key={trumboUser.uid}
						trumboEnv={environment === "local" ? "Local" : environment === "staging" ? "Staging" : "Production"}
						trumboUser={trumboUser}
						userOrganizations={organizations}
					/>
				) : (
					<AccountWelcomeView />
				)}
			</div>
		</div>
	)
}

const TrumboAccountView = ({ trumboUser, userOrganizations, activeOrganization, trumboEnv }: TrumboAccountViewProps) => {
	const { email, displayName, appBaseUrl, uid } = trumboUser
	const { remoteConfigSettings, environment } = useExtensionState()

	// Determine if dropdown should be locked by remote config
	const isLockedByRemoteConfig = Object.keys(remoteConfigSettings || {}).length > 0

	// Source of truth: Dedicated state for dropdown value that persists through failures
	// and represents that user's current selection.
	const [dropdownValue, setDropdownValue] = useState<string>(activeOrganization?.organizationId || uid)
	const [isLoading, setIsLoading] = useState(false)

	// Cache plan data per organization/user ID to avoid flashing when switching.
	const dataCache = useRef<Map<string, CachedData>>(new Map())

	// Current displayed data
	const [plan, setPlan] = useState<GetCurrentPlanResponse | null>(null)
	const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now())

	// Load cached data for current dropdown value
	const loadCachedData = useCallback((id: string) => {
		const cached = dataCache.current.get(id)
		if (cached) {
			setPlan(cached.plan)
			setLastFetchTime(cached.lastFetchTime)
			return true
		}
		return false
	}, [])

	const cacheCurrentData = useCallback(
		(id: string) => {
			dataCache.current.set(id, {
				plan,
				lastFetchTime,
			})
		},
		[plan, lastFetchTime],
	)
	// Track the active organization ID to detect changes
	const [lastActiveOrgId, setLastActiveOrgId] = useState<string | undefined>(activeOrganization?.organizationId)
	// Use ref for debounce timeout to avoid re-renders
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	// Track if manual fetch is in progress to avoid duplicate fetches
	const manualFetchInProgressRef = useRef<boolean>(false)
	// Track if initial mount fetch has completed to avoid duplicate fetches
	const initialFetchCompleteRef = useRef<boolean>(false)

	const isTrumboTester = useMemo(() => (email ? isTrumboInternalTester(email) : false), [email])

	const fetchCurrentPlan = useCallback(async () => {
		try {
			const response = await AccountServiceClient.getCurrentPlan(EmptyRequest.create())
			setPlan(response ?? null)
		} catch (error) {
			console.error("Failed to fetch current plan:", error)
		}
	}, [])

	const fetchPlan = useCallback(
		async (id: string, skipCache = false) => {
			try {
				if (isLoading) {
					return // Prevent multiple concurrent fetches
				}

				// Load cached data immediately if available (unless skipping cache)
				if (!skipCache && loadCachedData(id)) {
					// If we have cached data, show it first, then fetch in background
				}

				setIsLoading(true)
				// getCurrentPlan resolves the active scope (personal vs org) server-side,
				// so a single endpoint covers both personal and organization plans.
				await fetchCurrentPlan()

				// Cache the updated data
				cacheCurrentData(id)
			} catch (error) {
				console.error("Failed to fetch current plan:", error)
			} finally {
				setLastFetchTime(Date.now())
				setIsLoading(false)
			}
		},
		[isLoading, fetchCurrentPlan, loadCachedData, cacheCurrentData],
	)

	const handleOrganizationChange = useCallback(
		async (event: React.ChangeEvent<HTMLSelectElement>) => {
			const target = event.target
			if (!target) {
				return
			}

			const newValue = target.value
			if (newValue !== dropdownValue) {
				// Clear any pending debounced fetch since we're doing a manual one
				if (debounceTimeoutRef.current) {
					clearTimeout(debounceTimeoutRef.current)
					debounceTimeoutRef.current = null
				}

				// Cache current data before switching
				cacheCurrentData(dropdownValue)
				setDropdownValue(newValue)

				// Load cached data for new selection immediately, or clear if no cache
				if (!loadCachedData(newValue)) {
					// No cached data - clear current state to avoid showing wrong scope's plan
					setPlan(null)
				}

				// Set flag to indicate manual fetch in progress
				manualFetchInProgressRef.current = true

				// Switch the active scope FIRST so getCurrentPlan resolves the new scope.
				const organizationId = newValue === uid ? undefined : newValue
				await AccountServiceClient.setUserOrganization({ organizationId })

				// Fetch the plan for the newly active scope
				await fetchPlan(newValue)

				// Update the last active org ID to prevent the effect from triggering
				setLastActiveOrgId(newValue === uid ? undefined : newValue)

				// Clear the manual fetch flag after everything is done
				manualFetchInProgressRef.current = false
			}
		},
		[uid, dropdownValue, loadCachedData, fetchPlan, cacheCurrentData],
	)

	// Fetch plan every 60 seconds
	useInterval(() => {
		fetchPlan(dropdownValue)
	}, 60000)

	const trumboUrl = appBaseUrl || "https://platform.trumbo.dev"

	const selectedOrganization = useMemo(() => {
		if (dropdownValue === uid) {
			return null
		}
		return userOrganizations?.find((org) => org.organizationId === dropdownValue) ?? null
	}, [dropdownValue, uid, userOrganizations])

	const canManageBilling = dropdownValue === uid || (selectedOrganization != null && isAdminOrOwner(selectedOrganization))

	// Fetch plan on mount
	useEffect(() => {
		async function initialFetch() {
			await fetchPlan(dropdownValue)
			initialFetchCompleteRef.current = true
		}
		initialFetch()
	}, [dropdownValue, fetchPlan])

	// Refetch the plan when the panel regains visibility/focus, so a subscription
	// upgrade completed in the browser (e.g. on /billing) is reflected here
	// immediately instead of waiting up to 60s for the next poll tick. The server
	// is still the source of truth for access; this only refreshes the display.
	const refreshOnVisibleRef = useRef<() => void>(() => {})
	refreshOnVisibleRef.current = () => {
		if (!initialFetchCompleteRef.current) {
			return
		}
		// Avoid hammering the platform on rapid focus churn: skip if we fetched
		// within the last 10s. fetchPlan also guards concurrency via isLoading.
		if (Date.now() - lastFetchTime < 10_000) {
			return
		}
		fetchPlan(dropdownValue)
	}
	useEffect(() => {
		const onVisibility = () => {
			if (document.visibilityState === "visible") {
				refreshOnVisibleRef.current()
			}
		}
		const onFocus = () => refreshOnVisibleRef.current()
		document.addEventListener("visibilitychange", onVisibility)
		window.addEventListener("focus", onFocus)
		return () => {
			document.removeEventListener("visibilitychange", onVisibility)
			window.removeEventListener("focus", onFocus)
		}
	}, [])

	useEffect(() => {
		// Handle organization changes with 500ms debounce
		const currentActiveOrgId = activeOrganization?.organizationId
		const hasActiveOrgChanged = currentActiveOrgId !== lastActiveOrgId

		// Only handle external organization changes (not dropdown changes)
		// Dropdown changes are handled by handleOrganizationChange
		const isExternalOrgChange = hasActiveOrgChanged && !manualFetchInProgressRef.current

		if (isExternalOrgChange) {
			// Clear any existing timeout
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
			}

			// Update dropdown to match the new active organization
			const newDropdownValue = currentActiveOrgId || uid
			if (newDropdownValue !== dropdownValue) {
				// Cache current data before switching
				cacheCurrentData(dropdownValue)
				setDropdownValue(newDropdownValue)

				// Only clear data if initial fetch has completed to avoid clearing on mount
				if (!loadCachedData(newDropdownValue) && initialFetchCompleteRef.current) {
					// No cached data - clear to avoid showing wrong scope's plan
					setPlan(null)
				}
			}

			// Only set timeout if initial fetch is complete
			if (initialFetchCompleteRef.current) {
				// Set new timeout to fetch after 500ms
				debounceTimeoutRef.current = setTimeout(() => {
					fetchPlan(newDropdownValue)
					setLastActiveOrgId(currentActiveOrgId)
				}, 500)
			} else {
				// Just update the active org ID
				setLastActiveOrgId(currentActiveOrgId)
			}
		}

		// Cleanup timeout on unmount
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
			}
		}
	}, [activeOrganization?.organizationId, lastActiveOrgId, uid, dropdownValue, loadCachedData, fetchPlan, cacheCurrentData])

	return (
		<div className="h-full flex flex-col">
			<div className="flex flex-col h-full">
				<div className="trumbo-card flex flex-col w-full gap-4 mb-6 p-4">
					<div className="flex items-center flex-wrap gap-y-4">
						<div className="size-14 rounded-full trumbo-gradient flex items-center justify-center text-xl font-heading font-semibold text-(--brand-foreground) mr-4 shrink-0">
							{displayName?.[0] || email?.[0] || "?"}
						</div>

						<div className="flex flex-col">
							{displayName && (
								<h2 className="text-foreground m-0 text-lg font-heading font-semibold tracking-[-0.02em]">
									{displayName}
								</h2>
							)}

							{email && <div className="text-sm text-description">{email}</div>}

							<div className="flex gap-2 items-center mt-1">
								<Tooltip>
									<TooltipTrigger>
										<VSCodeDropdown
											className="w-full"
											currentValue={dropdownValue}
											disabled={isLoading || isLockedByRemoteConfig}
											onChange={handleOrganizationChange}>
											<VSCodeOption key="personal" value={uid}>
												Personal
											</VSCodeOption>
											{userOrganizations?.map((org: UserOrganization) => (
												<VSCodeOption key={org.organizationId} value={org.organizationId}>
													{org.name}
												</VSCodeOption>
											))}
										</VSCodeDropdown>
									</TooltipTrigger>
									<TooltipContent hidden={!isLockedByRemoteConfig}>
										This cannot be changed while your organization has remote configuration enabled.
									</TooltipContent>
								</Tooltip>
								{activeOrganization && (
									<VSCodeTag className="text-xs p-2" title="Role">
										{getMainRole(activeOrganization.roles)}
									</VSCodeTag>
								)}
							</div>
						</div>
					</div>
					<div className="w-full flex gap-2 flex-col min-[225px]:flex-row">
						<RemoteConfigToggle activeOrganization={activeOrganization} />
					</div>
				</div>

				<div className="w-full flex gap-2 flex-col min-[225px]:flex-row">
					<div className="w-full min-[225px]:w-1/2">
						<VSCodeButtonLink
							appearance="primary"
							className="w-full"
							href={getTrumboUris(trumboUrl, "dashboard").href}>
							Dashboard
						</VSCodeButtonLink>
					</div>
					<VSCodeButton appearance="secondary" className="w-full min-[225px]:w-1/2" onClick={() => handleSignOut()}>
						Log out
					</VSCodeButton>
				</div>

				<VSCodeDivider className="w-full my-6" />

				<PlanUsage
					billingUrl={getTrumboUris(trumboUrl, "billing")}
					canManageBilling={canManageBilling}
					fetchPlan={() => fetchPlan(dropdownValue)}
					isLoading={isLoading}
					lastFetchTime={lastFetchTime}
					plan={plan}
				/>

				{/* Hide environment switching UI when in self-hosted mode */}
				{isTrumboTester && environment !== "selfHosted" && (
					<div className="w-full gap-1 items-end">
						<VSCodeDivider className="w-full my-3" />
						<div className="text-sm font-semibold">Trumbo Environment</div>
						<VSCodeDropdown
							className="w-full mt-1"
							currentValue={trumboEnv}
							onChange={async (e) => {
								const target = e.target as HTMLSelectElement
								if (target?.value) {
									const value = target.value as "Local" | "Staging" | "Production"
									updateSetting("trumboEnv", value.toLowerCase())
								}
							}}>
							{TrumboEnvOptions.map((env) => (
								<VSCodeOption key={env} value={env}>
									{env}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
				)}
			</div>
		</div>
	)
}

export default memo(AccountView)
