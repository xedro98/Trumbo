import type { TrumboCore } from "@trumbodev/core";
import type { Message } from "@trumbodev/shared";

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
