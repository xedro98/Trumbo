import type {
	ProviderSettingsManager,
	TrumboAccountOrganization,
} from "@trumbo/core";
import {
	createTrumboAccountService,
	loadTrumboAccountSnapshot,
	switchTrumboAccount,
} from "../tui/trumbo-account";
import { c } from "../utils/output";

type TeamIo = {
	writeln: (text?: string) => void;
	writeErr: (text: string) => void;
};

export function resolveTeamMatch(
	organizations: TrumboAccountOrganization[],
	target: string,
): TrumboAccountOrganization | "personal" | null {
	const query = target.trim().toLowerCase();
	if (!query) return null;
	if (query === "personal" || query === "personal-account") {
		return "personal";
	}

	const exact = organizations.find((org) => {
		const id = org.organizationId.toLowerCase();
		const name = org.name.trim().toLowerCase();
		return id === query || name === query;
	});
	if (exact) return exact;

	return (
		organizations.find((org) => {
			const id = org.organizationId.toLowerCase();
			const name = org.name.trim().toLowerCase();
			return id.startsWith(query) || name.startsWith(query);
		}) ?? null
	);
}

function formatTeamLabel(org: TrumboAccountOrganization): string {
	if (org.name.trim()) {
		return org.name.trim();
	}
	return org.organizationId;
}

function resolveActiveTeamId(
	organizations: TrumboAccountOrganization[],
	storedOrgId?: string | null,
): string | null {
	if (storedOrgId?.trim()) {
		return storedOrgId.trim();
	}
	return (
		organizations.find((org) => org.active)?.organizationId ??
		organizations[0]?.organizationId ??
		null
	);
}

export async function runTeamListCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: TeamIo;
}): Promise<number> {
	try {
		const snapshot = await loadTrumboAccountSnapshot({
			config: { apiKey: "", logger: undefined, providerId: "trumbo" },
			providerSettingsManager: input.providerSettingsManager,
		});
		const storedOrgId =
			input.providerSettingsManager.getProviderSettings("trumbo")?.auth
				?.organizationId ?? null;
		const activeId = resolveActiveTeamId(snapshot.organizations, storedOrgId);

		if (snapshot.organizations.length === 0) {
			input.io.writeln("No teams found for this account.");
			return 0;
		}

		input.io.writeln(`${c.dim}Teams for ${snapshot.user.email}${c.reset}`);
		for (const org of snapshot.organizations) {
			const active = org.organizationId === activeId;
			const marker = active ? `${c.green}*${c.reset} ` : "  ";
			const role = org.roles[0] ?? "member";
			input.io.writeln(
				`${marker}${formatTeamLabel(org)} ${c.dim}(${org.organizationId}, ${role})${c.reset}`,
			);
		}
		input.io.writeln("");
		input.io.writeln(
			`${c.dim}Switch with:${c.reset} trumbo team switch <team-id>`,
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

export async function runTeamCurrentCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: TeamIo;
}): Promise<number> {
	try {
		const snapshot = await loadTrumboAccountSnapshot({
			config: { apiKey: "", logger: undefined, providerId: "trumbo" },
			providerSettingsManager: input.providerSettingsManager,
		});
		const storedOrgId =
			input.providerSettingsManager.getProviderSettings("trumbo")?.auth
				?.organizationId ?? null;
		const activeId = resolveActiveTeamId(snapshot.organizations, storedOrgId);
		const active =
			snapshot.organizations.find((org) => org.organizationId === activeId) ??
			snapshot.organizations[0];

		if (!active) {
			input.io.writeln("No active team selected.");
			return 0;
		}

		input.io.writeln(
			`${c.green}Active team:${c.reset} ${formatTeamLabel(active)}`,
		);
		input.io.writeln(`${c.dim}Team id:${c.reset} ${active.organizationId}`);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

export async function runTeamSwitchCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	target: string;
	io: TeamIo;
}): Promise<number> {
	try {
		const service = await createTrumboAccountService({
			config: { apiKey: "", logger: undefined, providerId: "trumbo" },
			providerSettingsManager: input.providerSettingsManager,
		});
		if (!service) {
			input.io.writeErr(
				"No Trumbo account auth token found. Run trumbo auth trumbo first.",
			);
			return 1;
		}

		const user = await service.fetchMe();
		const organizations = (user.organizations ?? []).map((org) => ({
			...org,
			organizationId:
				org.organizationId ??
				(org as TrumboAccountOrganization & { id?: string }).id ??
				"",
		}));
		const match = resolveTeamMatch(organizations, input.target);
		if (!match) {
			input.io.writeErr(
				`Unknown team "${input.target}". Run trumbo team list to see available teams.`,
			);
			return 1;
		}

		const organizationId = match === "personal" ? null : match.organizationId;
		await switchTrumboAccount({
			config: { apiKey: "", logger: undefined, providerId: "trumbo" },
			organizationId,
			providerSettingsManager: input.providerSettingsManager,
		});

		const label =
			match === "personal" ? "Personal account" : formatTeamLabel(match);
		input.io.writeln(`${c.green}Switched to${c.reset} ${label}`);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}
