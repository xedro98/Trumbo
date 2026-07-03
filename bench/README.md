```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```

# Trumbo Evaluation Framework

A layered testing system for measuring Trumbo's performance at different levels of granularity.

> Note: Smoke tests (Layer 2) are partially disabled while the eval framework is repointed at the new SDK CLI. The scenarios under `bench/smoke-tests/` are preserved and `npm run eval:smoke:run` still works against whatever `trumbo` is on `$PATH` (install with `npm i -g @trumbodev/cli`). The old build-and-link helpers and the auto-running `trumbo-evals-regression.yml` workflow are off until someone wires the build step at the new SDK CLI.

## Directory Structure

```
bench/
├── smoke-tests/           # Quick provider validation (minutes)
│   ├── run-smoke-tests.ts
│   └── scenarios/         # 5 curated test scenarios
│
├── e2e/                   # Full E2E with trumbo-bench (hours)
│   └── run-trumbo-bench.ts
│
├── trumbo-bench/           # Real-world tasks (git submodule)
│   └── tasks/             # 12 production bug fixes
│
├── analysis/              # Metrics and reporting framework
│   ├── src/
│   │   ├── metrics.ts     # pass@k, pass^k calculations
│   │   ├── classifier.ts  # Failure pattern matching
│   │   └── reporters/     # Markdown, JSON output
│   └── patterns/
│       └── trumbo-failures.yaml
│
└── baselines/             # Performance baselines for regression detection
```

## Test Layers

### Layer 1: Contract Tests (Unit)

Location: `src/core/api/transform/__tests__/`

Tests API transform logic without LLM calls:

- Thinking trace preservation
- Tool call parsing (XML, native formats)
- Provider format conversions

```bash
npm run test:unit -- --grep "Thinking\|Tool Call"
```

### Layer 2: Smoke Tests (Minutes)

Location: `bench/smoke-tests/`

Quick validation across providers with real LLM calls:

- 5 curated scenarios
- 3 trials per test for pass@k metrics
- Runs the `trumbo` CLI with `--config`, `-y`, `-t`, and `-m`

```bash
# Set API key (Trumbo provider)
export TRUMBO_API_KEY=sk-...

# Run smoke tests
npm run eval:smoke:run

# Run specific scenario
npm run eval:smoke:run -- --scenario 01-create-file

# Run with specific model (overrides per-scenario models)
npm run eval:smoke:run -- --model anthropic/claude-sonnet-4.5
```

### Layer 3: E2E Tests (Hours)

Location: `bench/e2e/` + `bench/trumbo-bench/`

Full agent tests on production-grade tasks:

- 12 real-world coding problems
- Docker/Daytona execution via Harbor
- Nightly CI runs

```bash
# Prerequisites: Python 3.13, Harbor, Docker
npm run eval:e2e

# Specific task
npm run eval:e2e -- --tasks discord

# Different provider
npm run eval:e2e -- --provider openai --model gpt-4o
```

## Metrics

The framework calculates:

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| **pass@k** | P(≥1 of k passes) | Solution finding capability |
| **pass^k** | P(all k pass) | Reliability |
| **Flakiness** | Entropy of pass rate | Consistency |

With 3 trials:

- All pass → `pass` (reliable)
- All fail → `fail` (broken)
- Mixed → `flaky` (needs investigation)

## CI Integration

- Current PR gate: contract tests only
- Smoke test CI: temporarily disabled while the workflow is repointed at the SDK CLI
- Nightly: E2E tests with trumbo-bench are not yet implemented, see TODO

## Quick Start

```bash
# Run all fast tests
npm run test:unit
npm run eval:smoke:run

# Run E2E (requires setup)
cd bench/trumbo-bench
# Follow README.md for Harbor setup
npm run eval:e2e
```

## Adding Tests

### Smoke Test Scenario

1. Create `bench/smoke-tests/scenarios/<name>/config.json`
2. Add an optional `template/` directory with starting files
3. Run to verify: `npm run eval:smoke:run -- --scenario <name>`

### Contract Test

1. Add to `src/core/api/transform/__tests__/`
2. Run: `npm run test:unit -- --grep "YourTest"`

### E2E Task

Contributions for trumbo-bench tasks are welcome — open a discussion at [https://github.com/xedro98/trembo/discussions](https://github.com/xedro98/trembo/discussions).

## Resources

- [trumbo-bench tasks](trumbo-bench/README.md)
- [Smoke test scenarios](smoke-tests/README.md)

## TODO

- [ ] **Nightly E2E CI**: Add scheduled workflow for trumbo-bench tests
  - Requires: Docker runner, Harbor setup, ~1-2 hour timeout
  - Should run on schedule (e.g., nightly) not per-PR
  - Separate secrets for E2E environment
- [ ] **Native tool calling smoke tests**: Add CLI support for `native_tool_call_enabled` setting to test Claude 4 with native tools
