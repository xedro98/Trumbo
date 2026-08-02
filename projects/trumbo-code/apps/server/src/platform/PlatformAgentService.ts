// @effect-diagnostics globalFetchInEffect:off preferSchemaOverJson:off globalFetch:off globalTimers:off

import {
  PlatformEcosystemError,
  type PlatformAgentDetailResult,
  type PlatformAgentMessage,
  type PlatformCreateAgentInput,
  type PlatformCreateAgentResult,
  type PlatformDeleteAgentResult,
  type PlatformSendAgentMessageInput,
  type PlatformSendAgentMessageResult,
  type PlatformStopAgentResult,
} from "@trumbo-code/contracts";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";

import * as TrumboPlatformTokenManager from "../auth/TrumboPlatformTokenManager.ts";
import { resolveTrumboProviderBaseUrl } from "../provider/trumboCloudClient.ts";

/** Error raised when the user is not signed in to Trumbo. */
class NotSignedInError {
  readonly _tag = "NotSignedInError";
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

interface PlatformEnvelope<T> {
  readonly success?: boolean;
  readonly data?: T;
  readonly error?: string;
}

async function readEnvelope<T>(response: Response): Promise<PlatformEnvelope<T>> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { success: false, error: text || `Request failed (${response.status})` };
  }
  return (await response.json()) as PlatformEnvelope<T>;
}

/** fetch with an abort timeout so a hung platform request doesn't block the
 *  proxy fiber forever. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 30_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Extract plain text from a UIMessage (ai-chat) parts array. */
function textFromParts(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  const chunks: string[] = [];
  for (const part of parts) {
    if (typeof part === "string" && part.trim()) {
      chunks.push(part);
    } else if (typeof part === "object" && part !== null) {
      const record = part as { type?: string; text?: string };
      if (typeof record.text === "string" && record.text.trim()) {
        chunks.push(record.text);
      }
    }
  }
  return chunks.join("\n\n");
}

/** Extract plain text from a message's `content` or `parts` (UIMessage) field. */
function textFromMessage(entry: Record<string, unknown>): string {
  const fromParts = textFromParts(entry.parts);
  if (fromParts) return fromParts;
  const content = entry.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return textFromParts(content);
  return "";
}

/** Normalise the platform's agent state payload into our detail result. */
function normalizeAgentDetail(raw: unknown): PlatformAgentDetailResult {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const state = (obj.state ?? obj) as Record<string, unknown>;
  const messagesRaw = Array.isArray(obj.messages)
    ? obj.messages
    : Array.isArray((state as Record<string, unknown>).messages)
      ? (state as Record<string, unknown>).messages
      : [];
  const messages: PlatformAgentMessage[] = [];
  for (const entry of messagesRaw as ReadonlyArray<Record<string, unknown>>) {
    const role = typeof entry.role === "string" ? entry.role : "assistant";
    const content = textFromMessage(entry);
    if (content || role === "tool") {
      messages.push({
        role: role as PlatformAgentMessage["role"],
        content,
        ...(typeof entry.id === "string" ? { id: entry.id } : {}),
      });
    }
  }
  const pick = (key: string): string | undefined =>
    typeof state[key] === "string" ? (state[key] as string) : undefined;
  const pickNum = (key: string): number | undefined =>
    typeof state[key] === "number" ? (state[key] as number) : undefined;
  return {
    agentId: typeof obj.agentId === "string" ? obj.agentId : typeof state.agentId === "string" ? (state.agentId as string) : "",
    status: pick("status") ?? "idle",
    ...(pick("model") ? { model: pick("model") } : {}),
    ...(pick("mode") ? { mode: pick("mode") } : {}),
    ...(pick("sandboxId") ? { sandboxId: pick("sandboxId") } : {}),
    ...(pick("branch") ? { branch: pick("branch") } : {}),
    ...(pickNum("msUsedRaw") != null ? { msUsedRaw: pickNum("msUsedRaw") } : {}),
    messages,
  };
}

interface ConnectedRepoRow {
  readonly id: string;
  readonly provider: string;
  readonly owner: string;
  readonly name: string;
  readonly full_name: string;
  readonly default_branch: string;
  readonly active: number;
}

