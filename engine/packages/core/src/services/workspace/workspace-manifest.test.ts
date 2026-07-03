import { upsertWorkspaceInfo } from "@trumbo/shared";
import { describe, expect, it } from "vitest";
import { workspaceHintForPath } from "./workspace-manifest";

describe("workspaceHintForPath", () => {
	it("uses the directory name for normal paths", () => {
		expect(workspaceHintForPath("D:\\Torch\\cline-full")).toBe("cline-full");
	});

	it("falls back for Windows drive roots where basename is empty", () => {
		expect(workspaceHintForPath("D:\\")).toBe("D:");
	});

	it("produces a hint that passes workspace manifest validation", () => {
		const manifest = upsertWorkspaceInfo(
			{ workspaces: {} },
			{ rootPath: "D:\\", hint: workspaceHintForPath("D:\\") },
		);
		expect(manifest.workspaces["D:\\"]?.hint).toBe("D:");
	});
});
