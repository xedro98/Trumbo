import * as vscode from "vscode"

export type TrumboDockLocation = "sidebar" | "panel" | "activitybar"

export const TRUMBO_DOCK_LOCATION_CONFIG = "preferredLocation"

export function readPreferredDockLocation(): TrumboDockLocation {
	const value = vscode.workspace.getConfiguration("trumbo").get<string>(TRUMBO_DOCK_LOCATION_CONFIG, "sidebar")
	if (value === "panel" || value === "activitybar") {
		return value
	}
	return "sidebar"
}

export async function persistPreferredDockLocation(location: TrumboDockLocation): Promise<void> {
	await vscode.workspace.getConfiguration("trumbo").update(TRUMBO_DOCK_LOCATION_CONFIG, location, true)
}
