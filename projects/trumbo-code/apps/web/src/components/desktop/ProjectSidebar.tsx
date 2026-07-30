import {
	scopedProjectKey,
	scopedThreadKey,
	scopeProjectRef,
	scopeThreadRef,
} from "@trumbo-code/client-runtime/environment";
import { CheckIcon, FolderPlusIcon, PlusIcon, SquarePenIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { openCommandPalette } from "~/commandPaletteBus";
import { useNewThreadHandler } from "~/hooks/useHandleNewThread";
import { useProjectPicker } from "~/hooks/useProjectPicker";
import { useClientSettings } from "~/hooks/useSettings";
import { useThreadShells } from "~/state/entities";
import { cn } from "~/lib/utils";
import { sortThreads } from "~/lib/threadSort";
import { formatRelativeTimeLabel } from "~/timestampFormat";
import { mostRecentThreadForProjectGroup } from "~/projectPicker.logic";
import { resolveThreadRouteRef } from "~/threadRoutes";
import { buildThreadRouteParams } from "~/threadRoutes";
import type { SidebarProjectSnapshot } from "~/sidebarProjectGrouping";
import type { SidebarThreadSummary } from "~/types";
import { ProjectFavicon } from "~/components/ProjectFavicon";
import { ThreadRowLeadingStatus, ThreadRowTrailingStatus } from "~/components/ThreadStatusIndicators";
import { Button } from "~/components/ui/button";

function representativeProjectMember(project: SidebarProjectSnapshot) {
	return project.memberProjects[0] ?? project;
}

const SIDEBAR_WIDTH_STORAGE_KEY = "trumbo-code:project-sidebar-width:v2";
const DEFAULT_SIDEBAR_WIDTH = 280;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 480;

function readStoredWidth(): number {
	if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
	try {
		const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
		const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
		if (Number.isFinite(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
			return parsed;
		}
	} catch {
		// localStorage may be unavailable.
	}
	return DEFAULT_SIDEBAR_WIDTH;
}

function persistWidth(value: number): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(value));
	} catch {
		// ignore
	}
}

/**
 * ProjectSidebar — a clean, persistent left rail. Projects are non-collapsible
 * section headers; their threads are always listed underneath. Every row is
 * the same height and font size. Width is drag-adjustable and persisted.
 */
