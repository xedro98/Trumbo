import { describe, expect, it, vi } from "vitest";
import { createReconfigScheduler } from "./reconfig-scheduler";

describe("createReconfigScheduler", () => {
	it("runs actions immediately when idle", async () => {
		const action = vi.fn(async () => {});
		const scheduler = createReconfigScheduler({
			isRunning: () => false,
			isShutdown: () => false,
		});

		await scheduler.runSerialized(action);

		expect(action).toHaveBeenCalledOnce();
	});

	it("queues actions while running and flushes them when idle", async () => {
		let running = true;
		const first = vi.fn(async () => {});
		const second = vi.fn(async () => {});
		const scheduler = createReconfigScheduler({
			isRunning: () => running,
			isShutdown: () => false,
		});

		await scheduler.enqueueWhenIdle(first);
		expect(first).not.toHaveBeenCalled();
		expect(scheduler.getPendingCount()).toBe(1);

		running = false;
		scheduler.flushPending();
		await scheduler.waitForIdle();

		expect(first).toHaveBeenCalledOnce();
		expect(second).not.toHaveBeenCalled();

		await scheduler.enqueueWhenIdle(second);
		await scheduler.waitForIdle();
		expect(second).toHaveBeenCalledOnce();
	});

	it("serializes concurrent immediate actions", async () => {
		const order: string[] = [];
		const scheduler = createReconfigScheduler({
			isRunning: () => false,
			isShutdown: () => false,
		});

		const first = scheduler.runSerialized(async () => {
			order.push("first-start");
			await new Promise((resolve) => setTimeout(resolve, 20));
			order.push("first-end");
		});
		const second = scheduler.runSerialized(async () => {
			order.push("second");
		});

		await Promise.all([first, second]);

		expect(order).toEqual(["first-start", "first-end", "second"]);
	});

	it("does not flush when shutdown is requested", async () => {
		let shutdown = false;
		const action = vi.fn(async () => {});
		const scheduler = createReconfigScheduler({
			isRunning: () => true,
			isShutdown: () => shutdown,
		});

		await scheduler.enqueueWhenIdle(action);
		shutdown = true;
		scheduler.flushPending();
		await scheduler.waitForIdle();

		expect(action).not.toHaveBeenCalled();
	});
});
