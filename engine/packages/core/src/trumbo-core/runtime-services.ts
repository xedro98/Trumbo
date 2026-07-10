import type {
	MessageWithMetadata,
	SessionTreeEntry,
	SessionTreeNode,
} from "@trumbo/shared";
import type {
	PendingPromptsRuntimeService,
	PendingPromptsServiceApi,
	RuntimeHost,
	SessionModelRuntimeService,
	SessionUsageRuntimeService,
} from "../runtime/host/runtime-host";
import {
	hostSupportsSessionTree,
	type SessionTreeHost,
	SessionTreeService,
	type SessionTreeSnapshot,
	type SessionTreeValidationResult,
} from "../session/session-tree-service";
import {
	type CoreSettingsListInput,
	type CoreSettingsMutationResult,
	type CoreSettingsSnapshot,
	type CoreSettingsToggleInput,
	createCoreSettingsService,
	type TrumboCoreSettingsApi,
} from "../settings";

type RuntimeHostWithSettings = RuntimeHost & {
	listSettings?: (
		input?: CoreSettingsListInput,
	) => Promise<CoreSettingsSnapshot>;
	toggleSetting?: (
		input: CoreSettingsToggleInput,
	) => Promise<CoreSettingsMutationResult>;
};

export type RuntimeHostServiceExtensions = RuntimeHost &
	Partial<
		PendingPromptsRuntimeService &
			SessionUsageRuntimeService &
			SessionModelRuntimeService
	>;

export function createTrumboCoreSettingsApi(
	host: RuntimeHost,
): TrumboCoreSettingsApi {
	return {
		async list(input) {
			const settingsHost = host as RuntimeHostWithSettings;
			if (settingsHost.listSettings) {
				return await settingsHost.listSettings(input);
			}
			return await createCoreSettingsService().list(input);
		},
		async toggle(input) {
			const settingsHost = host as RuntimeHostWithSettings;
			if (settingsHost.toggleSetting) {
				return await settingsHost.toggleSetting(input);
			}
			return await createCoreSettingsService().toggle(input);
		},
	};
}

export function createTrumboCorePendingPromptsApi(
	host: RuntimeHost,
): PendingPromptsServiceApi {
	function getService(): PendingPromptsServiceApi {
		const service = (host as RuntimeHostServiceExtensions).pendingPrompts;
		if (!service) {
			throw new Error("Pending prompt service is not available.");
		}
		return service;
	}
	return {
		list(input) {
			return getService().list(input);
		},
		update(input) {
			return getService().update(input);
		},
		delete(input) {
			return getService().delete(input);
		},
	};
}

/**
 * Session tree API exposed on `TrumboCore.tree`.
 *
 * Provides read and mutation operations for the conversation tree model
 * (TRU-21/TRU-22). All methods are async and operate on persisted session
 * data.
 */
export interface TrumboCoreSessionTreeApi {
	/** Read the full tree snapshot: entries, active leaf, and active path. */
	getSnapshot(sessionId: string): Promise<SessionTreeSnapshot>;
	/** Get the tree structure (root nodes with children) for rendering. */
	getTree(sessionId: string): Promise<SessionTreeNode[]>;
	/** Get all entries (flat array, including abandoned branches). */
	getEntries(sessionId: string): Promise<SessionTreeEntry[]>;
	/** Get the active path (root to active leaf) — what the agent sees. */
	getActivePath(sessionId: string): Promise<MessageWithMetadata[]>;
	/** Get the active leaf entry ID. */
	getActiveLeafId(sessionId: string): Promise<string | undefined>;
	/** Get all leaf entry IDs (branch tips). */
	getLeafEntryIds(sessionId: string): Promise<string[]>;
	/** Get direct children of an entry. */
	getChildren(sessionId: string, entryId: string): Promise<SessionTreeEntry[]>;
	/** Get all descendants of an entry. */
	getDescendants(
		sessionId: string,
		entryId: string,
	): Promise<SessionTreeEntry[]>;
	/** Get the path from root to a specific entry (inclusive). */
	getAncestorPath(
		sessionId: string,
		entryId: string,
	): Promise<SessionTreeEntry[]>;
	/** Switch the active leaf to a different entry and persist. */
	switchLeaf(sessionId: string, entryId: string): Promise<boolean>;
	/** Branch from an entry (alias for switchLeaf). */
	branchFrom(sessionId: string, entryId: string): Promise<boolean>;
	/** Validate tree integrity (duplicates, dangling refs, cycles). */
	validateTree(sessionId: string): Promise<SessionTreeValidationResult>;
}

/**
 * Factory: create the `TrumboCore.tree` API from a runtime host.
 *
 * If the host supports the `SessionTreeHost` interface (i.e. it's a
 * `LocalRuntimeHost`), returns a `SessionTreeService`-backed API.
 * Otherwise returns a stub that throws on any call, indicating the
 * host doesn't support tree operations.
 */
export function createTrumboCoreSessionTreeApi(
	host: RuntimeHost,
): TrumboCoreSessionTreeApi {
	if (hostSupportsSessionTree(host)) {
		const service = new SessionTreeService(host as SessionTreeHost);
		return {
			getSnapshot: (sessionId) => service.getSnapshot(sessionId),
			getTree: (sessionId) => service.getTree(sessionId),
			getEntries: (sessionId) => service.getEntries(sessionId),
			getActivePath: (sessionId) => service.getActivePath(sessionId),
			getActiveLeafId: (sessionId) => service.getActiveLeafId(sessionId),
			getLeafEntryIds: (sessionId) => service.getLeafEntryIds(sessionId),
			getChildren: (sessionId, entryId) =>
				service.getChildren(sessionId, entryId),
			getDescendants: (sessionId, entryId) =>
				service.getDescendants(sessionId, entryId),
			getAncestorPath: (sessionId, entryId) =>
				service.getAncestorPath(sessionId, entryId),
			switchLeaf: (sessionId, entryId) =>
				service.switchLeaf(sessionId, entryId),
			branchFrom: (sessionId, entryId) =>
				service.branchFrom(sessionId, entryId),
			validateTree: (sessionId) => service.validateTree(sessionId),
		};
	}

	const message =
		"Session tree operations are not available on this runtime host.";
	return {
		getSnapshot: () => Promise.reject(new Error(message)),
		getTree: () => Promise.reject(new Error(message)),
		getEntries: () => Promise.reject(new Error(message)),
		getActivePath: () => Promise.reject(new Error(message)),
		getActiveLeafId: () => Promise.reject(new Error(message)),
		getLeafEntryIds: () => Promise.reject(new Error(message)),
		getChildren: () => Promise.reject(new Error(message)),
		getDescendants: () => Promise.reject(new Error(message)),
		getAncestorPath: () => Promise.reject(new Error(message)),
		switchLeaf: () => Promise.reject(new Error(message)),
		branchFrom: () => Promise.reject(new Error(message)),
		validateTree: () => Promise.reject(new Error(message)),
	};
}
