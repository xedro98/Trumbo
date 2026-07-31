import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PanelLeftIcon } from "lucide-react";

import { APP_DISPLAY_NAME } from "../branding";
import { isElectron } from "../env";
import { cn, isMacPlatform } from "../lib/utils";
import { TrumboWordmark } from "./TrumboWordmark";
import { AppChromeActions } from "./desktop/AppChromeActions";
import { ProjectSidebar } from "./desktop/ProjectSidebar";
import { ProjectPickerMenu } from "./desktop/ProjectPickerMenu";
import { ThreadTabBar } from "./desktop/ThreadTabBar";
import { SidebarProviderUpdatePill } from "./sidebar/SidebarProviderUpdatePill";
import { SidebarUpdatePill } from "./sidebar/SidebarUpdatePill";
import { openSettingsModal } from "../settingsModalBus";

const MACOS_TRAFFIC_LIGHTS_LEFT_INSET = "90px";
const SIDEBAR_COLLAPSED_KEY = "trumbo-code:sidebar-collapsed:v1";

function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistSidebarCollapsed(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
}

function AppBrand() {
  return (
    <Link
      aria-label="Go to threads"
      className={cn(
        "ml-[var(--workspace-titlebar-content-left)] flex h-7 w-fit min-w-0 shrink-0 items-center gap-2 overflow-hidden rounded-md outline-hidden ring-ring focus-visible:ring-2 [-webkit-app-region:no-drag]",
        "text-foreground",
      )}
      to="/"
    >
      <TrumboWordmark className="size-4" />
      <span className="truncate text-sm font-medium tracking-tight text-muted-foreground">
        {APP_DISPLAY_NAME}
      </span>
    </Link>
  );
}

/** @deprecated Prefer AppTabsLayout; kept as the historical export name for call sites. */
export function AppSidebarLayout({ children }: { children: ReactNode }) {
  return <AppTabsLayout>{children}</AppTabsLayout>;
}

export function AppTabsLayout({ children }: { children: ReactNode }) {
  const isMacosDesktop = isElectron && isMacPlatform(navigator.platform);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [isWindowFullscreen, setIsWindowFullscreen] = useState(() => {
    const getWindowFullscreenState = window.desktopBridge?.getWindowFullscreenState;
    return isMacosDesktop && typeof getWindowFullscreenState === "function"
      ? getWindowFullscreenState()
      : false;
  });
  const chromeStyle =
    isMacosDesktop && !isWindowFullscreen
      ? ({ "--workspace-controls-left": MACOS_TRAFFIC_LIGHTS_LEFT_INSET } as CSSProperties)
      : undefined;

  useEffect(() => {
    if (!isMacosDesktop) return;
    const bridge = window.desktopBridge;
    if (!bridge) return;
    const { getWindowFullscreenState, onWindowFullscreenStateChange } = bridge;
    if (
      typeof getWindowFullscreenState !== "function" ||
      typeof onWindowFullscreenStateChange !== "function"
    ) {
      return;
    }

    const unsubscribe = onWindowFullscreenStateChange(setIsWindowFullscreen);
    setIsWindowFullscreen(getWindowFullscreenState());
    return unsubscribe;
  }, [isMacosDesktop]);

  useEffect(() => {
    const onMenuAction = window.desktopBridge?.onMenuAction;
    if (typeof onMenuAction !== "function") {
      return;
    }

    const unsubscribe = onMenuAction((action) => {
      if (action === "open-settings") {
        openSettingsModal();
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Cmd/Ctrl+B toggles sidebar visibility.
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const isMod = isMacPlatform(navigator.platform) ? event.metaKey : event.ctrlKey;
      if (isMod && event.key === "b") {
        event.preventDefault();
        setSidebarCollapsed((prev) => {
          const next = !prev;
          persistSidebarCollapsed(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="flex h-dvh! min-h-0 w-full flex-col overflow-hidden bg-background text-foreground"
      style={chromeStyle}
      data-app-tabs-layout=""
    >
      <header
        className={cn(
          "workspace-topbar shrink-0 gap-2 border-b border-border px-2",
          isElectron && "drag-region",
        )}
        data-app-chrome=""
      >
        <div className="flex min-w-0 shrink-0 items-center gap-2 [-webkit-app-region:no-drag]">
          <AppBrand />
          <ProjectPickerMenu className="md:hidden" />
          <SidebarProviderUpdatePill />
          <SidebarUpdatePill />
        </div>
        <ThreadTabBar />
        <AppChromeActions />
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {sidebarCollapsed ? null : <ProjectSidebar className="hidden md:flex" />}
        {sidebarCollapsed ? (
          <button
            type="button"
            aria-label="Show sidebar (Cmd+B)"
            title="Show sidebar (Cmd+B)"
            className="flex h-full w-9 shrink-0 items-center justify-center border-r border-border text-muted-foreground/50 transition-colors hover:bg-border/40 hover:text-foreground [-webkit-app-region:no-drag]"
            onClick={() => {
              setSidebarCollapsed(false);
              persistSidebarCollapsed(false);
            }}
          >
            <PanelLeftIcon className="size-4" />
          </button>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
