import { useEffect, useMemo, useState } from "react";
import {
	buildSlashCommandRegistry,
	getInvokableUserSlashCommands,
	getVisibleSystemSlashCommands,
	getVisibleUserSlashCommands,
} from "../commands/slash-command-registry";
import type { InteractiveSlashCommand } from "../interactive-welcome";
import type { TuiProps } from "../types";
import type { PromptTemplate } from "../utils/prompt-templates";

export function useSlashCommands(input: {
	workflowSlashCommands: TuiProps["workflowSlashCommands"];
	loadAdditionalSlashCommands: TuiProps["loadAdditionalSlashCommands"];
	canFork: boolean;
	promptTemplates: Map<string, PromptTemplate>;
}) {
	const {
		workflowSlashCommands,
		loadAdditionalSlashCommands,
		canFork,
		promptTemplates,
	} = input;
	const [additionalSlashCommands, setAdditionalSlashCommands] = useState<
		TuiProps["workflowSlashCommands"] | undefined
	>(loadAdditionalSlashCommands ? [] : undefined);

	useEffect(() => {
		if (!loadAdditionalSlashCommands) {
			setAdditionalSlashCommands(undefined);
			return;
		}
		let cancelled = false;
		void loadAdditionalSlashCommands()
			.then((commands) => {
				if (!cancelled) {
					setAdditionalSlashCommands(commands);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setAdditionalSlashCommands([]);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [loadAdditionalSlashCommands]);

	const templateCommands: InteractiveSlashCommand[] = useMemo(
		() =>
			[...promptTemplates.values()].map((t) => ({
				name: t.name,
				instructions: t.content,
				description: t.description,
				kind: "workflow" as const,
			})),
		[promptTemplates],
	);

	const registry = useMemo(() => {
		return buildSlashCommandRegistry({
			workflowSlashCommands: [
				...(workflowSlashCommands ?? []),
				...templateCommands,
			],
			additionalSlashCommands,
			canFork,
		});
	}, [
		workflowSlashCommands,
		templateCommands,
		additionalSlashCommands,
		canFork,
	]);

	const systemCommands = useMemo(
		() => getVisibleSystemSlashCommands(registry),
		[registry],
	);
	const skillCommands = useMemo(
		() => getVisibleUserSlashCommands(registry),
		[registry],
	);
	const invokableSkillCommands = useMemo(
		() => getInvokableUserSlashCommands(registry),
		[registry],
	);

	return { registry, systemCommands, skillCommands, invokableSkillCommands };
}
