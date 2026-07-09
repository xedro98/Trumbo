import { describe, expect, it } from "vitest";
import { normalizeMcpToolResult } from "./tools";

describe("normalizeMcpToolResult", () => {
	it("maps mimeType to mediaType on image content blocks", () => {
		const raw = {
			content: [
				{ type: "image", data: "iVBORw0KGgo=", mimeType: "image/png" },
				{ type: "text", text: "sessionId: abc-123" },
			],
			_meta: { foo: "bar" },
		};
		const result = normalizeMcpToolResult(raw) as unknown[];
		expect(Array.isArray(result)).toBe(true);
		const image = result[0] as Record<string, unknown>;
		expect(image.type).toBe("image");
		expect(image.mediaType).toBe("image/png");
		expect(image.mimeType).toBe("image/png");
		expect(image.data).toBe("iVBORw0KGgo=");
		const text = result[1] as Record<string, unknown>;
		expect(text.type).toBe("text");
		expect(text.text).toBe("sessionId: abc-123");
	});

	it("does not overwrite an existing mediaType", () => {
		const raw = {
			content: [
				{
					type: "image",
					data: "abc",
					mediaType: "image/jpeg",
					mimeType: "image/png",
				},
			],
		};
		const result = normalizeMcpToolResult(raw) as unknown[];
		const image = result[0] as Record<string, unknown>;
		expect(image.mediaType).toBe("image/jpeg");
	});

	it("passes through non-image blocks unchanged", () => {
		const raw = {
			content: [
				{ type: "text", text: "hello" },
				{ type: "resource", resource: { uri: "file:///x" } },
			],
		};
		const result = normalizeMcpToolResult(raw) as unknown[];
		expect(result[0]).toEqual({ type: "text", text: "hello" });
		expect(result[1]).toEqual({
			type: "resource",
			resource: { uri: "file:///x" },
		});
	});

	it("passes through non-object results unchanged", () => {
		expect(normalizeMcpToolResult(null)).toBeNull();
		expect(normalizeMcpToolResult("hello")).toBe("hello");
		expect(normalizeMcpToolResult([1, 2, 3])).toEqual([1, 2, 3]);
		expect(normalizeMcpToolResult(undefined)).toBeUndefined();
	});

	it("passes through objects without a content array", () => {
		const raw = { foo: "bar" };
		expect(normalizeMcpToolResult(raw)).toBe(raw);
	});

	it("handles empty content arrays", () => {
		const raw = { content: [] };
		const result = normalizeMcpToolResult(raw) as unknown[];
		expect(result).toEqual([]);
	});
});
