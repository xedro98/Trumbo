import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createRpcEmitter, type RpcRequest, startRpcServer } from "./rpc-mode";

describe("rpc-mode", () => {
	it("startRpcServer processes requests and returns responses", async () => {
		const stdin = new PassThrough();
		const stdout = new PassThrough();
		const chunks: string[] = [];

		stdout.on("data", (chunk: Buffer) => {
			chunks.push(chunk.toString());
		});

		const serverPromise = startRpcServer({
			stdin,
			stdout,
			handler: async (request: RpcRequest) => {
				if (request.type === "ping") {
					return { pong: true };
				}
				return null;
			},
		});

		// Send a ping request
		stdin.write(`${JSON.stringify({ type: "ping", id: "1" })}\n`);
		// Send exit
		stdin.write(`${JSON.stringify({ type: "exit", id: "2" })}\n`);

		await serverPromise;

		const allOutput = chunks.join("");
		expect(allOutput).toContain("ready");
		expect(allOutput).toContain("pong");
		expect(allOutput).toContain('"ok":true');
	});

	it("handles invalid JSON gracefully", async () => {
		const stdin = new PassThrough();
		const stdout = new PassThrough();
		const chunks: string[] = [];

		stdout.on("data", (chunk: Buffer) => {
			chunks.push(chunk.toString());
		});

		const serverPromise = startRpcServer({
			stdin,
			stdout,
			handler: async () => null,
		});

		stdin.write("invalid json\n");
		stdin.write(`${JSON.stringify({ type: "exit" })}\n`);

		await serverPromise;

		const allOutput = chunks.join("");
		expect(allOutput).toContain("Invalid JSON");
	});

	it("handles handler errors gracefully", async () => {
		const stdin = new PassThrough();
		const stdout = new PassThrough();
		const chunks: string[] = [];

		stdout.on("data", (chunk: Buffer) => {
			chunks.push(chunk.toString());
		});

		const serverPromise = startRpcServer({
			stdin,
			stdout,
			handler: async () => {
				throw new Error("Handler error");
			},
		});

		stdin.write(`${JSON.stringify({ type: "test", id: "1" })}\n`);
		stdin.write(`${JSON.stringify({ type: "exit" })}\n`);

		await serverPromise;

		const allOutput = chunks.join("");
		expect(allOutput).toContain("Handler error");
		expect(allOutput).toContain('"ok":false');
	});

	it("createRpcEmitter writes events to stdout", () => {
		const stdout = new PassThrough();
		const chunks: string[] = [];

		stdout.on("data", (chunk: Buffer) => {
			chunks.push(chunk.toString());
		});

		const emit = createRpcEmitter(stdout);
		emit("test_event", { key: "value" });

		const output = chunks.join("");
		expect(output).toContain("test_event");
		expect(output).toContain('"key":"value"');
	});
});
