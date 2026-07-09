export type ReconfigSchedulerInput = {
	isRunning: () => boolean;
	isShutdown: () => boolean;
};

export function createReconfigScheduler(input: ReconfigSchedulerInput) {
	let chain: Promise<void> = Promise.resolve();
	const pending: Array<() => Promise<void>> = [];

	const runSerialized = (action: () => Promise<void>): Promise<void> => {
		if (input.isShutdown()) {
			return Promise.resolve();
		}
		const next = chain
			.then(async () => {
				if (input.isShutdown()) {
					return;
				}
				await action();
			})
			.catch(() => {});
		chain = next;
		return next;
	};

	const enqueueWhenIdle = (action: () => Promise<void>): Promise<void> => {
		if (input.isShutdown()) {
			return Promise.resolve();
		}
		if (input.isRunning()) {
			pending.push(action);
			return Promise.resolve();
		}
		return runSerialized(action);
	};

	const flushPending = (): void => {
		if (input.isRunning() || input.isShutdown() || pending.length === 0) {
			return;
		}
		const batch = pending.splice(0);
		void runSerialized(async () => {
			for (const action of batch) {
				if (input.isRunning() || input.isShutdown()) {
					pending.unshift(...batch.slice(batch.indexOf(action)));
					return;
				}
				await action();
			}
		});
	};

	const waitForIdle = async (): Promise<void> => {
		await chain;
	};

	return {
		enqueueWhenIdle,
		runSerialized,
		flushPending,
		waitForIdle,
		getPendingCount: () => pending.length,
	};
}
