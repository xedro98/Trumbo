import { describe, expect, it } from "vitest";

import {
  buildTrumboApiEnv,
  buildTrumboCliAcpSpawnInput,
  resolveTrumboCliDevCwd,
  TRUMBO_CLI_CWD_ENV,
} from "./TrumboCliAcpSupport.ts";

describe("buildTrumboApiEnv", () => {
  it("defaults team and spawn flags to enabled when unset", () => {
    const env = buildTrumboApiEnv(undefined, "token", "quartz-1.0");
    expect(env.TRUMBO_ENABLE_AGENT_TEAMS).toBe("1");
    expect(env.TRUMBO_ENABLE_SPAWN_AGENT).toBe("1");
  });

  it("honors explicit disable flags", () => {
    const env = buildTrumboApiEnv(undefined, "token", "quartz-1.0", undefined, {
      enableAgentTeams: false,
      enableSpawnAgent: false,
    });
    expect(env.TRUMBO_ENABLE_AGENT_TEAMS).toBe("0");
    expect(env.TRUMBO_ENABLE_SPAWN_AGENT).toBe("0");
  });

  it("forwards the thinking level when provided", () => {
    const env = buildTrumboApiEnv(undefined, "token", "quartz-1.0", undefined, undefined, "high");
    expect(env.TRUMBO_THINKING_LEVEL).toBe("high");
  });

  it("omits the thinking level when unset or blank", () => {
    const unset = buildTrumboApiEnv(undefined, "token", "quartz-1.0");
    expect(unset.TRUMBO_THINKING_LEVEL).toBeUndefined();
    const blank = buildTrumboApiEnv(undefined, "token", "quartz-1.0", undefined, undefined, "  ");
    expect(blank.TRUMBO_THINKING_LEVEL).toBeUndefined();
  });
});

describe("resolveTrumboCliDevCwd", () => {
  it("is overridden by the TRUMBO_CLI_CWD environment variable", () => {
    const cwd = "C:\\dev\\console";
    expect(resolveTrumboCliDevCwd({ [TRUMBO_CLI_CWD_ENV]: cwd })).toBe(cwd);
    expect(resolveTrumboCliDevCwd({ [TRUMBO_CLI_CWD_ENV]: `  ${cwd}  ` })).toBe(cwd);
  });

  it("falls back to the sibling console workspace when the env var is unset", () => {
    const resolved = resolveTrumboCliDevCwd({});
    // This repo layout: projects/trumbo-code + projects/console are siblings.
    expect(resolved).toBeDefined();
    expect(resolved!.endsWith(`${process.platform === "win32" ? "\\" : "/"}console`)).toBe(true);
  });
});

describe("buildTrumboCliAcpSpawnInput", () => {
  it("uses the configured binary path with --acp args", () => {
    const spawn = buildTrumboCliAcpSpawnInput(
      "C:\\bin\\trumbo.exe",
      undefined,
      undefined,
      "token",
      "quartz-1.0",
    );
    expect(spawn.command).toBe("C:\\bin\\trumbo.exe");
    expect(spawn.args).toEqual(["--acp"]);
  });

  it("uses bun dev mode with --acp when a CLI workspace is configured", () => {
    const spawn = buildTrumboCliAcpSpawnInput(
      undefined,
      "C:\\dev\\console",
      undefined,
      "token",
      "quartz-1.0",
    );
    expect(spawn.command).toMatch(/bun(\.exe)?$/u);
    expect(spawn.args).toEqual(["run", "src/index.ts", "--acp"]);
    expect(spawn.cwd).toBe("C:\\dev\\console");
  });

  it("includes the Trumbo API env for ACP sessions", () => {
    const spawn = buildTrumboCliAcpSpawnInput(
      undefined,
      "C:\\dev\\console",
      undefined,
      "token",
      "quartz-1.0",
    );
    expect(spawn.env).toMatchObject({
      TRUMBO_API_KEY: "token",
      TRUMBO_PROVIDER: "trumbo",
      TRUMBO_MODEL: "quartz-1.0",
    });
    expect(spawn.env?.TRUMBO_ENABLE_AGENT_TEAMS).toBe("1");
    expect(spawn.env?.TRUMBO_ENABLE_SPAWN_AGENT).toBe("1");
  });

  it("treats the bare package-name binaryPath as unconfigured when a dev workspace exists", () => {
    // TrumboSettings decodes binaryPath to the bare package name "trumbo" by
    // default. That resolves to the npm Rust TUI — not ACP-capable — so when
    // the TypeScript console CLI is present as a sibling workspace, Bun dev
    // mode must win over the PATH fallback.
    const spawn = buildTrumboCliAcpSpawnInput(
      "trumbo",
      undefined,
      undefined,
      "token",
      "quartz-1.0",
    );
    expect(spawn.command).toMatch(/bun(\.exe)?$/u);
    expect(spawn.args).toEqual(["run", "src/index.ts", "--acp"]);
    expect(spawn.cwd).toBeDefined();
  });

  it("still honors an explicit absolute binaryPath when a dev workspace exists", () => {
    const spawn = buildTrumboCliAcpSpawnInput(
      "C:\\bin\\trumbo.exe",
      undefined,
      undefined,
      "token",
      "quartz-1.0",
    );
    expect(spawn.command).toBe("C:\\bin\\trumbo.exe");
    expect(spawn.args).toEqual(["--acp"]);
  });

  it("prefers the sibling console workspace over a bare `trumbo` PATH fallback", () => {
    // When the console CLI source is present as a sibling workspace, the dev
    // bun path is used so the ACP-capable CLI is always the one spawned.
    const spawn = buildTrumboCliAcpSpawnInput(
      undefined,
      undefined,
      undefined,
      "token",
      "quartz-1.0",
    );
    expect(spawn.args).toContain("--acp");
    expect(spawn.cwd).toBeDefined();
    expect(spawn.env).toMatchObject({
      TRUMBO_API_KEY: "token",
      TRUMBO_PROVIDER: "trumbo",
    });
  });
});
