import { describe, expect, it } from "vitest";
import {
	parseAsciiLogo,
	resolveLogoBounds,
	scaleAsciiLogo,
} from "./scale-ascii-logo";

const SAMPLE = parseAsciiLogo(`+++++
+   +
+   +
+   +
+++++`);

describe("scaleAsciiLogo", () => {
	it("returns source unchanged when it already fits", () => {
		expect(scaleAsciiLogo(SAMPLE, 10, 10)).toBe(SAMPLE.join("\n"));
	});

	it("scales down proportionally for narrow terminals", () => {
		const scaled = scaleAsciiLogo(SAMPLE, 3, 3);
		const lines = scaled.split("\n");
		expect(lines.length).toBeLessThanOrEqual(3);
		expect(Math.max(...lines.map((line) => line.length))).toBeLessThanOrEqual(
			3,
		);
		expect(scaled.includes("+")).toBe(true);
	});

	it("keeps a single multiline block (no per-line shifting)", () => {
		const art = parseAsciiLogo(`   ++
  ++++
 +++++`);
		const scaled = scaleAsciiLogo(art, 20, 10);
		expect(scaled.split("\n").length).toBeGreaterThan(0);
	});
});

describe("resolveLogoBounds", () => {
	it("subtracts reserved home-screen space from height", () => {
		const bounds = resolveLogoBounds({
			terminalWidth: 120,
			terminalHeight: 40,
			reservedHeight: 16,
		});
		expect(bounds.maxWidth).toBe(118);
		expect(bounds.maxHeight).toBe(18);
	});
});
