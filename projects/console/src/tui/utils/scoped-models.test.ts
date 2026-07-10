import { describe, expect, it } from "vitest";
import {
	_resetScopedModelsCacheForTest,
	getNextScopedModel,
	loadScopedModels,
} from "./scoped-models";

describe("scoped-models", () => {
	beforeEach(() => {
		_resetScopedModelsCacheForTest();
	});

	it("loadScopedModels returns empty when no config", () => {
		const config = loadScopedModels();
		expect(config.models).toEqual([]);
	});

	it("getNextScopedModel returns undefined when no scoped models", () => {
		_resetScopedModelsCacheForTest();
		const result = getNextScopedModel("any-model");
		expect(result).toBeUndefined();
	});
});

import { beforeEach } from "vitest";
