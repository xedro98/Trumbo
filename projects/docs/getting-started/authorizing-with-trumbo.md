---
title: "Authorization"
description: "Authenticate with Trumbo and choose your first AI model"
---
Trumbo reaches AI models through a **provider**. Most setups use **Bring Your Own Key (BYOK)** — your own cloud provider credentials or a local runtime.

## Menu

- [CLI Setup](#cli-setup)
- [Provider Options](#provider-options)

## CLI Setup

```bash
# Authenticate from the terminal
trumbo auth

# Shorthand
trumbo a
```

Follow the prompts to pick a provider, paste an API key when needed, or point Trumbo at a local runtime.

## Provider Options

### BYOK (cloud + local)

#### Cloud Providers

| Provider | Best For | Setup Guide |
|----------|----------|-------------|
| **OpenRouter** | Multiple models, competitive pricing | [Setup](../provider-config/openrouter) |
| **Anthropic** | Direct Claude access | [Setup](../provider-config/anthropic) |
| **Claude Code** | Claude Max/Pro subscription | [Setup](../provider-config/anthropic) |
| **OpenAI** | GPT models | [Setup](../provider-config/openai) |
| **Google Gemini** | Gemini models | [Setup](../provider-config/google-gemini) |
| **AWS Bedrock** | Enterprise | [Setup](../provider-config/aws-bedrock/api-key) |
| **DeepSeek** | Great value | [Setup](../provider-config/deepseek) |

#### Local Models

Run models on your own hardware for full privacy and zero per-request cost.

| Provider | Best For | Setup Guide |
|----------|----------|-------------|
| **Ollama** | CLI-based local runtime | [Setup](../running-models-locally/overview#runtime-options) |
| **LM Studio** | GUI-based local runtime | [Setup](../running-models-locally/overview#runtime-options) |

Local models need adequate hardware (especially GPU memory). See [Running Models Locally](../running-models-locally/overview) for requirements.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Auth flow fails | Confirm your API key is valid and has access to the model you selected. |
| Local model unreachable | Make sure Ollama or LM Studio is running and listening on the expected port. |
| Wrong model selected | Run `trumbo auth` again or update provider settings with `/settings` in the CLI. |
