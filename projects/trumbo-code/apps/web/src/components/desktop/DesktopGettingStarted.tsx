import { useMemo, type ReactNode } from "react";
import { useAtomValue } from "@effect/atom-react";
import { FolderPlusIcon, LogInIcon, SquarePenIcon, WrenchIcon } from "lucide-react";

import { APP_DISPLAY_NAME } from "~/branding";
import { useOpenAddProjectCommandPalette } from "../../commandPaletteContext";
import { openSettingsModal } from "~/settingsModalBus";
import { useHandleNewThread } from "../../hooks/useHandleNewThread";
import { isNativeTrumboDesktop } from "../../lib/nativeTrumboDesktop";
import { cn } from "../../lib/utils";
import {
  applyProviderInstanceSettings,
  deriveProviderInstanceEntries,
  isProviderInstanceConfiguredForSetup,
} from "../../providerInstances";
import { useProjects, useThreadShells } from "../../state/entities";
import { primaryServerProvidersAtom, primaryServerSettingsAtom } from "../../state/server";
import { useTrumboModelAccess } from "../trumbo-auth/useTrumboModelAccess";
import { isTrumboSignedIn } from "../trumbo-auth/useTrumboAuthState";
import { Button } from "../ui/button";
import { ReadyToBuildHero } from "./ReadyToBuildHero";
import {
  buildDesktopSetupSteps,
  countRequiredIncompleteDesktopSetupSteps,
  findActiveDesktopSetupStep,
  isDesktopSetupComplete,
  type DesktopSetupStep,
} from "./DesktopGettingStarted.logic";

function StepActionButton({
  step,
  onProject,
  onProvider,
  onSignIn,
  onNewThread,
}: {
  readonly step: DesktopSetupStep;
  readonly onProject: () => void;
  readonly onProvider: ReactNode;
  readonly onSignIn: () => void;
  readonly onNewThread: () => void;
}) {
  const baseClass =
    "h-9 w-full gap-2 rounded-md px-3 text-sm font-medium tracking-tight sm:w-auto sm:min-w-44";

  switch (step.id) {
    case "project":
      return (
        <Button type="button" size="sm" className={baseClass} onClick={onProject}>
          <FolderPlusIcon className="size-3.5 opacity-70" />
          Add a project
        </Button>
      );
    case "provider":
      return onProvider;
    case "trumbo-auth":
      return (
        <Button type="button" size="sm" className={baseClass} onClick={onSignIn}>
          <LogInIcon className="size-3.5 opacity-70" />
          Sign in to Trumbo
        </Button>
      );
    case "thread":
      return (
        <Button type="button" size="sm" className={baseClass} onClick={onNewThread}>
          <SquarePenIcon className="size-3.5 opacity-70" />
          New thread
        </Button>
      );
    default:
      return null;
  }
}

export function DesktopGettingStarted(props: { readonly className?: string }) {
  const projects = useProjects();
  const threads = useThreadShells();
  const providers = useAtomValue(primaryServerProvidersAtom);
  const settings = useAtomValue(primaryServerSettingsAtom);
  const openAddProject = useOpenAddProjectCommandPalette();
  const { defaultProjectRef, handleNewThread: startNewThread } = useHandleNewThread();
  const { authState, openAuthPrompt, authPrompt } = useTrumboModelAccess();
  const isNativeDesktop = isNativeTrumboDesktop();

  const hasConfiguredProvider = useMemo(() => {
    const entries = applyProviderInstanceSettings(
      deriveProviderInstanceEntries(providers),
      settings,
    );
    return entries.some(isProviderInstanceConfiguredForSetup);
  }, [providers, settings]);

  const steps = useMemo(
    () =>
      buildDesktopSetupSteps({
        hasProject: projects.length > 0,
        hasConfiguredProvider,
        showProviderStep: !isNativeDesktop,
        showTrumboSignIn: isNativeDesktop,
        isTrumboSignedIn: isTrumboSignedIn(authState),
        hasThread: threads.length > 0,
      }),
    [authState?.status, hasConfiguredProvider, isNativeDesktop, projects.length, threads.length],
  );

  const setupComplete = isDesktopSetupComplete(steps);
  const remainingRequiredSteps = countRequiredIncompleteDesktopSetupSteps(steps);
  const activeStep = findActiveDesktopSetupStep(steps);

  const handleNewThreadClick = () => {
    if (!defaultProjectRef) return;
    void startNewThread(defaultProjectRef);
  };

  const providerAction = (
    <Button
      size="sm"
      variant="outline"
      className="h-9 w-full gap-2 rounded-md px-3 text-sm font-medium tracking-tight sm:w-auto sm:min-w-44"
      onClick={() => openSettingsModal("providers")}
    >
      <WrenchIcon className="size-3.5 opacity-70" />
      Open providers
    </Button>
  );

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col items-center justify-center text-center",
        props.className,
      )}
    >
      <ReadyToBuildHero className="-mt-2 mb-2" />

      <h1
        className={cn(
          "text-lg font-medium tracking-tight text-foreground",
          setupComplete ? "mt-2" : "mt-4",
        )}
      >
        {setupComplete ? "Ready to build" : `Welcome to ${APP_DISPLAY_NAME}`}
      </h1>
      <p className="mt-2 max-w-sm text-sm font-medium tracking-tight text-muted-foreground">
        {setupComplete
          ? "Open a thread from the tab bar, or start a fresh one below."
          : remainingRequiredSteps === 1
            ? "One step left before your first thread is ready."
            : `${remainingRequiredSteps} steps to get your workspace ready.`}
      </p>

      {setupComplete ? (
        <div className="mt-8 flex w-full max-w-xs flex-col items-center gap-2">
          {defaultProjectRef ? (
            <Button
              type="button"
              size="sm"
              className="h-9 w-full gap-2 rounded-md px-4 text-sm font-medium tracking-tight"
              onClick={handleNewThreadClick}
            >
              <SquarePenIcon className="size-3.5 opacity-70" />
              New thread
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-9 w-full gap-2 rounded-md px-4 text-sm font-medium tracking-tight"
              onClick={openAddProject}
            >
              <FolderPlusIcon className="size-3.5 opacity-70" />
              Add a project
            </Button>
          )}
        </div>
      ) : activeStep ? (
        <div className="mt-8 flex w-full max-w-xs flex-col items-center">
          <StepActionButton
            step={activeStep}
            onProject={openAddProject}
            onProvider={providerAction}
            onSignIn={() => void openAuthPrompt()}
            onNewThread={handleNewThreadClick}
          />
        </div>
      ) : null}

      {authPrompt}
    </div>
  );
}
