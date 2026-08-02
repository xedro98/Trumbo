import { Tabs } from "@cloudflare/kumo";
import { type ReactNode, useState } from "react";
import { CopyCommand } from "@/components/CopyCommand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DESKTOP_DOWNLOAD_URL, VSCODE_MARKETPLACE_URL } from "@/lib/links";

const INSTALL_SH_URL =
	"https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.sh";
const INSTALL_PS1_URL =
	"https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.ps1";

const VS_CODE_ICON = (
	<img
		src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/visual-studio-code-icon.png"
		alt=""
		aria-hidden="true"
		loading="eager"
		className="h-[1em] w-[1em] shrink-0 object-contain"
	/>
);

type InstallTab =
	| {
			kind: "command";
			id: string;
			label: ReactNode;
			command: string;
			displayCommand?: string;
	  }
	| {
			kind: "link";
			id: string;
			label: ReactNode;
			href: string;
			buttonLabel: string;
			note?: string;
	  };

const INSTALL_TABS: InstallTab[] = [
	{ kind: "command", id: "npm", label: "npm", command: "npm install -g @trumbodev/cli" },
	{ kind: "command", id: "pnpm", label: "pnpm", command: "pnpm add -g @trumbodev/cli" },
	{ kind: "command", id: "bun", label: "bun", command: "bun add -g @trumbodev/cli" },
	{
		kind: "command",
		id: "curl",
		label: "curl",
		command: `curl -fsSL ${INSTALL_SH_URL} | sh`,
		displayCommand: "curl -fsSL github.com/xedro98/Trumbo/.../install.sh | sh",
	},
	{
		kind: "command",
		id: "powershell",
		label: "PowerShell",
		command: `irm ${INSTALL_PS1_URL} | iex`,
		displayCommand: "irm github.com/xedro98/Trumbo/.../install.ps1 | iex",
	},
	{
		kind: "link",
		id: "desktop",
		label: "Desktop",
		href: DESKTOP_DOWNLOAD_URL,
		buttonLabel: "Download Desktop App",
		note: "Detects your platform and downloads the latest installer for macOS, Windows, or Linux.",
	},
	{
		kind: "link",
		id: "vscode",
		label: (
			<>
				{VS_CODE_ICON}
				<span className="ml-1">VS Code</span>
			</>
		),
		href: VSCODE_MARKETPLACE_URL,
		buttonLabel: "Install VS Code Extension",
		note: "Also works in Cursor, Windsurf, and other VS Code-compatible editors.",
	},
];

// Auto-detect the visitor's OS and pick the install method that needs no
// prerequisites: PowerShell on Windows, curl on macOS/Linux. These download
// the self-contained binary directly (no Node, no npm allow-scripts gating).
// Falls back to npm when detection isn't possible.
function detectDefaultInstallTab(): string {
	if (typeof navigator === "undefined") return "npm";
	const ua = navigator.userAgent || navigator.platform || "";
	if (/win/i.test(ua)) return "powershell";
	if (/mac|linux|freebsd|x11/i.test(ua)) return "curl";
	return "npm";
}

type DesktopPlatform = "mac" | "win" | "linux";

function detectDesktopPlatform(): DesktopPlatform | null {
	if (typeof navigator === "undefined") return null;
	const ua = navigator.userAgent || navigator.platform || "";
	if (/win/i.test(ua)) return "win";
	if (/mac/i.test(ua)) return "mac";
	if (/linux|freebsd|x11/i.test(ua)) return "linux";
	return null;
}

/** Detect the visitor's platform and resolve the matching latest-release asset
 * URL (arm64 .dmg on macOS, x64 .exe on Windows, .AppImage on Linux). Returns
 * null if the platform is unknown or the release/assets can't be fetched, so
 * the caller can fall back to the releases page. */
async function resolveDesktopDownloadUrl(): Promise<string | null> {
	const platform = detectDesktopPlatform();
	if (!platform) return null;
	const res = await fetch(
		"https://api.github.com/repos/xedro98/Trumbo/releases/latest",
	);
	if (!res.ok) return null;
	const data: {
		assets?: { name: string; browser_download_url: string }[];
	} = await res.json();
	const assets = data.assets ?? [];
	const pick = (suffix: string) =>
		assets.find((a) => a.name.endsWith(suffix))?.browser_download_url ?? null;
	if (platform === "win") return pick("-x64.exe");
	if (platform === "mac") return pick("-arm64.dmg") ?? pick(".dmg");
	return pick(".AppImage");
}

interface InstallCommandTabsProps {
	className?: string;
	defaultTabId?: string;
}

export function InstallCommandTabs({
	className,
	defaultTabId,
}: InstallCommandTabsProps) {
	const [tab, setTab] = useState(
		() => defaultTabId ?? detectDefaultInstallTab(),
	);
	const [busy, setBusy] = useState(false);
	const active = INSTALL_TABS.find((item) => item.id === tab) ?? INSTALL_TABS[0];

	async function handleLinkClick() {
		if (active.kind !== "link") return;
		// Desktop: auto-detect platform and download the latest matching asset.
		if (active.id === "desktop") {
			setBusy(true);
			try {
				const url = await resolveDesktopDownloadUrl();
				window.open(url ?? active.href, "_blank", "noopener,noreferrer");
			} catch {
				window.open(active.href, "_blank", "noopener,noreferrer");
			} finally {
				setBusy(false);
			}
			return;
		}
		window.open(active.href, "_blank", "noopener,noreferrer");
	}

	return (
		<div className={cn("max-w-[44rem]", className)}>
			<Tabs
				variant="segmented"
				tabs={INSTALL_TABS.map((item) => ({
					value: item.id,
					label: item.label,
					className: "min-w-0 flex-1 justify-center",
				}))}
				value={tab}
				onValueChange={setTab}
				className="mb-3 w-full"
				listClassName="w-full"
				aria-label="Install method"
			/>
			{active.kind === "command" ? (
				<div role="tabpanel" className="border border-grid-line bg-muted/15">
					<CopyCommand
						value={active.command}
						displayValue={active.displayCommand}
						className="border-0 bg-transparent"
					/>
				</div>
			) : (
				<div
					role="tabpanel"
					className="flex flex-col items-stretch gap-2 border border-grid-line bg-muted/15 p-3"
				>
					<Button
						className="w-full"
						loading={busy}
						onClick={handleLinkClick}
					>
						{active.buttonLabel}
					</Button>
					{active.note ? (
						<p className="text-xs text-muted-foreground">{active.note}</p>
					) : null}
				</div>
			)}
		</div>
	);
}
