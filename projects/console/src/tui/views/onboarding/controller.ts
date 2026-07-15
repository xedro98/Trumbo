import {
	captureProviderConfigured,
	getLocalProviderModels,
	getProviderConfigFields,
	type ProviderConfigFieldKey,
	type ProviderConfigFields,
	ProviderSettingsManager,
	refreshProviderModelsFromSource,
	resolveProviderConfig,
	saveLocalProviderSettings,
} from "@trumbodev/core";
import { isTrumboProvider } from "@trumbodev/shared";
import open from "open";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	type CodexCliStatus,
	checkCodexCliInstalled,
	isOpenAICodexCliProvider,
} from "../../../utils/codex-cli";
import { getPersistedProviderApiKey } from "../../../utils/provider-auth";
import { listLocalProviders } from "../../../utils/provider-catalog";
import { getCliTelemetryService } from "../../../utils/telemetry";
import {
	getCliSubscriptionUrl,
	getIndividualPlanFeatures,
} from "../../../utils/trumbo-pass-errors";
import {
	buildTrumboModelEntries,
	type TrumboModelPickerEntry,
	useTrumboRecommendedModels,
} from "../../components/model-selector/trumbo-model-picker";
import {
	type SearchableItem,
	useSearchableList,
} from "../../components/searchable-list";
import { palette } from "../../palette";
import {
	loadCurrentUserPlanFromProviderSettings,
	loadIndividualSubscriptionPlansFromProviderSettings,
} from "../../trumbo-account";
import {
	getDefaultAwsRegion,
	type ProviderConfigValues,
	resolveProviderConfigAwsRegion,
	resolveProviderConfigAzure,
	resolveProviderConfigSap,
	updateProviderConfigValue,
} from "../../utils/provider-config-values";
import { getProviderSection } from "../../utils/provider-sections";
import {
	isOnboardingOAuthProviderId,
	type OnboardingOAuthProviderId,
	runDeviceCodeAuthFlow,
	runOAuthAuthFlow,
} from "./auth";
import { FIELD_ORDER } from "./fields";
import { useOnboardingKeyboard } from "./keyboard";
import {
	getMainMenuOptions,
	type ModelEntry,
	type OnboardingResult,
	type OnboardingStep,
	type ProviderEntry,
	type ReasoningEffort,
	shouldUseFeaturedTrumboModelPicker,
	type ThinkingLevel,
	TRUMBO_PASS_SUBSCRIPTION_OPTIONS,
	type TrumboPassSubscriptionStatus,
	toModelEntriesFromKnownModels,
	toModelEntry,
	toProviderEntry,
} from "./model";

const CUSTOM_MODEL_ID_ACTION = "__custom_model_id__";

export interface OnboardingControllerProps {
	onComplete: (result: OnboardingResult) => void;
	onExit: () => void;
	providerSettingsManager?: ProviderSettingsManager;
}

