import { Loader } from "@cloudflare/kumo";
import { Image, TrashSimple, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { adminUploadImage } from "@/lib/blog-api";
import { cn } from "@/lib/utils";

export function AdminCoverImageUploader({
	value,
	onChange,
	className,
}: {
	value: string | null;
	onChange: (url: string | null) => void;
	className?: string;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const [dragging, setDragging] = useState(false);

	async function handleFile(file: File) {
		setUploading(true);
		setError("");
		try {
			const url = await adminUploadImage(file);
			onChange(url);
		} catch (uploadError) {
			setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	}

	function handleDrop(event: React.DragEvent) {
		event.preventDefault();
		setDragging(false);
		const file = event.dataTransfer.files?.[0];
		if (file) void handleFile(file);
	}

	if (value) {
		return (
			<div
				className={cn(
					"group relative overflow-hidden rounded-xl border border-kumo-hairline",
					className,
				)}
			>
				<img src={value} alt="Cover" className="h-52 w-full object-cover md:h-64" />
				<div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
				<div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 backdrop-blur hover:bg-white"
					>
						<UploadSimple size={14} />
						Replace
					</button>
					<button
						type="button"
						onClick={() => onChange(null)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-red-600 backdrop-blur hover:bg-white"
					>
						<TrashSimple size={14} />
						Remove
					</button>
				</div>
				<input
					ref={inputRef}
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) void handleFile(file);
						e.target.value = "";
					}}
					className="hidden"
				/>
			</div>
		);
	}

	return (
		<div className={className}>
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={handleDrop}
				disabled={uploading}
				className={cn(
					"flex h-52 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-kumo-hairline bg-kumo-elevated/50 text-center transition-colors md:h-64",
					dragging
						? "border-kumo-brand bg-kumo-brand/5"
						: "hover:border-kumo-brand/40 hover:bg-kumo-fill-hover/30",
					uploading && "opacity-60 cursor-not-allowed",
				)}
			>
				{uploading ? (
					<>
						<Loader className="size-5" />
						<span className="text-sm text-kumo-subtle">Uploading...</span>
					</>
				) : (
					<>
						<Image size={32} className="text-kumo-inactive" />
						<div>
							<p className="text-sm font-medium text-kumo-strong">Upload cover image</p>
							<p className="mt-1.5 text-xs text-kumo-subtle leading-relaxed">
								Drag and drop or click to browse.
								<br />
								PNG, JPG, WebP up to 8MB.
							</p>
						</div>
					</>
				)}
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) void handleFile(file);
					e.target.value = "";
				}}
				className="hidden"
			/>
			{error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
		</div>
	);
}
