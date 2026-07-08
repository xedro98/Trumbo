import { Check, Copy } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyCommandProps {
	value: string;
	displayValue?: string;
	className?: string;
}

export function CopyCommand({ value, displayValue, className }: CopyCommandProps) {
	const [copied, setCopied] = useState(false);

	async function onCopy() {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}

	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3 border border-grid-line bg-muted/15 px-4 py-3",
				className,
			)}
		>
			<code
				className="min-w-0 flex-1 truncate font-stat text-sm text-foreground"
				title={value}
			>
				{displayValue ?? value}
			</code>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="shrink-0 gap-1.5"
				onClick={() => void onCopy()}
				aria-label={copied ? "Copied" : "Copy command"}
			>
				{copied ? <Check size={14} /> : <Copy size={14} />}
				{copied ? "Copied" : "Copy"}
			</Button>
		</div>
	);
}
