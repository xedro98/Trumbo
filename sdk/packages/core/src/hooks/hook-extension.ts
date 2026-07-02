import type { AgentExtension, AgentHooks } from "@trembo/shared";

export function createAgentHooksExtension(
	name: string,
	hooks: AgentHooks | undefined,
): AgentExtension | undefined {
	if (!hooks) {
		return undefined;
	}
	return {
		name,
		manifest: { capabilities: ["hooks"] },
		hooks,
	};
}
