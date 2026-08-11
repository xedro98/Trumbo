// @effect-diagnostics nodeBuiltinImport:off globalErrorInEffectFailure:off

import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";
import * as Crypto from "effect/Crypto";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as ChildProcessSpawner from "effect/unstable/process/ChildProcessSpawner";
import * as EffectAcpErrors from "effect-acp/errors";

import * as AcpSessionRuntime from "./AcpSessionRuntime.ts";
import * as TrumboPlatformTokenManager from "../../auth/TrumboPlatformTokenManager.ts";
import { HostProcessPlatform } from "@trumbo-code/shared/hostProcess";
import { resolveSpawnCommand } from "@trumbo-code/shared/shell";

const isWindowsHost = Effect.runSync(HostProcessPlatform) === "win32";

const TRUMBO_PROVIDER_ENV = "TRUMBO_PROVIDER";
const TRUMBO_MODEL_ENV = "TRUMBO_MODEL";
const TRUMBO_THINKING_LEVEL_ENV = "TRUMBO_THINKING_LEVEL";
export const TRUMBO_CLI_CWD_ENV = "TRUMBO_CLI_CWD";
const TRUMBO_ENABLE_AGENT_TEAMS_ENV = "TRUMBO_ENABLE_AGENT_TEAMS";
const TRUMBO_ENABLE_SPAWN_AGENT_ENV = "TRUMBO_ENABLE_SPAWN_AGENT";

function resolveBunBinary(): string {
  const home = NodeOS.homedir();
  const exe = isWindowsHost ? "bun.exe" : "bun";
  const candidate = NodePath.join(home, ".bun", "bin", exe);
  if (NodeFS.existsSync(candidate)) {
    return candidate;
  }
  return "bun";
}

