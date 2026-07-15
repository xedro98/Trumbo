import { SessionSource } from "@trumbodev/core";
import type { Message } from "@trumbodev/shared";
import { deriveForkSessionTitle } from "./title";

type SourceSession = {
	source?: SessionSource;
	prompt?: string | null;
	metadata?: Record<string, unknown> | null;
};

export function buildForkSessionMetadata(input: {
	forkedFromSessionId: string;
	forkedAt: string;
	sourceSession?: SourceSession;
	messages: Message[];
}): Record<string, unknown> {
	const forkMetadata: Record<string, unknown> = {};
	const sourceMetadata = input.sourceSession?.metadata ?? undefined;

	if (sourceMetadata) {
		for (const [key, value] of Object.entries(sourceMetadata)) {
			if (key !== "fork") {
				forkMetadata[key] = value;
			}
		}
	}

	forkMetadata.fork = {
		forkedFromSessionId: input.forkedFromSessionId,
		forkedAt: input.forkedAt,
		source: input.sourceSession?.source ?? SessionSource.CLI,
	};
	forkMetadata.title = deriveForkSessionTitle({
		sourceTitle:
			typeof sourceMetadata?.title === "string"
				? sourceMetadata.title
				: undefined,
		sourcePrompt: input.sourceSession?.prompt,
		messages: input.messages,
	});

	return forkMetadata;
}
