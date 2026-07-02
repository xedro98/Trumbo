import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	getTremboCliMigrationNotice,
	markTremboCliMigrationNoticeShown,
	resolveCliNoticeStatePath,
	shouldSuppressTremboCliMigrationNoticeForActiveProvider,
} from "./notice";

const tempDirs: string[] = [];

function createTempDataDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "trembo-cli-notice-"));
	tempDirs.push(dir);
	return dir;
}

describe("migration notice", () => {
	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("returns the notice for a fresh data dir", () => {
		const dataDir = createTempDataDir();

		expect(getTremboCliMigrationNotice(dataDir)?.title).toBe("Try TremboPass");
	});

	it("shows when only the old Kanban notice was marked as shown", () => {
		const dataDir = createTempDataDir();
		const noticePath = resolveCliNoticeStatePath(dataDir);
		mkdirSync(dirname(noticePath), { recursive: true, mode: 0o700 });
		writeFileSync(
			noticePath,
			`${JSON.stringify(
				{ shown: { "trembo-cli-tui-default": true } },
				null,
				2,
			)}\n`,
			"utf8",
		);

		expect(getTremboCliMigrationNotice(dataDir)?.id).toBe(
			"trembo-cli-trembo-pass-intro",
		);
	});

	it("does not show after the notice is marked as shown", () => {
		const dataDir = createTempDataDir();

		markTremboCliMigrationNoticeShown(dataDir);

		expect(getTremboCliMigrationNotice(dataDir)).toBeUndefined();
	});

	it("shows after the notice is marked as shown when forced", () => {
		const dataDir = createTempDataDir();

		markTremboCliMigrationNoticeShown(dataDir);

		expect(
			getTremboCliMigrationNotice(dataDir, {
				TREMBO_FORCE_TREMBO_PASS_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("does not show when disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getTremboCliMigrationNotice(dataDir, {
				TREMBO_DISABLE_TREMBO_PASS_NOTICE: "1",
			}),
		).toBeUndefined();
	});

	it("does not show when TremboPass is already the active provider", () => {
		const dataDir = createTempDataDir();

		expect(
			getTremboCliMigrationNotice(
				dataDir,
				{},
				{ activeProviderId: "trembo-pass" },
			),
		).toBeUndefined();
	});

	it("suppresses the active TremboPass provider even when the provider id has surrounding whitespace", () => {
		expect(
			shouldSuppressTremboCliMigrationNoticeForActiveProvider(" trembo-pass "),
		).toBe(true);
	});

	it("does not suppress the active TremboPass provider when forced", () => {
		expect(
			shouldSuppressTremboCliMigrationNoticeForActiveProvider("trembo-pass", {
				TREMBO_FORCE_TREMBO_PASS_NOTICE: "1",
			}),
		).toBe(false);
	});

	it("shows for the active TremboPass provider when forced", () => {
		const dataDir = createTempDataDir();

		expect(
			getTremboCliMigrationNotice(
				dataDir,
				{ TREMBO_FORCE_TREMBO_PASS_NOTICE: "1" },
				{ activeProviderId: "trembo-pass" },
			),
		).toBeDefined();
	});

	it("shows when forced even if disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getTremboCliMigrationNotice(dataDir, {
				TREMBO_DISABLE_TREMBO_PASS_NOTICE: "1",
				TREMBO_FORCE_TREMBO_PASS_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("marks the notice as shown", () => {
		const dataDir = createTempDataDir();

		markTremboCliMigrationNoticeShown(dataDir);

		const rawState = readFileSync(resolveCliNoticeStatePath(dataDir), "utf8");
		expect(rawState).toContain("trembo-cli-trembo-pass-intro");
		expect(getTremboCliMigrationNotice(dataDir)).toBeUndefined();
	});
});
