import type {
	SendSessionInput,
	StartSessionInput,
	TrumboCore,
} from "@trumbodev/core";
import type { RpcRequest } from "./rpc-mode";

/**
 * Build the RPC request handler that maps JSONL requests to TrumboCore
 * session/tree operations. All session events observed via `core.subscribe`
 * are forwarded to the RPC client as `event` messages (the client filters by
 * `sessionId` in the event payload).
 */
export function createRpcHandler(
	core: TrumboCore,
	emit: (event: string, data: unknown) => void,
): (request: RpcRequest) => Promise<unknown> {
	// Forward every session event to the RPC client. Events carry their
	// sessionId in the payload, so a multi-session client can route them.
	core.subscribe((event) => {
		emit("agent_event", event);
	});

	const requireSessionId = (request: RpcRequest): string => {
		if (typeof request.sessionId !== "string" || !request.sessionId) {
			throw new Error(`${request.type} requires a sessionId`);
		}
		return request.sessionId;
	};

	return async (request: RpcRequest): Promise<unknown> => {
		switch (request.type) {
			case "start": {
				const input = (request.config ?? {}) as StartSessionInput;
				const result = await core.start(input);
				return {
					sessionId: result.sessionId,
					manifest: result.manifest,
				};
			}

			case "send": {
				const sessionId = requireSessionId(request);
				const sendInput: SendSessionInput = {
					sessionId,
					prompt:
						typeof request.text === "string"
							? request.text
							: String(request.prompt ?? ""),
					...(request.mode ? { mode: request.mode as never } : {}),
					...(request.delivery ? { delivery: request.delivery as never } : {}),
					...(Array.isArray(request.userImages)
						? { userImages: request.userImages as string[] }
						: {}),
					...(Array.isArray(request.userFiles)
						? { userFiles: request.userFiles as string[] }
						: {}),
				};
				return await core.send(sendInput);
			}

			case "abort": {
				const sessionId = requireSessionId(request);
				await core.abort(sessionId);
				return { ok: true };
			}

			case "stop": {
				const sessionId = requireSessionId(request);
				await core.stop(sessionId);
				return { ok: true };
			}

			case "get": {
				return await core.get(requireSessionId(request));
			}

			case "list": {
				return await core.list(
					typeof request.limit === "number" ? request.limit : 200,
				);
			}

			case "readMessages": {
				return await core.readMessages(requireSessionId(request));
			}

			case "getTree": {
				return await core.tree.getSnapshot(requireSessionId(request));
			}

			case "switchLeaf": {
				const sessionId = requireSessionId(request);
				if (typeof request.entryId !== "string" || !request.entryId) {
					throw new Error("switchLeaf requires an entryId");
				}
				return await core.tree.switchLeaf(sessionId, request.entryId);
			}

			case "delete": {
				return await core.delete(requireSessionId(request));
			}

			default:
				throw new Error(`Unknown RPC request type: ${request.type}`);
		}
	};
}
