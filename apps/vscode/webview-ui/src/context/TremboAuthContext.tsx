import type { UserOrganization } from "@shared/proto/trembo/account"
import { EmptyRequest } from "@shared/proto/trembo/common"
import deepEqual from "fast-deep-equal"
import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AccountServiceClient } from "@/services/grpc-client"

// Define User type (you may need to adjust this based on your actual User type)
export interface TremboUser {
	uid: string
	email?: string
	displayName?: string
	photoUrl?: string
	appBaseUrl?: string
}

export interface TremboAuthContextType {
	tremboUser: TremboUser | null
	organizations: UserOrganization[] | null
	activeOrganization: UserOrganization | null
}

export const TremboAuthContext = createContext<TremboAuthContextType | undefined>(undefined)

export const TremboAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<TremboUser | null>(null)
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
		console.log("Extension: TremboAuthContext: user updated:", user?.uid)
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
		<TremboAuthContext.Provider
			value={{
				tremboUser: user,
				organizations: userOrganizations,
				activeOrganization,
			}}>
			{children}
		</TremboAuthContext.Provider>
	)
}

export const useTremboAuth = () => {
	const context = useContext(TremboAuthContext)
	if (context === undefined) {
		throw new Error("useTremboAuth must be used within a TremboAuthProvider")
	}
	return context
}

export const useTremboSignIn = () => {
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
					setAuthStatusMessage("Unable to start sign-in. Please try again.")
				})
				.finally(() => {
					setIsLoading(false)
				})
		} catch (error) {
			console.error("Error signing in:", error)
			setAuthStatusMessage("Unable to start sign-in. Please try again.")
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
