import {
  scopedProjectKey,
  scopedThreadKey,
  scopeProjectRef,
  scopeThreadRef,
} from "@trumbo-code/client-runtime/environment";
import {
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderPlusIcon,
  PanelLeftCloseIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { openCommandPalette } from "~/commandPaletteBus";
import { useNewThreadHandler } from "~/hooks/useHandleNewThread";
import { useProjectPicker } from "~/hooks/useProjectPicker";
import { useClientSettings } from "~/hooks/useSettings";
import { useThreadShells } from "~/state/entities";
import { cn } from "~/lib/utils";
import { sortThreads } from "~/lib/threadSort";
import { formatRelativeTimeLabel } from "~/timestampFormat";
import { formatProjectPickerPath, mostRecentThreadForProjectGroup } from "~/projectPicker.logic";
import { resolveThreadRouteRef } from "~/threadRoutes";
import { buildThreadRouteParams } from "~/threadRoutes";
import type { SidebarProjectSnapshot } from "~/sidebarProjectGrouping";
import type { SidebarThreadSummary } from "~/types";
import { ProjectFavicon } from "~/components/ProjectFavicon";
import { ThreadRowTrailingStatus } from "~/components/ThreadStatusIndicators";
import { resolveThreadStatusPill } from "~/components/Sidebar.logic";
import { Dotm3x3_19 } from "~/components/ui/dotm-3x3-19";
import { Button } from "~/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "~/components/ui/menu";
import type { ContextMenuItem } from "@trumbo-code/contracts";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@trumbo-code/client-runtime/state/runtime";
import { readLocalApi } from "~/localApi";
import { useAtomCommand } from "~/state/use-atom-command";
import { threadEnvironment } from "~/state/threads";
import { useCopyToClipboard } from "~/hooks/useCopyToClipboard";
import { stackedThreadToast, toastManager } from "~/components/ui/toast";

function representativeProjectMember(project: SidebarProjectSnapshot) {
  return project.memberProjects[0] ?? project;
}

const SIDEBAR_WIDTH_STORAGE_KEY = "trumbo-code:project-sidebar-width:v2";
const SIDEBAR_COLLAPSED_KEY = "trumbo-code:sidebar-collapsed:v1";
const DEFAULT_SIDEBAR_WIDTH = 280;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 460;

// --- Timeline bucketing ----------------------------------------------------

type TimelineBucket = "today" | "week" | "month" | "older";

const TIMELINE_BUCKET_LABELS: Record<TimelineBucket, string> = {
  today: "Today",
  week: "Last 7 days",
  month: "Last month",
  older: "Older",
};

const TIMELINE_BUCKET_ORDER: readonly TimelineBucket[] = ["today", "week", "month", "older"];

function resolveThreadTimestamp(thread: SidebarThreadSummary): number {
  const latest = thread.latestUserMessageAt ? Date.parse(thread.latestUserMessageAt) : Number.NaN;
  if (Number.isFinite(latest)) return latest;
  const updated = Date.parse(thread.updatedAt);
  if (Number.isFinite(updated)) return updated;
  const created = Date.parse(thread.createdAt);
  return Number.isFinite(created) ? created : 0;
}

function resolveTimelineBucket(timestamp: number, now: number): TimelineBucket {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  if (timestamp >= todayStart) return "today";
  if (timestamp >= sevenDaysAgo) return "week";
  if (timestamp >= monthAgo) return "month";
  return "older";
}

function isThreadRunning(thread: SidebarThreadSummary): boolean {
  return (
    (thread.session?.status === "running" || thread.session?.status === "starting") &&
    thread.session.activeTurnId != null
  );
}

// --- Width persistence -----------------------------------------------------

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

const PINNED_THREADS_KEY = "trumbo-code:pinned-threads:v1";

function readPinnedThreads(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(PINNED_THREADS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function persistPinnedThreads(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PINNED_THREADS_KEY, JSON.stringify([...keys]));
  } catch {
    // ignore
  }
}

function persistWidth(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(value));
  } catch {
    // ignore
  }
}

