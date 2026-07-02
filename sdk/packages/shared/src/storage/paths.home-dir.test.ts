import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

type EnvSnapshot = {
	HOME: string | undefined;
	USERPROFILE: string | undefined;
	HOMEDRIVE: string | undefined;
	HOMEPATH: string | undefined;
	TREMBO_DIR: string | undefined;
};

function captureEnv(): EnvSnapshot {
	return {
		HOME: process.env.HOME,
		USERPROFILE: process.env.USERPROFILE,
		HOMEDRIVE: process.env.HOMEDRIVE,
		HOMEPATH: process.env.HOMEPATH,
		TREMBO_DIR: process.env.TREMBO_DIR,
	};
}

function restoreEnv(snapshot: EnvSnapshot): void {
	process.env.HOME = snapshot.HOME;
	process.env.USERPROFILE = snapshot.USERPROFILE;
	process.env.HOMEDRIVE = snapshot.HOMEDRIVE;
	process.env.HOMEPATH = snapshot.HOMEPATH;
	process.env.TREMBO_DIR = snapshot.TREMBO_DIR;
}

describe("storage home directory fallback", () => {
	let snapshot: EnvSnapshot = captureEnv();

	afterEach(() => {
		restoreEnv(snapshot);
		vi.resetModules();
	});

	it("uses USERPROFILE when HOME is unset", async () => {
		snapshot = captureEnv();
		delete process.env.HOME;
		process.env.USERPROFILE = "C:\\Users\\trembo";
		delete process.env.HOMEDRIVE;
		delete process.env.HOMEPATH;
		delete process.env.TREMBO_DIR;

		const { resolveTremboDir } = await import("./paths");
		expect(resolveTremboDir()).toBe(join("C:\\Users\\trembo", ".trembo"));
	});

	it("treats HOME=~ as unset and falls back to USERPROFILE", async () => {
		snapshot = captureEnv();
		process.env.HOME = "~";
		process.env.USERPROFILE = "C:\\Users\\trembo";
		delete process.env.HOMEDRIVE;
		delete process.env.HOMEPATH;
		delete process.env.TREMBO_DIR;

		const { resolveTremboDir } = await import("./paths");
		expect(resolveTremboDir()).toBe(join("C:\\Users\\trembo", ".trembo"));
	});
});
