import { describe, expect, it, vi } from "vitest";
import { createRpcHandler } from "./rpc-handler";
import type { RpcRequest } from "./rpc-mode";

function createMockCore() {
	const emitted: Array<{ event: string; data: unknown }> = [];
	const emit = (event: string, data: unknown) => {
		emitted.push({ event, data });
	};
	const core = {
		start: vi.fn().mockResolvedValue({
			sessionId: "s1",
			manifest: { id: "s1" },
		}),
		send: vi.fn().mockResolvedValue({ text: "done" }),
		abort: vi.fn().mockResolvedValue(undefined),
		stop: vi.fn().mockResolvedValue(undefined),
		get: vi.fn().mockResolvedValue({ id: "s1", status: "idle" }),
		list: vi.fn().mockResolvedValue([{ id: "s1" }]),
		readMessages: vi.fn().mockResolvedValue([{ role: "user" }]),
		delete: vi.fn().mockResolvedValue(true),
		subscribe: vi.fn().mockReturnValue(() => {}),
		tree: {
			getSnapshot: vi.fn().mockResolvedValue({ entries: [] }),
			switchLeaf: vi.fn().mockResolvedValue(true),
		},
	};
	const handler = createRpcHandler(core as never, emit);
	return { core, handler, emitted, emit };
}

describe("createRpcHandler", () => {
	it("subscribes to core events and forwards them via emit", () => {
		const { core, emitted } = createMockCore();
		expect(core.subscribe).toHaveBeenCalledOnce();
		const listener = core.subscribe.mock.calls[0]?.[0] as (
			event: unknown,
		) => void;
		listener({ type: "agent_event", payload: { event: { type: "say" } } });
		expect(emitted).toEqual([
			{
				event: "agent_event",
				data: { type: "agent_event", payload: { event: { type: "say" } } },
			},
		]);
	});

	it("start maps config to core.start and returns sessionId + manifest", async () => {
		const { core, handler } = createMockCore();
		const res = await handler({
			type: "start",
			config: { foo: 1 },
		} as RpcRequest);
		expect(core.start).toHaveBeenCalledWith({ foo: 1 });
		expect(res).toEqual({ sessionId: "s1", manifest: { id: "s1" } });
	});

	it("send maps text/prompt to a SendSessionInput", async () => {
		const { core, handler } = createMockCore();
		await handler({
			type: "send",
			sessionId: "s1",
			text: "hello",
			mode: "plan",
			delivery: "queue",
		} as RpcRequest);
		expect(core.send).toHaveBeenCalledWith({
			sessionId: "s1",
			prompt: "hello",
			mode: "plan",
			delivery: "queue",
		});
	});

	it("send throws without a sessionId", async () => {
		const { handler } = createMockCore();
		await expect(
			handler({ type: "send", text: "x" } as RpcRequest),
		).rejects.toThrow("send requires a sessionId");
	});

	it("maps abort/stop/get/list/readMessages/delete to core methods", async () => {
		const { core, handler } = createMockCore();
		await handler({ type: "abort", sessionId: "s1" } as RpcRequest);
		expect(core.abort).toHaveBeenCalledWith("s1");
		await handler({ type: "stop", sessionId: "s1" } as RpcRequest);
		expect(core.stop).toHaveBeenCalledWith("s1");
		await handler({ type: "get", sessionId: "s1" } as RpcRequest);
		expect(core.get).toHaveBeenCalledWith("s1");
		await handler({ type: "list", limit: 5 } as RpcRequest);
		expect(core.list).toHaveBeenCalledWith(5);
		await handler({ type: "list" } as RpcRequest);
		expect(core.list).toHaveBeenLastCalledWith(200);
		await handler({ type: "readMessages", sessionId: "s1" } as RpcRequest);
		expect(core.readMessages).toHaveBeenCalledWith("s1");
		await handler({ type: "delete", sessionId: "s1" } as RpcRequest);
		expect(core.delete).toHaveBeenCalledWith("s1");
	});

	it("maps getTree/switchLeaf to the tree api", async () => {
		const { core, handler } = createMockCore();
		await handler({ type: "getTree", sessionId: "s1" } as RpcRequest);
		expect(core.tree.getSnapshot).toHaveBeenCalledWith("s1");
		await handler({
			type: "switchLeaf",
			sessionId: "s1",
			entryId: "e1",
		} as RpcRequest);
		expect(core.tree.switchLeaf).toHaveBeenCalledWith("s1", "e1");
	});

	it("switchLeaf throws without an entryId", async () => {
		const { handler } = createMockCore();
		await expect(
			handler({ type: "switchLeaf", sessionId: "s1" } as RpcRequest),
		).rejects.toThrow("switchLeaf requires an entryId");
	});

	it("throws on an unknown request type", async () => {
		const { handler } = createMockCore();
		await expect(handler({ type: "nope" } as RpcRequest)).rejects.toThrow(
			"Unknown RPC request type: nope",
		);
	});
});
