import { Breadcrumbs, Sidebar } from "@cloudflare/kumo";
import {
	Article,
	ArrowSquareOut,
	FolderSimple,
	House,
	SignOut,
	TreeStructure,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

export function AdminShell({
	children,
	email,
	onLogout,
}: {
	children: ReactNode;
	email?: string | null;
	onLogout?: () => void;
}) {
	const [location] = useLocation();

	const isPosts = location.startsWith("/admin/posts") || location === "/admin" || location === "/admin/";
	const isCategories = location.startsWith("/admin/categories");
	const isEditor = location === "/admin/posts/new" || /^\/admin\/posts\/\d+$/.test(location);

	return (
		<div className="flex h-dvh overflow-hidden bg-kumo-canvas">
			<Sidebar.Provider defaultOpen>
				<Sidebar>
					<Sidebar.Header className="px-3 pt-4 pb-0">
						<Link
							href="/"
							className="flex items-center gap-2 px-2 mb-3 text-kumo-subtle hover:text-kumo-strong transition-colors"
						>
							<TreeStructure size={20} className="text-kumo-brand" />
							<span className="font-semibold text-sm">Trumbo</span>
						</Link>
					</Sidebar.Header>

					<Sidebar.Content>
						<Sidebar.Group>
							<Sidebar.GroupLabel>Admin</Sidebar.GroupLabel>
							<Sidebar.Menu>
								<Link href="/admin/posts" className="no-underline">
									<Sidebar.MenuButton icon={Article} active={isPosts}>
										Posts
									</Sidebar.MenuButton>
								</Link>
								<Link href="/admin/categories" className="no-underline">
									<Sidebar.MenuButton icon={FolderSimple} active={isCategories}>
										Categories
									</Sidebar.MenuButton>
								</Link>
							</Sidebar.Menu>
						</Sidebar.Group>

						<Sidebar.Group>
							<Sidebar.GroupLabel>Site</Sidebar.GroupLabel>
							<Sidebar.Menu>
								<Sidebar.MenuButton
									icon={ArrowSquareOut}
									onClick={() => window.open("/blog", "_blank")}
								>
									View blog
								</Sidebar.MenuButton>
								<Sidebar.MenuButton icon={House} onClick={() => {
									window.location.href = "/";
								}}>
									Homepage
								</Sidebar.MenuButton>
							</Sidebar.Menu>
						</Sidebar.Group>
					</Sidebar.Content>

					{email ? (
						<Sidebar.Footer className="px-3 pb-3">
							<div className="border-t border-kumo-hairline pt-3">
								<p className="px-2 text-xs text-kumo-inactive truncate mb-2">{email}</p>
								<button
									type="button"
									onClick={onLogout}
									className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-kumo-subtle hover:text-kumo-strong hover:bg-kumo-fill-hover transition-colors"
								>
									<SignOut size={16} />
									Sign out
								</button>
							</div>
						</Sidebar.Footer>
					) : null}
				</Sidebar>

				<main className="flex-1 flex flex-col overflow-auto">
					<div className="sticky top-0 z-10 bg-kumo-canvas border-b border-kumo-hairline px-6 py-3">
						<Breadcrumbs size="sm">
							<Breadcrumbs.Link href="/" icon={<House size={14} />}>
								Home
							</Breadcrumbs.Link>
							<Breadcrumbs.Separator />
							<Breadcrumbs.Link href="/admin">Admin</Breadcrumbs.Link>
							{isPosts && !isEditor ? (
								<>
									<Breadcrumbs.Separator />
									<Breadcrumbs.Current>Posts</Breadcrumbs.Current>
								</>
							) : null}
							{isEditor ? (
								<>
									<Breadcrumbs.Separator />
									<Breadcrumbs.Link href="/admin/posts">Posts</Breadcrumbs.Link>
									<Breadcrumbs.Separator />
									<Breadcrumbs.Current>Editor</Breadcrumbs.Current>
								</>
							) : null}
							{isCategories ? (
								<>
									<Breadcrumbs.Separator />
									<Breadcrumbs.Current>Categories</Breadcrumbs.Current>
								</>
							) : null}
						</Breadcrumbs>
					</div>
					<div className="flex-1 overflow-auto">
						{children}
					</div>
				</main>
			</Sidebar.Provider>
		</div>
	);
}
