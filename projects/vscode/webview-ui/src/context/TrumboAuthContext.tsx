import type { UserOrganization } from "@shared/proto/trumbo/account"
import { EmptyRequest } from "@shared/proto/trumbo/common"
import deepEqual from "fast-deep-equal"
import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AccountServiceClient } from "@/services/grpc-client"

// Define User type (you may need to adjust this based on your actual User type)
export interface TrumboUser {
	uid: string
	email?: string
	displayName?: string
	photoUrl?: string
	appBaseUrl?: string
}

export interface TrumboAuthContextType {
	trumboUser: TrumboUser | null
	organizations: UserOrganization[] | null
	activeOrganization: UserOrganization | null
}

export const TrumboAuthContext = createContext<TrumboAuthContextType | undefined>(undefined)

export const TrumboAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<TrumboUser | null>(null)
	const [userOrganizations, setUserOrganizations] = useState<UserOrganization[] | null>(null)

	const getUserOrganizations = useCallback(async () => {
		try {
			const response = await AccountServiceClient.getUserOrganizations(EmptyRequest.create())
			setUserOrganizations((old) => {
				if (!deepEqual(response.organizations, old)) {
					return response.organizations
				}

				return old
			})
		} catch (error) {
			console.error("Failed to fetch user organizations:", error)
		}
	}, [])

	const activeOrganization = useMemo(() => {
		return userOrganizations?.find((org) => org.active) ?? null
	}, [userOrganizations])

	useEffect(() => {
		console.log("Extension: TrumboAuthContext: user updated:", user?.uid)
	}, [user?.uid])

	// Handle auth status update events
	useEffect(() => {
		const cancelSubscription = AccountServiceClient.subscribeToAuthStatusUpdate(EmptyRequest.create(), {
			onResponse: async (response: any) => {
				setUser((oldUser) => {
					if (!response?.user?.uid) {
						return null
					}

					if (response?.user && oldUser?.uid !== response.user.uid) {
						// Once we have a new user, fetch organizations that
						// allow us to display the active account in account view UI
						// and fetch the correct credit balance to display on mount
						getUserOrganizations()
						return response.user
					}

					return oldUser
				})
			},
			onError: (error: Error) => {
				console.error("Error in auth callback subscription:", error)
			},
			onComplete: () => {
				console.log("Auth callback subscription completed")
			},
		})

		// Cleanup function to cancel subscription when component unmounts
		return () => {
			cancelSubscription()
		}
	}, [getUserOrganizations])

	return (
		<TrumboAuthContext.Provider
			value={{
				trumboUser: user,
				organizations: userOrganizations,
				activeOrganization,
			}}>
			{children}
		</TrumboAuthContext.Provider>
	)
}

export const useTrumboAuth = () => {
	const context = useContext(TrumboAuthContext)
	if (context === undefined) {
		throw new Error("useTrumboAuth must be used within a TrumboAuthProvider")
	}
	return context
}

export const useTrumboSignIn = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null)

	const handleSignIn = useCallback(() => {
		try {
			setIsLoading(true)
			setAuthStatusMessage(null)

			AccountServiceClient.accountLoginClicked(EmptyRequest.create())
				.then((response) => {
					setAuthStatusMessage(response.value || "Complete sign-in in your browser.")
				})
				.catch((err) => {
				console.error("Failed to start login:", err)
				const detail =
					err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error"
				setAuthStatusMessage(`Unable to start sign-in: ${detail}`)
				})
				.finally(() => {
					setIsLoading(false)
				})
		} catch (error) {
		console.error("Error signing in:", error)
		const detail =
			error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error"
		setAuthStatusMessage(`Unable to start sign-in: ${detail}`)
		setIsLoading(false)
		}
	}, [])

	return {
		isLoginLoading: isLoading,
		authStatusMessage,
		handleSignIn,
	}
}

export const handleSignOut = async () => {
	try {
		await AccountServiceClient.accountLogoutClicked(EmptyRequest.create()).catch((err) =>
			console.error("Failed to logout:", err),
		)
	} catch (error) {
		console.error("Error signing out:", error)
		throw error
	}
}
