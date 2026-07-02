import { describe, expect, it } from "vitest"
import { isTremboProvider } from "@/shared/utils/trembo"
import { resolveWorkspaceRootPath } from "./workspace-root"

describe("isTremboProvider", () => {
	it("treats both Trembo account providers as Trembo providers", () => {
		expect(isTremboProvider("trembo")).toBe(true)
		expect(isTremboProvider("trembo-pass")).toBe(true)
		expect(isTremboProvider("anthropic")).toBe(false)
		expect(isTremboProvider(undefined)).toBe(false)
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
