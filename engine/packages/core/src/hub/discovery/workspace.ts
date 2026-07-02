import { join } from "node:path";
import { normalizeWorkspacePath } from "../../services/workspace/workspace-manifest";
import {
	type HubOwnerContext,
	resolveHubOwnerContext,
	resolveTrumboDataDir,
} from ".";

const DEFAULT_SHARED_HUB_OWNER_LABEL = "shared:trumbo";
const HUB_DISCOVERY_ENV = "TRUMBO_HUB_DISCOVERY_PATH";
const PRODUCTION_HUB_OWNER_ID = "hub-production";

export function resolveWorkspaceHubOwnerContext(
	workspaceRoot: string,
): HubOwnerContext {
	const normalized = normalizeWorkspacePath(workspaceRoot.trim());
	return resolveHubOwnerContext(
		`workspace:${normalized || workspaceRoot.trim()}`,
	);
}

export function resolveSharedHubOwnerContext(
	label = DEFAULT_SHARED_HUB_OWNER_LABEL,
): HubOwnerContext {
	return resolveHubOwnerContext(label);
}

export function resolveProductionHubOwnerContext(): HubOwnerContext {
	return {
		ownerId: PRODUCTION_HUB_OWNER_ID,
		discoveryPath:
			process.env[HUB_DISCOVERY_ENV]?.trim() ||
			join(resolveTrumboDataDir(), "locks", "hub", "production.json"),
	};
}
