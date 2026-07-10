import { describe, expect, it } from "vitest";
import {
	clearTrustDecision,
	getTrustDecision,
	isWorkspaceTrusted,
	loadTrustStore,
	setTrustDecision,
} from "./project-trust";

describe("project-trust", () => {
	it("loadTrustStore returns empty store when no file", () => {
		const store = loadTrustStore();
		expect(store.decisions).toBeDefined();
	});

	it("getTrustDecision returns ask for unknown workspace", () => {
		const decision = getTrustDecision("/nonexistent/workspace");
		expect(decision).toBe("ask");
	});

	it("isWorkspaceTrusted returns false for untrusted workspace", () => {
		expect(isWorkspaceTrusted("/nonexistent/workspace")).toBe(false);
	});

	it("isWorkspaceTrusted returns true with always override", () => {
		expect(isWorkspaceTrusted("/any/path", "always")).toBe(true);
	});

	it("isWorkspaceTrusted returns false with never override", () => {
		expect(isWorkspaceTrusted("/any/path", "never")).toBe(false);
	});

	it("setTrustDecision and getTrustDecision round-trip", () => {
		const testPath = "/test/workspace/for/trust";
		setTrustDecision(testPath, "always");
		expect(getTrustDecision(testPath)).toBe("always");
		clearTrustDecision(testPath);
	});
});
