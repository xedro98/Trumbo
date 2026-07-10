import { describe, expect, it } from "vitest";
import {
	expandTemplate,
	parseFrontmatter,
	parseTemplateInvocation,
} from "./prompt-templates";

describe("parseFrontmatter", () => {
	it("parses simple frontmatter", () => {
		const raw = `---
description: Review a file
---
Review the file.`;
		const { frontmatter, body } = parseFrontmatter(raw);
		expect(frontmatter.description).toBe("Review a file");
		expect(body).toBe("Review the file.");
	});

	it("returns empty frontmatter for no frontmatter", () => {
		const raw = "Just a body.";
		const { frontmatter, body } = parseFrontmatter(raw);
		expect(frontmatter).toEqual({});
		expect(body).toBe("Just a body.");
	});
});

describe("expandTemplate", () => {
	it("replaces positional arguments", () => {
		const result = expandTemplate("Review $1 for issues", ["src/index.ts"]);
		expect(result).toBe("Review src/index.ts for issues");
	});

	it("replaces multiple positional arguments", () => {
		const result = expandTemplate("$1 and $2", ["a", "b"]);
		expect(result).toBe("a and b");
	});

	it("replaces $@ with all arguments", () => {
		const result = expandTemplate("Focus on: $@", ["a", "b", "c"]);
		expect(result).toBe("Focus on: a b c");
	});

	it("leaves unmatched placeholders", () => {
		const result = expandTemplate("$1 and $3", ["a"]);
		expect(result).toBe("a and $3");
	});

	it("handles no arguments", () => {
		const result = expandTemplate("No args $1", []);
		expect(result).toBe("No args $1");
	});
});

describe("parseTemplateInvocation", () => {
	it("parses slash command with args", () => {
		const result = parseTemplateInvocation("/review src/index.ts performance");
		expect(result).toEqual({
			name: "review",
			args: ["src/index.ts", "performance"],
		});
	});

	it("parses slash command without args", () => {
		const result = parseTemplateInvocation("/help");
		expect(result).toEqual({ name: "help", args: [] });
	});

	it("returns undefined for non-slash input", () => {
		expect(parseTemplateInvocation("hello")).toBeUndefined();
	});

	it("returns undefined for empty input", () => {
		expect(parseTemplateInvocation("")).toBeUndefined();
	});
});
