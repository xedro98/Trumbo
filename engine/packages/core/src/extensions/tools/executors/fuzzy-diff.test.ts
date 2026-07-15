import { describe, expect, it } from "vitest";
import {
	applyEditsToNormalizedContent,
	applyReplacementsPreservingUnchangedLines,
	detectLineEnding,
	type Edit,
	fuzzyFindText,
	generateDiffString,
	normalizeForFuzzyMatch,
	normalizeToLF,
	restoreLineEndings,
	stripBom,
} from "./fuzzy-diff";

describe("normalizeForFuzzyMatch", () => {
	it("passes through plain ASCII unchanged", () => {
		expect(normalizeForFuzzyMatch("hello world\nfoo bar")).toBe(
			"hello world\nfoo bar",
		);
	});

	it("strips trailing whitespace from each line", () => {
		expect(normalizeForFuzzyMatch("hello   \nworld\t")).toBe("hello\nworld");
	});

	it("converts smart single quotes to ASCII", () => {
		expect(normalizeForFuzzyMatch("\u2018hello\u2019")).toBe("'hello'");
		expect(normalizeForFuzzyMatch("\u201A\u201B")).toBe("''");
	});

	it("converts smart double quotes to ASCII", () => {
		expect(normalizeForFuzzyMatch("\u201Chello\u201D")).toBe('"hello"');
		expect(normalizeForFuzzyMatch("\u201E\u201F")).toBe('""');
	});

	it("converts Unicode dashes to ASCII hyphen", () => {
		expect(
			normalizeForFuzzyMatch("\u2010\u2011\u2012\u2013\u2014\u2015\u2212"),
		).toBe("-------");
	});

	it("converts special Unicode spaces to regular space", () => {
		// Mix with non-whitespace so trimEnd doesn't strip the whole line
		expect(normalizeForFuzzyMatch("x\u00A0y\u2002z")).toBe("x y z");
		expect(normalizeForFuzzyMatch("a\u3000b")).toBe("a b");
	});

	it("preserves line count (critical for the overlay algorithm)", () => {
		const input = "line1\nline2\nline3";
		const normalized = normalizeForFuzzyMatch(input);
		expect(normalized.split("\n").length).toBe(input.split("\n").length);
	});

	it("applies NFKC normalization", () => {
		// Fullwidth Latin letters fold to ASCII under NFKC
		expect(normalizeForFuzzyMatch("\uFF21\uFF22\uFF23")).toBe("ABC");
	});
});

describe("fuzzyFindText", () => {
	it("finds exact match without fuzzy", () => {
		const content = "hello world foo bar";
		const result = fuzzyFindText(content, "world");
		expect(result.found).toBe(true);
		expect(result.usedFuzzyMatch).toBe(false);
		expect(result.index).toBe(6);
		expect(result.matchLength).toBe(5);
		expect(result.contentForReplacement).toBe(content);
	});

	it("finds fuzzy match when trailing whitespace differs", () => {
		const content = "hello   \nworld";
		const oldText = "hello\nworld";
		const result = fuzzyFindText(content, oldText);
		expect(result.found).toBe(true);
		expect(result.usedFuzzyMatch).toBe(true);
		expect(result.index).toBe(0);
		expect(result.matchLength).toBe(oldText.length);
	});

	it("finds fuzzy match when smart quotes differ", () => {
		const content = "\u201Chello\u201D";
		const oldText = '"hello"';
		const result = fuzzyFindText(content, oldText);
		expect(result.found).toBe(true);
		expect(result.usedFuzzyMatch).toBe(true);
	});

	it("returns not found when text does not exist", () => {
		const result = fuzzyFindText("hello world", "goodbye");
		expect(result.found).toBe(false);
		expect(result.index).toBe(-1);
	});
});

describe("stripBom", () => {
	it("strips BOM and returns it", () => {
		const { bom, text } = stripBom("\uFEFFhello");
		expect(bom).toBe("\uFEFF");
		expect(text).toBe("hello");
	});

	it("returns empty BOM when not present", () => {
		const { bom, text } = stripBom("hello");
		expect(bom).toBe("");
		expect(text).toBe("hello");
	});
});

describe("detectLineEnding", () => {
	it("detects CRLF when it appears first", () => {
		expect(detectLineEnding("line1\r\nline2\n")).toBe("\r\n");
	});

	it("detects LF when no CRLF", () => {
		expect(detectLineEnding("line1\nline2\n")).toBe("\n");
	});

	it("defaults to LF when no newlines", () => {
		expect(detectLineEnding("hello")).toBe("\n");
	});

	it("detects LF when LF appears before CRLF", () => {
		expect(detectLineEnding("line1\nline2\r\n")).toBe("\n");
	});
});

describe("normalizeToLF / restoreLineEndings", () => {
	it("normalizes CRLF to LF", () => {
		expect(normalizeToLF("a\r\nb\r\n")).toBe("a\nb\n");
	});

	it("normalizes lone CR to LF", () => {
		expect(normalizeToLF("a\rb\r")).toBe("a\nb\n");
	});

	it("restores CRLF", () => {
		expect(restoreLineEndings("a\nb\n", "\r\n")).toBe("a\r\nb\r\n");
	});

	it("restores LF (identity)", () => {
		expect(restoreLineEndings("a\nb\n", "\n")).toBe("a\nb\n");
	});

	it("round-trips CRLF through normalize and restore", () => {
		const original = "line1\r\nline2\r\nline3\r\n";
		const normalized = normalizeToLF(original);
		const restored = restoreLineEndings(normalized, "\r\n");
		expect(restored).toBe(original);
	});
});

