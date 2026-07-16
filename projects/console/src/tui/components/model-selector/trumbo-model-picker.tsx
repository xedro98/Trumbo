// @jsxImportSource @opentui/react

import {
	buildTrumboRecommendedModelsFromKnownModels,
	fetchTrumboRecommendedModels,
	ProviderSettingsManager,
	type TrumboRecommendedModel,
	type TrumboRecommendedModelsData,
} from "@trumbodev/core";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import "opentui-spinner/react";
import { palette } from "../../palette";

export interface TrumboModelPickerItem {
	kind: "model";
	model: TrumboRecommendedModel;
	tier: "quartz" | "recommended" | "free";
}

export interface TrumboModelPickerBrowse {
	kind: "browse";
}

export type TrumboModelPickerEntry =
	| TrumboModelPickerItem
	| TrumboModelPickerBrowse;

/**
 * Trumbo Quartz — the public frontier model family, shown as three model cards
 * (not "modes"). Picking one feels identical to picking any other model; the
 * platform routes each turn server-side. `quartz-hyper` is gated to Max/Ultra
 * server-side (its description notes the plan requirement); the FLAGSHIP tag
 * signals the flagship variant.
 */
const QUARTZ_PICKER_ENTRIES: TrumboModelPickerItem[] = [
	{
		kind: "model",
		tier: "quartz",
		model: {
			id: "quartz",
			name: "Quartz",
			description:
				"Adaptive reasoning model that scales compute to the complexity of each request.",
			tags: ["ADAPTIVE"],
		},
	},
	{
		kind: "model",
		tier: "quartz",
		model: {
			id: "quartz-lite",
			name: "Quartz Lite",
			description:
				"Fast and economical Quartz variant for everyday agent loops and inline edits.",
			tags: ["FAST"],
		},
	},
	{
		kind: "model",
		tier: "quartz",
		model: {
			id: "quartz-hyper",
			name: "Quartz Hyper",
			description:
				"Flagship Quartz variant for maximum reasoning depth on hard engineering and research. Max/Ultra plans.",
			tags: ["FLAGSHIP"],
		},
	},
];

const QUARTZ_IDS: ReadonlySet<string> = new Set(
	QUARTZ_PICKER_ENTRIES.map((entry) => entry.model.id),
);

function tagColor(tag: string): string {
	if (tag === "FREE") return palette.success;
	if (tag === "BEST") return "magenta";
	return "green";
}

function resolveDisplayName(
	modelId: string,
	knownModels?: Record<string, unknown>,
): string {
	if (knownModels) {
		const candidates = [modelId, modelId.split("/").pop()];
		for (const key of candidates) {
			if (!key) continue;
			const hit = knownModels[key] as { name?: string } | undefined;
			if (hit?.name) return hit.name;
		}
	}
	return modelId.includes("/")
		? (modelId.split("/").pop() ?? modelId)
		: modelId;
}

export function useTrumboRecommendedModels() {
	const [data, setData] = useState<TrumboRecommendedModelsData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		const manager = new ProviderSettingsManager();
		fetchTrumboRecommendedModels({ providerSettingsManager: manager })
			.then((result) => {
				if (!cancelled) setData(result);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return { data, loading };
}

export function buildTrumboModelEntries(
	data: TrumboRecommendedModelsData,
): TrumboModelPickerEntry[] {
	// Quartz variants lead the picker as a distinct model family. Any quartz
	// ids returned by the platform catalog are de-duplicated here so they only
	// appear once (under the Quartz header).
	const entries: TrumboModelPickerEntry[] = [...QUARTZ_PICKER_ENTRIES];
	for (const m of data.recommended) {
		if (QUARTZ_IDS.has(m.id)) continue;
		entries.push({ kind: "model", model: m, tier: "recommended" });
	}
	for (const m of data.free) {
		if (QUARTZ_IDS.has(m.id)) continue;
		entries.push({ kind: "model", model: m, tier: "free" });
	}
	entries.push({ kind: "browse" });
	return entries;
}

export function buildTrumboModelEntriesFromKnownModels(
	knownModels:
		| Record<string, { name?: string; description?: string }>
		| undefined,
): TrumboModelPickerEntry[] | null {
	const data = buildTrumboRecommendedModelsFromKnownModels(knownModels);
	if (!data) {
		return null;
	}
	return buildTrumboModelEntries(data);
}

export function TrumboModelPicker(props: {
	entries: TrumboModelPickerEntry[];
	selected: number;
	loading?: boolean;
	knownModels?: Record<string, unknown>;
	currentModelId?: string;
}) {
	const { entries, selected, loading, knownModels, currentModelId } = props;

	if (loading) {
		return (
			<box flexDirection="row" gap={1} paddingX={1}>
				<spinner name="dots" color="gray" />
				<text fg="gray">Loading models...</text>
			</box>
		);
	}

	let lastTier: string | null = null;
	let isFirstHeader = true;
	const rows: ReactNode[] = [];

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		if (!entry) continue;
		const isSel = i === selected;

		if (entry.kind === "model") {
			if (entry.tier !== lastTier) {
				lastTier = entry.tier;
				const label =
					entry.tier === "quartz"
						? "Quartz"
						: entry.tier === "recommended"
							? "Recommended"
							: "Free";
				rows.push(
					<box
						key={`tier-${entry.tier}`}
						paddingX={1}
						marginTop={isFirstHeader ? 0 : 1}
					>
						<text fg="gray">{label}</text>
					</box>,
				);
				isFirstHeader = false;
			}

			const tags = entry.model.tags;
			const name = resolveDisplayName(entry.model.id, knownModels);
			const isCurrent = currentModelId === entry.model.id;
			rows.push(
				<box
					key={entry.model.id}
					paddingX={1}
					flexDirection="row"
					gap={1}
					backgroundColor={isSel ? palette.selection : undefined}
				>
					<text fg={isSel ? palette.textOnSelection : "gray"} flexShrink={0}>
						{isSel ? "\u276f" : " "}
					</text>
					<text fg={isSel ? palette.textOnSelection : undefined}>{name}</text>
					{tags.map((t) => (
						<text
							key={t}
							fg={isSel ? palette.textOnSelection : tagColor(t)}
							flexShrink={0}
						>
							{t}
						</text>
					))}
					{isCurrent && (
						<text fg={isSel ? palette.textOnSelection : "gray"} flexShrink={0}>
							(current)
						</text>
					)}
				</box>,
			);
		} else {
			rows.push(
				<box
					key="browse-all"
					paddingX={1}
					flexDirection="row"
					gap={1}
					backgroundColor={isSel ? palette.selection : undefined}
					marginTop={1}
				>
					<text fg={isSel ? palette.textOnSelection : "gray"} flexShrink={0}>
						{isSel ? "\u276f" : " "}
					</text>
					<text fg={isSel ? palette.textOnSelection : "gray"}>
						Browse all models...
					</text>
				</box>,
			);
		}
	}

	return <box flexDirection="column">{rows}</box>;
}
