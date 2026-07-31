import {
  ProviderDriverKind,
  type ProviderInstanceId,
  type ResolvedKeybindingsConfig,
} from "@trumbo-code/contracts";
import { resolveSelectableModel } from "@trumbo-code/shared/model";
import { memo, useCallback, useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";
import type { VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDownIcon, LockIcon, SearchIcon, StarIcon } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { Kbd } from "../ui/kbd";
import { cn } from "~/lib/utils";
import { isNativeTrumboDesktop } from "../../lib/nativeTrumboDesktop";
import { useTrumboModelAccess } from "../trumbo-auth/useTrumboModelAccess";
import { useTrumboAuthState } from "../trumbo-auth/useTrumboAuthState";
import { ProviderInstanceIcon } from "./ProviderInstanceIcon";
import { ModelLabLogo } from "./ModelLabLogo";
import {
  type ModelEsque,
  getDisplayModelName,
  getTriggerDisplayModelName,
  getTriggerDisplayModelLabel,
} from "./providerIconUtils";
import { buildModelPickerSearchText, scoreModelPickerSearch } from "./modelPickerSearch";
import { isModelPickerNewModel } from "./modelPickerModelHighlights";
import {
  isProviderInstancePickerReady,
  isProviderInstancePickerVisible,
  type ProviderInstanceEntry,
} from "../../providerInstances";
import { providerModelKey, sortProviderModelItems } from "../../modelOrdering";
import {
  modelPickerJumpCommandForIndex,
  modelPickerJumpIndexFromCommand,
  resolveShortcutCommand,
  shortcutLabelForCommand,
} from "../../keybindings";
import { useClientSettings, useUpdateClientSettings } from "~/hooks/useSettings";
import { fetchPlatformModelCatalog } from "../../lib/platformModelCatalog";

// ─── shared types ──────────────────────────────────────────────────────────

interface PickerModel {
  slug: string;
  name: string;
  shortName?: string;
  subProvider?: string;
  description?: string;
  locked?: boolean;
  disabledReason?: string | null;
}

interface FlatRow {
  key: string;
  slug: string;
  instanceId: ProviderInstanceId;
  driverKind: ProviderDriverKind;
  instanceDisplayName: string;
  instanceAccentColor?: string;
  model: PickerModel;
  isFavorite: boolean;
  searchText: string;
}

const PAGE_SIZE = 8;
const RECENT_MODELS_KEY = "trumbo-code:recent-models:v1";
const MAX_RECENT_MODELS = 5;

interface RecentModelEntry {
  readonly key: string;
  readonly instanceId: string;
  readonly slug: string;
  readonly name: string;
}

function readRecentModels(): RecentModelEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_MODELS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECENT_MODELS);
  } catch {
    return [];
  }
}

function addRecentModel(entry: RecentModelEntry): void {
  if (typeof window === "undefined") return;
  try {
    const current = readRecentModels().filter((e) => e.key !== entry.key);
    current.unshift(entry);
    window.localStorage.setItem(
      RECENT_MODELS_KEY,
      JSON.stringify(current.slice(0, MAX_RECENT_MODELS)),
    );
  } catch {
    // ignore
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

function splitKey(key: string): { instanceId: ProviderInstanceId; slug: string } {
  const i = key.indexOf(":");
  return i === -1
    ? { instanceId: key as ProviderInstanceId, slug: "" }
    : { instanceId: key.slice(0, i) as ProviderInstanceId, slug: key.slice(i + 1) };
}

function filterModels<T extends PickerModel>(list: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...list];
  return list.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.slug.toLowerCase().includes(q) ||
      (m.description?.toLowerCase().includes(q) ?? false),
  );
}

export function tierAllowsHyper(tier?: string | null): boolean {
  const n = (tier ?? "").toLowerCase();
  return n === "max" || n === "ultra" || n === "enterprise";
}

// ─── Quartz constants (for native Trumbo desktop) ──────────────────────────

const QUARTZ_VARIANTS: readonly PickerModel[] = [
  {
    slug: "quartz-1.0",
    name: "Quartz 1.0",
    description: "Balanced reasoning — default thinking depth",
  },
  {
    slug: "quartz-1.0-lite",
    name: "Quartz Lite",
    description: "Faster replies with lighter thinking",
  },
  {
    slug: "quartz-1.0-hyper",
    name: "Quartz Hyper",
    description: "Maximum thinking depth (Max/Ultra)",
  },
];

// ─── component ─────────────────────────────────────────────────────────────

