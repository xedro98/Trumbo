// Download progress dialog for the TUI.
//
// Shows a progress bar (rendered as filled blocks) with downloaded/total bytes
// and speed, updating in real time as a model file downloads. Compose with the
// dialog lifecycle (withShownDialog) so the dialog stays open for the download
// lifetime and closes when the download completes or fails.

import type { DownloadProgress } from "@trumbodev/llms";
import { formatBytes } from "@trumbodev/llms";
import { useState } from "react";

interface DownloadProgressDialogProps {
	/** The file name being downloaded (shown in the header). */
	fileName: string;
	/** Progress updates; pass the latest DownloadProgress from the downloader. */
	progress: DownloadProgress | null;
	/** Error message if the download failed, null otherwise. */
	error?: string | null;
}

const BAR_WIDTH = 40;

/**
 * Render a text-based progress bar: `[████████░░░░░░░░] 45%`.
 */
function renderBar(percent: number | undefined): string {
	if (percent === undefined) {
		return `[${"░".repeat(BAR_WIDTH)}] (size unknown)`;
	}
	const filled = Math.round((percent / 100) * BAR_WIDTH);
	return `[${"█".repeat(filled)}${"░".repeat(BAR_WIDTH - filled)}] ${percent.toFixed(0)}%`;
}

export function DownloadProgressDialog(
	props: DownloadProgressDialogProps,
): React.ReactNode {
	const { fileName, progress, error } = props;

	if (error) {
		return (
			<box flexDirection="column" paddingX={1} paddingY={1}>
				<text fg="red" bold>
					Download failed
				</text>
				<text fg="gray">{fileName}</text>
				<text fg="red">{error}</text>
			</box>
		);
	}

	const downloaded = progress?.downloadedBytes ?? 0;
	const total = progress?.totalBytes;
	const speed = progress?.bytesPerSecond;

	return (
		<box flexDirection="column" paddingX={1} paddingY={1}>
			<text bold>Downloading {fileName}</text>
			<text fg="gray">{renderBar(progress?.percent)}</text>
			<text fg="gray">
				{formatBytes(downloaded)}
				{total !== undefined ? ` / ${formatBytes(total)}` : ""}
				{speed !== undefined ? ` (${formatBytes(speed)}/s)` : ""}
			</text>
		</box>
	);
}

/**
 * Hook that tracks download progress state for the dialog. Call
 * `setProgress` from the downloader's `onProgress` callback.
 */
export function useDownloadProgress(): {
	progress: DownloadProgress | null;
	error: string | null;
	setProgress: (p: DownloadProgress) => void;
	setError: (e: string | null) => void;
	reset: () => void;
} {
	const [progress, setProgress] = useState<DownloadProgress | null>(null);
	const [error, setError] = useState<string | null>(null);
	return {
		progress,
		error,
		setProgress,
		setError,
		reset: () => {
			setProgress(null);
			setError(null);
		},
	};
}
