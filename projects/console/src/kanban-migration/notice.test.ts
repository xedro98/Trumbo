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
	getTrumboCliMigrationNotice,
	markTrumboCliMigrationNoticeShown,
	resolveCliNoticeStatePath,
	shouldSuppressTrumboCliMigrationNoticeForActiveProvider,
} from "./notice";

const tempDirs: string[] = [];

function createTempDataDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "trumbo-cli-notice-"));
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

		expect(getTrumboCliMigrationNotice(dataDir)?.title).toBe("Try TrumboPass");
	});

	it("shows when only the old Kanban notice was marked as shown", () => {
		const dataDir = createTempDataDir();
		const noticePath = resolveCliNoticeStatePath(dataDir);
		mkdirSync(dirname(noticePath), { recursive: true, mode: 0o700 });
		writeFileSync(
			noticePath,
			`${JSON.stringify(
				{ shown: { "trumbo-cli-tui-default": true } },
				null,
				2,
			)}\n`,
			"utf8",
		);

		expect(getTrumboCliMigrationNotice(dataDir)?.id).toBe(
			"trumbo-cli-trumbo-pass-intro",
		);
	});

	it("does not show after the notice is marked as shown", () => {
		const dataDir = createTempDataDir();

		markTrumboCliMigrationNoticeShown(dataDir);

		expect(getTrumboCliMigrationNotice(dataDir)).toBeUndefined();
	});

	it("shows after the notice is marked as shown when forced", () => {
		const dataDir = createTempDataDir();

		markTrumboCliMigrationNoticeShown(dataDir);

		expect(
			getTrumboCliMigrationNotice(dataDir, {
				TRUMBO_FORCE_TRUMBO_PASS_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("does not show when disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getTrumboCliMigrationNotice(dataDir, {
				TRUMBO_DISABLE_TRUMBO_PASS_NOTICE: "1",
			}),
		).toBeUndefined();
	});

	it("does not show when TrumboPass is already the active provider", () => {
		const dataDir = createTempDataDir();

		expect(
			getTrumboCliMigrationNotice(
				dataDir,
				{},
				{ activeProviderId: "trumbo-pass" },
			),
		).toBeUndefined();
	});

	it("suppresses the active TrumboPass provider even when the provider id has surrounding whitespace", () => {
		expect(
			shouldSuppressTrumboCliMigrationNoticeForActiveProvider(" trumbo-pass "),
		).toBe(true);
	});

	it("does not suppress the active TrumboPass provider when forced", () => {
		expect(
			shouldSuppressTrumboCliMigrationNoticeForActiveProvider("trumbo-pass", {
				TRUMBO_FORCE_TRUMBO_PASS_NOTICE: "1",
			}),
		).toBe(false);
	});

	it("shows for the active TrumboPass provider when forced", () => {
		const dataDir = createTempDataDir();

		expect(
			getTrumboCliMigrationNotice(
				dataDir,
				{ TRUMBO_FORCE_TRUMBO_PASS_NOTICE: "1" },
				{ activeProviderId: "trumbo-pass" },
			),
		).toBeDefined();
	});

	it("shows when forced even if disabled through the environment", () => {
		const dataDir = createTempDataDir();

		expect(
			getTrumboCliMigrationNotice(dataDir, {
				TRUMBO_DISABLE_TRUMBO_PASS_NOTICE: "1",
				TRUMBO_FORCE_TRUMBO_PASS_NOTICE: "1",
			}),
		).toBeDefined();
	});

	it("marks the notice as shown", () => {
		const dataDir = createTempDataDir();

		markTrumboCliMigrationNoticeShown(dataDir);

		const rawState = readFileSync(resolveCliNoticeStatePath(dataDir), "utf8");
		expect(rawState).toContain("trumbo-cli-trumbo-pass-intro");
		expect(getTrumboCliMigrationNotice(dataDir)).toBeUndefined();
	});
});