describe("applyReplacementsPreservingUnchangedLines", () => {
	it("preserves unchanged lines from the original", () => {
		const original = "line1   \nline2\nline3   \n";
		const base = normalizeForFuzzyMatch(original); // "line1\nline2\nline3\n"
		// Replace "line2" with "LINE2" in the base
		const matchIndex = base.indexOf("line2");
		const replacements = [{ matchIndex, matchLength: 5, newText: "LINE2" }];
		const result = applyReplacementsPreservingUnchangedLines(
			original,
			base,
			replacements,
		);
		// line1 and line3 should keep their trailing whitespace from the original
		expect(result).toBe("line1   \nLINE2\nline3   \n");
	});

	it("throws when line counts differ", () => {
		expect(() =>
			applyReplacementsPreservingUnchangedLines("a\nb", "a\nb\nc", []),
		).toThrow("different line count");
	});
});

describe("applyEditsToNormalizedContent", () => {
	it("applies a single exact edit", () => {
		const content = "hello world\nfoo bar";
		const edits: Edit[] = [{ oldText: "world", newText: "WORLD" }];
		const { baseContent, newContent } = applyEditsToNormalizedContent(
			content,
			edits,
			"test.ts",
		);
		expect(baseContent).toBe(content);
		expect(newContent).toBe("hello WORLD\nfoo bar");
	});

	it("applies multiple non-overlapping edits", () => {
		const content = "aaa bbb ccc";
		const edits: Edit[] = [
			{ oldText: "aaa", newText: "AAA" },
			{ oldText: "ccc", newText: "CCC" },
		];
		const { newContent } = applyEditsToNormalizedContent(
			content,
			edits,
			"test.ts",
		);
		expect(newContent).toBe("AAA bbb CCC");
	});

	it("throws on empty oldText", () => {
		expect(() =>
			applyEditsToNormalizedContent(
				"hello",
				[{ oldText: "", newText: "x" }],
				"test.ts",
			),
		).toThrow("must not be empty");
	});

	it("throws on not found", () => {
		expect(() =>
			applyEditsToNormalizedContent(
				"hello",
				[{ oldText: "world", newText: "x" }],
				"test.ts",
			),
		).toThrow("Could not find");
	});

	it("throws on duplicate occurrences", () => {
		expect(() =>
			applyEditsToNormalizedContent(
				"foo foo",
				[{ oldText: "foo", newText: "bar" }],
				"test.ts",
			),
		).toThrow("occurrences");
	});

	it("throws on overlapping edits", () => {
		const content = "abcdef";
		const edits: Edit[] = [
			{ oldText: "abc", newText: "ABC" },
			{ oldText: "cde", newText: "CDE" },
		];
		expect(() =>
			applyEditsToNormalizedContent(content, edits, "test.ts"),
		).toThrow("overlap");
	});

	it("throws on no change (identical replacement)", () => {
		expect(() =>
			applyEditsToNormalizedContent(
				"hello",
				[{ oldText: "hello", newText: "hello" }],
				"test.ts",
			),
		).toThrow("No changes");
	});

	it("applies fuzzy match preserving unchanged lines", () => {
		const content = "hello   \nworld\nfoo   \n";
		const edits: Edit[] = [
			{ oldText: "hello\nworld", newText: "HELLO\nWORLD" },
		];
		const { baseContent, newContent } = applyEditsToNormalizedContent(
			content,
			edits,
			"test.ts",
		);
		// The fuzzy match should preserve trailing whitespace on unchanged lines
		expect(newContent).toBe("HELLO\nWORLD\nfoo   \n");
		expect(baseContent).toBe(content);
	});
});

describe("generateDiffString", () => {
	it("generates a diff with line numbers", () => {
		const old = "line1\nline2\nline3";
		const newContent = "line1\nLINE2\nline3";
		const { diff, firstChangedLine } = generateDiffString(old, newContent);
		expect(diff).toContain("-2 line2");
		expect(diff).toContain("+2 LINE2");
		expect(firstChangedLine).toBe(2);
	});

	it("returns undefined firstChangedLine when no changes", () => {
		const { firstChangedLine } = generateDiffString("hello", "hello");
		expect(firstChangedLine).toBeUndefined();
	});

	it("handles added lines", () => {
		const old = "a\nb";
		const newContent = "a\nb\nc";
		const { diff, firstChangedLine } = generateDiffString(old, newContent);
		expect(diff).toContain("+");
		expect(diff).toContain("c");
		// firstChangedLine points at the first new/changed line in the new file
		expect(firstChangedLine).toBeDefined();
	});

	it("handles removed lines", () => {
		const old = "a\nb\nc";
		const newContent = "a\nc";
		const { diff } = generateDiffString(old, newContent);
		expect(diff).toContain("-2 b");
	});
});
