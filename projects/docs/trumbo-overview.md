---
title: "Trumbo Overview"
description: "Your AI-powered coding agent for complex work. Read files, write code, run commands, all with your approval."
---
Welcome to the Trumbo documentation. Whether you're setting up for the first time or pushing into advanced capabilities, everything you need is here.

## What is Trumbo?

Trumbo is an AI coding agent that lives in your terminal. It reads and writes files, runs terminal commands, drives a browser, and helps you build features through natural conversation. Every action waits for your explicit approval, so you stay in control the whole way through.

## Model access

Connect the models you want to use — cloud providers or local runtimes — with your own credentials:

- **Bring Your Own Key** — Use your own provider credentials for cloud providers or local runtimes.

  - **Run models locally** — Ollama, LM Studio, and other local inference runtimes on your machine.

## Applications

The end-user surfaces built on Trumbo:

- **CLI** — Run Trumbo in your terminal with interactive chat or headless automation.     `npm i -g @trumbodev/cli` (or `trumbo`)

  - **Platform** — Hosted products: Cloud Agents, Sandbox, Browser Run, Security, Knowledge, Automations, and APIs at platform.trumbo.dev.

## Agent Core (SDK)

The SDK is Trumbo's agent core — use it to build your own applications, automations, and integrations. See the SDK section for the full functionality and architecture of the Trumbo Agent.

- **SDK** — Build AI agents and integrations powered by the same core engine behind the CLI.     `npm install @trumbo/sdk`

## Platform products (quick links)

- **Automations** — Durable workflows across agents, sandboxes, security, webhooks, waits, retries, and parallel branches.

  - **Cloud Agents** — Hosted agents with REST, MCP, schedules, and channels.

  - **Sandbox** — Remote Linux VMs for shell, code, git, and previews.

  - **Hosted MCP** — Product tools on api.trumbo.dev/v1/mcp.

## Editor integration

The Trumbo CLI also integrates with ACP-capable editors (such as **Zed** and **Neovim**) via `trumbo --acp`.
