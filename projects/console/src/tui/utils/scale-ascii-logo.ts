/** Scale ASCII logo art to fit the terminal while preserving alignment. */
export function parseAsciiLogo(raw: string): string[] {
	return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd().split("\n");
}

export function scaleAsciiLogo(
	lines: string[],
	maxWidth: number,
	maxHeight: number,
	displayScale = 1,
): string {
	if (lines.length === 0 || maxWidth <= 0 || maxHeight <= 0) {
		return "";
	}

	const sourceWidth = Math.max(...lines.map((line) => line.length), 1);
	const sourceHeight = lines.length;
	const scale = Math.max(0.1, Math.min(1, displayScale));
	const targetWidth = Math.min(
		maxWidth,
		Math.max(1, Math.floor(sourceWidth * scale)),
	);
	const targetHeight = Math.min(
		maxHeight,
		Math.max(1, Math.floor(sourceHeight * scale)),
	);

	if (sourceWidth <= targetWidth && sourceHeight <= targetHeight) {
		return lines.join("\n");
	}

	const outputWidth = targetWidth;
	const outputHeight = targetHeight;
	const grid = lines.map((line) => {
		const row = line.split("");
		while (row.length < sourceWidth) {
			row.push(" ");
		}
		return row;
	});

	const outputLines: string[] = [];
	for (let y = 0; y < outputHeight; y += 1) {
		const yStart = Math.floor((y * sourceHeight) / outputHeight);
		const yEnd = Math.max(
			yStart + 1,
			Math.floor(((y + 1) * sourceHeight) / outputHeight),
		);
		let line = "";
		for (let x = 0; x < outputWidth; x += 1) {
			const xStart = Math.floor((x * sourceWidth) / outputWidth);
			const xEnd = Math.max(
				xStart + 1,
				Math.floor(((x + 1) * sourceWidth) / outputWidth),
			);
			let ink = false;
			for (let sy = yStart; sy < yEnd && !ink; sy += 1) {
				for (let sx = xStart; sx < xEnd; sx += 1) {
					if (grid[sy]?.[sx] === "+") {
						ink = true;
						break;
					}
				}
			}
			line += ink ? "+" : " ";
		}
		outputLines.push(line.replace(/\s+$/, ""));
	}

	while (outputLines.length > 0 && !outputLines[0]?.includes("+")) {
		outputLines.shift();
	}
	while (
		outputLines.length > 0 &&
		!outputLines[outputLines.length - 1]?.includes("+")
	) {
		outputLines.pop();
	}

	return outputLines.join("\n");
}

export function resolveLogoBounds(input: {
	terminalWidth: number;
	terminalHeight: number;
	reservedHeight?: number;
	maxHeightRatio?: number;
	horizontalMargin?: number;
}): { maxWidth: number; maxHeight: number } {
	const horizontalMargin = input.horizontalMargin ?? 2;
	const reservedHeight = input.reservedHeight ?? 16;
	const maxHeightRatio = input.maxHeightRatio ?? 0.45;

	const maxWidth = Math.max(24, input.terminalWidth - horizontalMargin);
	const maxHeight = Math.max(
		8,
		Math.min(
			Math.floor(input.terminalHeight * maxHeightRatio),
			input.terminalHeight - reservedHeight,
		),
	);

	return { maxWidth, maxHeight };
}