export const ProviderModelPicker = memo(function ProviderModelPicker(props: {
  activeInstanceId: ProviderInstanceId;
  model: string;
  lockedProvider: ProviderDriverKind | null;
  lockedContinuationGroupKey?: string | null;
  instanceEntries: ReadonlyArray<ProviderInstanceEntry>;
  keybindings?: ResolvedKeybindingsConfig;
  modelOptionsByInstance: ReadonlyMap<ProviderInstanceId, ReadonlyArray<ModelEsque>>;
  activeProviderIconClassName?: string;
  compact?: boolean;
  disabled?: boolean;
  terminalOpen?: boolean;
  open?: boolean;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerClassName?: string;
  onOpenChange?: (open: boolean) => void;
  getModelDisabledReason?: (instanceId: ProviderInstanceId, model: string) => string | null;
  onInstanceModelChange: (instanceId: ProviderInstanceId, model: string) => void;
}) {
  const authState = useTrumboAuthState();
  const { resolveModelDisabledReason } = useTrumboModelAccess();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = props.open ?? internalOpen;

  const setOpen = useCallback(
    (open: boolean) => {
      props.onOpenChange?.(open);
      if (props.open === undefined) setInternalOpen(open);
    },
    [props.onOpenChange, props.open],
  );

  const activeEntry = useMemo(
    () => props.instanceEntries.find((e) => e.instanceId === props.activeInstanceId) ?? null,
    [props.activeInstanceId, props.instanceEntries],
  );

  const isTrumboDriver =
    isNativeTrumboDesktop() && activeEntry?.driverKind === ProviderDriverKind.make("trumbo");

  const mergedGetDisabledReason = useCallback(
    (instanceId: ProviderInstanceId, model: string): string | null => {
      const entry = props.instanceEntries.find((c) => c.instanceId === instanceId);
      const trumboReason = resolveModelDisabledReason(
        entry?.driverKind === ProviderDriverKind.make("trumbo"),
      );
      if (trumboReason) return trumboReason;
      return props.getModelDisabledReason?.(instanceId, model) ?? null;
    },
    [props.getModelDisabledReason, props.instanceEntries, resolveModelDisabledReason],
  );

  const handleSelect = useCallback(
    (instanceId: ProviderInstanceId, modelSlug: string) => {
      if (mergedGetDisabledReason(instanceId, modelSlug)) return;
      const options = props.modelOptionsByInstance.get(instanceId);
      if (!options) return;
      const entry = props.instanceEntries.find((e) => e.instanceId === instanceId);
      if (!entry) return;
      const resolved = resolveSelectableModel(entry.driverKind, modelSlug, options);
      if (resolved) {
        // Track in recent models
        const modelOpt = options.find((o) => o.slug === resolved);
        addRecentModel({
          key: providerModelKey(instanceId, resolved),
          instanceId,
          slug: resolved,
          name: modelOpt?.name ?? resolved,
        });
        props.onInstanceModelChange(instanceId, resolved);
        setOpen(false);
      }
    },
    [
      mergedGetDisabledReason,
      props.instanceEntries,
      props.modelOptionsByInstance,
      props.onInstanceModelChange,
      setOpen,
    ],
  );

  // ─── trigger label ──────────────────────────────────────────────────────

  const selectedInstanceOptions = props.modelOptionsByInstance.get(props.activeInstanceId) ?? [];
  const selectedModel =
    selectedInstanceOptions.find((o) => o.slug === props.model) ?? selectedInstanceOptions[0];
  const triggerTitle = selectedModel ? getTriggerDisplayModelName(selectedModel) : props.model;
  const triggerLabel = selectedModel ? getTriggerDisplayModelLabel(selectedModel) : props.model;
  const duplicateDriverCount = props.instanceEntries.filter(
    (e) => activeEntry !== null && e.driverKind === activeEntry.driverKind,
  ).length;
  const showInstanceBadge = Boolean(activeEntry?.accentColor) || duplicateDriverCount > 1;

  // ─── render ─────────────────────────────────────────────────────────────

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (props.disabled) {
          setOpen(false);
          return;
        }
        setOpen(open);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant={props.triggerVariant ?? "ghost"}
            data-chat-provider-model-picker="true"
            data-picker-version="v2-redesign"
            className={cn(
              "min-w-0 justify-between whitespace-nowrap px-2 text-muted-foreground/70 hover:text-foreground/80",
              props.compact ? "max-w-42 shrink-0" : "max-w-48 shrink sm:max-w-56 sm:px-3",
              props.triggerClassName,
            )}
            disabled={props.disabled}
          />
        }
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {isTrumboDriver && selectedModel ? (
            <ModelLabLogo
              modelId={selectedModel.slug}
              modelName={selectedModel.name}
              className="size-3.5 shrink-0"
            />
          ) : activeEntry ? (
            <ProviderInstanceIcon
              driverKind={activeEntry.driverKind}
              displayName={activeEntry.displayName}
              accentColor={activeEntry.accentColor}
              showBadge={showInstanceBadge}
              className={showInstanceBadge ? "size-5" : "size-4"}
              iconClassName={cn("size-4", props.activeProviderIconClassName)}
              indicatorBackground="var(--input)"
              badgeClassName="right-[-0.125rem] bottom-[-0.125rem] h-3 min-w-3 px-0.5 text-[7px]"
            />
          ) : null}
          <Tooltip>
            <TooltipTrigger render={<span className="min-w-0 flex-1 overflow-hidden truncate" />}>
              {triggerTitle}
            </TooltipTrigger>
            <TooltipPopup side="top">{triggerLabel}</TooltipPopup>
          </Tooltip>
        </span>
        <span aria-hidden="true" className="flex items-center">
          <ChevronDownIcon aria-hidden="true" className="!ms-0 !-me-1 size-3 shrink-0 opacity-60" />
        </span>
      </PopoverTrigger>

      <PopoverPopup
        align="start"
        side="top"
        sideOffset={8}
        className="rounded-md border border-border bg-popover p-0 shadow-lg before:hidden"
        viewportClassName="p-0 [--viewport-inline-padding:0]"
      >
        <div
          className="flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden"
          style={{ maxHeight: "min(26rem, 60vh)" }}
        >
          {isTrumboDriver ? (
            <TrumboModelList
              instanceId={props.activeInstanceId}
              value={props.model}
              planTier={authState?.subscription?.tier ?? null}
              {...(authState?.accessToken ? { accessToken: authState.accessToken } : {})}
              fallbackCatalog={selectedInstanceOptions.map((o) => ({ id: o.slug, name: o.name }))}
              modelAccessBlocked={resolveModelDisabledReason(true) !== null}
              getModelDisabledReason={mergedGetDisabledReason}
              onSelect={(slug) => handleSelect(props.activeInstanceId, slug)}
              onRequestClose={() => setOpen(false)}
              {...(props.keybindings ? { keybindings: props.keybindings } : {})}
              terminalOpen={props.terminalOpen ?? false}
            />
          ) : (
            <ProviderModelList
              activeInstanceId={props.activeInstanceId}
              model={props.model}
              lockedProvider={props.lockedProvider}
              lockedContinuationGroupKey={props.lockedContinuationGroupKey ?? null}
              instanceEntries={props.instanceEntries}
              {...(props.keybindings ? { keybindings: props.keybindings } : {})}
              modelOptionsByInstance={props.modelOptionsByInstance}
              terminalOpen={props.terminalOpen ?? false}
              getModelDisabledReason={mergedGetDisabledReason}
              onSelect={handleSelect}
              onRequestClose={() => setOpen(false)}
            />
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
});

// ─── search input (shared) ─────────────────────────────────────────────────

function PickerSearchInput({
  inputRef,
  value,
  onChange,
  onKeyDown,
  placeholder,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div className="shrink-0 border-b border-border p-2">
      <div className="input-surface flex h-8 items-center gap-2 rounded-sm px-2">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground/50" />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          placeholder={placeholder}
          aria-label="Search models"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  );
}

// ─── model row (shared) ────────────────────────────────────────────────────

function ModelRow({
  label,
  description,
  providerLabel,
  isSelected,
  isHighlighted,
  isDisabled,
  isFavorite,
  showNew,
  jumpLabel,
  icon,
  disabledReason,
  onClick,
  onHover,
  onToggleFavorite,
}: {
  label: string;
  description?: string | undefined;
  providerLabel?: string | undefined;
  isSelected: boolean;
  isHighlighted: boolean;
  isDisabled: boolean;
  isFavorite: boolean;
  showNew?: boolean;
  jumpLabel?: string | null;
  icon?: React.ReactNode;
  disabledReason?: string | null | undefined;
  onClick: () => void;
  onHover: () => void;
  onToggleFavorite?: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={isDisabled || undefined}
      data-highlighted={isHighlighted ? "" : undefined}
      data-selected={isSelected ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      tabIndex={-1}
      title={disabledReason ?? undefined}
      onClick={() => {
        if (!isDisabled) onClick();
      }}
      onMouseMove={onHover}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2.5 px-3 py-2 outline-none transition-colors",
        "data-highlighted:bg-muted/40",
        isSelected && "bg-brand/8",
        isDisabled && "cursor-not-allowed opacity-50",
      )}
    >
      {icon ? (
        <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "min-w-0 truncate text-sm leading-5",
              isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/85",
            )}
          >
            {label}
          </span>
          {showNew ? (
            <span className="shrink-0 rounded-sm bg-amber-500/15 px-1 py-px text-[9px] font-bold uppercase leading-none tracking-wide text-amber-700 dark:bg-amber-400/12 dark:text-amber-300">
              New
            </span>
          ) : null}
        </div>
        {description ? (
          <div className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground/50">
            {description}
          </div>
        ) : null}
        {providerLabel ? (
          <div className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground/50">
            {providerLabel}
          </div>
        ) : null}
        {disabledReason ? (
          <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground/50">
            {disabledReason}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {jumpLabel ? (
          <Kbd className="h-4 min-w-0 rounded-sm px-1 text-[10px]">{jumpLabel}</Kbd>
        ) : null}
        {isDisabled ? (
          <LockIcon className="size-3.5 shrink-0 text-muted-foreground/50" />
        ) : isSelected ? (
          <CheckIcon className="size-4 shrink-0 text-brand" />
        ) : null}
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            onKeyDown={(e) => e.stopPropagation()}
            disabled={isDisabled}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-sm transition-opacity",
              isFavorite
                ? "text-yellow-500 opacity-100"
                : "text-muted-foreground/40 opacity-0 hover:text-foreground group-hover:opacity-100",
            )}
          >
            <StarIcon className={cn("size-3", isFavorite && "fill-current")} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── keyboard hook ─────────────────────────────────────────────────────────

function useKeyboardNav({
  selectableKeys,
  highlightedKey,
  setHighlightedKey,
  selectByKey,
  onRequestClose,
  keybindings,
  terminalOpen,
}: {
  selectableKeys: readonly string[];
  highlightedKey: string | null;
  setHighlightedKey: React.Dispatch<React.SetStateAction<string | null>>;
  selectByKey: (key: string) => void;
  onRequestClose: () => void;
  keybindings: ResolvedKeybindingsConfig | undefined;
  terminalOpen: boolean;
}) {
  const moveHighlight = useCallback(
    (delta: number) => {
      if (selectableKeys.length === 0) return;
      const idx = highlightedKey ? selectableKeys.indexOf(highlightedKey) : -1;
      let next = idx === -1 ? (delta > 0 ? 0 : selectableKeys.length - 1) : idx + delta;
      if (next < 0) next = 0;
      if (next > selectableKeys.length - 1) next = selectableKeys.length - 1;
      setHighlightedKey(selectableKeys[next] ?? null);
    },
    [highlightedKey, selectableKeys, setHighlightedKey],
  );

  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onRequestClose();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const target = highlightedKey ?? selectableKeys[0];
        if (target) selectByKey(target);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveHighlight(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveHighlight(-1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setHighlightedKey(selectableKeys[0] ?? null);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setHighlightedKey(selectableKeys[selectableKeys.length - 1] ?? null);
        return;
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        moveHighlight(PAGE_SIZE);
        return;
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        moveHighlight(-PAGE_SIZE);
        return;
      }
      e.stopPropagation();
    },
    [highlightedKey, moveHighlight, onRequestClose, selectableKeys, selectByKey, setHighlightedKey],
  );

  // Jump shortcuts ⌘1..⌘9
  const resolvedKeybindings = useMemo(() => keybindings ?? [], [keybindings]);
  const shortcutCtx = useMemo(
    () => ({ terminalFocus: false, terminalOpen, modelPickerOpen: true }) as const,
    [terminalOpen],
  );
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      const command = resolveShortcutCommand(event, resolvedKeybindings, {
        platform: navigator.platform,
        context: shortcutCtx,
      });
      const jumpIndex = modelPickerJumpIndexFromCommand(command ?? "");
      if (jumpIndex === null) return;
      const targetKey = selectableKeys[jumpIndex];
      if (!targetKey) return;
      event.preventDefault();
      event.stopPropagation();
      selectByKey(targetKey);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [resolvedKeybindings, shortcutCtx, selectableKeys, selectByKey]);

  // Scroll highlighted row into view
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!highlightedKey || !scrollRef.current) return;
    const target = scrollRef.current.querySelector<HTMLElement>(`[data-highlighted]`);
    target?.scrollIntoView({ block: "nearest" });
  }, [highlightedKey]);

  return { onSearchKeyDown, scrollRef };
}