export function ProjectSidebar({ className }: { readonly className?: string }) {
	const navigate = useNavigate();
	const handleNewThread = useNewThreadHandler();
	const { projectGroups, activeProject, activeProjectKey, threadCountByProjectKey, threads } =
		useProjectPicker();
	const allThreads = useThreadShells();
	const threadSortOrder = useClientSettings((settings) => settings.sidebarThreadSortOrder);

	// --- Resizable width --------------------------------------------------
	const [width, setWidth] = useState<number>(readStoredWidth);
	const draggingRef = useRef(false);

	useEffect(() => {
		const onMouseMove = (event: MouseEvent) => {
			if (!draggingRef.current) return;
			const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, event.clientX));
			setWidth(next);
		};
		const onMouseUp = () => {
			if (!draggingRef.current) return;
			draggingRef.current = false;
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			persistWidth(width);
		};
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [width]);

	const startResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		draggingRef.current = true;
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}, []);

	// --- Active thread ref (for highlighting) -----------------------------
	const routeThreadRef = useParams({ strict: false, select: (params) => resolveThreadRouteRef(params) });
	const routeThreadKey = routeThreadRef ? scopedThreadKey(routeThreadRef) : null;

	const openProject = useCallback(
		async (project: SidebarProjectSnapshot) => {
			const representative = representativeProjectMember(project);
			const projectRef = scopeProjectRef(representative.environmentId, representative.id);
			const recent = mostRecentThreadForProjectGroup(project, threads);
			if (recent) {
				void navigate({
					to: "/$environmentId/$threadId",
					params: buildThreadRouteParams(scopeThreadRef(recent.environmentId, recent.id)),
				});
				return;
			}
			await handleNewThread(projectRef);
		},
		[handleNewThread, navigate, threads],
	);

	const createThreadInProject = useCallback(
		async (project: SidebarProjectSnapshot) => {
			const representative = representativeProjectMember(project);
			await handleNewThread(scopeProjectRef(representative.environmentId, representative.id));
		},
		[handleNewThread],
	);

	const openAddProject = useCallback(() => openCommandPalette({ open: "add-project" }), []);
	const openNewThreadIn = useCallback(() => openCommandPalette({ open: "new-thread-in" }), []);

	const sortedGroups = useMemo(
		() =>
			[...projectGroups].sort((a, b) => {
				if (a.projectKey === activeProjectKey) return -1;
				if (b.projectKey === activeProjectKey) return 1;
				return a.displayName.localeCompare(b.displayName);
			}),
		[projectGroups, activeProjectKey],
	);

	// Threads per project group.
	const threadsByProjectKey = useMemo(() => {
		const memberRefsByKey = new Map<string, ReadonlySet<string>>();
		for (const project of projectGroups) {
			memberRefsByKey.set(
				project.projectKey,
				new Set(project.memberProjectRefs.map((ref) => scopedProjectKey(ref))),
			);
		}
		const next = new Map<string, SidebarThreadSummary[]>();
		for (const thread of allThreads) {
			const threadProjectKey = scopedProjectKey(
				scopeProjectRef(thread.environmentId, thread.projectId),
			);
			for (const [projectKey, refs] of memberRefsByKey) {
				if (refs.has(threadProjectKey)) {
					const list = next.get(projectKey);
					if (list) list.push(thread);
					else next.set(projectKey, [thread]);
					break;
				}
			}
		}
		for (const [key, list] of next) {
			next.set(key, sortThreads(list, threadSortOrder));
		}
		return next;
	}, [allThreads, projectGroups, threadSortOrder]);

	const navigateToThread = useCallback(
		(thread: SidebarThreadSummary) => {
			void navigate({
				to: "/$environmentId/$threadId",
				params: buildThreadRouteParams(scopeThreadRef(thread.environmentId, thread.id)),
			});
		},
		[navigate],
	);

	return (
		<aside
			data-slot="project-sidebar"
			className={cn(
				"relative flex h-full shrink-0 flex-col border-r border-border bg-background",
				className,
			)}
			style={{ width }}
			aria-label="Projects and threads"
		>
			{/* Header */}
			<div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					Projects
				</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						aria-label="New thread in project"
						title="New thread in…"
						onClick={openNewThreadIn}
						className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
					>
						<PlusIcon className="size-4" />
					</button>
				</div>
			</div>

			{/* List — plain scroll, no clipping */}
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="flex flex-col p-1.5">
					{sortedGroups.length === 0 ? (
						<div className="px-2 py-8 text-center">
							<p className="text-sm text-muted-foreground">No projects yet</p>
							<p className="mt-1 text-xs text-muted-foreground/60">Add one to get started.</p>
						</div>
					) : (
						sortedGroups.map((project) => {
							const member = representativeProjectMember(project);
							const isActive = project.projectKey === activeProjectKey;
							const threadCount = threadCountByProjectKey.get(project.projectKey) ?? 0;
							const projectThreads = threadsByProjectKey.get(project.projectKey) ?? [];
							return (
								<div key={project.projectKey} className="mb-2 flex flex-col">
									{/* Project header row — non-collapsible, click to open */}
									<button
										type="button"
										onClick={() => void openProject(project)}
										data-testid={`project-sidebar-item-${project.projectKey}`}
										data-active={isActive ? "true" : undefined}
										className={cn(
											"flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors",
											"hover:bg-border/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
											isActive && "bg-brand/10 hover:bg-brand/12",
										)}
									>
										<ProjectFavicon
											environmentId={member.environmentId}
											cwd={member.workspaceRoot}
											className="size-4 shrink-0"
										/>
										<span
											className={cn(
												"min-w-0 flex-1 truncate font-medium leading-none",
												isActive ? "text-foreground" : "text-foreground/90",
											)}
										>
											{project.displayName}
										</span>
										{threadCount > 0 ? (
											<span className="shrink-0 rounded-full bg-border/60 px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
												{threadCount}
											</span>
										) : null}
										{isActive ? <CheckIcon className="size-4 shrink-0 text-brand" /> : null}
									</button>

									{/* Threads — always shown, no collapse */}
									{projectThreads.length > 0 ? (
										<div className="flex flex-col">
											{projectThreads.map((thread) => {
												const threadKey = scopedThreadKey(
													scopeThreadRef(thread.environmentId, thread.id),
												);
												const isCurrent = threadKey === routeThreadKey;
												const timestamp = formatRelativeTimeLabel(
													thread.latestUserMessageAt ?? thread.updatedAt ?? thread.createdAt,
												);
												return (
													<button
														type="button"
														key={threadKey}
														onClick={() => navigateToThread(thread)}
														data-testid={`project-sidebar-thread-${threadKey}`}
														data-active={isCurrent ? "true" : undefined}
														title={thread.title}
														className={cn(
															"flex h-8 w-full items-center gap-2 rounded-md px-2 pl-10 text-left text-sm transition-colors",
															"hover:bg-border/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
															isCurrent && "bg-brand/10 hover:bg-brand/12",
														)}
													>
														<ThreadRowLeadingStatus thread={thread} />
														<span
															className={cn(
																"min-w-0 flex-1 truncate leading-none",
																isCurrent
																	? "font-medium text-foreground"
																	: "font-normal text-foreground/75",
															)}
														>
															{thread.title}
														</span>
														{timestamp ? (
															<span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/50">
																{timestamp}
															</span>
														) : null}
														<ThreadRowTrailingStatus thread={thread} />
													</button>
												);
											})}
										</div>
									) : null}
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Active project quick action */}
			{activeProject ? (
				<div className="shrink-0 border-t border-border px-2 py-2">
					<Button
						type="button"
						size="xs"
						variant="outline"
						className="h-8 w-full gap-1.5 text-sm"
						onClick={() => void createThreadInProject(activeProject)}
					>
						<SquarePenIcon className="size-4" />
						New thread here
					</Button>
				</div>
			) : null}

			{/* Footer */}
			<div className="shrink-0 border-t border-border p-2">
				<Button
					type="button"
					size="xs"
					variant="ghost"
					className="h-8 w-full gap-1.5 justify-start text-sm text-muted-foreground hover:text-foreground"
					onClick={openAddProject}
				>
					<FolderPlusIcon className="size-4" />
					Add project
				</Button>
			</div>

			{/* Drag-to-resize handle */}
			<div
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize project sidebar"
				onMouseDown={startResize}
				onDoubleClick={() => {
					setWidth(DEFAULT_SIDEBAR_WIDTH);
					persistWidth(DEFAULT_SIDEBAR_WIDTH);
				}}
				className="absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize touch-none select-none transition-colors hover:bg-brand/40"
				style={{ marginRight: -1 }}
			/>
		</aside>
	);
}
