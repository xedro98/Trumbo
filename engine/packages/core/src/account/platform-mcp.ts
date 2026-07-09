import {
	getTrumboEnvironmentConfig,
	isUnconfiguredTrumboUrl,
} from "@trumbo/shared";
import {
	McpSettingsUpdateSkippedError,
	resolveDefaultMcpSettingsPath,
	updateMcpSettingsFile,
} from "../extensions/mcp";

/** Matches the MCP server name exposed at api.trumbo.dev/v1/mcp. */
export const PLATFORM_KNOWLEDGE_MCP_SERVER_NAME = "trumbo-platform";

const MANAGED_BY = "trumbo-platform";
const WORKOS_TOKEN_PREFIX = "workos:";
const BEARER_PREFIX = "bearer ";
const MAX_ORG_ID_LENGTH = 128;
const ORG_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export type SyncPlatformKnowledgeMcpAction =
	| "created"
	| "updated"
	| "removed"
	| "skipped";

export interface SyncPlatformKnowledgeMcpServerOptions {
	accessToken: string;
	orgId?: string | null;
	mcpBaseUrl?: string;
	settingsPath?: string;
}

export interface SyncPlatformKnowledgeMcpServerResult {
	action: SyncPlatformKnowledgeMcpAction;
	serverName: string;
	reason?: string;
}

export interface SyncPlatformKnowledgeMcpForSessionInput {
	providerId: string;
	apiKey?: string;
	headers?: Record<string, string>;
	mcpBaseUrl?: string;
	settingsPath?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripTrumboAccessToken(accessToken: string): string {
	let token = accessToken.trim();
	if (token.toLowerCase().startsWith(WORKOS_TOKEN_PREFIX)) {
		token = token.slice(WORKOS_TOKEN_PREFIX.length).trim();
	}
	if (token.toLowerCase().startsWith(BEARER_PREFIX)) {
		token = token.slice(BEARER_PREFIX.length).trim();
	}
	return token;
}

export function isTrumboPlatformProvider(
	providerId: string | undefined,
): boolean {
	const normalized = providerId?.trim().toLowerCase();
	return normalized === "trumbo" || normalized === "trumbo-pass";
}

export function normalizePlatformKnowledgeOrgId(
	orgId?: string | null,
): string | undefined {
	const normalized = orgId?.trim();
	if (!normalized) {
		return undefined;
	}
	if (normalized.length > MAX_ORG_ID_LENGTH) {
		throw new Error("Organization id is too long.");
	}
	if (!ORG_ID_PATTERN.test(normalized)) {
		throw new Error("Organization id contains invalid characters.");
	}
	return normalized;
}

function assertSafeMcpBaseUrl(mcpBaseUrl: string): string {
	const trimmed = mcpBaseUrl.trim();
	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		throw new Error(`Invalid platform MCP URL: ${mcpBaseUrl}`);
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(
			`Invalid platform MCP URL: ${mcpBaseUrl} (only http and https are supported)`,
		);
	}
	if (parsed.username || parsed.password) {
		throw new Error("Platform MCP URL must not include embedded credentials.");
	}
	const hostname = parsed.hostname.toLowerCase();
	const isLocalhost =
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "[::1]";
	const env = getTrumboEnvironmentConfig();
	if (
		env.environment === "production" &&
		parsed.protocol !== "https:" &&
		!isLocalhost
	) {
		throw new Error(
			"Platform MCP URL must use https in production environments.",
		);
	}
	if (isUnconfiguredTrumboUrl(mcpBaseUrl.replace(/\/v1\/mcp\/?$/, ""))) {
		throw new Error("Platform MCP URL is not configured for this environment.");
	}
	return trimmed.replace(/\/$/, "");
}

function resolvePlatformMcpBaseUrl(mcpBaseUrl?: string): string {
	const resolved =
		mcpBaseUrl?.trim() || getTrumboEnvironmentConfig().mcpBaseUrl;
	if (!resolved?.trim()) {
		throw new Error("Trumbo MCP base URL is not configured.");
	}
	return assertSafeMcpBaseUrl(resolved.trim());
}

function buildPlatformMcpHeaders(
	accessToken: string,
	orgId?: string | null,
): Record<string, string> {
	const token = stripTrumboAccessToken(accessToken);
	if (!token) {
		throw new Error("Platform Knowledge MCP sync requires an access token.");
	}
	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};
	const organizationId = normalizePlatformKnowledgeOrgId(orgId);
	if (organizationId) {
		headers["X-Org-Id"] = organizationId;
	}
	return headers;
}

function buildManagedPlatformServerEntry(input: {
	accessToken: string;
	orgId?: string | null;
	mcpBaseUrl: string;
}): Record<string, unknown> {
	return {
		transport: {
			type: "streamableHttp",
			url: input.mcpBaseUrl,
			headers: buildPlatformMcpHeaders(input.accessToken, input.orgId),
		},
		metadata: {
			managedBy: MANAGED_BY,
			description: "Trumbo Knowledge (search_knowledge MCP tool)",
		},
	};
}

