import type { NewSessionRequest } from "@agentclientprotocol/sdk";
import {
	McpSettingsUpdateSkippedError,
	resolveDefaultMcpSettingsPath,
	updateMcpSettingsFile,
} from "@trumbodev/core";

const MANAGED_BY = "trumbo-acp-client";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function headersFromAcp(
	headers: ReadonlyArray<{ name: string; value: string }>,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const header of headers) {
		const name = header.name?.trim();
		if (name) {
			out[name] = header.value ?? "";
		}
	}
	return out;
}

function acpServerToMcpEntry(
	server: NewSessionRequest["mcpServers"][number],
): Record<string, unknown> | undefined {
	if (server.type === "http" || server.type === "sse") {
		return {
			transport: {
				type: "streamableHttp",
				url: server.url,
				headers: headersFromAcp(server.headers),
			},
			metadata: {
				managedBy: MANAGED_BY,
			},
		};
	}
	if (server.type === "stdio") {
		const env: Record<string, string> = {};
		for (const variable of server.env ?? []) {
			const name = variable.name?.trim();
			if (name) {
				env[name] = variable.value ?? "";
			}
		}
		return {
			transport: {
				type: "stdio",
				command: server.command,
				args: [...server.args],
				...(Object.keys(env).length > 0 ? { env } : {}),
			},
			metadata: {
				managedBy: MANAGED_BY,
			},
		};
	}
	return undefined;
}

function isManagedAcpServer(entry: unknown): boolean {
	if (!isRecord(entry)) {
		return false;
	}
	const metadata = entry.metadata;
	return isRecord(metadata) && metadata.managedBy === MANAGED_BY;
}

/**
 * Merge ACP session MCP servers into ~/.trumbo MCP settings so the CLI runtime
 * can load preview/platform HTTP servers passed by Trumbo Code and other ACP clients.
 */
export async function syncAcpMcpServersForSession(
	mcpServers: NewSessionRequest["mcpServers"] | undefined,
): Promise<void> {
	const incoming = mcpServers ?? [];
	const desiredNames = new Set(incoming.map((server) => server.name));

	try {
		await updateMcpSettingsFile(resolveDefaultMcpSettingsPath(), (settings) => {
			const serversValue = settings.mcpServers;
			const map =
				serversValue &&
				typeof serversValue === "object" &&
				!Array.isArray(serversValue)
					? { ...(serversValue as Record<string, unknown>) }
					: {};

			for (const [name, entry] of Object.entries(map)) {
				if (isManagedAcpServer(entry) && !desiredNames.has(name)) {
					delete map[name];
				}
			}

			for (const server of incoming) {
				const entry = acpServerToMcpEntry(server);
				if (entry) {
					map[server.name] = entry;
				}
			}

			settings.mcpServers = map;
			return "updated";
		});
	} catch (error) {
		if (error instanceof McpSettingsUpdateSkippedError) {
			return;
		}
		throw error;
	}
}