export const makePlatformAgentService = () => ({
  /** Find a platform-connected repo matching owner/name (e.g. github.com/owner/repo).
   *  Returns its repoId for engineering agent provisioning, or null when the repo
   *  is not connected on the platform. */
  findConnectedRepoId: (input: { owner: string; name: string }) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return null;
      }
      const baseUrl = resolveTrumboProviderBaseUrl();
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetchWithTimeout(`${baseUrl}/repos`, {
            headers: authHeaders(accessToken.value),
          });
          return readEnvelope<ConnectedRepoRow[]>(response);
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.findConnectedRepo",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      }).pipe(Effect.option);
      if (Option.isNone(result) || !result.value.success || !Array.isArray(result.value.data)) {
        return null;
      }
      const fullName = `${input.owner}/${input.name}`.toLowerCase();
      const match = result.value.data.find(
        (repo) =>
          repo.active === 1 && typeof repo.full_name === "string" && repo.full_name.toLowerCase() === fullName,
      );
      return match?.id ?? null;
    }),

  /** Connect a repo on the platform (needs the user's git OAuth to be linked).
   *  Returns the new repoId, or null on failure. */
  connectRepo: (input: { provider: string; owner: string; name: string }) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return null;
      }
      const baseUrl = resolveTrumboProviderBaseUrl();
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetchWithTimeout(`${baseUrl}/repos`, {
            method: "POST",
            headers: authHeaders(accessToken.value),
            body: JSON.stringify({
              provider: input.provider,
              owner: input.owner,
              name: input.name,
              fullName: `${input.owner}/${input.name}`,
            }),
          });
          return readEnvelope<{ id?: string; repoId?: string }>(response);
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.connectRepo",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      }).pipe(Effect.option);
      if (Option.isNone(result) || !result.value.success || !result.value.data) {
        return null;
      }
      return result.value.data.id ?? result.value.data.repoId ?? null;
    }),

  createAgent: (input: PlatformCreateAgentInput & { provisionSync?: boolean }) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.createAgent",
            message: "Sign in to Trumbo to start a cloud agent.",
          }),
        );
      }

      const baseUrl = resolveTrumboProviderBaseUrl();
      const body = {
        // Always engineering: chat-kind agents get an empty internal model token
        // (they rely on the dashboard WebSocket bearer for /chat auth) and cannot
        // run turns when created via REST. Engineering agents get a minted token
        // so the cloud agent can call the model and respond. repoId optional —
        // without one the agent chats and can request a repo.
        kind: input.kind ?? "engineering",
        model: input.model ?? "quartz-1.0-lite",
        prompt: input.prompt,
        ...(input.name ? { name: input.name } : {}),
        ...(input.repoId
          ? { repoId: input.repoId, provisionSync: input.provisionSync ?? false }
          : {}),
      };

      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetchWithTimeout(`${baseUrl}/agents`, {
            method: "POST",
            headers: authHeaders(accessToken.value),
            body: JSON.stringify(body),
          });
          return readEnvelope<PlatformCreateAgentResult>(response);
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.createAgent",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      });

      if (!result.success || !result.data) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.createAgent",
            message: result.error ?? "Failed to create cloud agent.",
          }),
        );
      }
      return result.data;
    }),

  /** Start async sandbox provisioning for an engineering agent (clone repo,
   *  create working branch, write env). Returns immediately; poll
   *  getSetupProgress for live progress. */
  provisionAgent: (agentId: string, input: { repoId: string }) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.provisionAgent",
            message: "Sign in to Trumbo to provision a sandbox.",
          }),
        );
      }
      const baseUrl = resolveTrumboProviderBaseUrl();
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetchWithTimeout(
            `${baseUrl}/agents/${encodeURIComponent(agentId)}/provision`,
            {
              method: "POST",
              headers: authHeaders(accessToken.value),
              body: JSON.stringify({ repoId: input.repoId }),
            },
          );
          return readEnvelope<{ status?: string; sandboxId?: string; error?: string }>(response);
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.provisionAgent",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      });
      if (!result.success || !result.data) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.provisionAgent",
            message: result.error ?? "Failed to start sandbox provisioning.",
          }),
        );
      }
      return result.data;
    }),

  /** Read live sandbox setup progress for an agent (phase + human message). */
  getSetupProgress: (agentId: string) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.getSetupProgress",
            message: "Sign in to Trumbo to read sandbox setup progress.",
          }),
        );
      }
      const baseUrl = resolveTrumboProviderBaseUrl();
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetchWithTimeout(
            `${baseUrl}/agents/${encodeURIComponent(agentId)}/setup-progress`,
            { headers: authHeaders(accessToken.value) },
          );
          return readEnvelope<{
            status?: string;
            phase?: string;
            message?: string;
            error?: string | null;
            sandboxId?: string | null;
            branch?: string | null;
            repoId?: string | null;
          }>(response);
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.getSetupProgress",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      });
      if (!result.success || !result.data) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.getSetupProgress",
            message: result.error ?? "Failed to read sandbox setup progress.",
          }),
        );
      }
      return result.data;
    }),

  getAgent: (agentId: string) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.getAgent",
            message: "Sign in to Trumbo to view cloud agents.",
          }),
        );
      }

      const baseUrl = resolveTrumboProviderBaseUrl();
      const result = yield* Effect.tryPromise({
        try: async () => {
          const [stateResp, messagesResp] = await Promise.all([
            fetchWithTimeout(`${baseUrl}/agents/${encodeURIComponent(agentId)}`, {
              headers: authHeaders(accessToken.value),
            }),
            fetchWithTimeout(`${baseUrl}/agents/${encodeURIComponent(agentId)}/messages`, {
              headers: authHeaders(accessToken.value),
            }),
          ]);
          const state = await readEnvelope<unknown>(stateResp);
          const messages = messagesResp.ok
            ? await readEnvelope<unknown[]>(messagesResp)
            : ({ success: false, data: [] } as { success?: boolean; data?: unknown[] });
          return { state, messages };
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.getAgent",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      });

      if (!result.state.success || result.state.data == null) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.getAgent",
            message: result.state.error ?? "Failed to load cloud agent.",
          }),
        );
      }
      // The platform returns { success, data: <agent state> } for state and
      // { success, data: UIMessage[] } for messages — merge them.
      const statePayload = (result.state.data as { data?: unknown }).data ?? result.state.data;
      const messagesPayload = Array.isArray(result.messages.data) ? result.messages.data : [];
      const detail = normalizeAgentDetail(statePayload);
      const messages: PlatformAgentMessage[] = [];
      for (const entry of messagesPayload as ReadonlyArray<Record<string, unknown>>) {
        const role = typeof entry.role === "string" ? entry.role : "assistant";
        const content = textFromMessage(entry);
        if (content || role === "tool") {
          messages.push({
            role: role as PlatformAgentMessage["role"],
            content,
            ...(typeof entry.id === "string" ? { id: entry.id } : {}),
          });
        }
      }
      return { ...detail, messages };
    }),

  sendMessage: (input: PlatformSendAgentMessageInput) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.sendAgentMessage",
            message: "Sign in to Trumbo to send messages to a cloud agent.",
          }),
        );
      }

      const baseUrl = resolveTrumboProviderBaseUrl();
      const body = {
        message: input.message,
        ...(input.model ? { model: input.model } : {}),
      };

      const result = yield* Effect.tryPromise({
        try: async () => {
          // Non-streaming send: the platform queues the turn and the DO runs it.
          // We poll state separately for updated messages.
          const response = await fetchWithTimeout(
            `${baseUrl}/agents/${encodeURIComponent(input.agentId)}/messages`,
            {
              method: "POST",
              headers: authHeaders(accessToken.value),
              body: JSON.stringify(body),
            },
          );
          return readEnvelope<{ status?: string }>(response);
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.sendAgentMessage",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      });

      if (!result.success || !result.data) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.sendAgentMessage",
            message: result.error ?? "Failed to send message to cloud agent.",
          }),
        );
      }
      return {
        agentId: input.agentId,
        status: result.data.status ?? "running",
      } satisfies PlatformSendAgentMessageResult;
    }),

  stopAgent: (agentId: string) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return { stopped: false } satisfies PlatformStopAgentResult;
      }
      const baseUrl = resolveTrumboProviderBaseUrl();
      yield* Effect.tryPromise({
        try: async () => {
          await fetchWithTimeout(`${baseUrl}/agents/${encodeURIComponent(agentId)}/stop`, {
            method: "POST",
            headers: authHeaders(accessToken.value),
          });
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.stopAgent",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      });
      return { stopped: true } satisfies PlatformStopAgentResult;
    }),

  deleteAgent: (agentId: string) =>
    Effect.gen(function* () {
      const tokenManager = yield* TrumboPlatformTokenManager.TrumboPlatformTokenManager;
      const accessToken = yield* tokenManager.getAccessToken;
      if (Option.isNone(accessToken)) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.deleteAgent",
            message: "Sign in to Trumbo to delete cloud agents.",
          }),
        );
      }
      const baseUrl = resolveTrumboProviderBaseUrl();
      const result = yield* Effect.tryPromise({
        try: async () => {
          const response = await fetchWithTimeout(`${baseUrl}/agents/${encodeURIComponent(agentId)}`, {
            method: "DELETE",
            headers: authHeaders(accessToken.value),
          });
          return readEnvelope<{ deleted?: boolean; msUsed?: number }>(response);
        },
        catch: (cause) =>
          new PlatformEcosystemError({
            operation: "platform.deleteAgent",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      });
      if (!result.success || !result.data) {
        return yield* Effect.fail(
          new PlatformEcosystemError({
            operation: "platform.deleteAgent",
            message: result.error ?? "Failed to delete cloud agent.",
          }),
        );
      }
      return {
        deleted: result.data.deleted ?? true,
        msUsed: result.data.msUsed ?? 0,
      } satisfies PlatformDeleteAgentResult;
    }),
});

export type PlatformAgentService = ReturnType<typeof makePlatformAgentService>;
