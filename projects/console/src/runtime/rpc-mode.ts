/**
 * RPC mode — JSONL stdin/stdout protocol for embedding Trumbo in other tools.
 *
 * Protocol: newline-delimited JSON. Each line is a JSON object with a `type`
 * field. Requests are sent to stdin, responses and events are written to stdout.
 *
 * Request types:
 * - `{ "type": "start", "config": {...} }` — start a new session
 * - `{ "type": "send", "sessionId": "...", "text": "..." }` — send a turn
 * - `{ "type": "abort", "sessionId": "..." }` — abort current run
 * - `{ "type": "stop", "sessionId": "..." }` — stop a session
 * - `{ "type": "get", "sessionId": "..." }` — get session info
 * - `{ "type": "list", "limit": 200 }` — list sessions
 * - `{ "type": "readMessages", "sessionId": "..." }` — read session messages
 * - `{ "type": "getTree", "sessionId": "..." }` — get session tree
 * - `{ "type": "switchLeaf", "sessionId": "...", "entryId": "..." }` — switch tree leaf
 * - `{ "type": "exit" }` — shut down the RPC server
 *
 * Response/event types:
 * - `{ "type": "result", "id": "...", "ok": true, "data": {...} }` — successful response
 * - `{ "type": "result", "id": "...", "ok": false, "error": "..." }` — error response
 * - `{ "type": "event", "event": "agent_event", "data": {...} }` — streaming event
 * - `{ "type": "ready" }` — server is ready
 *
 * @example
 * ```bash
 * echo '{"type":"start","config":{"providerId":"anthropic","modelId":"claude-sonnet-4-20250514"}}' | trumbo --mode rpc
 * ```
 */

import { createInterface, type Interface } from "node:readline";
import type { Readable, Writable } from "node:stream";

export interface RpcRequest {
	type: string;
	id?: string;
	[key: string]: unknown;
}

export interface RpcResponse {
	type: "result";
	id?: string;
	ok: boolean;
	data?: unknown;
	error?: string;
}

export interface RpcEvent {
	type: "event";
	event: string;
	data: unknown;
}

export type RpcMessage = RpcResponse | RpcEvent;

export interface RpcServerOptions {
	stdin: Readable;
	stdout: Writable;
	handler: (request: RpcRequest) => Promise<unknown>;
	onEvent?: (emit: (event: string, data: unknown) => void) => void;
	onExit?: () => void;
}

/**
 * Start an RPC server that reads JSONL from stdin and writes JSONL to stdout.
 *
 * Each request is processed asynchronously. Responses are written as soon as
 * they're available. The server runs until `exit` is received or stdin closes.
 */
export async function startRpcServer(options: RpcServerOptions): Promise<void> {
	const { stdin, stdout, handler, onExit } = options;
	const rl: Interface = createInterface({ input: stdin });

	const emit = (message: RpcMessage): void => {
		stdout.write(`${JSON.stringify(message)}\n`);
	};

	// Signal readiness
	emit({ type: "event", event: "ready", data: null });

	rl.on("line", async (line: string) => {
		const trimmed = line.trim();
		if (!trimmed) return;

		let request: RpcRequest;
		try {
			request = JSON.parse(trimmed) as RpcRequest;
		} catch {
			emit({
				type: "result",
				ok: false,
				error: `Invalid JSON: ${trimmed.slice(0, 100)}`,
			});
			return;
		}

		if (request.type === "exit") {
			emit({ type: "result", id: request.id, ok: true, data: null });
			rl.close();
			onExit?.();
			return;
		}

		try {
			const data = await handler(request);
			emit({ type: "result", id: request.id, ok: true, data });
		} catch (error) {
			emit({
				type: "result",
				id: request.id,
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	});

	return new Promise<void>((resolve) => {
		rl.on("close", () => {
			onExit?.();
			resolve();
		});
	});
}

/**
 * Create an RPC event emitter that writes events to stdout.
 */
export function createRpcEmitter(stdout: Writable) {
	return (event: string, data: unknown): void => {
		stdout.write(
			`${JSON.stringify({ type: "event", event, data } as RpcEvent)}\n`,
		);
	};
}