// ─── Provider model list (generic providers) ───────────────────────────────

function ProviderModelList(props: {
  activeInstanceId: ProviderInstanceId;
  model: string;
  lockedProvider: ProviderDriverKind | null;
  lockedContinuationGroupKey: string | null;
  instanceEntries: ReadonlyArray<ProviderInstanceEntry>;
  keybindings?: ResolvedKeybindingsConfig;
  modelOptionsByInstance: ReadonlyMap<ProviderInstanceId, ReadonlyArray<ModelEsque>>;
  terminalOpen: boolean;
  getModelDisabledReason: (instanceId: ProviderInstanceId, model: string) => string | null;
  onSelect: (instanceId: ProviderInstanceId, model: string) => void;
  onRequestClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<ProviderInstanceId | "favorites">(
    () => props.activeInstanceId,
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const favorites = useClientSettings((s) => s.favorites ?? []);
  const updateSettings = useUpdateClientSettings();
  const [recentModels] = useState<RecentModelEntry[]>(() => readRecentModels());

  const favoritesSet = useMemo(
    () => new Set(favorites.map((f) => providerModelKey(f.provider, f.model))),
    [favorites],
  );

  const entryByInstanceId = useMemo(
    () => new Map(props.instanceEntries.map((e) => [e.instanceId, e])),
    [props.instanceEntries],
  );

  const readyInstanceSet = useMemo(() => {
    const s = new Set<ProviderInstanceId>();
    for (const e of props.instanceEntries) {
      if (isProviderInstancePickerReady(e)) s.add(e.instanceId);
    }
    return s;
  }, [props.instanceEntries]);

  const matchesLocked = useCallback(
    (entry: Pick<ProviderInstanceEntry, "driverKind" | "continuationGroupKey">): boolean => {
      if (props.lockedProvider === null) return true;
      if (entry.driverKind !== props.lockedProvider) return false;
      if (!props.lockedContinuationGroupKey) return true;
      return entry.continuationGroupKey === props.lockedContinuationGroupKey;
    },
    [props.lockedContinuationGroupKey, props.lockedProvider],
  );

  const isLocked = props.lockedProvider !== null;
  const isSearching = search.trim().length > 0;

  // Build flat searchable rows
  const allRows = useMemo<readonly FlatRow[]>(() => {
    const out: FlatRow[] = [];
    for (const [instanceId, models] of props.modelOptionsByInstance) {
      const entry = entryByInstanceId.get(instanceId);
      if (!entry || !readyInstanceSet.has(instanceId)) continue;
      for (const model of models) {
        const key = providerModelKey(instanceId, model.slug);
        out.push({
          key,
          slug: model.slug,
          instanceId,
          driverKind: entry.driverKind,
          instanceDisplayName: entry.displayName,
          ...(entry.accentColor ? { instanceAccentColor: entry.accentColor } : {}),
          model: {
            slug: model.slug,
            name: model.name,
            ...(model.shortName ? { shortName: model.shortName } : {}),
            ...(model.subProvider ? { subProvider: model.subProvider } : {}),
          },
          isFavorite: favoritesSet.has(key),
          searchText: buildModelPickerSearchText({
            name: model.name,
            ...(model.shortName ? { shortName: model.shortName } : {}),
            ...(model.subProvider ? { subProvider: model.subProvider } : {}),
            driverKind: entry.driverKind,
            providerDisplayName: entry.displayName,
          }),
        });
      }
    }
    return out;
  }, [props.modelOptionsByInstance, entryByInstanceId, readyInstanceSet, favoritesSet]);

  // Filter rows
  const filteredRows = useMemo<readonly FlatRow[]>(() => {
    const query = search.trim();
    if (query) {
      const ranked: Array<{ row: FlatRow; score: number }> = [];
      for (const row of allRows) {
        if (isLocked && !matchesLocked(row)) continue;
        const score = scoreModelPickerSearch(
          {
            name: row.model.name,
            ...(row.model.shortName ? { shortName: row.model.shortName } : {}),
            ...(row.model.subProvider ? { subProvider: row.model.subProvider } : {}),
            driverKind: row.driverKind,
            providerDisplayName: row.instanceDisplayName,
            isFavorite: row.isFavorite,
          },
          query,
        );
        if (score === null) continue;
        ranked.push({ row, score });
      }
      ranked.sort((a, b) => {
        const d = a.score - b.score;
        if (d !== 0) return d;
        if (a.row.isFavorite !== b.row.isFavorite) return a.row.isFavorite ? -1 : 1;
        return a.row.searchText.localeCompare(b.row.searchText);
      });
      return ranked.map((r) => r.row);
    }

    let rows = allRows;
    if (isLocked) rows = rows.filter((r) => matchesLocked(r));
    if (selectedInstance === "favorites") {
      rows = rows.filter((r) => r.isFavorite);
    } else {
      rows = rows.filter((r) => r.instanceId === selectedInstance);
    }
    const instanceOrder = props.instanceEntries.map((e) => e.instanceId);
    return sortProviderModelItems(rows, {
      favoriteModelKeys: favoritesSet,
      groupFavorites: selectedInstance !== "favorites",
      instanceOrder: selectedInstance === "favorites" ? instanceOrder : [],
    });
  }, [
    allRows,
    favoritesSet,
    isLocked,
    matchesLocked,
    props.instanceEntries,
    search,
    selectedInstance,
  ]);

  const filteredKeys = useMemo(() => filteredRows.map((r) => r.key), [filteredRows]);
  const selectableKeys = useMemo(
    () =>
      filteredKeys.filter((key) => {
        const { instanceId, slug } = splitKey(key);
        return !props.getModelDisabledReason(instanceId, slug);
      }),
    [filteredKeys, props.getModelDisabledReason],
  );

  // Jump labels
  const jumpLabels = useMemo(() => {
    const map = new Map<string, string>();
    const ctx = {
      platform: navigator.platform,
      context: { terminalFocus: false, terminalOpen: props.terminalOpen, modelPickerOpen: true },
    } as const;
    let count = 0;
    for (const key of selectableKeys) {
      const cmd = modelPickerJumpCommandForIndex(count);
      if (!cmd) break;
      const label = shortcutLabelForCommand(props.keybindings ?? [], cmd, ctx);
      if (label) map.set(key, label);
      count++;
    }
    return map;
  }, [props.keybindings, props.terminalOpen, selectableKeys]);

  // Prime highlight
  useLayoutEffect(() => {
    const activeKey = `${props.activeInstanceId}:${props.model}`;
    if (filteredKeys.length === 0) {
      setHighlightedKey(null);
    } else if (filteredKeys.includes(activeKey)) {
      const { instanceId, slug } = splitKey(activeKey);
      setHighlightedKey(
        props.getModelDisabledReason(instanceId, slug) ? (selectableKeys[0] ?? null) : activeKey,
      );
    } else {
      setHighlightedKey(selectableKeys[0] ?? null);
    }
  }, [
    filteredKeys,
    selectableKeys,
    props.activeInstanceId,
    props.model,
    props.getModelDisabledReason,
  ]);

  // Focus search on mount
  useLayoutEffect(() => {
    searchRef.current?.focus({ preventScroll: true });
  }, []);

  const selectByKey = useCallback(
    (key: string) => {
      const { instanceId, slug } = splitKey(key);
      props.onSelect(instanceId, slug);
    },
    [props],
  );

  const toggleFavorite = useCallback(
    (instanceId: ProviderInstanceId, model: string) => {
      const next = [...favorites];
      const i = next.findIndex((f) => f.provider === instanceId && f.model === model);
      if (i >= 0) next.splice(i, 1);
      else next.push({ provider: instanceId, model });
      updateSettings({ favorites: next });
    },
    [favorites, updateSettings],
  );

  const { onSearchKeyDown, scrollRef } = useKeyboardNav({
    selectableKeys,
    highlightedKey,
    setHighlightedKey,
    selectByKey,
    onRequestClose: props.onRequestClose,
    keybindings: props.keybindings,
    terminalOpen: props.terminalOpen,
  });

  // Visible instances for tabs
  const visibleInstances = useMemo(
    () => props.instanceEntries.filter(isProviderInstancePickerVisible),
    [props.instanceEntries],
  );
  const showTabs = !isSearching && visibleInstances.length > 1;

  return (
    <>
      <PickerSearchInput
        inputRef={searchRef}
        value={search}
        onChange={setSearch}
        onKeyDown={onSearchKeyDown}
        placeholder="Search models..."
      />

      {showTabs ? (
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {favorites.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedInstance("favorites")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors",
                selectedInstance === "favorites"
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground/60 hover:bg-border/40 hover:text-foreground",
              )}
            >
              <StarIcon className="size-3" />
              Favorites
            </button>
          ) : null}
          {visibleInstances.map((entry) => {
            const isDisabled =
              !isProviderInstancePickerReady(entry) || (isLocked && !matchesLocked(entry));
            const isSelected = selectedInstance === entry.instanceId;
            return (
              <button
                key={entry.instanceId}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && setSelectedInstance(entry.instanceId)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground/60 hover:bg-border/40 hover:text-foreground",
                  isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
                )}
              >
                <ProviderInstanceIcon
                  driverKind={entry.driverKind}
                  displayName={entry.displayName}
                  accentColor={entry.accentColor}
                  showBadge={false}
                  className="size-4"
                  iconClassName="size-3.5"
                  indicatorBackground="transparent"
                />
                <span className="max-w-[100px] truncate">{entry.displayName}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
        {filteredRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No models found</p>
        ) : (
          <>
            {!isSearching && recentModels.length > 0 ? (
              <>
                <p className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/55 uppercase">
                  Recent
                </p>
                {recentModels.map((rm) => {
                  const row = allRows.find((r) => r.key === rm.key);
                  if (!row) return null;
                  const disabledReason = props.getModelDisabledReason(
                    rm.instanceId as ProviderInstanceId,
                    rm.slug,
                  );
                  const isDisabled = Boolean(disabledReason);
                  const isSelected = rm.key === `${props.activeInstanceId}:${props.model}`;
                  const label = getDisplayModelName(
                    row.model,
                    !isLocked ? { preferShortName: true } : undefined,
                  );
                  const providerLabel = row.model.subProvider
                    ? `${row.instanceDisplayName} · ${row.model.subProvider}`
                    : row.instanceDisplayName;
                  return (
                    <ModelRow
                      key={`recent-${rm.key}`}
                      label={label}
                      providerLabel={providerLabel}
                      isSelected={isSelected}
                      isHighlighted={false}
                      isDisabled={isDisabled}
                      isFavorite={row.isFavorite}
                      disabledReason={disabledReason}
                      onClick={() => selectByKey(rm.key)}
                      onHover={() => setHighlightedKey(rm.key)}
                      onToggleFavorite={() =>
                        toggleFavorite(rm.instanceId as ProviderInstanceId, rm.slug)
                      }
                    />
                  );
                })}
                <div className="mx-3 my-1 h-px bg-border/40" />
              </>
            ) : null}
            {filteredRows.map((row) => {
              const disabledReason = props.getModelDisabledReason(row.instanceId, row.model.slug);
              const isDisabled = Boolean(disabledReason);
              const isSelected = row.key === `${props.activeInstanceId}:${props.model}`;
              const isHighlighted = row.key === highlightedKey;
              const label = getDisplayModelName(
                row.model,
                !isLocked ? { preferShortName: true } : undefined,
              );
              const providerLabel = row.model.subProvider
                ? `${row.instanceDisplayName} · ${row.model.subProvider}`
                : row.instanceDisplayName;
              return (
                <ModelRow
                  key={row.key}
                  label={label}
                  providerLabel={providerLabel}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isDisabled={isDisabled}
                  isFavorite={row.isFavorite}
                  showNew={isModelPickerNewModel(row.driverKind, row.model.slug)}
                  jumpLabel={jumpLabels.get(row.key) ?? null}
                  disabledReason={disabledReason}
                  onClick={() => selectByKey(row.key)}
                  onHover={() => setHighlightedKey(row.key)}
                  onToggleFavorite={() => toggleFavorite(row.instanceId, row.model.slug)}
                />
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

// ─── Trumbo model list (native desktop Quartz) ─────────────────────────────

function TrumboModelList(props: {
  instanceId: ProviderInstanceId;
  value: string;
  planTier?: string | null;
  accessToken?: string;
  fallbackCatalog: ReadonlyArray<{ id: string; name: string; description?: string }>;
  modelAccessBlocked: boolean;
  getModelDisabledReason: (instanceId: ProviderInstanceId, model: string) => string | null;
  onSelect: (slug: string) => void;
  onRequestClose: () => void;
  keybindings?: ResolvedKeybindingsConfig;
  terminalOpen: boolean;
}) {
  const [catalog, setCatalog] = useState<PickerModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load platform catalog
  const load = useCallback(async () => {
    setLoading(true);
    const toOptions = (
      list: ReadonlyArray<{ id: string; name: string; description?: string | null }>,
    ): PickerModel[] =>
      list
        .map((m): PickerModel => {
          const base: PickerModel = { slug: m.id, name: m.name };
          const desc = m.description ?? undefined;
          return desc ? { ...base, description: desc } : base;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    try {
      const remote = await fetchPlatformModelCatalog(props.accessToken);
      setCatalog(remote.length > 0 ? toOptions(remote) : toOptions(props.fallbackCatalog));
    } catch {
      setCatalog(toOptions(props.fallbackCatalog));
    } finally {
      setLoading(false);
    }
  }, [props.accessToken, props.fallbackCatalog]);

  useEffect(() => {
    void load();
  }, [load]);

  // Quartz variants with access gating
  const quartz = useMemo<PickerModel[]>(() => {
    const allowHyper = tierAllowsHyper(props.planTier);
    return QUARTZ_VARIANTS.map((variant) => {
      const reason = props.getModelDisabledReason(props.instanceId, variant.slug) ?? null;
      if (props.modelAccessBlocked && reason)
        return { ...variant, locked: true, disabledReason: reason };
      if (variant.slug === "quartz-1.0-hyper" && !allowHyper)
        return { ...variant, locked: true, disabledReason: reason };
      if (reason) return { ...variant, disabledReason: reason };
      return variant;
    });
  }, [props.getModelDisabledReason, props.instanceId, props.modelAccessBlocked, props.planTier]);

  const allModels = useMemo<PickerModel[]>(() => {
    const quartzIds = new Set(quartz.map((e) => e.slug));
    return catalog
      .filter((e) => !quartzIds.has(e.slug))
      .map((e) => {
        const reason = props.getModelDisabledReason(props.instanceId, e.slug) ?? null;
        if (props.modelAccessBlocked && reason)
          return { ...e, locked: true, disabledReason: reason };
        return { ...e, disabledReason: reason };
      });
  }, [catalog, props.getModelDisabledReason, props.instanceId, props.modelAccessBlocked, quartz]);

  const filteredQuartz = useMemo(() => filterModels(quartz, search), [quartz, search]);
  const filteredAll = useMemo(() => filterModels(allModels, search), [allModels, search]);

  type Entry =
    | { kind: "header"; key: string; label: string }
    | { kind: "model"; key: string; model: PickerModel };

  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];
    if (filteredQuartz.length > 0) {
      out.push({ kind: "header", key: "h:quartz", label: "Quartz" });
      for (const m of filteredQuartz) out.push({ kind: "model", key: `m:${m.slug}`, model: m });
    }
    if (filteredAll.length > 0) {
      out.push({ kind: "header", key: "h:all", label: "All models" });
      for (const m of filteredAll) out.push({ kind: "model", key: `m:${m.slug}`, model: m });
    }
    return out;
  }, [filteredQuartz, filteredAll]);

  const selectableKeys = useMemo(
    () =>
      entries
        .filter((e): e is Extract<Entry, { kind: "model" }> => e.kind === "model")
        .filter((e) => !e.model.locked && !e.model.disabledReason)
        .map((e) => e.key),
    [entries],
  );

  const empty = filteredQuartz.length === 0 && filteredAll.length === 0;

  // Prime highlight
  useLayoutEffect(() => {
    const activeKey = `m:${props.value}`;
    if (selectableKeys.length === 0) {
      setHighlightedKey(null);
    } else if (selectableKeys.includes(activeKey)) {
      setHighlightedKey(activeKey);
    } else {
      setHighlightedKey(selectableKeys[0] ?? null);
    }
  }, [selectableKeys, props.value]);

  // Focus search
  useEffect(() => {
    const t = window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(t);
  }, []);

  const handleSelect = useCallback(
    (model: PickerModel) => {
      if (model.locked || model.disabledReason) return;
      props.onSelect(model.slug);
    },
    [props],
  );

  const selectByKey = useCallback(
    (key: string) => {
      const entry = entries.find((e) => e.key === key);
      if (entry && entry.kind === "model") handleSelect(entry.model);
    },
    [entries, handleSelect],
  );

  const { onSearchKeyDown, scrollRef } = useKeyboardNav({
    selectableKeys,
    highlightedKey,
    setHighlightedKey,
    selectByKey,
    onRequestClose: props.onRequestClose,
    keybindings: props.keybindings,
    terminalOpen: props.terminalOpen,
  });

  return (
    <>
      <PickerSearchInput
        inputRef={searchRef}
        value={search}
        onChange={setSearch}
        onKeyDown={onSearchKeyDown}
        placeholder="Search models..."
      />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading && empty ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">Loading models...</p>
        ) : empty ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">No models found</p>
        ) : (
          entries.map((entry) => {
            if (entry.kind === "header") {
              return (
                <p
                  key={entry.key}
                  className="sticky top-0 z-10 border-b border-border bg-popover px-3 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground/55 uppercase"
                >
                  {entry.label}
                </p>
              );
            }
            const model = entry.model;
            const active = model.slug === props.value;
            const isDisabled = Boolean(model.locked || model.disabledReason);
            const isHighlighted = entry.key === highlightedKey;
            return (
              <ModelRow
                key={entry.key}
                label={model.name}
                {...(model.description ? { description: model.description } : {})}
                isSelected={active}
                isHighlighted={isHighlighted}
                isDisabled={isDisabled}
                isFavorite={false}
                disabledReason={model.disabledReason}
                icon={<ModelLabLogo modelId={model.slug} modelName={model.name} />}
                onClick={() => handleSelect(model)}
                onHover={() => setHighlightedKey(entry.key)}
              />
            );
          })
        )}
      </div>
    </>
  );
}