// --- Project selector dropdown --------------------------------------------

function ProjectSelectorDropdown({
  projectGroups,
  activeProject,
  threadCountByProjectKey,
  selectedProjectKey,
  onOpenProject,
  onSelectProject,
  onCreateThread,
  onAddProject,
}: {
  readonly projectGroups: readonly SidebarProjectSnapshot[];
  readonly activeProject: SidebarProjectSnapshot | null;
  readonly threadCountByProjectKey: ReadonlyMap<string, number>;
  readonly selectedProjectKey: string | null;
  readonly onOpenProject: (project: SidebarProjectSnapshot) => void;
  readonly onSelectProject: (projectKey: string | null) => void;
  readonly onCreateThread: (project: SidebarProjectSnapshot) => void;
  readonly onAddProject: () => void;
}) {
  const selectedProject = selectedProjectKey
    ? (projectGroups.find((p) => p.projectKey === selectedProjectKey) ?? null)
    : null;
  const displayProject = selectedProject ?? activeProject;
  const displayThreadCount = displayProject
    ? (threadCountByProjectKey.get(displayProject.projectKey) ?? 0)
    : 0;
  const triggerMember = displayProject ? representativeProjectMember(displayProject) : null;
  const isAllSelected = selectedProjectKey === null;

  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label="Switch project"
            data-testid="sidebar-project-selector-trigger"
            className={cn(
              "input-surface flex h-9 w-full items-center gap-2 rounded-sm px-2.5 text-left text-sm transition-colors",
              "hover:[border-color:var(--input-surface-border-focus)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          />
        }
      >
        {triggerMember ? (
          <ProjectFavicon
            environmentId={triggerMember.environmentId}
            cwd={triggerMember.workspaceRoot}
            className="size-4 shrink-0"
          />
        ) : (
          <FolderIcon className="size-4 shrink-0 text-muted-foreground/60" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/90">
          {displayProject?.displayName ??
            (projectGroups.length === 0 ? "No projects" : "All projects")}
        </span>
        {displayThreadCount > 0 ? (
          <span className="shrink-0 rounded-sm bg-border/50 px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {displayThreadCount}
          </span>
        ) : null}
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground/40" />
      </MenuTrigger>
      <MenuPopup
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-72 max-w-[min(18rem,calc(100vw-2rem))]"
      >
        {projectGroups.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <FolderIcon className="mx-auto size-6 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No projects yet</p>
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="mt-3 h-7 w-full gap-1.5 text-xs"
              onClick={onAddProject}
            >
              <FolderPlusIcon className="size-3.5" />
              Add project
            </Button>
          </div>
        ) : (
          <>
            {/* All projects filter */}
            <MenuItem
              onClick={() => onSelectProject(null)}
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-2",
                isAllSelected && "bg-brand/8",
              )}
              data-active={isAllSelected ? "true" : undefined}
            >
              <FolderIcon className="size-4 shrink-0 text-muted-foreground/50" />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  isAllSelected ? "font-medium text-foreground" : "text-foreground/80",
                )}
              >
                All projects
              </span>
              {isAllSelected ? <CheckIcon className="size-4 shrink-0 text-brand" /> : null}
            </MenuItem>

            <MenuSeparator className="mx-0 my-1" />

            {/* Project list */}
            {projectGroups.map((project) => {
              const member = representativeProjectMember(project);
              const isSelected = project.projectKey === selectedProjectKey;
              const threadCount = threadCountByProjectKey.get(project.projectKey) ?? 0;
              return (
                <MenuItem
                  key={project.projectKey}
                  onClick={() => {
                    onOpenProject(project);
                    onSelectProject(project.projectKey);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-2",
                    isSelected && "bg-brand/8",
                  )}
                  data-testid={`sidebar-project-selector-item-${project.projectKey}`}
                  data-active={isSelected ? "true" : undefined}
                >
                  <ProjectFavicon
                    environmentId={member.environmentId}
                    cwd={member.workspaceRoot}
                    className="size-4 shrink-0"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
                    <span
                      className={cn(
                        "truncate text-sm",
                        isSelected ? "font-medium text-foreground" : "text-foreground/80",
                      )}
                    >
                      {project.displayName}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground/45">
                      {formatProjectPickerPath(member.workspaceRoot, 32)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {threadCount > 0 ? (
                      <span className="text-[11px] tabular-nums text-muted-foreground/55">
                        {threadCount}
                      </span>
                    ) : null}
                    {isSelected ? <CheckIcon className="size-4 shrink-0 text-brand" /> : null}
                  </span>
                </MenuItem>
              );
            })}

            <MenuSeparator className="mx-0 my-1" />

            {/* Bottom actions */}
            {activeProject ? (
              <MenuItem
                onClick={() => onCreateThread(activeProject)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground/70"
              >
                <PlusIcon className="size-3.5 shrink-0" />
                <span>New thread</span>
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={onAddProject}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground/70"
            >
              <FolderPlusIcon className="size-3.5 shrink-0" />
              <span>Add project</span>
            </MenuItem>
          </>
        )}
      </MenuPopup>
    </Menu>
  );
}

function ThreadCard({
  thread,
  isCurrent,
  isKeyboardFocused,
  isPinned,
  owningProject,
  onNavigate,
  onTogglePin,
  onContextMenu,
}: {
  readonly thread: SidebarThreadSummary;
  readonly isCurrent: boolean;
  readonly isKeyboardFocused: boolean;
  readonly isPinned: boolean;
  readonly owningProject: SidebarProjectSnapshot | null;
  readonly onNavigate: (thread: SidebarThreadSummary) => void;
  readonly onTogglePin: () => void;
  readonly onContextMenu: (event: ReactMouseEvent) => void;
}) {
  const threadKey = scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id));
  const running = isThreadRunning(thread);
  const timestamp = formatRelativeTimeLabel(
    thread.latestUserMessageAt ?? thread.updatedAt ?? thread.createdAt,
  );
  const status = resolveThreadStatusPill({ thread });
  const branch = thread.branch;

  return (
    <button
      type="button"
      onClick={() => onNavigate(thread)}
      onContextMenu={onContextMenu}
      data-testid={`project-sidebar-thread-${threadKey}`}
      data-active={isCurrent ? "true" : undefined}
      className={cn(
        "relative w-full rounded-sm px-2.5 py-1.5 text-left transition-colors",
        "hover:bg-border/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        isCurrent && "bg-brand/12 hover:bg-brand/15",
        isKeyboardFocused && !isCurrent && "bg-muted/30 ring-1 ring-ring/30",
      )}
    >
      {/* Active accent bar — left edge, brand green */}
      {isCurrent ? (
        <span
          className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand"
          aria-hidden="true"
        />
      ) : null}
      {/* Mini progress bar for running threads */}
      {running ? (
        <span
          className="absolute bottom-0 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-muted/40"
          aria-hidden="true"
        >
          <span className="block h-full w-1/3 animate-pulse rounded-full bg-sky-500 dark:bg-sky-400" />
        </span>
      ) : null}

      {/* Flex row: [16px icon col] [content] */}
      <div className="flex items-start gap-2">
        {/* Fixed-width icon column — 16px, vertically centered to line 1 */}
        <span className="flex h-5 w-4 shrink-0 items-center justify-start">
          {running ? (
            <span
              className="inline-flex items-center text-sky-600 dark:text-sky-300/80"
              aria-label={status?.label ?? "Working"}
            >
              <Dotm3x3_19
                size={16}
                dotSize={2}
                cellPadding={1}
                speed={1.3}
                ariaLabel={status?.label ?? "Working"}
              />
            </span>
          ) : status ? (
            <span
              className={cn("size-1.5 shrink-0 rounded-full", status.dotClass)}
              aria-label={status.label}
            />
          ) : (
            /* Completed / idle — green dot */
            <span
              className="size-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400/80"
              aria-label="Completed"
            />
          )}
        </span>

        {/* Content column — both lines start at the same x */}
        <div className="min-w-0 flex-1">
          {/* Line 1: title + time */}
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm leading-5",
                isCurrent ? "font-semibold text-foreground" : "font-medium text-foreground/80",
              )}
              title={thread.title}
            >
              {thread.title}
            </span>
            {timestamp ? (
              <span className="shrink-0 text-xs leading-4 tabular-nums text-muted-foreground/50">
                {timestamp}
              </span>
            ) : null}
          </div>

          {/* Line 2: project · branch · trailing status */}
          <div className="mt-0.5 flex items-center gap-1.5 text-xs leading-4 text-muted-foreground/50">
            {owningProject ? (
              <span className="min-w-0 truncate">{owningProject.displayName}</span>
            ) : null}
            {owningProject && branch ? (
              <span className="shrink-0 text-muted-foreground/30">·</span>
            ) : null}
            {branch ? <span className="min-w-0 truncate">{branch}</span> : null}
            <span className="ml-auto flex shrink-0 items-center gap-1">
              {isPinned ? (
                <button
                  type="button"
                  aria-label="Unpin thread"
                  className="text-muted-foreground/40 hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                  }}
                >
                  <PinIcon className="size-3 fill-current" />
                </button>
              ) : null}
              <ThreadRowTrailingStatus thread={thread} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// --- Sidebar ---------------------------------------------------------------

