```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Trembo Testing Platform

A CLI testing framework for the Trembo Core extension. It ships gRPC-based integration clients and the surrounding harness for running automated scenarios against the extension.

## Overview

The platform drives end-to-end validation of Trembo's core functionality through three pieces:

- **gRPC Adapters** — clients for Trembo's gRPC services
- **Test Harness** — the runner, utilities, and type definitions
- **Spec Files** — JSON instructions that describe automated test cases

## Structure

```
testing-platform/
├── adapters/           # gRPC communication adapters
│   ├── grpcAdapter.ts     # Main gRPC adapter implementation
├── harness/            # Test execution framework
│   ├── runner.ts          # Main test runner
│   ├── types.ts           # Type definitions
│   └── utils.ts           # Utility functions
```

## Prerequisites

- **Node.js** >= 18 (the runtime) and **bun** (package manager + task runner)
- **Protocol Buffers** (used for gRPC)

Generate the proto files from the **root of the Trembo project**:

```bash
bun run protos
```

## Setup

From the root of the Trembo project:

```bash
bun run install:all
bun run protos
```

Then install and build the testing platform:

```bash
cd testing-platform
bun install
bun run build
```

## Running Spec File Tests

Before running specs, start the standalone Trembo Core gRPC server (which runs the mocks and the host gRPC):

```bash
bun run test:sca-server
```

Then run the CLI against a spec file or folder:

```bash
bun run start:dev <spec-file-or-folder>
```
