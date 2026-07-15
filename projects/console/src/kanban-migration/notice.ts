import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveTrumboDataDir } from "@trumbodev/shared/storage";

const NOTICE_ID = "trumbo-cli-trumbo-pass-intro";
const FORCE_NOTICE_ENV = "TRUMBO_FORCE_TRUMBO_PASS_NOTICE";
const DISABLE_NOTICE_ENV = "TRUMBO_DISABLE_TRUMBO_PASS_NOTICE";

export interface CliMigrationNotice {
	id: string;
	title: string;
}

export interface CliMigrationNoticeOptions {
	activeProviderId?: string;
}

interface CliNoticeState {
	shown: Record<string, boolean>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJsonRecord(filePath: string): Record<string, unknown> | undefined {
	if (!existsSync(filePath)) {
		return undefined;
	}
	try {
		const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
		return isRecord(parsed) ? parsed : undefined;
	} catch {
		return undefined;
	}
}

function readNoticeState(filePath: string): CliNoticeState {
	const parsed = readJsonRecord(filePath);
	const shown: Record<string, boolean> = {};
	if (!parsed) {
		return { shown };
	}
	const rawShown = parsed.shown;
	if (!isRecord(rawShown)) {
		return { shown };
	}
	for (const [key, value] of Object.entries(rawShown)) {
		if (typeof value === "boolean") {
			shown[key] = value;
		}
	}
	return { shown };
}

function isForceNoticeEnabled(env: NodeJS.ProcessEnv): boolean {
	return env[FORCE_NOTICE_ENV]?.trim() === "1";
}

export function shouldSuppressTrumboCliMigrationNoticeForActiveProvider(
	activeProviderId: string | undefined,
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	return (
		activeProviderId?.trim() === "trumbo-pass" && !isForceNoticeEnabled(env)
	);
}

export function resolveCliNoticeStatePath(
	dataDir = resolveTrumboDataDir(),
): string {
	return join(dataDir, "settings", "cli-notices.json");
}

export function getTrumboCliMigrationNotice(
	dataDir = resolveTrumboDataDir(),
	env: NodeJS.ProcessEnv = process.env,
	options: CliMigrationNoticeOptions = {},
): CliMigrationNotice | undefined {
	const noticePath = resolveCliNoticeStatePath(dataDir);
	const noticeState = readNoticeState(noticePath);
	const forceNotice = isForceNoticeEnabled(env);
	const disableNotice = env[DISABLE_NOTICE_ENV]?.trim() === "1";
	if (disableNotice && !forceNotice) {
		return undefined;
	}
	if (
		shouldSuppressTrumboCliMigrationNoticeForActiveProvider(
			options.activeProviderId,
			env,
		)
	) {
		return undefined;
	}
	if (noticeState.shown[NOTICE_ID] && !forceNotice) {
		return undefined;
	}
	return {
		id: NOTICE_ID,
		title: "Try TrumboPass",
	};
}

export function markTrumboCliMigrationNoticeShown(
	dataDir = resolveTrumboDataDir(),
): void {
	const noticePath = resolveCliNoticeStatePath(dataDir);
	const noticeState = readNoticeState(noticePath);
	const nextState: CliNoticeState = {
		shown: {
			...noticeState.shown,
			[NOTICE_ID]: true,
		},
	};
	mkdirSync(dirname(noticePath), { recursive: true, mode: 0o700 });
	writeFileSync(noticePath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
}