export function useOnboardingController(props: OnboardingControllerProps) {
	const { onComplete } = props;
	const providerSettingsManager = useMemo(
		() => props.providerSettingsManager ?? new ProviderSettingsManager(),
		[props.providerSettingsManager],
	);
	const menuOptions = useMemo(
		() =>
			getMainMenuOptions({
				isTrumboPassEnabled: false,
			}),
		[],
	);
	const [step, setStep] = useState<OnboardingStep>("menu");
	const [menuSelected, setMenuSelected] = useState(0);
	const [oauthProvider, setOauthProvider] = useState("");
	const [authStatus, setAuthStatus] = useState("");
	const [authUrl, setAuthUrl] = useState("");
	const [authError, setAuthError] = useState("");
	const [activeProviderId, setActiveProviderId] = useState("");
	const [activeProviderName, setActiveProviderName] = useState("");
	const [byoFields, setByoFields] = useState<ProviderConfigFields["fields"]>(
		{},
	);
	const [byoDescription, setByoDescription] = useState<string | undefined>();
	const [byoValues, setByoValues] = useState<ProviderConfigValues>({});
	const [byoFocusedField, setByoFocusedField] =
		useState<ProviderConfigFieldKey>("apiKey");
	const [codexCliStatus, setCodexCliStatus] = useState<
		CodexCliStatus | undefined
	>();
	const [codexCliChecking, setCodexCliChecking] = useState(false);
	const authAbortRef = useRef(false);

	// Device code flow
	const [deviceUserCode, setDeviceUserCode] = useState("");
	const [deviceVerifyUrl, setDeviceVerifyUrl] = useState("");
	const [deviceStatus, setDeviceStatus] = useState("");
	const [deviceError, setDeviceError] = useState("");
	const deviceAbortRef = useRef(false);

	// Provider catalog
	const [providers, setProviders] = useState<ProviderEntry[]>([]);
	const [providersLoading, setProvidersLoading] = useState(true);

	useEffect(() => {
		listLocalProviders(providerSettingsManager)
			.then(({ providers: list }) => {
				setProviders(list.map(toProviderEntry));
			})
			.catch(() => {})
			.finally(() => setProvidersLoading(false));
	}, [providerSettingsManager]);

	const providerItems: SearchableItem[] = useMemo(
		() =>
			providers.map((p) => ({
				key: p.id,
				label: p.name,
				section: getProviderSection(p),
				detail: p.isOAuth
					? "(OAuth)"
					: p.isLocalAuth
						? "(local CLI)"
						: undefined,
				searchText: `${p.name} ${p.id}`,
				rightLabel: p.hasAuth ? "\u25cf" : undefined,
				rightLabelColor: palette.success,
			})),
		[providers],
	);

	const providerList = useSearchableList(providerItems);

	// Model catalog for selected provider
	const [modelEntries, setModelEntries] = useState<ModelEntry[]>([]);
	const [modelsLoading, setModelsLoading] = useState(false);
	const [modelsDefaultId, setModelsDefaultId] = useState("");
	const [customModelId, setCustomModelId] = useState("");
	const [customModelError, setCustomModelError] = useState("");
	const [trumboPassSubscriptionStatus, setTrumboPassSubscriptionStatus] =
		useState<TrumboPassSubscriptionStatus>("loading");
	const [trumboPassSubscriptionError, setTrumboPassSubscriptionError] =
		useState("");
	const [trumboPassCurrentPlanName, setTrumboPassCurrentPlanName] =
		useState("");
	const [trumboPassPlanFeatures, setTrumboPassPlanFeatures] = useState<
		string[]
	>([]);
	const [trumboPassSubscriptionSelected, setTrumboPassSubscriptionSelected] =
		useState(0);
	const [
		trumboPassSubscriptionOpenStatus,
		setTrumboPassSubscriptionOpenStatus,
	] = useState("");
	const trumboPassSubscriptionUrl = useMemo(() => getCliSubscriptionUrl(), []);

	const modelItems: SearchableItem[] = useMemo(
		() =>
			modelEntries.map((m) => ({
				key: m.id,
				label: m.name,
				searchText: `${m.name} ${m.id}`,
				rightLabel: m.id === modelsDefaultId ? "(default)" : undefined,
				rightLabelColor: "gray",
			})),
		[modelEntries, modelsDefaultId],
	);

	const createCustomModelItem = useCallback(
		(_search: string, filteredItems: SearchableItem[]) => {
			if (activeProviderId === "trumbo-pass") {
				return undefined;
			}
			if (filteredItems.some((item) => item.key === CUSTOM_MODEL_ID_ACTION)) {
				return undefined;
			}
			return {
				key: CUSTOM_MODEL_ID_ACTION,
				label: "Create custom model ID",
				detail: "manual entry",
				searchText: "create custom model id manual entry",
			} satisfies SearchableItem;
		},
		[activeProviderId],
	);

	const modelList = useSearchableList(modelItems, createCustomModelItem);

	// Trumbo featured model picker
	const recommended = useTrumboRecommendedModels();
	const trumboEntries: TrumboModelPickerEntry[] = useMemo(
		() => (recommended.data ? buildTrumboModelEntries(recommended.data) : []),
		[recommended.data],
	);
	const [trumboModelSelected, setTrumboModelSelected] = useState(0);
	const [trumboModelReasoningIds, setTrumboModelReasoningIds] = useState<
		Set<string>
	>(new Set());
	const [trumboKnownModels, setTrumboKnownModels] = useState<
		Record<string, unknown> | undefined
	>(undefined);

	useEffect(() => {
		getLocalProviderModels("trumbo")
			.then(({ models }) => {
				const ids = new Set<string>();
				for (const m of models) {
					if (m.supportsReasoning) ids.add(m.id);
				}
				setTrumboModelReasoningIds(ids);
			})
			.catch(() => {});
		resolveProviderConfig("trumbo")
			.then((resolved) => {
				if (resolved?.knownModels) setTrumboKnownModels(resolved.knownModels);
			})
			.catch(() => {});
	}, []);

	// Thinking level
	const [thinkingSelected, setThinkingSelected] = useState(0);
	const [selectedModelName, setSelectedModelName] = useState("");
	const [selectedModelId, setSelectedModelId] = useState("");
	const [selectedThinking, setSelectedThinking] = useState(false);
	const [selectedReasoningEffort, setSelectedReasoningEffort] = useState<
		ReasoningEffort | undefined
	>(undefined);

	const loadModelsForProvider = useCallback(
		(providerId: string) => {
			setModelsLoading(true);
			setModelEntries([]);
			refreshProviderModelsFromSource(providerSettingsManager, providerId)
				.catch(() => {})
				.then(async () => {
					const providerConfig = providerSettingsManager.getProviderConfig(
						providerId,
						{ includeKnownModels: false },
					);
					const resolved = await resolveProviderConfig(
						providerId,
						{
							loadLatestOnInit: true,
							loadPrivateOnAuth: true,
							failOnError: false,
						},
						providerConfig,
					);
					const resolvedModels = toModelEntriesFromKnownModels(
						resolved?.knownModels,
					);
					if (resolvedModels.length > 0) {
						setModelsDefaultId(resolved?.modelId ?? "");
						return resolvedModels;
					}
					const { models } = await getLocalProviderModels(
						providerId,
						providerConfig,
					);
					return models.map(toModelEntry);
				})
				.then((models) => {
					setModelEntries(models);
				})
				.catch(() => {})
				.finally(() => setModelsLoading(false));
		},
		[providerSettingsManager],
	);

	const refreshTrumboPassSubscriptionStatus = useCallback(() => {
		setTrumboPassSubscriptionStatus("loading");
		setTrumboPassSubscriptionError("");
		setTrumboPassCurrentPlanName("");
		setTrumboPassSubscriptionOpenStatus("");

		loadCurrentUserPlanFromProviderSettings({ providerSettingsManager })
			.then(
				(value) => ({ status: "fulfilled" as const, value }),
				(reason) => ({ status: "rejected" as const, reason }),
			)
			.then((currentPlanResult) =>
				loadIndividualSubscriptionPlansFromProviderSettings({
					providerSettingsManager,
				})
					.then(
						(value) => ({ status: "fulfilled" as const, value }),
						(reason) => ({ status: "rejected" as const, reason }),
					)
					.then((availablePlansResult) => ({
						availablePlansResult,
						currentPlanResult,
					})),
			)
			.then(({ currentPlanResult, availablePlansResult }) => {
				if (availablePlansResult.status === "fulfilled") {
					setTrumboPassPlanFeatures(
						getIndividualPlanFeatures(availablePlansResult.value),
					);
				}

				if (currentPlanResult.status === "rejected") {
					const error = currentPlanResult.reason;
					const message =
						error instanceof Error ? error.message : String(error);
					if (message.trim().toLowerCase() === "no plan found for user") {
						setTrumboPassSubscriptionStatus("unsubscribed");
						return;
					}
					setTrumboPassSubscriptionError(message);
					setTrumboPassSubscriptionStatus("error");
					return;
				}

				const plan = currentPlanResult.value?.plan;
				if (plan) {
					setTrumboPassCurrentPlanName(
						plan.displayName || plan.name || plan.id || "TrumboPass",
					);
					setTrumboPassSubscriptionStatus("subscribed");
				} else {
					setTrumboPassSubscriptionStatus("unsubscribed");
				}
			});
	}, [providerSettingsManager]);

	const transitionToModelPicker = useCallback(
		(providerId: string) => {
			setActiveProviderId(providerId);
			const provider = providers.find((p) => p.id === providerId);
			setActiveProviderName(provider?.name ?? providerId);
			setModelsDefaultId(provider?.defaultModelId ?? "");
			if (shouldUseFeaturedTrumboModelPicker(providerId)) {
				setTrumboModelSelected(0);
				setStep("trumbo_model");
			} else if (providerId === "openai-compatible") {
				const existing =
					providerSettingsManager.getProviderSettings(providerId);
				setCustomModelId(existing?.model ?? provider?.defaultModelId ?? "");
				setCustomModelError("");
				setStep("custom_model_id");
			} else {
				setStep("model_picker");
				loadModelsForProvider(providerId);
			}
		},
		[providers, loadModelsForProvider, providerSettingsManager],
	);

	const transitionToTrumboPassSubscription = useCallback(() => {
		setActiveProviderId("trumbo-pass");
		const provider = providers.find((p) => p.id === "trumbo-pass");
		setActiveProviderName(provider?.name ?? "TrumboPass");
		setModelsDefaultId(provider?.defaultModelId ?? "");
		setTrumboPassSubscriptionSelected(0);
		setStep("trumbo_pass_subscription");
		refreshTrumboPassSubscriptionStatus();
	}, [providers, refreshTrumboPassSubscriptionStatus]);

	const handleAuthComplete = useCallback(
		(providerId: OnboardingOAuthProviderId) => {
			if (providerId === "trumbo-pass") {
				transitionToTrumboPassSubscription();
				return;
			}
			transitionToModelPicker(providerId);
		},
		[transitionToTrumboPassSubscription, transitionToModelPicker],
	);

	const resetAuth = useCallback(() => {
		setAuthStatus("");
		setAuthUrl("");
		setAuthError("");
		authAbortRef.current = false;
	}, []);

	const startDeviceCodeFlow = useCallback(
		(providerId: OnboardingOAuthProviderId) => {
			deviceAbortRef.current = false;
			setDeviceUserCode("");
			setDeviceVerifyUrl("");
			setDeviceError("");
			setDeviceStatus("Requesting device code...");
			setOauthProvider(providerId);
			setStep("device_code");

			runDeviceCodeAuthFlow({
				providerId,
				providerSettingsManager,
				isAborted: () => deviceAbortRef.current,
				setUserCode: setDeviceUserCode,
				setVerifyUrl: setDeviceVerifyUrl,
				setStatus: setDeviceStatus,
				setError: setDeviceError,
				onComplete: handleAuthComplete,
				telemetry: getCliTelemetryService(),
			});
		},
		[providerSettingsManager, handleAuthComplete],
	);

	const startOAuthFlow = useCallback(
		(providerId: OnboardingOAuthProviderId) => {
			if (isTrumboProvider(providerId)) {
				startDeviceCodeFlow(providerId);
				return;
			}

			resetAuth();
			setOauthProvider(providerId);
			setStep("oauth_pending");
			setAuthStatus("Opening browser...");

			runOAuthAuthFlow({
				providerId,
				providerSettingsManager,
				isAborted: () => authAbortRef.current,
				setStatus: setAuthStatus,
				setAuthUrl,
				setError: setAuthError,
				onComplete: handleAuthComplete,
				telemetry: getCliTelemetryService(),
			});
		},
		[
			providerSettingsManager,
			resetAuth,
			handleAuthComplete,
			startDeviceCodeFlow,
		],
	);

	const continueFromTrumboPassSubscription = useCallback(() => {
		transitionToModelPicker("trumbo-pass");
	}, [transitionToModelPicker]);

	const openTrumboPassSubscriptionPage = useCallback(() => {
		setTrumboPassSubscriptionOpenStatus("Opening subscription page...");
		void open(trumboPassSubscriptionUrl, { wait: false })
			.then(() => {
				setTrumboPassSubscriptionOpenStatus(
					"Opened subscription page in your browser.",
				);
			})
			.catch(() => {
				setTrumboPassSubscriptionOpenStatus(
					`Could not open browser automatically. Open ${trumboPassSubscriptionUrl}`,
				);
			});
	}, [trumboPassSubscriptionUrl]);

	useEffect(() => {
		if (
			step === "trumbo_pass_subscription" &&
			trumboPassSubscriptionStatus === "subscribed"
		) {
			transitionToModelPicker("trumbo-pass");
		}
	}, [step, trumboPassSubscriptionStatus, transitionToModelPicker]);

	const refreshCodexCliStatus = useCallback(() => {
		setCodexCliStatus(undefined);
		setCodexCliChecking(true);
		checkCodexCliInstalled()
			.then(setCodexCliStatus)
			.catch((error: unknown) => {
				setCodexCliStatus({
					installed: false,
					reason: error instanceof Error ? error.message : String(error),
				});
			})
			.finally(() => setCodexCliChecking(false));
	}, []);

	const selectProvider = useCallback(
		(providerId: string) => {
			const provider = providers.find((p) => p.id === providerId);
			if (!provider) return;
			if (provider.isOAuth) {
				if (isOnboardingOAuthProviderId(provider.id)) {
					startOAuthFlow(provider.id);
				}
				return;
			}
			if (provider.isLocalAuth || isOpenAICodexCliProvider(provider.id)) {
				setActiveProviderId(provider.id);
				setActiveProviderName(provider.name);
				setCodexCliStatus(undefined);
				setStep("codex_cli_setup");
				refreshCodexCliStatus();
				return;
			}
			const config = getProviderConfigFields(provider.id);
			setActiveProviderId(provider.id);
			setActiveProviderName(provider.name);
			setByoFields(config.fields);
			setByoDescription(config.description);

			// Build initial values from existing settings
			const existing = providerSettingsManager.getProviderSettings(provider.id);
			const initialValues: ProviderConfigValues = {};
			if (config.fields.baseUrl) {
				initialValues.baseUrl =
					existing?.baseUrl?.trim() ??
					config.fields.baseUrl?.defaultValue ??
					"";
			}
			if (config.fields.azureApiVersion) {
				initialValues.azureApiVersion =
					existing?.azure?.apiVersion?.trim() ?? "";
			}
			if (config.fields.awsRegion) {
				const existingProfile = existing?.aws?.profile?.trim() ?? "";
				initialValues.awsRegion =
					existing?.aws?.region?.trim() || getDefaultAwsRegion(existingProfile);
			}
			if (config.fields.apiKey) {
				initialValues.apiKey = existing?.apiKey?.trim() ?? "";
			}
			if (config.fields.awsProfile) {
				initialValues.awsProfile = existing?.aws?.profile?.trim() ?? "";
			}
			if (config.fields.sapClientId) {
				initialValues.sapClientId = existing?.sap?.clientId?.trim() ?? "";
			}
			if (config.fields.sapClientSecret) {
				initialValues.sapClientSecret =
					existing?.sap?.clientSecret?.trim() ?? "";
			}
			if (config.fields.sapTokenUrl) {
				initialValues.sapTokenUrl = existing?.sap?.tokenUrl?.trim() ?? "";
			}
			if (config.fields.sapResourceGroup) {
				initialValues.sapResourceGroup =
					existing?.sap?.resourceGroup?.trim() ?? "default";
			}
			if (config.fields.sapDeploymentId) {
				initialValues.sapDeploymentId =
					existing?.sap?.deploymentId?.trim() ?? "";
			}
			setByoValues(initialValues);

			// Focus the first visible field
			const firstField = FIELD_ORDER.find(
				(k) => config.fields[k] !== undefined,
			);
			setByoFocusedField(firstField ?? "apiKey");
			setStep("byo_apikey");
		},
		[providers, startOAuthFlow, refreshCodexCliStatus, providerSettingsManager],
	);

	const saveCodexCliConfig = useCallback(() => {
		if (!codexCliStatus?.installed) {
			return;
		}
		saveLocalProviderSettings(providerSettingsManager, {
			providerId: activeProviderId,
		});
		transitionToModelPicker(activeProviderId);
	}, [
		activeProviderId,
		codexCliStatus,
		providerSettingsManager,
		transitionToModelPicker,
	]);

	const saveByoConfig = useCallback(() => {
		// No required-field validation. If credentials are missing or wrong,
		// the provider's own auth response is the authoritative error and is
		// surfaced when the model picker / first turn runs.
		const apiKey = byoValues.apiKey?.trim();
		const awsProfile = byoValues.awsProfile?.trim();
		const hasAzureFields = byoFields.azureApiVersion;
		const hasAwsFields = byoFields.awsRegion || byoFields.awsProfile;
		const hasSapFields =
			byoFields.sapClientId ||
			byoFields.sapClientSecret ||
			byoFields.sapTokenUrl ||
			byoFields.sapResourceGroup ||
			byoFields.sapDeploymentId;

		saveLocalProviderSettings(providerSettingsManager, {
			providerId: activeProviderId,
			apiKey: byoFields.apiKey ? apiKey : undefined,
			baseUrl: byoFields.baseUrl ? byoValues.baseUrl?.trim() : undefined,
			azure: hasAzureFields ? resolveProviderConfigAzure(byoValues) : undefined,
			aws: hasAwsFields
				? {
						region: resolveProviderConfigAwsRegion(byoValues),
						authentication: apiKey ? "api-key" : "profile",
						profile: apiKey ? undefined : awsProfile || undefined,
					}
				: undefined,
			sap: hasSapFields ? resolveProviderConfigSap(byoValues) : undefined,
		});
		// Emit a single `user.provider_configured` event mirroring the
		// `{ provider }` payload shape used by the auth funnel. The save above
		// is synchronous and infallible, so there's no start/fail counterpart;
		// invalid credentials surface later as `task.provider_api_error` on
		// the first real API call.
		captureProviderConfigured(getCliTelemetryService(), activeProviderId);
		transitionToModelPicker(activeProviderId);
	}, [
		byoValues,
		byoFields,
		activeProviderId,
		providerSettingsManager,
		transitionToModelPicker,
	]);

	const completeModelSelection = useCallback(
		(modelId: string) => {
			const existing =
				providerSettingsManager.getProviderSettings(activeProviderId);
			providerSettingsManager.saveProviderSettings(
				{ ...(existing ?? { provider: activeProviderId }), model: modelId },
				{ setLastUsed: true },
			);
			setSelectedModelId(modelId);
			const entry = modelEntries.find((m) => m.id === modelId);
			if (entry?.supportsReasoning) {
				setSelectedModelName(entry.name);
				setThinkingSelected(0);
				setStep("thinking_level");
			} else {
				setStep("done");
			}
		},
		[activeProviderId, modelEntries, providerSettingsManager],
	);

	const selectModelItem = useCallback(
		(item: SearchableItem | undefined) => {
			if (!item) return;
			if (item.key === CUSTOM_MODEL_ID_ACTION) {
				setCustomModelId("");
				setCustomModelError("");
				setStep("custom_model_id");
				return;
			}
			completeModelSelection(item.key);
		},
		[completeModelSelection],
	);

	const saveModelSelection = useCallback(() => {
		selectModelItem(modelList.selectedItem);
	}, [modelList.selectedItem, selectModelItem]);

	const saveCustomModelId = useCallback(() => {
		const modelId = customModelId.trim();
		if (!modelId) {
			setCustomModelError("Enter a model ID");
			return;
		}
		completeModelSelection(modelId);
	}, [customModelId, completeModelSelection]);

	const saveTrumboModelSelection = useCallback(
		(modelId: string, modelName: string) => {
			const existing =
				providerSettingsManager.getProviderSettings(activeProviderId);
			providerSettingsManager.saveProviderSettings(
				{
					...(existing ?? { provider: activeProviderId }),
					model: modelId,
				},
				{ setLastUsed: true },
			);
			setSelectedModelId(modelId);
			if (trumboModelReasoningIds.has(modelId)) {
				setSelectedModelName(modelName);
				setThinkingSelected(0);
				setStep("thinking_level");
			} else {
				setStep("done");
			}
		},
		[activeProviderId, trumboModelReasoningIds, providerSettingsManager],
	);

	const saveThinkingLevel = useCallback(
		(level: ThinkingLevel) => {
			const existing =
				providerSettingsManager.getProviderSettings(activeProviderId);
			if (level === "none") {
				providerSettingsManager.saveProviderSettings({
					...(existing ?? { provider: activeProviderId }),
					reasoning: { enabled: false },
				});
				setSelectedThinking(false);
				setSelectedReasoningEffort(undefined);
			} else {
				providerSettingsManager.saveProviderSettings({
					...(existing ?? { provider: activeProviderId }),
					reasoning: { enabled: true, effort: level },
				});
				setSelectedThinking(true);
				setSelectedReasoningEffort(level);
			}
			setStep("done");
		},
		[activeProviderId, providerSettingsManager],
	);

	useEffect(() => {
		if (step !== "done") return undefined;
		const timer = setTimeout(() => {
			const providerSettings =
				providerSettingsManager.getProviderSettings(activeProviderId);
			onComplete({
				providerId: activeProviderId,
				modelId: selectedModelId,
				apiKey: getPersistedProviderApiKey(activeProviderId, providerSettings),
				thinking: selectedThinking,
				reasoningEffort: selectedReasoningEffort,
			});
		}, 500);
		return () => clearTimeout(timer);
	}, [
		step,
		onComplete,
		activeProviderId,
		selectedModelId,
		selectedThinking,
		selectedReasoningEffort,
		providerSettingsManager,
	]);

	useOnboardingKeyboard({
		step,
		onExit: props.onExit,
		oauthProvider,
		activeProviderId,
		menuOptions,
		menuSelected,
		providerList,
		modelList,
		trumboEntries,
		trumboModelSelected,
		trumboPassSubscriptionStatus,
		trumboPassSubscriptionOptions: TRUMBO_PASS_SUBSCRIPTION_OPTIONS,
		trumboPassSubscriptionSelected,
		thinkingSelected,
		setStep,
		setMenuSelected,
		resetByoFields: () => {
			setByoFields({});
			setByoValues({});
			setByoDescription(undefined);
		},
		byoFields,
		byoFocusedField,
		setByoFocusedField,
		setDeviceUserCode,
		setDeviceVerifyUrl,
		setDeviceError,
		setDeviceStatus,
		setTrumboModelSelected,
		setTrumboPassSubscriptionSelected,
		setThinkingSelected,
		continueFromTrumboPassSubscription,
		refreshTrumboPassSubscriptionStatus,
		openTrumboPassSubscriptionPage,
		abortOAuth: () => {
			authAbortRef.current = true;
		},
		abortDeviceCode: () => {
			deviceAbortRef.current = true;
		},
		resetAuth,
		refreshCodexCliStatus,
		startOAuthFlow,
		startDeviceCodeFlow,
		selectProvider,
		loadModelsForProvider,
		saveTrumboModelSelection,
		saveCodexCliConfig,
		saveByoConfig,
		saveModelSelection,
		saveThinkingLevel,
	});

	return {
		activeProviderName,
		activeProviderId,
		authError,
		authStatus,
		authUrl,
		byoDescription,
		byoFields,
		byoFocusedField,
		byoValues,
		codexCliChecking,
		codexCliStatus,
		trumboEntries,
		trumboKnownModels,
		trumboModelSelected,
		trumboPassCurrentPlanName,
		trumboPassPlanFeatures,
		trumboPassSubscriptionError,
		trumboPassSubscriptionOpenStatus,
		trumboPassSubscriptionOptions: TRUMBO_PASS_SUBSCRIPTION_OPTIONS,
		trumboPassSubscriptionSelected,
		trumboPassSubscriptionStatus,
		trumboPassSubscriptionUrl,
		deviceError,
		deviceStatus,
		deviceUserCode,
		deviceVerifyUrl,
		customModelError,
		customModelId,
		customModelTitle:
			activeProviderId === "openai-compatible"
				? "Set model ID"
				: "Create custom model ID",
		handleByoFieldInput: (field: ProviderConfigFieldKey, value: string) => {
			setByoValues((prev) => updateProviderConfigValue(prev, field, value));
		},
		handleCustomModelIdInput: (value: string) => {
			setCustomModelId(value);
			setCustomModelError("");
		},
		handleModelItemSelect: selectModelItem,
		menuSelected,
		menuOptions,
		modelItems,
		modelList,
		modelsLoading,
		oauthProvider,
		providerList,
		providersLoading,
		recommendedLoading: recommended.loading,
		saveByoConfig,
		saveCodexCliConfig,
		saveCustomModelId,
		selectedModelName,
		step,
		thinkingSelected,
	};
}
