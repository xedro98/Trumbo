import { useKeyboard } from "@opentui/react";
import type { ProviderConfigFieldKey } from "@trumbodev/core";
import type { Dispatch, SetStateAction } from "react";
import type { TrumboModelPickerEntry } from "../../components/model-selector/trumbo-model-picker";
import type { SearchableListState } from "../../components/searchable-list";
import {
	isOnboardingOAuthProviderId,
	type OnboardingOAuthProviderId,
} from "./auth";
import { FIELD_ORDER } from "./fields";
import {
	type MenuOption,
	type OnboardingStep,
	THINKING_LEVELS,
	type ThinkingLevel,
	type TrumboPassSubscriptionOption,
	type TrumboPassSubscriptionStatus,
} from "./model";

export function useOnboardingKeyboard(input: {
	step: OnboardingStep;
	onExit: () => void;
	oauthProvider: string;
	activeProviderId: string;
	menuOptions: MenuOption[];
	menuSelected: number;
	providerList: SearchableListState;
	modelList: SearchableListState;
	trumboEntries: TrumboModelPickerEntry[];
	trumboModelSelected: number;
	trumboPassSubscriptionStatus: TrumboPassSubscriptionStatus;
	trumboPassSubscriptionOptions: TrumboPassSubscriptionOption[];
	trumboPassSubscriptionSelected: number;
	thinkingSelected: number;
	setStep: (step: OnboardingStep) => void;
	setMenuSelected: Dispatch<SetStateAction<number>>;
	resetByoFields: () => void;
	byoFields: Partial<Record<ProviderConfigFieldKey, unknown>>;
	byoFocusedField: ProviderConfigFieldKey;
	setByoFocusedField: Dispatch<SetStateAction<ProviderConfigFieldKey>>;
	setDeviceUserCode: (value: string) => void;
	setDeviceVerifyUrl: (value: string) => void;
	setDeviceError: (value: string) => void;
	setDeviceStatus: (value: string) => void;
	setTrumboModelSelected: Dispatch<SetStateAction<number>>;
	setTrumboPassSubscriptionSelected: Dispatch<SetStateAction<number>>;
	setThinkingSelected: Dispatch<SetStateAction<number>>;
	continueFromTrumboPassSubscription: () => void;
	refreshTrumboPassSubscriptionStatus: () => void;
	openTrumboPassSubscriptionPage: () => void;
	abortOAuth: () => void;
	abortDeviceCode: () => void;
	resetAuth: () => void;
	refreshCodexCliStatus: () => void;
	startOAuthFlow: (providerId: OnboardingOAuthProviderId) => void;
	startDeviceCodeFlow: (providerId: OnboardingOAuthProviderId) => void;
	selectProvider: (providerId: string) => void;
	loadModelsForProvider: (providerId: string) => void;
	saveTrumboModelSelection: (modelId: string, modelName: string) => void;
	saveCodexCliConfig: () => void;
	saveByoConfig: () => void;
	saveModelSelection: () => void;
	saveThinkingLevel: (level: ThinkingLevel) => void;
}) {
	useKeyboard((key) => {
		if (input.step === "done") return;

		if (key.ctrl && key.name === "c") {
			input.onExit();
			return;
		}

		if (key.name === "escape") {
			if (input.step === "oauth_pending") {
				input.abortOAuth();
				input.resetAuth();
				input.setStep("menu");
				input.setMenuSelected(0);
				return;
			}
			if (input.step === "device_code") {
				input.abortDeviceCode();
				input.setDeviceUserCode("");
				input.setDeviceVerifyUrl("");
				input.setDeviceError("");
				input.setDeviceStatus("");
				input.setStep("menu");
				input.setMenuSelected(0);
				return;
			}
			if (input.step === "byo_apikey") {
				input.resetByoFields();
				input.setStep("byo_provider");
				return;
			}
			if (input.step === "byo_provider") {
				input.setStep("menu");
				input.setMenuSelected(0);
				return;
			}
			if (input.step === "codex_cli_setup") {
				input.setStep("byo_provider");
				return;
			}
			if (input.step === "trumbo_pass_subscription") {
				input.setStep("menu");
				input.setMenuSelected(0);
				return;
			}
			if (input.step === "trumbo_model") {
				input.setStep("menu");
				input.setMenuSelected(0);
				return;
			}
			if (input.step === "model_picker") {
				if (input.activeProviderId === "trumbo") {
					input.setTrumboModelSelected(0);
					input.setStep("trumbo_model");
				} else {
					input.setStep("menu");
					input.setMenuSelected(0);
				}
				return;
			}
			if (input.step === "custom_model_id") {
				input.setStep("model_picker");
				return;
			}
			if (input.step === "thinking_level") {
				if (input.activeProviderId === "trumbo") {
					input.setTrumboModelSelected(0);
					input.setStep("trumbo_model");
				} else {
					input.setStep("model_picker");
					input.loadModelsForProvider(input.activeProviderId);
				}
			}
			return;
		}

		if (input.step === "oauth_pending") {
			if (key.name === "d" && input.oauthProvider === "trumbo") {
				input.abortOAuth();
				input.resetAuth();
				input.startDeviceCodeFlow("trumbo");
			}
			return;
		}

		if (input.step === "device_code") return;

		if (input.step === "trumbo_pass_subscription") {
			const total = input.trumboPassSubscriptionOptions.length;
			if (total === 0) return;
			if (key.name === "up" || (key.ctrl && key.name === "p")) {
				input.setTrumboPassSubscriptionSelected((s) =>
					s <= 0 ? total - 1 : s - 1,
				);
				return;
			}
			if (key.name === "down" || (key.ctrl && key.name === "n")) {
				input.setTrumboPassSubscriptionSelected((s) =>
					s >= total - 1 ? 0 : s + 1,
				);
				return;
			}
			if (key.name === "return" || key.name === "enter") {
				const option =
					input.trumboPassSubscriptionOptions[
						Math.min(input.trumboPassSubscriptionSelected, total - 1)
					];
				if (!option) return;
				if (option.value === "subscribe") {
					input.openTrumboPassSubscriptionPage();
				} else if (option.value === "refresh") {
					if (input.trumboPassSubscriptionStatus !== "loading") {
						input.refreshTrumboPassSubscriptionStatus();
					}
				} else if (option.value === "skip") {
					input.continueFromTrumboPassSubscription();
				} else if (option.value === "back") {
					input.setStep("menu");
					input.setMenuSelected(0);
				}
			}
			return;
		}

		if (input.step === "menu") {
			const opts = input.menuOptions;
			const findNext = (from: number, dir: 1 | -1): number => {
				const n = opts.length;
				for (let step = 1; step <= n; step++) {
					const idx = (((from + dir * step) % n) + n) % n;
					if (!opts[idx]?.disabled) return idx;
				}
				return from;
			};
			if (key.name === "up") {
				input.setMenuSelected((s) => findNext(s, -1));
				return;
			}
			if (key.name === "down") {
				input.setMenuSelected((s) => findNext(s, 1));
				return;
			}
			if (key.name === "return") {
				const option = opts[input.menuSelected];
				if (!option || option.disabled) return;
				if (isOnboardingOAuthProviderId(option.value)) {
					input.startOAuthFlow(option.value);
				} else {
					input.setStep("byo_provider");
				}
			}
			return;
		}

		if (input.step === "byo_provider") {
			if (key.name === "up" || (key.ctrl && key.name === "p")) {
				input.providerList.moveUp();
				return;
			}
			if (key.name === "down" || (key.ctrl && key.name === "n")) {
				input.providerList.moveDown();
				return;
			}
			if (key.name === "return") {
				const item = input.providerList.selectedItem;
				if (item) input.selectProvider(item.key);
			}
			return;
		}

		if (input.step === "codex_cli_setup") {
			if (key.name === "r") {
				input.refreshCodexCliStatus();
				return;
			}
			if (key.name === "return") {
				input.saveCodexCliConfig();
			}
			return;
		}

		if (input.step === "byo_apikey") {
			if (key.name === "tab") {
				const visible = FIELD_ORDER.filter(
					(k) => input.byoFields[k] !== undefined,
				);
				if (visible.length > 1) {
					const idx = visible.indexOf(input.byoFocusedField);
					const nextIdx = key.shift
						? (idx - 1 + visible.length) % visible.length
						: (idx + 1) % visible.length;
					const next = visible[nextIdx];
					if (next) input.setByoFocusedField(next as ProviderConfigFieldKey);
				}
			}
			return;
		}

		if (input.step === "trumbo_model") {
			const total = input.trumboEntries.length;
			if (total === 0) return;
			if (key.name === "up" || (key.ctrl && key.name === "p")) {
				input.setTrumboModelSelected((s) => (s <= 0 ? total - 1 : s - 1));
				return;
			}
			if (key.name === "down" || (key.ctrl && key.name === "n")) {
				input.setTrumboModelSelected((s) => (s >= total - 1 ? 0 : s + 1));
				return;
			}
			if (key.name === "return") {
				const entry = input.trumboEntries[input.trumboModelSelected];
				if (!entry) return;
				if (entry.kind === "model") {
					input.saveTrumboModelSelection(entry.model.id, entry.model.name);
				} else {
					input.setStep("model_picker");
					input.loadModelsForProvider(input.activeProviderId);
				}
			}
			return;
		}

		if (input.step === "model_picker") {
			if (key.name === "up" || (key.ctrl && key.name === "p")) {
				input.modelList.moveUp();
				return;
			}
			if (key.name === "down" || (key.ctrl && key.name === "n")) {
				input.modelList.moveDown();
				return;
			}
			if (key.name === "return") {
				input.saveModelSelection();
			}
			return;
		}

		if (input.step === "thinking_level") {
			if (key.name === "up" || (key.ctrl && key.name === "p")) {
				input.setThinkingSelected((s) =>
					s <= 0 ? THINKING_LEVELS.length - 1 : s - 1,
				);
				return;
			}
			if (key.name === "down" || (key.ctrl && key.name === "n")) {
				input.setThinkingSelected((s) =>
					s >= THINKING_LEVELS.length - 1 ? 0 : s + 1,
				);
				return;
			}
			if (key.name === "return") {
				const level = THINKING_LEVELS[input.thinkingSelected];
				if (level) input.saveThinkingLevel(level.value);
			}
		}
	});
}
