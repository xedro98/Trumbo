import { Loader } from "@cloudflare/kumo";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminCategoriesPage } from "@/components/admin/AdminCategoriesPage";
import { AdminLoginPage } from "@/components/admin/AdminLoginPage";
import { AdminPostEditorPage } from "@/components/admin/AdminPostEditorPage";
import { AdminPostsPage } from "@/components/admin/AdminPostsPage";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminLogout, adminMe } from "@/lib/blog-api";

export function AdminPage() {
	const [location] = useLocation();
	const [session, setSession] = useState<{ authed: boolean; email: string | null } | null>(null);

	useEffect(() => {
		void adminMe().then(setSession);
	}, [location]);

	if (session === null) {
		return (
			<div className="flex h-dvh items-center justify-center bg-kumo-canvas">
				<div className="flex items-center gap-3 text-sm text-kumo-subtle">
					<Loader className="size-4" />
					Checking session...
				</div>
			</div>
		);
	}

	if (!session.authed) {
		return <AdminLoginPage onLogin={() => void adminMe().then(setSession)} />;
	}

	const content = (() => {
		if (location === "/admin/posts/new") return <AdminPostEditorPage />;
		const match = location.match(/^\/admin\/posts\/(\d+)$/);
		if (match) return <AdminPostEditorPage postId={Number(match[1])} />;
		if (location === "/admin/categories") return <AdminCategoriesPage />;
		return <AdminPostsPage />;
	})();

	return (
		<AdminShell
			email={session.email}
			onLogout={() => void adminLogout().then(() => setSession({ authed: false, email: null }))}
		>
			{content}
		</AdminShell>
	);
}
