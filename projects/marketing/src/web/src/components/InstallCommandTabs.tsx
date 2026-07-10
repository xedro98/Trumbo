import { Tabs } from "@cloudflare/kumo";
import { useState } from "react";
import { CopyCommand } from "@/components/CopyCommand";
import { cn } from "@/lib/utils";

const INSTALL_SH_URL =
	"https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.sh";
const INSTALL_PS1_URL =
	"https://raw.githubusercontent.com/xedro98/Trumbo/main/projects/console/script/install.ps1";

type InstallTab = {
	id: string;
	label: string;
	command: string;
	displayCommand?: string;
};

const INSTALL_TABS: InstallTab[] = [
	{ id: "npm", label: "npm", command: "npm install -g @trumbodev/cli" },
	{ id: "pnpm", label: "pnpm", command: "pnpm add -g @trumbodev/cli" },
	{ id: "bun", label: "bun", command: "bun add -g @trumbodev/cli" },
	{
		id: "curl",
		label: "curl",
		command: `curl -fsSL ${INSTALL_SH_URL} | sh`,
		displayCommand: "curl -fsSL github.com/xedro98/Trumbo/.../install.sh | sh",
	},
	{
		id: "powershell",
		label: "PowerShell",
		command: `irm ${INSTALL_PS1_URL} | iex`,
		displayCommand: "irm github.com/xedro98/Trumbo/.../install.ps1 | iex",
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
	const active =
		INSTALL_TABS.find((item) => item.id === tab) ?? INSTALL_TABS[0];

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
			<div role="tabpanel" className="border border-grid-line bg-muted/15">
				<CopyCommand
					value={active.command}
					displayValue={active.displayCommand}
					className="border-0 bg-transparent"
				/>
			</div>
		</div>
	);
}