export function ProjectSidebar({ className }: { readonly className?: string }) {
  const navigate = useNavigate();
  const handleNewThread = useNewThreadHandler();
  const { projectGroups, activeProject, threadCountByProjectKey, threads } = useProjectPicker();
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

  // --- Active thread ref ------------------------------------------------
  const routeThreadRef = useParams({
    strict: false,
    select: (params) => resolveThreadRouteRef(params),
  });
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

  // --- Threads + timeline bucketing ------------------------------------
  const visibleThreads = useMemo(
    () =>
      sortThreads(
        allThreads.filter((t) => t.archivedAt === null),
        threadSortOrder,
      ),
    [allThreads, threadSortOrder],
  );

  const projectKeyByThreadProjectKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectGroups) {
      for (const ref of project.memberProjectRefs) {
        map.set(scopedProjectKey(ref), project.projectKey);
      }
    }
    return map;
  }, [projectGroups]);

  const projectByKey = useMemo(
    () => new Map(projectGroups.map((p) => [p.projectKey, p] as const)),
    [projectGroups],
  );

  // --- Search filter -----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedThreads, setPinnedThreads] = useState<Set<string>>(() => readPinnedThreads());
  const trimmedQuery = searchQuery.trim().toLowerCase();

  // --- Selected project filter ------------------------------------------
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);

  const filteredThreads = useMemo(() => {
    let result = visibleThreads;
    // Filter by selected project in the dropdown.
    if (selectedProjectKey !== null) {
      const selectedProject = projectByKey.get(selectedProjectKey);
      if (selectedProject) {
        const memberRefs = new Set(
          selectedProject.memberProjectRefs.map((ref) => scopedProjectKey(ref)),
        );
        result = result.filter((thread) =>
          memberRefs.has(scopedProjectKey(scopeProjectRef(thread.environmentId, thread.projectId))),
        );
      }
    }
    // Filter by search query.
    if (trimmedQuery.length === 0) return result;
    return result.filter((thread) => {
      if (thread.title.toLowerCase().includes(trimmedQuery)) return true;
      if (thread.branch?.toLowerCase().includes(trimmedQuery)) return true;
      const owningProjectKey = projectKeyByThreadProjectKey.get(
        scopedProjectKey(scopeProjectRef(thread.environmentId, thread.projectId)),
      );
      const owningProject = owningProjectKey ? (projectByKey.get(owningProjectKey) ?? null) : null;
      return owningProject?.displayName.toLowerCase().includes(trimmedQuery) ?? false;
    });
  }, [
    projectByKey,
    projectKeyByThreadProjectKey,
    selectedProjectKey,
    trimmedQuery,
    visibleThreads,
  ]);

  const filteredBucketedThreads = useMemo(() => {
    const now = Date.now();
    const pinnedArr = pinnedThreads;
    const buckets: Record<TimelineBucket, SidebarThreadSummary[]> = {
      today: [],
      week: [],
      month: [],
      older: [],
    };
    for (const thread of filteredThreads) {
      const ts = resolveThreadTimestamp(thread);
      const bucket = resolveTimelineBucket(ts, now);
      buckets[bucket].push(thread);
      // Pinned threads sort first within each bucket
      buckets[bucket].sort((a, b) => {
        const aKey = scopedThreadKey(scopeThreadRef(a.environmentId, a.id));
        const bKey = scopedThreadKey(scopeThreadRef(b.environmentId, b.id));
        const aPinned = pinnedArr.has(aKey) ? 0 : 1;
        const bPinned = pinnedArr.has(bKey) ? 0 : 1;
        if (aPinned !== bPinned) return aPinned - bPinned;
        return 0; // preserve original order for non-pinned
      });
    }
    return buckets;
  }, [filteredThreads]);

  const navigateToThread = useCallback(
    (thread: SidebarThreadSummary) => {
      void navigate({
        to: "/$environmentId/$threadId",
        params: buildThreadRouteParams(scopeThreadRef(thread.environmentId, thread.id)),
      });
    },
    [navigate],
  );

  const togglePinThread = useCallback((threadKey: string) => {
    setPinnedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(threadKey)) next.delete(threadKey);
      else next.add(threadKey);
      persistPinnedThreads(next);
      return next;
    });
  }, []);

  // --- Thread context menu (right-click) -------------------------------
  const archiveThread = useAtomCommand(threadEnvironment.archive, { reportFailure: false });
  const interruptThreadTurn = useAtomCommand(threadEnvironment.interruptTurn, {
    reportFailure: false,
  });
  const appSettingsConfirmThreadArchive = useClientSettings<boolean>(
    (settings) => settings.confirmThreadArchive,
  );
  const { copyToClipboard: copyThreadIdToClipboard } = useCopyToClipboard<{ threadId: string }>({
    onCopy: (ctx) => {
      toastManager.add({ type: "success", title: "Thread ID copied", description: ctx.threadId });
    },
    onError: (error) => {
      toastManager.add(
        stackedThreadToast({
          type: "error",
          title: "Failed to copy thread ID",
          description: error instanceof Error ? error.message : "An error occurred.",
        }),
      );
    },
  });
  const { copyToClipboard: copyPathToClipboard } = useCopyToClipboard<{ path: string }>({
    onCopy: (ctx) => {
      toastManager.add({ type: "success", title: "Path copied", description: ctx.path });
    },
    onError: (error) => {
      toastManager.add(
        stackedThreadToast({
          type: "error",
          title: "Failed to copy path",
          description: error instanceof Error ? error.message : "An error occurred.",
        }),
      );
    },
  });

  const handleThreadContextMenu = useCallback(
    async (
      thread: SidebarThreadSummary,
      owningProject: SidebarProjectSnapshot | null,
      isPinned: boolean,
      event: ReactMouseEvent,
    ) => {
      event.preventDefault();
      const api = readLocalApi();
      if (!api) return;
      const threadRef = scopeThreadRef(thread.environmentId, thread.id);
      const threadKey = scopedThreadKey(threadRef);
      const workspacePath = owningProject?.workspaceRoot ?? null;

      const isRunning = isThreadRunning(thread);
      const items: ContextMenuItem<string>[] = [
        { id: "toggle-pin", label: isPinned ? "Unpin thread" : "Pin thread" },
        { id: "archive", label: "Archive" },
        ...(isRunning ? [{ id: "force-stop", label: "Force stop" }] : []),
        { id: "copy-path", label: "Copy Path" },
        { id: "copy-thread-id", label: "Copy Thread ID" },
      ];

      const clicked = await api.contextMenu.show(items, {
        x: event.clientX,
        y: event.clientY,
      });

      if (clicked === "toggle-pin") {
        togglePinThread(threadKey);
        return;
      }
      if (clicked === "archive") {
        if (appSettingsConfirmThreadArchive) {
          const confirmed = await api.dialogs.confirm(`Archive thread "${thread.title}"?`);
          if (!confirmed) return;
        }
        const result = await archiveThread({
          environmentId: thread.environmentId,
          input: { threadId: thread.id },
        });
        if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
          const error = squashAtomCommandFailure(result);
          toastManager.add(
            stackedThreadToast({
              type: "error",
              title: "Failed to archive thread",
              description: error instanceof Error ? error.message : "An error occurred.",
            }),
          );
        }
        return;
      }
      if (clicked === "copy-path") {
        if (!workspacePath) {
          toastManager.add(
            stackedThreadToast({
              type: "error",
              title: "Path unavailable",
              description: "This thread does not have a workspace path to copy.",
            }),
          );
          return;
        }
        copyPathToClipboard(workspacePath, { path: workspacePath });
        return;
      }
      if (clicked === "copy-thread-id") {
        copyThreadIdToClipboard(thread.id, { threadId: thread.id });
        return;
      }
      if (clicked === "force-stop") {
        const runningTurnId =
          thread.session?.status === "running" ? thread.session.activeTurnId : null;
        const result = await interruptThreadTurn({
          environmentId: thread.environmentId,
          input: {
            threadId: thread.id,
            ...(runningTurnId !== null ? { turnId: runningTurnId } : {}),
          },
        });
        if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
          const error = squashAtomCommandFailure(result);
          toastManager.add(
            stackedThreadToast({
              type: "error",
              title: "Failed to stop thread",
              description: error instanceof Error ? error.message : "An error occurred.",
            }),
          );
        }
        return;
      }
    },
    [
      appSettingsConfirmThreadArchive,
      archiveThread,
      copyPathToClipboard,
      copyThreadIdToClipboard,
      interruptThreadTurn,
      togglePinThread,
    ],
  );

  // --- Keyboard navigation (ArrowUp/ArrowDown to move through threads) ---
  const [keyboardIndex, setKeyboardIndex] = useState<number | null>(null);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      // Only handle when the sidebar container is focused or no input is focused.
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;

      // Build the flat list of visible thread keys in render order.
      const flatKeys: string[] = [];
      for (const bucket of TIMELINE_BUCKET_ORDER) {
        for (const thread of filteredBucketedThreads[bucket]) {
          flatKeys.push(scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id)));
        }
      }
      if (flatKeys.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setKeyboardIndex((prev) => {
          if (prev === null) return 0;
          return Math.min(prev + 1, flatKeys.length - 1);
        });
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setKeyboardIndex((prev) => {
          if (prev === null) return flatKeys.length - 1;
          return Math.max(prev - 1, 0);
        });
        return;
      }
      if (event.key === "Enter") {
        if (keyboardIndex === null) return;
        const key = flatKeys[keyboardIndex];
        if (!key) return;
        const thread = filteredThreads.find(
          (t) => scopedThreadKey(scopeThreadRef(t.environmentId, t.id)) === key,
        );
        if (thread) {
          event.preventDefault();
          navigateToThread(thread);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredBucketedThreads, filteredThreads, keyboardIndex, navigateToThread]);

  return (
    <aside
      data-slot="project-sidebar"
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r border-border bg-background",
        className,
      )}
      style={{ width }}
      aria-label="Conversations and projects"
    >
      {/* Top section: project selector dropdown + search input. Sticky so it stays visible while scrolling. */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-border p-2">
        <ProjectSelectorDropdown
          projectGroups={projectGroups}
          activeProject={activeProject}
          threadCountByProjectKey={threadCountByProjectKey}
          selectedProjectKey={selectedProjectKey}
          onOpenProject={(project) => void openProject(project)}
          onSelectProject={setSelectedProjectKey}
          onCreateThread={(project) => void createThreadInProject(project)}
          onAddProject={openAddProject}
        />
        <div className="input-surface flex h-9 w-full items-center gap-2 rounded-sm px-2.5 transition-colors focus-within:[border-color:var(--input-surface-border-focus)] focus-within:[background-color:var(--input-surface-bg-focus)]">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground/60" />
          <input
            type="search"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search conversations"
            data-testid="sidebar-search-input"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
        </div>
      </div>

      {/* Scrollable timeline + projects */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col py-1.5">
          {visibleThreads.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Start a new thread from a project below.
              </p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">No results for “{searchQuery}”</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs text-brand hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            TIMELINE_BUCKET_ORDER.map((bucket) => {
              const bucketThreads = filteredBucketedThreads[bucket];
              if (bucketThreads.length === 0) return null;

              return (
                <div key={bucket} className="flex flex-col">
                  {/* Bucket header */}
                  <div className="flex items-center justify-between px-2.5 pb-0.5 pt-2">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/55 uppercase">
                      {TIMELINE_BUCKET_LABELS[bucket]}
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground/35">
                      {bucketThreads.length}
                    </span>
                  </div>

                  {/* Thread cards — all shown, no truncation */}
                  <div className="flex flex-col">
                    {bucketThreads.map((thread) => {
                      const threadKey = scopedThreadKey(
                        scopeThreadRef(thread.environmentId, thread.id),
                      );
                      const isCurrent = threadKey === routeThreadKey;
                      const owningProjectKey =
                        projectKeyByThreadProjectKey.get(
                          scopedProjectKey(scopeProjectRef(thread.environmentId, thread.projectId)),
                        ) ?? null;
                      const owningProject = owningProjectKey
                        ? (projectByKey.get(owningProjectKey) ?? null)
                        : null;

                      return (
                        <ThreadCard
                          key={threadKey}
                          thread={thread}
                          isCurrent={isCurrent}
                          isPinned={pinnedThreads.has(threadKey)}
                          onTogglePin={() => togglePinThread(threadKey)}
                          onContextMenu={(event) =>
                            void handleThreadContextMenu(
                              thread,
                              owningProject,
                              pinnedThreads.has(threadKey),
                              event,
                            )
                          }
                          isKeyboardFocused={(() => {
                            let fi = 0;
                            for (const b of TIMELINE_BUCKET_ORDER) {
                              for (const t of filteredBucketedThreads[b]) {
                                if (
                                  scopedThreadKey(scopeThreadRef(t.environmentId, t.id)) ===
                                  threadKey
                                )
                                  return fi === keyboardIndex;
                                fi++;
                              }
                            }
                            return false;
                          })()}
                          owningProject={owningProject}
                          onNavigate={navigateToThread}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="h-8 flex-1 gap-1.5 text-sm"
            onClick={() =>
              activeProject ? void createThreadInProject(activeProject) : openNewThreadIn()
            }
          >
            <PlusIcon className="size-4" />
            New thread
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            aria-label="Add project"
            title="Add project"
            className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
            onClick={openAddProject}
          >
            <FolderPlusIcon className="size-4" />
          </Button>
          <button
            type="button"
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Cmd+B)"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
            onClick={() => {
              try {
                window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "1");
              } catch {}
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "b", metaKey: true, ctrlKey: true }),
              );
            }}
          >
            <PanelLeftCloseIcon className="size-4" />
          </button>
        </div>
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
