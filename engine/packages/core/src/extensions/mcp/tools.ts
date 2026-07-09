import { type AgentTool, createTool } from "@trumbo/shared";
import { defaultMcpToolNameTransform } from "./name-transform";
import type { CreateMcpToolsOptions, McpToolDescriptor } from "./types";

function defaultMcpDescription(
	serverName: string,
	tool: McpToolDescriptor,
): string {
	const base = tool.description?.trim();
	if (base) {
		return base;
	}
	return `Execute MCP tool "${tool.name}" from server "${serverName}".`;
}

/** Normalize a raw MCP `tools/call` result into a shape the AI SDK formatter
 *  recognizes. Exported for unit testing. */
export function normalizeMcpToolResult(raw: unknown): unknown {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		return raw;
	}
	const obj = raw as Record<string, unknown>;
	const content = obj.content;
	if (!Array.isArray(content)) {
		return raw;
	}
	const normalized = content.map((block) => {
		if (!block || typeof block !== "object" || Array.isArray(block)) {
			return block;
		}
		const b = block as Record<string, unknown>;
		if (
			b.type === "image" &&
			typeof b.mimeType === "string" &&
			b.mediaType === undefined
		) {
			return { ...b, mediaType: b.mimeType };
		}
		return block;
	});
	return normalized;
}

export async function createMcpTools(
	options: CreateMcpToolsOptions,
): Promise<AgentTool[]> {
	const descriptors = await options.provider.listTools(options.serverName);
	const nameTransform = options.nameTransform ?? defaultMcpToolNameTransform;

	return descriptors.map((descriptor) => {
		const agentToolName = nameTransform({
			serverName: options.serverName,
			toolName: descriptor.name,
		});

		return createTool({
			name: agentToolName,
			description: defaultMcpDescription(options.serverName, descriptor),
			inputSchema: descriptor.inputSchema,
			timeoutMs: options.timeoutMs,
			retryable: options.retryable,
			maxRetries: options.maxRetries,
			execute: async (input: unknown, context) => {
				const raw = await options.provider.callTool({
					serverName: options.serverName,
					toolName: descriptor.name,
					arguments:
						input && typeof input === "object" && !Array.isArray(input)
							? (input as Record<string, unknown>)
							: undefined,
					context,
				});
				return normalizeMcpToolResult(raw);
			},
		});
	});
}
