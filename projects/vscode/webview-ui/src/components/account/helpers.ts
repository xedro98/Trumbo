import type { UserOrganization } from "@shared/proto/trumbo/account"

export const getMainRole = (roles?: string[]) => {
	if (!roles) {
		return undefined
	}

	if (roles.includes("owner")) {
		return "Owner"
	}
	if (roles.includes("admin")) {
		return "Admin"
	}

	return "Member"
}

export const getTrumboUris = (base: string, type: "dashboard" | "billing"): URL => {
	if (type === "dashboard") {
		// The platform dashboard lives at the app root ("/"). Use an empty
		// relative ref so path-prefixed self-hosted/proxy bases keep their prefix
		// instead of resetting to the origin.
		return new URL("", base)
	}

	// Subscription / billing management. The active personal-vs-org scope is
	// resolved server-side from the session (see setUserOrganization), so no
	// query param is needed here.
	return new URL("billing", base)
}

export const isAdminOrOwner = (activeOrg: UserOrganization): boolean => {
	return activeOrg.roles.findIndex((role) => role === "admin" || role === "owner") > -1
}
