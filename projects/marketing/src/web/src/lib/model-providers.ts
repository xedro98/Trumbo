export type ModelProvider = {
	name: string;
	logoUrl: string;
};

const labLogo = (labId: string) => `https://models.dev/logos/labs/${labId}.svg`;

/** Supported model labs (logos from models.dev/labs). */
export const MODEL_PROVIDERS: ModelProvider[] = [
	{ name: "DeepSeek", logoUrl: labLogo("deepseek") },
	{ name: "Zhipu AI", logoUrl: labLogo("zhipuai") },
	{ name: "OpenAI", logoUrl: labLogo("openai") },
	{ name: "Moonshot AI", logoUrl: labLogo("moonshotai") },
	{ name: "MiniMax", logoUrl: labLogo("minimax") },
	{ name: "Alibaba", logoUrl: labLogo("alibaba") },
];
