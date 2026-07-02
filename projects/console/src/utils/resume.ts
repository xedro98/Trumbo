import type { TrumboCore } from "@trumbo/core";
import type { Message } from "@trumbo/shared";

export async function loadInteractiveResumeMessages(
	sessionManager: TrumboCore,
	resumeSessionId?: string,
): Promise<Message[] | undefined> {
	const target = resumeSessionId?.trim();
	if (!target) {
		return undefined;
	}
	return await sessionManager.readMessages(target);
}
