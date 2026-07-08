export enum NEW_USER_TYPE {
	TRUMBO_PASS = "trumbo-pass",
	FREE = "free",
	POWER = "power",
	BYOK = "byok",
}

type UserTypeSelection = {
	title: string
	description: string
	type: NEW_USER_TYPE
}

export const STEP_CONFIG = {
	0: {
		title: "How will you use Trumbo?",
		description: "Select an option below to get started.",
		buttons: [
			{ text: "Continue", action: "next", variant: "default" },
			{ text: "Login to Trumbo", action: "signin", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.TRUMBO_PASS]: {
		title: "Select a TrumboPass model",
		buttons: [
			{ text: "Create my Account", action: "signup", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.FREE]: {
		title: "Select a free model",
		buttons: [
			{ text: "Create my Account", action: "signup", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.POWER]: {
		title: "Select your model",
		buttons: [
			{ text: "Create my Account", action: "signup", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	[NEW_USER_TYPE.BYOK]: {
		title: "Configure your provider",
		buttons: [
			{ text: "Continue", action: "done", variant: "default" },
			{ text: "Back", action: "back", variant: "secondary" },
		],
	},
	2: {
		title: "Almost there!",
		description: "Complete account creation in your browser. Then come back here to finish up.",
		buttons: [{ text: "Back", action: "back", variant: "secondary" }],
	},
} as const

const TRUMBO_PASS_USER_TYPE_SELECTION: UserTypeSelection = {
	title: "TrumboPass (Recommended)",
	description: "One subscription, curated models, no API keys",
	type: NEW_USER_TYPE.TRUMBO_PASS,
}

const BASE_USER_TYPE_SELECTIONS: UserTypeSelection[] = [
	{ title: "Absolutely Free", description: "Get started at no cost", type: NEW_USER_TYPE.FREE },
	{ title: "Frontier Model", description: "Claude, GPT Codex, Gemini, etc.", type: NEW_USER_TYPE.POWER },
	{ title: "Bring my own API key", description: "Use Trumbo with your provider of choice", type: NEW_USER_TYPE.BYOK },
]

/** Free leads (and is the default); TrumboPass is inserted second when its models are available. */
export function getUserTypeSelections(hasTrumboPassModels: boolean): UserTypeSelection[] {
	if (!hasTrumboPassModels) {
		return BASE_USER_TYPE_SELECTIONS
	}
	const [free, ...rest] = BASE_USER_TYPE_SELECTIONS
	return [free, TRUMBO_PASS_USER_TYPE_SELECTION, ...rest]
}
