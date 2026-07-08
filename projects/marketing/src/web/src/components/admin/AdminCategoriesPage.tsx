import { Button, Loader } from "@cloudflare/kumo";
import { Plus, Trash } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
	adminCreateCategory,
	adminDeleteCategory,
	adminFetchCategories,
	type BlogCategory,
} from "@/lib/blog-api";

export function AdminCategoriesPage() {
	const [categories, setCategories] = useState<BlogCategory[]>([]);
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);
	const [deleting, setDeleting] = useState(false);

	function reload() {
		setLoading(true);
		adminFetchCategories()
			.then(setCategories)
			.catch(() => setError("Failed to load categories"))
			.finally(() => setLoading(false));
	}

	useEffect(reload, []);

	async function handleCreate(event: React.FormEvent) {
		event.preventDefault();
		if (!name.trim()) return;
		setSaving(true);
		setError("");
		try {
			await adminCreateCategory(name.trim());
			setName("");
			reload();
		} catch (createError) {
			setError(createError instanceof Error ? createError.message : "Failed to add category");
		} finally {
			setSaving(false);
		}
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await adminDeleteCategory(deleteTarget.id);
			setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
			setDeleteTarget(null);
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : "Failed to delete category");
		} finally {
			setDeleting(false);
		}
	}

	return (
		<div className="p-6 md:p-8 lg:p-10 space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-kumo-strong">Categories</h1>
				<p className="mt-1 text-sm text-kumo-subtle max-w-lg">
					Group posts by topic. Categories appear on cards and post headers.
				</p>
			</div>

			<form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 sm:items-end">
				<div className="flex-1">
					<label className="block mb-1.5 text-xs font-medium text-kumo-inactive uppercase tracking-wider">
						New category
					</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Engineering, Product, Design..."
						className="w-full h-10 rounded-lg border border-kumo-hairline bg-kumo-canvas px-3 text-sm text-kumo-strong placeholder:text-kumo-inactive focus:outline-none focus:ring-2 focus:ring-kumo-brand/20 focus:border-kumo-brand/40"
						required
					/>
					<p className="mt-1 text-xs text-kumo-inactive">Slug is generated automatically from the name.</p>
				</div>
				<Button type="submit" variant="primary" loading={saving} icon={<Plus size={16} />}>
					Add category
				</Button>
			</form>

			{error ? (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			) : null}

			{loading ? (
				<div className="flex items-center gap-3 py-16 text-sm text-kumo-subtle">
					<Loader className="size-4" />
					Loading categories...
				</div>
			) : categories.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-kumo-hairline py-16 text-center">
					<p className="text-sm font-medium text-kumo-strong">No categories yet</p>
					<p className="mt-1 text-sm text-kumo-subtle max-w-sm">
						Add a category to organize posts on the blog index and homepage cards.
					</p>
				</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{categories.map((category) => (
						<div
							key={category.id}
							className="group flex items-start justify-between gap-3 rounded-xl border border-kumo-hairline bg-kumo-elevated hover:bg-kumo-fill-hover/30 transition-colors p-5"
						>
							<div className="min-w-0">
								<p className="font-semibold text-kumo-strong">{category.name}</p>
								<p className="mt-1 text-xs text-kumo-inactive font-mono">{category.slug}</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								shape="square"
								onClick={() => setDeleteTarget(category)}
								aria-label={`Delete ${category.name}`}
								className="opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<Trash size={16} />
							</Button>
						</div>
					))}
				</div>
			)}

			{deleteTarget ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<button
						type="button"
						className="absolute inset-0 bg-black/20 backdrop-blur-sm"
						onClick={() => setDeleteTarget(null)}
						aria-label="Close"
					/>
					<div className="relative w-full max-w-md rounded-xl border border-kumo-hairline bg-kumo-canvas p-6 shadow-xl">
						<h2 className="font-semibold text-kumo-strong">Delete category?</h2>
						<p className="mt-2 text-sm text-kumo-subtle">
							"{deleteTarget.name}" will be removed. Posts keep their content but lose this
							category link.
						</p>
						<div className="mt-6 flex gap-3 justify-end">
							<Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								size="sm"
								loading={deleting}
								onClick={confirmDelete}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
