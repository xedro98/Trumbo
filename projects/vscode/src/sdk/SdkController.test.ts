import { describe, expect, it } from "vitest"
import { isTrumboProvider } from "@/shared/utils/trumbo"
import { resolveWorkspaceRootPath } from "./workspace-root"

describe("isTrumboProvider", () => {
	it("treats both Trumbo account providers as Trumbo providers", () => {
		expect(isTrumboProvider("trumbo")).toBe(true)
		expect(isTrumboProvider("trumbo-pass")).toBe(true)
		expect(isTrumboProvider("anthropic")).toBe(false)
		expect(isTrumboProvider(undefined)).toBe(false)
	})
})

describe("resolveWorkspaceRootPath", () => {
	it("uses the first non-empty workspace path when available", () => {
		expect(resolveWorkspaceRootPath(["", "/workspace"], "/Users/tester/Desktop")).toBe("/workspace")
	})

	it("falls back to Desktop when no workspace folder is open", () => {
		expect(resolveWorkspaceRootPath([], "/Users/tester/Desktop")).toBe("/Users/tester/Desktop")
	})
})
