/**
 * `trumbo security` — list findings and manage org suppressions via the platform API.
 */

import type { ProviderSettingsManager } from "@trumbodev/core";
import { createTrumboAccountService } from "../tui/trumbo-account";
import { c } from "../utils/output";

type SecurityIo = {
	writeln: (text?: string) => void;
	writeErr: (text: string) => void;
};

async function requireSecurityService(input: {
	providerSettingsManager: ProviderSettingsManager;
}) {
	const service = await createTrumboAccountService({
		config: { apiKey: "", logger: undefined, providerId: "trumbo" },
		providerSettingsManager: input.providerSettingsManager,
	});
	if (!service) {
		throw new Error(
			"Not signed in. Run `trumbo auth trumbo` first, then retry.",
		);
	}
	return service;
}

export async function runSecurityFindingsCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: SecurityIo;
	severity?: string;
	status?: string;
	repoId?: string;
	pageSize?: number;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireSecurityService(input);
		const params = new URLSearchParams();
		params.set("page", "1");
		params.set("pageSize", String(Math.min(input.pageSize ?? 50, 100)));
		if (input.severity) params.set("severity", input.severity);
		if (input.status) params.set("status", input.status);
		if (input.repoId) params.set("repoId", input.repoId);

		const data = await service.platformRequest<{
			findings: Array<{
				id: string;
				severity: string;
				status: string;
				title: string;
				file_path: string;
				line_start: number | null;
				repo_id: string;
				category: string;
			}>;
			total: number;
		}>(`/api/v1/security/findings?${params.toString()}`);

		if (input.json) {
			input.io.writeln(JSON.stringify(data, null, 2));
			return 0;
		}

		const findings = data.findings ?? [];
		input.io.writeln(
			c.dim(
				`Security findings (${findings.length} of ${data.total ?? findings.length})`,
			),
		);
		if (findings.length === 0) {
			input.io.writeln("No findings match the filters.");
			return 0;
		}
		for (const f of findings) {
			const loc =
				f.line_start != null ? `${f.file_path}:${f.line_start}` : f.file_path;
			input.io.writeln(
				`${c.bold(f.severity.padEnd(8))} ${f.status.padEnd(14)} ${f.id.slice(0, 8)}  ${f.title}`,
			);
			input.io.writeln(`         ${c.dim(loc)}  [${f.category}]`);
		}
		return 0;
	} catch (err) {
		input.io.writeErr(err instanceof Error ? err.message : String(err));
		return 1;
	}
}

export async function runSecuritySuppressCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: SecurityIo;
	findingId: string;
	reason?: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireSecurityService(input);
		const data = await service.platformRequest<{
			id: string;
			fingerprint?: string;
		}>(`/api/v1/security/suppressions`, {
			method: "POST",
			body: {
				findingId: input.findingId,
				reason: input.reason ?? "Suppressed via CLI",
			},
		});
		if (input.json) {
			input.io.writeln(JSON.stringify(data, null, 2));
			return 0;
		}
		input.io.writeln(`Suppression created: ${data.id}`);
		return 0;
	} catch (err) {
		input.io.writeErr(err instanceof Error ? err.message : String(err));
		return 1;
	}
}

export async function runSecuritySuppressionsListCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: SecurityIo;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireSecurityService(input);
		const data = await service.platformRequest<{
			suppressions: Array<{
				id: string;
				fingerprint: string;
				ruleId: string | null;
				filePath: string | null;
				reason: string | null;
				createdAt: number;
			}>;
		}>(`/api/v1/security/suppressions`);

		if (input.json) {
			input.io.writeln(JSON.stringify(data, null, 2));
			return 0;
		}

		const rows = data.suppressions ?? [];
		if (rows.length === 0) {
			input.io.writeln("No suppressions.");
			return 0;
		}
		input.io.writeln(c.dim(`Suppressions (${rows.length})`));
		for (const s of rows) {
			input.io.writeln(
				`${s.id.slice(0, 8)}  ${s.filePath ?? "any"}  ${s.ruleId ?? s.fingerprint.slice(0, 12)}`,
			);
			if (s.reason) input.io.writeln(`         ${c.dim(s.reason)}`);
		}
		return 0;
	} catch (err) {
		input.io.writeErr(err instanceof Error ? err.message : String(err));
		return 1;
	}
}

export async function runSecuritySuppressionsDeleteCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: SecurityIo;
	id: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireSecurityService(input);
		const data = await service.platformRequest<{ deleted: boolean }>(
			`/api/v1/security/suppressions/${encodeURIComponent(input.id)}`,
			{ method: "DELETE" },
		);
		if (input.json) {
			input.io.writeln(JSON.stringify(data, null, 2));
			return 0;
		}
		input.io.writeln(
			data.deleted ? `Deleted suppression ${input.id}` : "Nothing deleted.",
		);
		return 0;
	} catch (err) {
		input.io.writeErr(err instanceof Error ? err.message : String(err));
		return 1;
	}
}

export async function runSecurityComplianceCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: SecurityIo;
	json?: boolean;
	refresh?: boolean;
}): Promise<number> {
	try {
		const service = await requireSecurityService(input);
		const data = input.refresh
			? await service.platformRequest<{
					reports: Array<Record<string, unknown>>;
				}>(`/api/v1/security/compliance/refresh`, { method: "POST", body: {} })
			: await service.platformRequest<{
					reports: Array<{
						id: string;
						name: string;
						overallStatus: string;
						controlsMet: number;
						controlsTotal: number;
						controls: Array<{
							id: string;
							title: string;
							status: string;
							summary: string;
						}>;
					}>;
				}>(`/api/v1/security/compliance/packs`);

		if (input.json) {
			input.io.writeln(JSON.stringify(data, null, 2));
			return 0;
		}

		const reports =
			(
				data as {
					reports?: Array<{
						id: string;
						name: string;
						overallStatus: string;
						controlsMet: number;
						controlsTotal: number;
						controls: Array<{
							id: string;
							title: string;
							status: string;
							summary: string;
						}>;
					}>;
				}
			).reports ?? [];

		for (const report of reports) {
			input.io.writeln(
				`${c.bold(report.name)}  [${report.overallStatus}]  ${report.controlsMet}/${report.controlsTotal}`,
			);
			for (const control of report.controls ?? []) {
				input.io.writeln(
					`  ${control.id.padEnd(10)} ${control.status.padEnd(8)} ${control.title}`,
				);
			}
			input.io.writeln();
		}
		return 0;
	} catch (err) {
		input.io.writeErr(err instanceof Error ? err.message : String(err));
		return 1;
	}
}
