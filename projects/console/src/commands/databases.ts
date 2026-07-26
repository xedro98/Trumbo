/**
 * `trumbo db` — manage Trumbo Database (Database-as-a-Service) via the platform API.
 *
 * Subcommands:
 *   trumbo db list                       list databases (filter: --kind=sql|kv|r2|vectorize)
 *   trumbo db create <name>              create + provision a database (--kind, --region)
 *   trumbo db inspect <dbId>             database detail
 *   trumbo db delete <dbId>              delete database
 *   trumbo db query <dbId> <sql>         run a read-only SQL query (SQL only)
 *   trumbo db migrate <dbId> <ver> <name> <sql-file>  apply a versioned migration (SQL only)
 *   trumbo db migrations <dbId>          list applied migrations
 *   trumbo db backup <dbId>              create a backup (SQL only)
 *   trumbo db backups <dbId>             list backups
 */

import type { ProviderSettingsManager } from "@trumbodev/core";
import { createTrumboAccountService } from "../tui/trumbo-account";
import { cyan, dim, green } from "../utils/output";

type DbIo = {
	writeln: (text?: string) => void;
	writeErr: (text: string) => void;
};

async function requireService(input: {
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

interface DbView {
	id: string;
	name: string;
	slug: string;
	kind: string;
	region: string;
	status: string;
	createdAt: number;
}
// ── list ──────────────────────────────────────────────────────────────────

export async function runDbListCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	kind?: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const params = new URLSearchParams();
		if (input.kind) params.set("kind", input.kind);
		const data = await service.platformRequest<{
			databases: DbView[];
			total: number;
		}>(`/api/v1/databases?${params.toString()}`);
		if (input.json) {
			input.io.writeln(JSON.stringify(data));
			return 0;
		}
		if (data.databases.length === 0) {
			input.io.writeln(
				dim("No databases yet. Create one with `trumbo db create <name>`."),
			);
			return 0;
		}
		for (const db of data.databases) {
			input.io.writeln(
				`${cyan(db.slug)}  ${dim(db.id)}  ${db.kind}  ${db.region}  ${db.status}`,
			);
		}
		input.io.writeln(dim(`\n${data.total} database(s).`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── create ────────────────────────────────────────────────────────────────

export async function runDbCreateCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	name: string;
	kind?: string;
	region?: string;
	connectionString?: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const body: Record<string, unknown> = { name: input.name };
		if (input.kind) body.kind = input.kind;
		if (input.region) body.region = input.region;
		if (input.connectionString) body.connectionString = input.connectionString;
		const db = await service.platformRequest<DbView>(`/api/v1/databases`, {
			method: "POST",
			body,
		});
		if (input.json) {
			input.io.writeln(JSON.stringify(db));
			return 0;
		}
		input.io.writeln(
			`${green("Created database")} ${cyan(db.slug)}  ${dim(db.id)}  ${db.kind}`,
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── inspect ───────────────────────────────────────────────────────────────

export async function runDbInspectCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const db = await service.platformRequest<DbView>(
			`/api/v1/databases/${encodeURIComponent(input.dbId)}`,
		);
		if (input.json) {
			input.io.writeln(JSON.stringify(db));
			return 0;
		}
		input.io.writeln(`${cyan(db.name)}  ${dim(db.id)}`);
		input.io.writeln(
			`${dim("Kind:")} ${db.kind}  ${dim("Region:")} ${db.region}  ${dim("Status:")} ${db.status}`,
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── delete ─────────────────────────────────────────────────────────────────

export async function runDbDeleteCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		await service.platformRequest(
			`/api/v1/databases/${encodeURIComponent(input.dbId)}`,
			{ method: "DELETE" },
		);
		input.io.writeln(green(`Deleted database ${input.dbId}.`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── query ──────────────────────────────────────────────────────────────────

export async function runDbQueryCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
	sql: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const result = await service.platformRequest<{
			rows: Record<string, unknown>[];
		}>(`/api/v1/databases/${encodeURIComponent(input.dbId)}/query`, {
			method: "POST",
			body: { sql: input.sql },
		});
		if (input.json) {
			input.io.writeln(JSON.stringify(result));
			return 0;
		}
		for (const row of result.rows) input.io.writeln(JSON.stringify(row));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── migrate ────────────────────────────────────────────────────────────────

export async function runDbMigrateCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
	version: number;
	name: string;
	sqlFile: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const fs = await import("node:fs/promises");
		const sql = await fs.readFile(input.sqlFile, "utf8");
		const result = await service.platformRequest<{
			applied: boolean;
			version: number;
			hash: string;
		}>(`/api/v1/databases/${encodeURIComponent(input.dbId)}/migrations`, {
			method: "POST",
			body: { version: input.version, name: input.name, sql },
		});
		input.io.writeln(
			result.applied
				? green(`Applied migration v${result.version}.`)
				: dim(`Migration v${result.version} already applied.`),
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── migrations (list) ──────────────────────────────────────────────────────

export async function runDbMigrationsCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const data = await service.platformRequest<{
			migrations: Array<{ version: number; name: string; applied_at: number }>;
		}>(`/api/v1/databases/${encodeURIComponent(input.dbId)}/migrations`);
		if (data.migrations.length === 0) {
			input.io.writeln(dim("No migrations applied."));
			return 0;
		}
		for (const m of data.migrations) {
			input.io.writeln(
				`${cyan(`v${m.version}`)}  ${m.name}  ${dim(new Date(m.applied_at * 1000).toISOString())}`,
			);
		}
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── attach ─────────────────────────────────────────────────────────────────

export async function runDbAttachCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
	appId: string;
	bindingName?: string;
	environment?: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const body: Record<string, unknown> = { appId: input.appId };
		if (input.bindingName) body.bindingName = input.bindingName;
		if (input.environment) body.environment = input.environment;
		await service.platformRequest(
			`/api/v1/databases/${encodeURIComponent(input.dbId)}/attach`,
			{ method: "POST", body },
		);
		input.io.writeln(
			green(
				`Attached database ${input.dbId} to app ${input.appId} as ${input.bindingName ?? "TRUMBO_DB"}.`,
			),
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── backup / backups ───────────────────────────────────────────────────────

export async function runDbBackupCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const backup = await service.platformRequest<{
			id: string;
			size_bytes: number;
			created_at: number;
		}>(`/api/v1/databases/${encodeURIComponent(input.dbId)}/backups`, {
			method: "POST",
		});
		input.io.writeln(
			green(`Created backup ${backup.id} (${backup.size_bytes} bytes).`),
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

export async function runDbBackupsCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const data = await service.platformRequest<{
			backups: Array<{
				id: string;
				size_bytes: number | null;
				kind: string;
				created_at: number;
			}>;
		}>(`/api/v1/databases/${encodeURIComponent(input.dbId)}/backups`);
		if (data.backups.length === 0) {
			input.io.writeln(dim("No backups yet."));
			return 0;
		}
		for (const b of data.backups) {
			input.io.writeln(
				`${dim(b.id.slice(0, 8))}  ${b.kind}  ${b.size_bytes ?? "?"} bytes  ${new Date(b.created_at * 1000).toISOString()}`,
			);
		}
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── branch ──────────────────────────────────────────────────────────────────

export async function runDbBranchCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
	name: string;
	withData?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const body: Record<string, unknown> = { name: input.name };
		if (input.withData) body.withData = true;
		const db = await service.platformRequest<DbView>(
			`/api/v1/databases/${encodeURIComponent(input.dbId)}/branch`,
			{ method: "POST", body },
		);
		input.io.writeln(
			green(
				`Branched database ${cyan(db.slug)}  ${dim(db.id)} from ${input.dbId}`,
			),
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── restore ─────────────────────────────────────────────────────────────────

export async function runDbRestoreCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
	backupId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		await service.platformRequest(
			`/api/v1/databases/${encodeURIComponent(input.dbId)}/backups/${encodeURIComponent(input.backupId)}/restore`,
			{ method: "POST" },
		);
		input.io.writeln(
			green(`Restored database ${input.dbId} from backup ${input.backupId}.`),
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── config (edge config / feature flags) ────────────────────────────────────

export async function runDbConfigCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: DbIo;
	dbId: string;
	key: string;
	value?: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		if (input.value === undefined) {
			const res = await service.platformRequest<{
				key: string;
				value: string | null;
			}>(
				`/api/v1/databases/${encodeURIComponent(input.dbId)}/config?key=${encodeURIComponent(input.key)}`,
			);
			input.io.writeln(
				`${cyan(res.key)} = ${res.value === null ? dim("(unset)") : res.value}`,
			);
			return 0;
		}
		await service.platformRequest(
			`/api/v1/databases/${encodeURIComponent(input.dbId)}/config`,
			{ method: "PUT", body: { key: input.key, value: input.value } },
		);
		input.io.writeln(green(`Set ${input.key} on ${input.dbId}.`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── command builder ────────────────────────────────────────────────────────

import { Command } from "commander";

export function createDbCommand(
	io: DbIo,
	getProviderSettingsManager: () => Promise<ProviderSettingsManager>,
	setExitCode: (code: number) => void,
): Command {
	function action<T extends unknown[]>(
		fn: (...args: T) => Promise<number>,
	): (...args: T) => Promise<void> {
		return async (...args: T) => {
			try {
				const code = await fn(...args);
				setExitCode(code);
			} catch (error) {
				io.writeErr(error instanceof Error ? error.message : String(error));
				setExitCode(1);
			}
		};
	}

	const db = new Command("db")
		.description("Manage Trumbo Database (Database-as-a-Service)")
		.exitOverride();

	db.command("list")
		.description("List databases")
		.option("--kind <kind>", "sql|kv|r2|vectorize")
		.option("--json", "Print JSON")
		.action(
			action(async (_opts: { kind?: string; json?: boolean }) => {
				const psm = await getProviderSettingsManager();
				return runDbListCommand({
					providerSettingsManager: psm,
					io,
					kind: _opts.kind,
					json: Boolean(_opts.json),
				});
			}),
		);

	db.command("create <name>")
		.description("Create + provision a database")
		.option(
			"--kind <kind>",
			"sql|kv|r2|vectorize|analytics|hyperdrive|edgeconfig",
			"sql",
		)
		.option("--region <region>", "Region")
		.option(
			"--connection-string <cs>",
			"Postgres connection string (kind=hyperdrive)",
		)
		.option("--json", "Print JSON")
		.action(
			action(
				async (
					name: string,
					_opts: {
						kind?: string;
						region?: string;
						connectionString?: string;
						json?: boolean;
					},
				) => {
					const psm = await getProviderSettingsManager();
					return runDbCreateCommand({
						providerSettingsManager: psm,
						io,
						name,
						kind: _opts.kind,
						region: _opts.region,
						connectionString: _opts.connectionString,
						json: Boolean(_opts.json),
					});
				},
			),
		);

	db.command("inspect <dbId>")
		.description("Database detail")
		.option("--json", "Print JSON")
		.action(
			action(async (dbId: string, _opts: { json?: boolean }) => {
				const psm = await getProviderSettingsManager();
				return runDbInspectCommand({
					providerSettingsManager: psm,
					io,
					dbId,
					json: Boolean(_opts.json),
				});
			}),
		);

	db.command("delete <dbId>")
		.description("Delete a database")
		.action(
			action(async (dbId: string) => {
				const psm = await getProviderSettingsManager();
				return runDbDeleteCommand({ providerSettingsManager: psm, io, dbId });
			}),
		);

	db.command("attach <dbId>")
		.description("Attach a database to an Agent App")
		.requiredOption("--app <appId>", "App id to bind the database to")
		.option("--binding <name>", "Worker binding name", "TRUMBO_DB")
		.option("-e, --environment <env>", "production|preview", "production")
		.action(
			action(
				async (
					dbId: string,
					_opts: { app: string; binding?: string; environment?: string },
				) => {
					const psm = await getProviderSettingsManager();
					return runDbAttachCommand({
						providerSettingsManager: psm,
						io,
						dbId,
						appId: _opts.app,
						bindingName: _opts.binding,
						environment: _opts.environment,
					});
				},
			),
		);

	db.command("query <dbId> <sql>")
		.description("Run a read-only SQL query (SQL only)")
		.option("--json", "Print JSON")
		.action(
			action(async (dbId: string, sql: string, _opts: { json?: boolean }) => {
				const psm = await getProviderSettingsManager();
				return runDbQueryCommand({
					providerSettingsManager: psm,
					io,
					dbId,
					sql,
					json: Boolean(_opts.json),
				});
			}),
		);

	db.command("migrate <dbId> <version> <name> <sqlFile>")
		.description("Apply a versioned migration (SQL only)")
		.action(
			action(
				async (
					dbId: string,
					version: string,
					name: string,
					sqlFile: string,
				) => {
					const psm = await getProviderSettingsManager();
					return runDbMigrateCommand({
						providerSettingsManager: psm,
						io,
						dbId,
						version: Number(version),
						name,
						sqlFile,
					});
				},
			),
		);

	db.command("migrations <dbId>")
		.description("List applied migrations")
		.action(
			action(async (dbId: string) => {
				const psm = await getProviderSettingsManager();
				return runDbMigrationsCommand({
					providerSettingsManager: psm,
					io,
					dbId,
				});
			}),
		);

	db.command("backup <dbId>")
		.description("Create a backup (SQL only)")
		.action(
			action(async (dbId: string) => {
				const psm = await getProviderSettingsManager();
				return runDbBackupCommand({ providerSettingsManager: psm, io, dbId });
			}),
		);

	db.command("backups <dbId>")
		.description("List backups")
		.action(
			action(async (dbId: string) => {
				const psm = await getProviderSettingsManager();
				return runDbBackupsCommand({ providerSettingsManager: psm, io, dbId });
			}),
		);

	db.command("branch <dbId>")
		.description("Branch a SQL database (schema, optional data)")
		.requiredOption("--name <n>", "Name for the branched database")
		.option("--with-data", "Copy data in addition to schema")
		.action(
			action(
				async (dbId: string, _opts: { name: string; withData?: boolean }) => {
					const psm = await getProviderSettingsManager();
					return runDbBranchCommand({
						providerSettingsManager: psm,
						io,
						dbId,
						name: _opts.name,
						withData: _opts.withData,
					});
				},
			),
		);

	db.command("restore <dbId> <backupId>")
		.description("Restore a SQL database from a backup")
		.action(
			action(async (dbId: string, backupId: string) => {
				const psm = await getProviderSettingsManager();
				return runDbRestoreCommand({
					providerSettingsManager: psm,
					io,
					dbId,
					backupId,
				});
			}),
		);

	db.command("config <dbId> <key> [value]")
		.description(
			"Read (no value) or set a feature-flag key on an edge-config database",
		)
		.action(
			action(async (dbId: string, key: string, value: string | undefined) => {
				const psm = await getProviderSettingsManager();
				return runDbConfigCommand({
					providerSettingsManager: psm,
					io,
					dbId,
					key,
					value,
				});
			}),
		);

	return db;
}
