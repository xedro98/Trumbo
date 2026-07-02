import type { TremboCore } from "@trembo/core";
import type { Message } from "@trembo/shared";

export async function loadInteractiveResumeMessages(
	sessionManager: TremboCore,
	resumeSessionId?: string,
): Promise<Message[] | undefined> {
	const target = resumeSessionId?.trim();
	if (!target) {
		return undefined;
	}
	return await sessionManager.readMessages(target);
}
