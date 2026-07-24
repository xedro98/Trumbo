/**
 * Streaming model file downloader with progress events.
 *
 * Downloads model files (e.g. from Hugging Face) to a local path, emitting
 * progress updates so the TUI can show a progress bar. Handles redirects
 * (via `fetch`), streaming to disk, and abort signals for cancellation.
 *
 * Mirrors the streaming pattern from `projects/vscode/scripts/download-ripgrep.mjs`
 * but uses the modern `fetch` + `ReadableStream` API for cross-runtime
 * compatibility (Node and Bun).
 */

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface DownloadProgress {
	/** Bytes downloaded so far. */
	downloadedBytes: number;
	/** Total bytes from the Content-Length header, when available. */
	totalBytes?: number;
	/** Percentage complete (0–100), when totalBytes is known. */
	percent?: number;
	/** Download speed in bytes/second, computed from the elapsed time. */
	bytesPerSecond?: number;
}

export interface DownloadOptions {
	/** Called with progress updates during the download. */
	onProgress?: (progress: DownloadProgress) => void;
	/** Abort signal for cancelling the download. */
	signal?: AbortSignal;
}

/**
 * Download a file from `url` to `destPath`, streaming to disk and emitting
 * progress updates. Creates parent directories as needed.
 *
 * @throws if the HTTP response is not ok, the body is missing, or the stream
 *   fails.
 */
export async function downloadModelFile(
	url: string,
	destPath: string,
	options: DownloadOptions = {},
): Promise<void> {
	const { onProgress, signal } = options;

	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(
			`Download failed: ${response.status} ${response.statusText} for ${url}`,
		);
	}
	if (!response.body) {
		throw new Error("Download failed: response has no body");
	}

	const totalBytes =
		Number(response.headers.get("content-length")) || undefined;
	await mkdir(dirname(destPath), { recursive: true });
	const fileStream = createWriteStream(destPath);

	let downloadedBytes = 0;
	const startTime = Date.now();
	const reader = response.body.getReader();

	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			fileStream.write(value);
			downloadedBytes += value.byteLength;
			const elapsedMs = Date.now() - startTime;
			onProgress?.({
				downloadedBytes,
				totalBytes,
				percent: totalBytes
					? Math.min(100, (downloadedBytes / totalBytes) * 100)
					: undefined,
				bytesPerSecond:
					elapsedMs > 0 ? (downloadedBytes / elapsedMs) * 1000 : undefined,
			});
		}
	} finally {
		fileStream.end();
		await new Promise<void>((resolve, reject) => {
			fileStream.on("finish", resolve);
			fileStream.on("error", reject);
		});
	}
}

/**
 * Format a byte count as a human-readable string (e.g. "1.5 GB").
 */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
