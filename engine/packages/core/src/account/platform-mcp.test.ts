import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	loadMcpSettingsFile,
	updateMcpSettingsFileSync,
} from "../extensions/mcp";
import {
	normalizePlatformKnowledgeOrgId,
	PLATFORM_KNOWLEDGE_MCP_SERVER_NAME,
	removePlatformKnowledgeMcpServer,
	resolveActiveOrganizationIdFromUser,
	syncPlatformKnowledgeMcpForSession,
	syncPlatformKnowledgeMcpServer,
} from "./platform-mcp";

const tempRoots: string[] = [];

afterEach(async () => {
	await Promise.all(
		tempRoots
			.splice(0)
			.map((root) => rm(root, { recursive: true, force: true })),
	);
});

describe("platform-mcp", () => {
	it("creates the managed trumbo-platform MCP server entry", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");

		const result = await syncPlatformKnowledgeMcpServer({
			accessToken: "workos:access-token",
			orgId: "org-123",
			mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
			settingsPath,
		});

		expect(result.action).toBe("created");
		const settings = loadMcpSettingsFile({ filePath: settingsPath });
		expect(settings.mcpServers[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME]).toEqual({
			transport: {
				type: "streamableHttp",
				url: "https://api.trumbo.dev/v1/mcp",
				headers: {
					Authorization: "Bearer access-token",
					"X-Org-Id": "org-123",
				},
			},
			metadata: {
				managedBy: "trumbo-platform",
				description: "Trumbo Knowledge (search_knowledge MCP tool)",
			},
		});
	});

	it("normalizes bearer-prefixed tokens and clears org scope on personal accounts", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");

		await syncPlatformKnowledgeMcpServer({
			accessToken: "Bearer bearer-token",
			orgId: "org-123",
			mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
			settingsPath,
		});
		const cleared = await syncPlatformKnowledgeMcpServer({
			accessToken: "bearer-token",
			orgId: null,
			mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
			settingsPath,
		});

		expect(cleared.action).toBe("updated");
		expect(
			loadMcpSettingsFile({ filePath: settingsPath }).mcpServers[
				PLATFORM_KNOWLEDGE_MCP_SERVER_NAME
			],
		).toMatchObject({
			transport: {
				headers: {
					Authorization: "Bearer bearer-token",
				},
			},
		});
		const transport = loadMcpSettingsFile({ filePath: settingsPath })
			.mcpServers[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME]?.transport;
		expect(transport?.type).toBe("streamableHttp");
		if (transport?.type === "streamableHttp") {
			expect(transport.headers?.Authorization).toBe("Bearer bearer-token");
			expect(transport.headers?.["X-Org-Id"]).toBeUndefined();
		}
	});

	it("skips writes when the managed entry is already current", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");

		const options = {
			accessToken: "access-token",
			orgId: "org-123",
			mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
			settingsPath,
		};
		await syncPlatformKnowledgeMcpServer(options);
		const result = await syncPlatformKnowledgeMcpServer(options);

		expect(result.action).toBe("skipped");
	});

	it("refuses to overwrite a user-owned trumbo-platform server", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");
		await writeFile(
			settingsPath,
			JSON.stringify(
				{
					mcpServers: {
						[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME]: {
							transport: {
								type: "streamableHttp",
								url: "https://example.com/mcp",
							},
							metadata: { managedBy: "user" },
						},
					},
				},
				null,
				2,
			),
			"utf8",
		);

		const result = await syncPlatformKnowledgeMcpServer({
			accessToken: "access-token",
			mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
			settingsPath,
		});

		expect(result.action).toBe("skipped");
		expect(result.reason).toContain("user-owned");
		expect(
			loadMcpSettingsFile({ filePath: settingsPath }).mcpServers[
				PLATFORM_KNOWLEDGE_MCP_SERVER_NAME
			]?.transport,
		).toMatchObject({ url: "https://example.com/mcp" });
	});

	it("rejects unsafe MCP URLs and malformed org ids", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");

		await expect(
			syncPlatformKnowledgeMcpServer({
				accessToken: "access-token",
				mcpBaseUrl: "file:///etc/passwd",
				settingsPath,
			}),
		).rejects.toThrow(/only http and https/i);

		await expect(
			syncPlatformKnowledgeMcpServer({
				accessToken: "access-token",
				orgId: "org\r\nInjected: true",
				mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
				settingsPath,
			}),
		).rejects.toThrow(/invalid characters/i);

		expect(() => normalizePlatformKnowledgeOrgId("valid_org-1")).not.toThrow();
	});

	it("removes only the managed trumbo-platform server", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");

		await syncPlatformKnowledgeMcpServer({
			accessToken: "access-token",
			mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
			settingsPath,
		});
		const result = await removePlatformKnowledgeMcpServer({ settingsPath });

		expect(result.action).toBe("removed");
		expect(
			loadMcpSettingsFile({ filePath: settingsPath }).mcpServers[
				PLATFORM_KNOWLEDGE_MCP_SERVER_NAME
			],
		).toBeUndefined();
	});

	it("does not remove a user-owned trumbo-platform server", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");
		updateMcpSettingsFileSync(settingsPath, (settings) => {
			settings.mcpServers = {
				[PLATFORM_KNOWLEDGE_MCP_SERVER_NAME]: {
					transport: {
						type: "streamableHttp",
						url: "https://example.com/mcp",
					},
					metadata: { managedBy: "user" },
				},
			};
		});

		const result = await removePlatformKnowledgeMcpServer({ settingsPath });

		expect(result.action).toBe("skipped");
		expect(
			loadMcpSettingsFile({ filePath: settingsPath }).mcpServers[
				PLATFORM_KNOWLEDGE_MCP_SERVER_NAME
			],
		).toBeDefined();
	});

	it("syncs from trumbo session config and ignores other providers", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "platform-mcp-"));
		tempRoots.push(tempRoot);
		const settingsPath = join(tempRoot, "trumbo_mcp_settings.json");

		const skipped = await syncPlatformKnowledgeMcpForSession({
			providerId: "anthropic",
			apiKey: "secret",
			settingsPath,
		});
		expect(skipped).toBeNull();

		const result = await syncPlatformKnowledgeMcpForSession({
			providerId: "trumbo",
			apiKey: "access-token",
			headers: { "X-Org-Id": "org-456" },
			mcpBaseUrl: "https://api.trumbo.dev/v1/mcp",
			settingsPath,
		});

		expect(result?.action).toBe("created");
		expect(
			loadMcpSettingsFile({ filePath: settingsPath }).mcpServers[
				PLATFORM_KNOWLEDGE_MCP_SERVER_NAME
			]?.transport,
		).toMatchObject({
			headers: {
				Authorization: "Bearer access-token",
				"X-Org-Id": "org-456",
			},
		});
	});

	it("resolves the active organization id from account user payloads", () => {
		expect(
			resolveActiveOrganizationIdFromUser({
				organizations: [
					{ organizationId: "org-a", active: false },
					{ organizationId: "org-b", active: true },
				],
			}),
		).toBe("org-b");
		expect(
			resolveActiveOrganizationIdFromUser({
				organizations: [{ id: "org-fallback" }],
			}),
		).toBe("org-fallback");
	});
});