function stableStringify(value: unknown): string {
	return JSON.stringify(value);
}

function isManagedPlatformServer(record: Record<string, unknown>): boolean {
	const metadata = record.metadata;
	return isRecord(metadata) && metadata.managedBy === MANAGED_BY;
}

function readExistingPlatformServer(
	servers: Record<string, unknown>,
): Record<string, unknown> | undefined {
	const current = servers[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME];
	if (!isRecord(current)) {
		return undefined;
	}
	if (!isManagedPlatformServer(current)) {
		throw new McpSettingsUpdateSkippedError(
			"Refusing to overwrite a user-owned MCP server named trumbo-platform.",
		);
	}
	return current;
}

export async function syncPlatformKnowledgeMcpServer(
	options: SyncPlatformKnowledgeMcpServerOptions,
): Promise<SyncPlatformKnowledgeMcpServerResult> {
	const accessToken = options.accessToken.trim();
	if (!accessToken) {
		throw new Error("Platform Knowledge MCP sync requires an access token.");
	}

	const filePath = options.settingsPath ?? resolveDefaultMcpSettingsPath();
	const mcpBaseUrl = resolvePlatformMcpBaseUrl(options.mcpBaseUrl);
	const desiredEntry = buildManagedPlatformServerEntry({
		accessToken,
		orgId: options.orgId,
		mcpBaseUrl,
	});

	try {
		const action = await updateMcpSettingsFile(filePath, (settings) => {
			const serversValue = settings.mcpServers;
			const servers =
				serversValue &&
				typeof serversValue === "object" &&
				!Array.isArray(serversValue)
					? { ...(serversValue as Record<string, unknown>) }
					: {};
			const existing = readExistingPlatformServer(servers);
			if (
				existing &&
				stableStringify(existing) === stableStringify(desiredEntry)
			) {
				throw new McpSettingsUpdateSkippedError(
					"Platform Knowledge MCP settings are already up to date.",
				);
			}
			servers[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME] = desiredEntry;
			settings.mcpServers = servers;
			return existing ? "updated" : "created";
		});
		return {
			action: action as Exclude<
				SyncPlatformKnowledgeMcpAction,
				"removed" | "skipped"
			>,
			serverName: PLATFORM_KNOWLEDGE_MCP_SERVER_NAME,
		};
	} catch (error) {
		if (error instanceof McpSettingsUpdateSkippedError) {
			return {
				action: "skipped",
				serverName: PLATFORM_KNOWLEDGE_MCP_SERVER_NAME,
				reason: error.message,
			};
		}
		throw error;
	}
}

export async function removePlatformKnowledgeMcpServer(options?: {
	settingsPath?: string;
}): Promise<SyncPlatformKnowledgeMcpServerResult> {
	const filePath = options?.settingsPath ?? resolveDefaultMcpSettingsPath();

	try {
		await updateMcpSettingsFile(filePath, (settings) => {
			const serversValue = settings.mcpServers;
			if (
				!serversValue ||
				typeof serversValue !== "object" ||
				Array.isArray(serversValue)
			) {
				throw new McpSettingsUpdateSkippedError(
					"Platform Knowledge MCP server is not configured.",
				);
			}
			const servers = { ...(serversValue as Record<string, unknown>) };
			const existing = servers[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME];
			if (!isRecord(existing) || !isManagedPlatformServer(existing)) {
				throw new McpSettingsUpdateSkippedError(
					"Platform Knowledge MCP server is not configured.",
				);
			}
			delete servers[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME];
			settings.mcpServers = servers;
			return "removed";
		});
		return {
			action: "removed",
			serverName: PLATFORM_KNOWLEDGE_MCP_SERVER_NAME,
		};
	} catch (error) {
		if (error instanceof McpSettingsUpdateSkippedError) {
			return {
				action: "skipped",
				serverName: PLATFORM_KNOWLEDGE_MCP_SERVER_NAME,
				reason: error.message,
			};
		}
		throw error;
	}
}

export async function syncPlatformKnowledgeMcpForSession(
	input: SyncPlatformKnowledgeMcpForSessionInput,
): Promise<SyncPlatformKnowledgeMcpServerResult | null> {
	if (!isTrumboPlatformProvider(input.providerId)) {
		return null;
	}
	const accessToken = input.apiKey?.trim();
	if (!accessToken) {
		return null;
	}
	return syncPlatformKnowledgeMcpServer({
		accessToken,
		orgId: input.headers?.["X-Org-Id"],
		mcpBaseUrl: input.mcpBaseUrl,
		settingsPath: input.settingsPath,
	});
}

export function resolveActiveOrganizationIdFromUser(input: {
	organizations?: ReadonlyArray<{
		active?: boolean;
		organizationId?: string;
		id?: string;
	}>;
}): string | undefined {
	const organizations = input.organizations ?? [];
	const active =
		organizations.find((organization) => organization.active) ??
		organizations[0];
	const organizationId = active?.organizationId ?? active?.id;
	return organizationId?.trim() || undefined;
}
