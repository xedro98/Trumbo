/**
 * `trumbo apps` — manage Trumbo Agent Apps via the platform API.
 *
 * Subcommands:
 *   trumbo apps list                  list apps for the active org
 *   trumbo apps create <name>         create a new app
 *   trumbo apps inspect <appId>       app detail + latest production deploy
 *   trumbo apps deploy <appId>        create + run a deploy (upload or git)
 *   trumbo apps deploys <appId>       list deploys for an app
 *   trumbo apps promote <appId> <d>   promote a preview deploy to production
 *   trumbo apps rollback <appId> <d>  roll production back to a prior deploy
 *   trumbo apps env <appId>           list env vars (secrets masked)
 *   trumbo apps env:set <appId>       set an env var / secret
 *   trumbo apps env:del <appId>       delete an env var
 *   trumbo apps delete <appId>        delete an app
 */

import type { ProviderSettingsManager } from "@trumbodev/core";
import { createTrumboAccountService } from "../tui/trumbo-account";
import { cyan, dim, green, red, yellow } from "../utils/output";

type AppsIo = {
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

interface AppView {
	id: string;
	name: string;
	slug: string;
	framework: string | null;
	productionUrl: string;
	productionDeployId: string | null;
	createdAt: number;
}

interface DeployView {
	id: string;
	status: string;
	environment: string;
	source: string;
	commitSha: string | null;
	previewUrl: string | null;
	buildSeconds: number;
	createdAt: number;
}

interface EnvVarView {
	id: string;
	environment: string;
	key: string;
	value: string;
	isSecret: boolean;
}

// ── list ──────────────────────────────────────────────────────────────────

export async function runAppsListCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	pageSize?: number;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const params = new URLSearchParams();
		params.set("page", "1");
		params.set("pageSize", String(Math.min(input.pageSize ?? 50, 100)));
		const data = await service.platformRequest<{
			apps: AppView[];
			total: number;
		}>(`/api/v1/apps?${params.toString()}`);
		if (input.json) {
			input.io.writeln(JSON.stringify(data));
			return 0;
		}
		if (data.apps.length === 0) {
			input.io.writeln(
				dim("No apps yet. Create one with `trumbo apps create <name>`."),
			);
			return 0;
		}
		for (const app of data.apps) {
			input.io.writeln(
				`${cyan(app.slug)}  ${dim(app.id)}  ${app.productionUrl}${app.productionDeployId ? green(" [live]") : yellow(" [no deploy]")}`,
			);
		}
		input.io.writeln(dim(`\n${data.total} app(s).`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── create ────────────────────────────────────────────────────────────────

export async function runAppsCreateCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	name: string;
	framework?: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const body: Record<string, unknown> = { name: input.name };
		if (input.framework) body.framework = input.framework;
		const app = await service.platformRequest<AppView>(`/api/v1/apps`, {
			method: "POST",
			body,
		});
		if (input.json) {
			input.io.writeln(JSON.stringify(app));
			return 0;
		}
		input.io.writeln(
			`${green("Created app")} ${cyan(app.slug)}  ${dim(app.id)}`,
		);
		input.io.writeln(`${dim("Production URL:")} ${app.productionUrl}`);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── inspect ───────────────────────────────────────────────────────────────

export async function runAppsInspectCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const data = await service.platformRequest<
			AppView & { latestProductionDeploy: DeployView | null }
		>(`/api/v1/apps/${encodeURIComponent(input.appId)}`);
		if (input.json) {
			input.io.writeln(JSON.stringify(data));
			return 0;
		}
		input.io.writeln(`${cyan(data.name)}  ${dim(data.id)}`);
		input.io.writeln(`${dim("Framework:")} ${data.framework ?? "static"}`);
		input.io.writeln(`${dim("Production URL:")} ${data.productionUrl}`);
		if (data.latestProductionDeploy) {
			input.io.writeln(
				`${dim("Latest deploy:")} ${data.latestProductionDeploy.status}  ${data.latestProductionDeploy.previewUrl ?? ""}`,
			);
		} else {
			input.io.writeln(yellow("No production deploy yet."));
		}
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── deploy ────────────────────────────────────────────────────────────────

export async function runAppsDeployCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	environment: "production" | "preview";
	source: "git" | "upload";
	sourcePath?: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const body: Record<string, unknown> = {
			environment: input.environment,
			source: input.source,
		};
		if (input.source === "upload" && input.sourcePath) {
			const fs = await import("node:fs/promises");
			body.sourceTarball = (await fs.readFile(input.sourcePath)).toString(
				"base64",
			);
		}
		const deploy = await service.platformRequest<DeployView>(
			`/api/v1/apps/${encodeURIComponent(input.appId)}/deploys`,
			{ method: "POST", body },
		);
		if (input.json) {
			input.io.writeln(JSON.stringify(deploy));
			return 0;
		}
		input.io.writeln(`${green("Deploy")} ${deploy.id}  ${deploy.status}`);
		if (deploy.previewUrl)
			input.io.writeln(`${dim("URL:")} ${deploy.previewUrl}`);
		if (deploy.status === "building") {
			input.io.writeln(dim("Build is running. Check `trumbo apps deploys`."));
		}
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}
// ── deploys (list) ─────────────────────────────────────────────────────────

export async function runAppsDeploysCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	environment?: string;
	json?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const params = new URLSearchParams();
		if (input.environment) params.set("environment", input.environment);
		const data = await service.platformRequest<{ deploys: DeployView[] }>(
			`/api/v1/apps/${encodeURIComponent(input.appId)}/deploys?${params.toString()}`,
		);
		if (input.json) {
			input.io.writeln(JSON.stringify(data));
			return 0;
		}
		if (data.deploys.length === 0) {
			input.io.writeln(dim("No deploys yet."));
			return 0;
		}
		for (const d of data.deploys) {
			const statusColor =
				d.status === "live" ? green : d.status === "failed" ? red : yellow;
			input.io.writeln(
				`${statusColor(d.status)}  ${dim(d.id.slice(0, 8))}  ${d.environment}  ${d.previewUrl ?? ""}`,
			);
		}
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── promote / rollback ────────────────────────────────────────────────────

export async function runAppsPromoteCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	deployId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		await service.platformRequest(
			`/api/v1/apps/${encodeURIComponent(input.appId)}/deploys/${encodeURIComponent(input.deployId)}/promote`,
			{ method: "POST" },
		);
		input.io.writeln(green(`Promoted deploy ${input.deployId} to production.`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

export async function runAppsRollbackCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	deployId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		await service.platformRequest(
			`/api/v1/apps/${encodeURIComponent(input.appId)}/deploys/${encodeURIComponent(input.deployId)}/rollback`,
			{ method: "POST" },
		);
		input.io.writeln(green(`Rolled back to deploy ${input.deployId}.`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}
// ── env ────────────────────────────────────────────────────────────────────

export async function runAppsEnvListCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	environment?: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const params = new URLSearchParams();
		params.set("environment", input.environment ?? "production");
		const data = await service.platformRequest<{ envVars: EnvVarView[] }>(
			`/api/v1/apps/${encodeURIComponent(input.appId)}/env?${params.toString()}`,
		);
		if (data.envVars.length === 0) {
			input.io.writeln(dim("No env vars set."));
			return 0;
		}
		for (const v of data.envVars) {
			const tag = v.isSecret ? yellow("[secret]") : dim("[plain] ");
			input.io.writeln(`${tag}  ${cyan(v.key)}  ${v.value}`);
		}
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

export async function runAppsEnvSetCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	key: string;
	value: string;
	environment?: string;
	secret?: boolean;
}): Promise<number> {
	try {
		const service = await requireService(input);
		await service.platformRequest(
			`/api/v1/apps/${encodeURIComponent(input.appId)}/env`,
			{
				method: "PUT",
				body: {
					key: input.key,
					value: input.value,
					environment: input.environment ?? "production",
					isSecret: input.secret ?? false,
				},
			},
		);
		input.io.writeln(
			green(`Set ${input.secret ? "secret" : "env var"} ${input.key}.`),
		);
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

export async function runAppsEnvDelCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	key: string;
	environment?: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const params = new URLSearchParams();
		params.set("key", input.key);
		params.set("environment", input.environment ?? "production");
		await service.platformRequest(
			`/api/v1/apps/${encodeURIComponent(input.appId)}/env?${params.toString()}`,
			{ method: "DELETE" },
		);
		input.io.writeln(green(`Deleted env var ${input.key}.`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── delete ─────────────────────────────────────────────────────────────────

export async function runAppsDeleteCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		await service.platformRequest(
			`/api/v1/apps/${encodeURIComponent(input.appId)}`,
			{
				method: "DELETE",
			},
		);
		input.io.writeln(green(`Deleted app ${input.appId}.`));
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── logs ────────────────────────────────────────────────────────────────────

export async function runAppsLogsCommand(input: {
	providerSettingsManager: ProviderSettingsManager;
	io: AppsIo;
	appId: string;
	deployId?: string;
}): Promise<number> {
	try {
		const service = await requireService(input);
		const params = new URLSearchParams();
		if (input.deployId) params.set("deployId", input.deployId);
		const suffix = params.toString() ? `?${params}` : "";
		const data = await service.platformRequest<{
			deploys: DeployView[];
			buildLog: { deployId: string; text: string | null } | null;
		}>(`/api/v1/apps/${encodeURIComponent(input.appId)}/logs${suffix}`);
		for (const d of data.deploys) {
			const statusColor =
				d.status === "live" ? green : d.status === "failed" ? red : yellow;
			input.io.writeln(
				`${statusColor(d.status)}  ${dim(d.id.slice(0, 8))}  ${d.environment}  ${d.previewUrl ?? ""}`,
			);
		}
		if (data.buildLog?.text) {
			input.io.writeln(dim("\n--- build log ---"));
			input.io.writeln(data.buildLog.text);
		} else if (data.buildLog) {
			input.io.writeln(
				dim(`\nNo build log stored for deploy ${data.buildLog.deployId}.`),
			);
		} else {
			input.io.writeln(dim("\nNo build log available."));
		}
		return 0;
	} catch (error) {
		input.io.writeErr(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

// ── command builder ────────────────────────────────────────────────────────

import { Command } from "commander";

export function createAppsCommand(
	io: AppsIo,
	getProviderSettingsManager: () => Promise<ProviderSettingsManager>,
	setExitCode: (code: number) => void,
): Command {
	let exitCode = 0;
	const fail = () => {
		exitCode = 1;
	};
	function action<T extends unknown[]>(
		fn: (...args: T) => Promise<number>,
	): (...args: T) => Promise<void> {
		return async (...args: T) => {
			try {
				const code = await fn(...args);
				setExitCode(code);
			} catch (error) {
				io.writeErr(error instanceof Error ? error.message : String(error));
				fail();
				setExitCode(exitCode);
			}
		};
	}

	const apps = new Command("apps")
		.description("Manage Trumbo Agent Apps")
		.exitOverride();

	apps
		.command("list")
		.description("List apps for the active org")
		.option("--page-size <n>", "Max rows")
		.option("--json", "Print JSON")
		.action(
			action(async (_opts: { pageSize?: string; json?: boolean }) => {
				const psm = await getProviderSettingsManager();
				return runAppsListCommand({
					providerSettingsManager: psm,
					io,
					pageSize: _opts.pageSize ? Number(_opts.pageSize) : undefined,
					json: Boolean(_opts.json),
				});
			}),
		);

	apps
		.command("create <name>")
		.description("Create a new app")
		.option("--framework <id>", "Framework preset")
		.option("--json", "Print JSON")
		.action(
			action(
				async (name: string, _opts: { framework?: string; json?: boolean }) => {
					const psm = await getProviderSettingsManager();
					return runAppsCreateCommand({
						providerSettingsManager: psm,
						io,
						name,
						framework: _opts.framework,
						json: Boolean(_opts.json),
					});
				},
			),
		);

	apps
		.command("inspect <appId>")
		.description("App detail + latest production deploy")
		.option("--json", "Print JSON")
		.action(
			action(async (appId: string, _opts: { json?: boolean }) => {
				const psm = await getProviderSettingsManager();
				return runAppsInspectCommand({
					providerSettingsManager: psm,
					io,
					appId,
					json: Boolean(_opts.json),
				});
			}),
		);

	apps
		.command("deploy <appId>")
		.description("Create + run a deploy")
		.option("-e, --environment <env>", "production|preview", "production")
		.option("-s, --source <src>", "git|upload", "git")
		.option("--path <p>", "Source tarball path (for --source=upload)")
		.option("--json", "Print JSON")
		.action(
			action(
				async (
					appId: string,
					_opts: {
						environment?: string;
						source?: string;
						path?: string;
						json?: boolean;
					},
				) => {
					const psm = await getProviderSettingsManager();
					const environment =
						_opts.environment === "preview" ? "preview" : "production";
					const source = _opts.source === "upload" ? "upload" : "git";
					return runAppsDeployCommand({
						providerSettingsManager: psm,
						io,
						appId,
						environment,
						source,
						sourcePath: _opts.path,
						json: Boolean(_opts.json),
					});
				},
			),
		);

	apps
		.command("deploys <appId>")
		.description("List deploys for an app")
		.option("-e, --environment <env>", "Filter by environment")
		.option("--json", "Print JSON")
		.action(
			action(
				async (
					appId: string,
					_opts: { environment?: string; json?: boolean },
				) => {
					const psm = await getProviderSettingsManager();
					return runAppsDeploysCommand({
						providerSettingsManager: psm,
						io,
						appId,
						environment: _opts.environment,
						json: Boolean(_opts.json),
					});
				},
			),
		);

	apps
		.command("promote <appId> <deployId>")
		.description("Promote a preview deploy to production")
		.action(
			action(async (appId: string, deployId: string) => {
				const psm = await getProviderSettingsManager();
				return runAppsPromoteCommand({
					providerSettingsManager: psm,
					io,
					appId,
					deployId,
				});
			}),
		);

	apps
		.command("rollback <appId> <deployId>")
		.description("Roll production back to a prior deploy")
		.action(
			action(async (appId: string, deployId: string) => {
				const psm = await getProviderSettingsManager();
				return runAppsRollbackCommand({
					providerSettingsManager: psm,
					io,
					appId,
					deployId,
				});
			}),
		);

	apps
		.command("env <appId>")
		.description("List env vars for an app (secrets masked)")
		.option("-e, --environment <env>", "production|preview", "production")
		.action(
			action(async (appId: string, _opts: { environment?: string }) => {
				const psm = await getProviderSettingsManager();
				return runAppsEnvListCommand({
					providerSettingsManager: psm,
					io,
					appId,
					environment: _opts.environment,
				});
			}),
		);

	apps
		.command("env:set <appId> <key> <value>")
		.description("Set an env var / secret on an app")
		.option("-e, --environment <env>", "production|preview", "production")
		.option("--secret", "Treat the value as a secret (encrypted, never echoed)")
		.action(
			action(
				async (
					appId: string,
					key: string,
					value: string,
					_opts: { environment?: string; secret?: boolean },
				) => {
					const psm = await getProviderSettingsManager();
					return runAppsEnvSetCommand({
						providerSettingsManager: psm,
						io,
						appId,
						key,
						value,
						environment: _opts.environment,
						secret: Boolean(_opts.secret),
					});
				},
			),
		);

	apps
		.command("env:del <appId> <key>")
		.description("Delete an env var from an app")
		.option("-e, --environment <env>", "production|preview", "production")
		.action(
			action(
				async (appId: string, key: string, _opts: { environment?: string }) => {
					const psm = await getProviderSettingsManager();
					return runAppsEnvDelCommand({
						providerSettingsManager: psm,
						io,
						appId,
						key,
						environment: _opts.environment,
					});
				},
			),
		);

	apps
		.command("delete <appId>")
		.description("Delete an app")
		.action(
			action(async (appId: string) => {
				const psm = await getProviderSettingsManager();
				return runAppsDeleteCommand({
					providerSettingsManager: psm,
					io,
					appId,
				});
			}),
		);

	apps
		.command("logs <appId>")
		.description("Show recent deploy statuses + the latest build log")
		.option(
			"-d, --deploy <deployId>",
			"Fetch the build log for a specific deploy",
		)
		.action(
			action(async (appId: string, _opts: { deploy?: string }) => {
				const psm = await getProviderSettingsManager();
				return runAppsLogsCommand({
					providerSettingsManager: psm,
					io,
					appId,
					deployId: _opts.deploy,
				});
			}),
		);

	return apps;
}