function resolveTrumboCodeWorkspaceRoot(): string | undefined {
  try {
    let dir = NodePath.dirname(NodeURL.fileURLToPath(import.meta.url));
    for (let depth = 0; depth < 8; depth += 1) {
      if (NodeFS.existsSync(NodePath.join(dir, "apps", "server", "package.json"))) {
        return dir;
      }
      const parent = NodePath.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Packaged desktop builds ship the ACP-capable Trumbo CLI (the compiled
 * `@trumbodev/cli`) at `<app>/resources/trumbo-cli/trumbo[.exe]`. Resolve it so
 * a packaged app never falls back to the npm-published `trumbo` Rust TUI
 * (which does not implement ACP). Dev checkouts have no bundled CLI — the
 * sibling console workspace (Bun dev) covers them instead.
 */
function resolveBundledTrumboCli(): string | undefined {
  try {
    const exe = isWindowsHost ? "trumbo.exe" : "trumbo";
    const bundleDir = NodePath.dirname(NodeURL.fileURLToPath(import.meta.url));
    const candidates = [
      // Electron main / ELECTRON_RUN_AS_NODE exposes `<app>/resources`.
      ...(typeof process.resourcesPath === "string"
        ? [NodePath.join(process.resourcesPath, "trumbo-cli", exe)]
        : []),
      // Walk up from .../resources/app.asar/apps/server/dist/bin.mjs
      NodePath.resolve(bundleDir, "../../../../", "trumbo-cli", exe),
    ];
    for (const candidate of candidates) {
      if (NodeFS.existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
    // A bundled CLI is optional; fall back to PATH resolution when absent.
  }
  return undefined;
}

function resolveSiblingConsoleWorkspace(): string | undefined {
  const trumboCodeRoot = resolveTrumboCodeWorkspaceRoot();
  if (!trumboCodeRoot) {
    return undefined;
  }
  // The Trumbo CLI source lives as a sibling workspace in the monorepo:
  //   cline-full/projects/console  (with trumbo-code at cline-full/projects/trumbo-code)
  // Probe every plausible layout so the Bun dev fallback works regardless of
  // how the checkout was arranged (folded monorepo, nested repo, packaged dev).
  const candidates = [
    NodePath.resolve(trumboCodeRoot, "../console"),
    NodePath.resolve(trumboCodeRoot, "../cline-full/projects/console"),
    NodePath.resolve(trumboCodeRoot, "../../projects/console"),
    NodePath.resolve(trumboCodeRoot, "../../cline-full/projects/console"),
  ];
  for (const candidate of candidates) {
    if (NodeFS.existsSync(NodePath.join(candidate, "src", "index.ts"))) {
      return candidate;
    }
  }
  return undefined;
}

export function resolveTrumboCliDevCwd(environment?: NodeJS.ProcessEnv): string | undefined {
  const fromEnv = environment?.[TRUMBO_CLI_CWD_ENV]?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return resolveSiblingConsoleWorkspace();
}

function pathWithBunOnPath(bunBinary: string, environment?: NodeJS.ProcessEnv): string | undefined {
  const bunDir = NodePath.dirname(bunBinary);
  const pathSeparator = isWindowsHost ? ";" : ":";
  const existingPath = environment?.PATH ?? process.env.PATH ?? "";
  if (!existingPath.includes(bunDir)) {
    return `${bunDir}${pathSeparator}${existingPath}`;
  }
  return existingPath;
}

function resolveTrumboCliFeatureFlag(
  value: boolean | undefined,
  defaultEnabled: boolean,
): "0" | "1" {
  const enabled = value ?? defaultEnabled;
  return enabled ? "1" : "0";
}

export function buildTrumboApiEnv(
  environment: NodeJS.ProcessEnv | undefined,
  model: string | undefined,
  extra?: NodeJS.ProcessEnv,
  featureFlags?: {
    readonly enableAgentTeams?: boolean;
    readonly enableSpawnAgent?: boolean;
  },
  thinkingLevel?: string,
): NodeJS.ProcessEnv {
  const normalizedThinkingLevel = thinkingLevel?.trim();
  return {
    ...environment,
    ...extra,
    // NOTE: intentionally no TRUMBO_API_KEY. The desktop's platform-host session
    // token is rejected by the api.trumbo.dev inference gateway (401
    // invalid_grant); the CLI authenticates itself over ACP with its own
    // API-realm credential (validate/refresh, then a device login when stale).
    [TRUMBO_PROVIDER_ENV]: "trumbo",
    ...(model ? { [TRUMBO_MODEL_ENV]: model } : {}),
    ...(normalizedThinkingLevel ? { [TRUMBO_THINKING_LEVEL_ENV]: normalizedThinkingLevel } : {}),
    [TRUMBO_ENABLE_AGENT_TEAMS_ENV]: resolveTrumboCliFeatureFlag(
      featureFlags?.enableAgentTeams,
      true,
    ),
    [TRUMBO_ENABLE_SPAWN_AGENT_ENV]: resolveTrumboCliFeatureFlag(
      featureFlags?.enableSpawnAgent,
      true,
    ),
  };
}

export interface TrumboCliAcpRuntimeInput extends Omit<
  AcpSessionRuntime.AcpSessionRuntimeOptions,
  "authMethodId" | "clientCapabilities" | "spawn"
> {
  readonly childProcessSpawner: ChildProcessSpawner.ChildProcessSpawner["Service"];
  readonly binaryPath: string | undefined;
  readonly cliCwd: string | undefined;
  readonly model: string | undefined;
  readonly thinkingLevel?: string | undefined;
  readonly enableAgentTeams?: boolean;
  readonly enableSpawnAgent?: boolean;
  readonly environment?: NodeJS.ProcessEnv;
}

const UNCAPPED_TRUMBO_ACP_HINT = "unexpected argument '--acp'";
// Cold-starting the TypeScript console CLI (bun transpiles its full dependency
// graph) can take well over the old 10s on first launch; give it plenty of
// room so a slow-but-capable build is not rejected.
const ACP_CAPABILITY_PROBE_TIMEOUT = Duration.seconds(45);

const resolveProbedSpawn = (
  spawn: AcpSessionRuntime.AcpSpawnInput,
  environment: NodeJS.ProcessEnv | undefined,
): Effect.Effect<AcpSessionRuntime.AcpSpawnInput, never> =>
  Effect.gen(function* () {
    const env = { ...process.env, ...environment };
    const resolved = yield* resolveSpawnCommand(spawn.command, spawn.args, {
      env,
      extendEnv: true,
    });
    return {
      command: resolved.command,
      args: resolved.args,
      ...(spawn.cwd ? { cwd: spawn.cwd } : {}),
      env: spawn.env ?? env,
    };
  });

const runAcpCapabilityProbe = (
  spawn: AcpSessionRuntime.AcpSpawnInput,
): Effect.Effect<boolean, never> =>
  Effect.callback((resume) => {
    const args = [...spawn.args, "--help"];
    const child = NodeChildProcess.spawn(spawn.command, args, {
      ...(spawn.cwd ? { cwd: spawn.cwd } : {}),
      ...(spawn.env ? { env: { ...process.env, ...spawn.env }, extendEnv: true } : {}),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (capable: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (!child.killed) {
        child.kill();
      }
      resume(Effect.succeed(capable));
    };

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", () => finish(false));
    child.on("close", (code) => {
      // The CLI accepts --acp when it prints its normal help (exit 0) instead of
      // rejecting the flag as unknown. A binary that never heard of --acp (e.g.
      // the native Rust TUI build) exits non-zero with the clap arg error.
      const clapRejectedAcp = stderr.includes(UNCAPPED_TRUMBO_ACP_HINT) || code !== 0;
      finish(!clapRejectedAcp);
    });
    const timer = setTimeout(() => finish(false), Duration.toMillis(ACP_CAPABILITY_PROBE_TIMEOUT));
  });

/**
 * Verifies the resolved Trumbo CLI actually supports ACP mode (--acp). The
 * npm-published `trumbo` is the native Rust TUI build, which does NOT accept
 * --acp; only the TypeScript console CLI (bun run src/index.ts) serves the
 * Agent Client Protocol. Fail fast with an actionable message instead of the
 * cryptic "call-rpc failed for method initialize" surfaced later.
 */
const assertAcpCapableTrumboCli = (
  spawn: AcpSessionRuntime.AcpSpawnInput,
  environment: NodeJS.ProcessEnv | undefined,
): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    const resolved = yield* resolveProbedSpawn(spawn, environment);
    const capable = yield* runAcpCapabilityProbe(resolved);
    if (capable) {
      return;
    }
    const hint = resolved.cwd ? ` (cwd: ${resolved.cwd})` : "";
    return yield* Effect.fail(
      new Error(
        [
          `The Trumbo CLI at '${resolved.command}' does not support ACP mode (--acp)${hint}.`,
          "Agent sessions in Trumbo Code require the ACP-capable Trumbo CLI. Install it with `npm install -g @trumbodev/cli`, or set the Trumbo provider's 'CLI binary path' / 'CLI workspace' to an ACP-capable build.",
        ].join(" "),
      ),
    );
  });

export function buildTrumboCliAcpSpawnInput(
  binaryPath: string | undefined,
  cliCwd: string | undefined,
  environment: NodeJS.ProcessEnv | undefined,
  model: string | undefined,
  featureFlags?: {
    readonly enableAgentTeams?: boolean;
    readonly enableSpawnAgent?: boolean;
  },
  thinkingLevel?: string,
): AcpSessionRuntime.AcpSpawnInput {
  const configuredBinary = binaryPath?.trim();
  // The Trumbo settings schema defaults `binaryPath` to the bare package name
  // "trumbo" (`makeBinaryPathSetting("trumbo")`). That name resolves to the
  // npm-published Rust TUI, which does NOT speak ACP — it only shadows the
  // ACP-capable console CLI. Treat the bare fallback name as *unconfigured* so
  // an ACP-capable build wins: an explicit path is honored verbatim, then the
  // dev console workspace (Bun), then the bundled CLI in packaged builds, and
  // only as a last resort the `trumbo` on PATH.
  const isPackageNameFallback = configuredBinary === "trumbo";
  const devCwd = cliCwd?.trim() || resolveTrumboCliDevCwd(environment);

  if (configuredBinary && !isPackageNameFallback) {
    return {
      command: configuredBinary,
      args: ["--acp"],
      env: buildTrumboApiEnv(environment, model, undefined, featureFlags, thinkingLevel),
    };
  }

  if (devCwd) {
    const bunBinary = resolveBunBinary();
    return {
      command: bunBinary,
      args: ["run", "src/index.ts", "--acp"],
      cwd: devCwd,
      env: buildTrumboApiEnv(
        environment,
        model,
        {
          PATH: pathWithBunOnPath(bunBinary, environment),
        },
        featureFlags,
        thinkingLevel,
      ),
    };
  }

  const bundledCli = resolveBundledTrumboCli();
  if (bundledCli) {
    // Packaged build ships its own ACP-capable CLI; never fall back to the
    // npm `trumbo` Rust TUI on PATH.
    return {
      command: bundledCli,
      args: ["--acp"],
      env: buildTrumboApiEnv(environment, model, undefined, featureFlags, thinkingLevel),
    };
  }

  return {
    command: configuredBinary ?? "trumbo",
    args: ["--acp"],
    env: buildTrumboApiEnv(environment, model, undefined, featureFlags, thinkingLevel),
  };
}

export const makeTrumboCliAcpRuntime = (
  input: TrumboCliAcpRuntimeInput,
): Effect.Effect<
  AcpSessionRuntime.AcpSessionRuntime["Service"],
  EffectAcpErrors.AcpError | Error,
  Crypto.Crypto | Scope.Scope | TrumboPlatformTokenManager.TrumboPlatformTokenManager
> =>
  Effect.gen(function* () {
    const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
    const accessToken = yield* tokenManager.getAccessToken;
    if (Option.isNone(accessToken)) {
      // @effect-diagnostics-next-line globalErrorInEffectFailure:off - user-facing sign-in prompt error.
      return yield* Effect.fail(
        new Error("Sign in to Trumbo on this device to use the Trumbo CLI provider."),
      );
    }

    const spawn = buildTrumboCliAcpSpawnInput(
      input.binaryPath,
      input.cliCwd,
      input.environment,
      input.model,
      {
        ...(input.enableAgentTeams !== undefined
          ? { enableAgentTeams: input.enableAgentTeams }
          : {}),
        ...(input.enableSpawnAgent !== undefined
          ? { enableSpawnAgent: input.enableSpawnAgent }
          : {}),
      },
      input.thinkingLevel,
    );

    // The Bun dev fallback is the project's own ACP-capable console CLI; probing
    // it costs a cold bun boot and can false-negative when that boot exceeds the
    // probe timeout, hard-failing a session that would otherwise start. Trust the
    // dev workspace (identified by a spawn cwd — the only path that sets one) and
    // probe only opaque binaries (explicit paths / PATH fallbacks).
    if (spawn.cwd === undefined) {
      yield* assertAcpCapableTrumboCli(spawn, input.environment);
    }

    const acpContext = yield* Layer.build(
      AcpSessionRuntime.layer({
        ...input,
        spawn,
        authMethodId: "trumbo",
        clientInfo: {
          name: "trumbo-code",
          version: "0.0.28",
        },
      }).pipe(
        Layer.provide(
          Layer.succeed(ChildProcessSpawner.ChildProcessSpawner, input.childProcessSpawner),
        ),
      ),
    );
    return yield* Effect.service(AcpSessionRuntime.AcpSessionRuntime).pipe(
      Effect.provide(acpContext),
    );
  });
