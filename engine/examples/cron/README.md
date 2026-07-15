# Trumbo Automation Examples

Example automation specs for file-based and event-driven automation in Trumbo. Use these as templates to stand up your own recurring or event-driven tasks. Each spec is a markdown file with YAML frontmatter that the Trumbo automation runtime picks up, reconciles, and executes on your schedule or in response to ingested events.

## Quick start: pick your automation

| Goal | Spec | Schedule | Mode |
|------|------|----------|------|
| Review code | `daily-code-review` | Mon-Fri 9 AM | act |
| Update CHANGELOG | `changelog-generator` | Friday 6 PM | act |
| Check security | `dependency-check` | Monday 10 AM | act |
| Verify tests | `test-coverage-report` | Daily 10 PM | act |
| Track performance | `performance-baseline` | Daily 2 AM | act |
| Check types | `type-check-strict` | Daily 6 AM | plan |
| Audit style | `code-style-audit` | Wednesday 3 AM | act |
| Find dead code | `dead-code-finder` | Sunday 4 AM | plan |
| Check docs | `documentation-check` | Thursday 5 AM | plan |
| Weekly wins | `weekly-metrics-summary` | Friday 5 PM | act |
| Review PRs | `pr-review` | On PR opened | act |
| Check PR changelog | `pr-changelog-check` | On PR opened | act |
| PR coverage | `pr-test-coverage` | On PR updated | act |

## Overview

Trumbo automation supports two spec types:

1. **Recurring specs** (`.cron.md`) — run on a schedule.
2. **Event-driven specs** (`.event.md`) — run when a matching event is ingested.

Both are enabled by dropping the file into `.trumbo/cron/`, where the hub or SDK picks them up.

## Recurring specs

### [`daily-code-review.cron.md`](./daily-code-review.cron.md)

A production-ready example that runs a code review automation on weekday mornings.

**Key fields:**
- `schedule: "0 9 * * MON-FRI"` — 9 AM on weekdays (cron format).
- `tools: run_commands,read_files` — restrict the run to specific tools.
- `mode: act` — execute commands (vs. `plan` or `yolo`).
- `timeoutSeconds: 1800` — 30-minute timeout.
- `modelSelection` — override the model/provider for this run.
- `notesDirectory` — durable automation notes for multi-run state.

**Usage:**
```bash
mkdir -p ~/.trumbo/cron
cp examples/cron/daily-code-review.cron.md ~/.trumbo/cron/
# Edit the spec: set workspaceRoot, model, etc.
# The spec is reconciled on startup; the next run is enqueued automatically.
```

**One-off specs:**
For one-time tasks, save as `.trumbo/cron/<name>.md` (no `.cron` infix) and omit the `schedule` field.

### Additional recurring spec examples

#### [`changelog-generator.cron.md`](./changelog-generator.cron.md)

**Auto-generate a changelog from recent commits.**

Runs every Friday at 6 PM. It reviews commits in a directory (for example `projects/console/`) and generates a changelog entry summarizing new features, bug fixes, and breaking changes, then updates `CHANGELOG.md` without bumping the version.

**Best for:** projects with frequent releases and manual changelog maintenance overhead.

#### [`dependency-check.cron.md`](./dependency-check.cron.md)

**Weekly dependency health check.**

Runs every Monday at 10 AM. It checks for outdated packages, security vulnerabilities, unused dependencies, and major version upgrades, then produces a prioritized report for action.

**Best for:** teams that want proactive dependency maintenance without daily alerts.

#### [`test-coverage-report.cron.md`](./test-coverage-report.cron.md)

**Daily test coverage metrics.**

Runs every day at 10 PM. It runs the full test suite, generates coverage reports, and flags files that need more tests, then writes a markdown summary with visual indicators.

**Best for:** maintaining code quality standards and tracking coverage trends over time.

#### [`performance-baseline.cron.md`](./performance-baseline.cron.md)

**Track performance metrics overnight.**

Runs daily at 2 AM. It measures build time, bundle size, and cold start performance, detects regressions, and alerts when metrics exceed thresholds.

**Best for:** CLI tools, libraries, or services where performance is critical.

#### [`type-check-strict.cron.md`](./type-check-strict.cron.md)

**Strict TypeScript type checking.**

Runs every morning at 6 AM in `plan` mode. It reports all type errors under strict compiler options and categorizes them by issue type.

**Best for:** gradually improving type safety without blocking development.

#### [`code-style-audit.cron.md`](./code-style-audit.cron.md)

**Code style and linting audit.**

Runs every Wednesday at 3 AM. It runs ESLint and Prettier, finds unused code, detects anti-patterns, and summarizes violations.

**Best for:** maintaining code consistency across a team.

#### [`dead-code-finder.cron.md`](./dead-code-finder.cron.md)

**Find and report dead code.**

Runs every Sunday at 4 AM in `plan` mode. It identifies unused exports, unreachable code, and deprecated patterns, then prioritizes safe removals versus ones that need review.

**Best for:** regular codebase cleanup and reducing technical debt.

#### [`documentation-check.cron.md`](./documentation-check.cron.md)

**Documentation coverage audit.**

Runs every Thursday at 5 AM in `plan` mode. It analyzes documentation completeness, finds missing JSDoc comments, checks for outdated docs, and evaluates overall documentation structure.

**Best for:** improving code maintainability and onboarding for new team members.

#### [`weekly-metrics-summary.cron.md`](./weekly-metrics-summary.cron.md)

**Weekly metrics summary for the team.**

Runs every Friday at 5 PM. It collects a week of data — commits, test coverage, performance, PR activity, and contributor stats — and generates a celebratory markdown report with top contributors, metric trends, and fun facts.

**Best for:** team morale, tracking velocity, and celebrating wins. Handy for Friday stand-ups or team channels.

## Event-driven specs

Event-driven specs live in `.trumbo/cron/events/` and trigger when a normalized event is ingested.

### [`events/pr-review.event.md`](./events/pr-review.event.md)

Runs a pull request review whenever a new PR opens on the `main` branch.

**Key fields:**
- `event: github.pull_request.opened` — trigger on this event type.
- `filters` — narrow scope: match repository, branch, labels, and so on.
- `debounceSeconds: 30` — wait 30s for more events before triggering.
- `dedupeWindowSeconds: 600` — ignore duplicate events within 10 minutes.
- `cooldownSeconds: 120` — wait 2 minutes after a run before the next trigger.
- `maxParallel: 2` — run at most 2 in parallel.

**Usage:**
```bash
mkdir -p ~/.trumbo/cron/events
cp examples/cron/events/pr-review.event.md ~/.trumbo/cron/events/
# Configure your repository, branch, and workspace.
# Wire up a GitHub App or webhook to ingest events.
```

**Ingesting events:**
Events are ingested via any of:
- A GitHub App or webhook receiver.
- Plugin-emitted events (see `plugins/automation-events.ts`).
- Connector adapters.
- `trumbo.automation.ingestEvent()` in the SDK.

### [`events/local-manual-test.event.md`](./events/local-manual-test.event.md)

A local test spec for verifying event-driven automation without any external services.

**Key fields:**
- `event: local.manual_test` — local event type (no external dependency).
- `filters: { topic: cron-feature-2 }` — match on event payload fields.
- `debounceSeconds: 0` — trigger immediately.
- `maxIterations: 5` — quick timeout for testing.

**Usage:**
```bash
mkdir -p ~/.trumbo/cron/events
cp examples/cron/events/local-manual-test.event.md ~/.trumbo/cron/events/

# Start the hub with automation enabled.
# In another shell, ingest a test event:
node -e "
  const { HubWebSocketClient } = require('@trumbodev/core');
  const client = new HubWebSocketClient('ws://localhost:8000');
  client.send('cron.event.ingest', {
    eventType: 'local.manual_test',
    envelope: { subject: 'test', topic: 'cron-feature-2', message: 'hello' }
  });
"
```

### [`events/local-plugin-event.event.md`](./events/local-plugin-event.event.md)

A test spec for plugin-emitted events. Pairs with `plugins/automation-events.ts`.

### Additional event-driven examples

#### [`events/pr-changelog-check.event.md`](./events/pr-changelog-check.event.md)

**Verify CHANGELOG updates in PRs.**

Triggers when a PR opens on `main`. If the PR modifies source code but does not update the CHANGELOG, it posts a comment suggesting what should be added. If the CHANGELOG is updated, it verifies the format.

**Best for:** keeping a changelog current without manual reminders, and reducing reviewer burden.

#### [`events/pr-test-coverage.event.md`](./events/pr-test-coverage.event.md)

**Analyze the test coverage impact of PRs.**

Triggers when a PR is opened or updated. It runs test coverage against the PR branch, compares it to `main`, and posts a comment showing:
- Which new code is covered versus uncovered.
- Coverage impact percentage.
- Files with decreased coverage.
- Recommendations for additional tests.

**Best for:** maintaining test coverage standards while being helpful rather than blocking — guiding authors toward better test practices.

**Key fields:**
- `event: local.plugin_event` — custom event emitted by the plugin.
- `filters: { topic: plugin-demo }` — match on plugin event attributes.
- Minimal throttling for responsive testing.

**Usage:**
```bash
mkdir -p ~/.trumbo/cron/events
cp examples/cron/events/local-plugin-event.event.md ~/.trumbo/cron/events/

# Load the plugin that emits these events.
trumbo plugin install https://github.com/xedro98/trembo/tree/main/engine/examples/plugins/automation-events.ts

# Run the CLI with automation enabled; the plugin emits events.
trumbo --enable-automation -i "Test automation events"
```

## Getting started

### 1. Set up the spec directory

```bash
mkdir -p ~/.trumbo/cron/events
```

### 2. Copy a template

- **For scheduled tasks:** copy `daily-code-review.cron.md`.
- **For GitHub events:** copy `pr-review.event.md`.
- **For local testing:** copy `local-manual-test.event.md`.
- **For plugin events:** copy `local-plugin-event.event.md`.

### 3. Customize the spec

Edit your copied spec:
- Set `workspaceRoot` to your project path.
- Set `modelSelection` if you are using a non-default model.
- Update `filters` to match your repos and branches.
- Adjust timeout, iterations, and tool restrictions.
- Refine the prompt (the YAML body).

### 4. Enable automation

**In the hub:**
```bash
new HubWebSocketServer({
  cronOptions: { workspaceRoot: "/absolute/workspace" }
});
```

**In the SDK:**
```ts
const trumbo = await TrumboCore.create({
  automation: true,  // Enable automation
  // ... other options
});
```

**In the CLI:**
```bash
trumbo --enable-automation
```

### 5. Monitor runs

Completed and failed runs are reported to `.trumbo/cron/reports/<run-id>.md` with:
- YAML frontmatter (run ID, status, timing, token usage).
- A summary of the work performed.
- Tool calls and results.
- For events: the trigger event context.

## Field reference

### Common fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Unique identifier (alphanumeric, hyphens). |
| `title` | string | yes | Human-readable title. |
| `workspaceRoot` | string | yes | Absolute path to the project. |
| `mode` | string | no | `yolo` (default), `act`, or `plan`. |
| `tools` | string/array | no | Comma-separated tool names; empty disables work tools. |
| `systemPrompt` | string | no | Custom system prompt. |
| `modelSelection` | object | no | `{ providerId, modelId }`. |
| `maxIterations` | number | no | Iteration limit. |
| `timeoutSeconds` | number | no | Run timeout. |
| `extensions` | array | no | `rules`, `skills`, `plugins`. |
| `tags` | array | no | Arbitrary tags for grouping. |
| `metadata` | object | no | Custom metadata. |

### Recurring-only fields (`.cron.md`)

| Field | Type | Notes |
|-------|------|-------|
| `schedule` | string | **Required.** Cron expression (5 fields: minute, hour, day, month, day-of-week). |
| `timezone` | string | Optional. IANA timezone (e.g. `America/New_York`). Defaults to the system timezone. |

### Event-only fields (`.event.md`)

| Field | Type | Notes |
|-------|------|-------|
| `event` | string | **Required.** Event type (e.g. `github.pull_request.opened`, `local.manual_test`). |
| `filters` | object | Optional. Match event fields (supports dot paths). |
| `debounceSeconds` | number | Optional. Coalesce events within N seconds (default 0). |
| `dedupeWindowSeconds` | number | Optional. Skip duplicates within N seconds (default 0). |
| `cooldownSeconds` | number | Optional. Wait N seconds after a run (default 0). |
| `maxParallel` | number | Optional. Max concurrent runs (default unbounded). |

## Tools reference

Available tool names:
- `read_files` — read file contents.
- `search_codebase` — search across the project.
- `run_commands` — execute shell commands.
- `fetch_web_content` — fetch URLs.
- `apply_patch` — apply code patches.
- `editor` — edit files.
- `skills` — call custom skills.
- `ask_question` — query the user.
- `submit_and_exit` — complete the run.

## Practical automation workflows

### A complete development automation suite

Combine several specs for continuous coverage:

```
Monday 10 AM    → dependency-check.cron.md       (Check dependencies)
Tuesday 3 AM    → code-style-audit.cron.md       (Lint and format)
Wednesday 5 AM  → documentation-check.cron.md    (Doc coverage)
Thursday 4 AM   → dead-code-finder.cron.md       (Find cleanup opportunities)
Friday 6 PM     → changelog-generator.cron.md    (Auto-generate changelog)
Daily 2 AM      → performance-baseline.cron.md   (Track metrics)
Daily 10 PM     → test-coverage-report.cron.md   (Coverage trends)
Daily 6 AM      → type-check-strict.cron.md      (Type safety)

On every PR:
  → pr-changelog-check.event.md     (Verify CHANGELOG)
  → pr-test-coverage.event.md       (Coverage impact)
```

That gives you continuous quality monitoring without anyone having to remember to run checks by hand.

### Team workflows by role

**For team leads:**
- `dependency-check.cron.md` — weekly security review.
- `dead-code-finder.cron.md` — quarterly cleanup planning.
- `performance-baseline.cron.md` — monitor system health.

**For QA engineers:**
- `test-coverage-report.cron.md` — track trends.
- `pr-test-coverage.event.md` — PR-level feedback.

**For backend teams:**
- `performance-baseline.cron.md` — build time, API response time.
- `type-check-strict.cron.md` — type safety.

**For frontend teams:**
- `performance-baseline.cron.md` — bundle size, cold start.
- `code-style-audit.cron.md` — consistent styling.

## Examples in action

### Schedule a daily security audit

```md
---
id: daily-security-audit
title: Daily Security Audit
workspaceRoot: /path/to/repo
schedule: "0 2 * * *"  # 2 AM daily
tools: read_files,search_codebase
mode: act
timeoutSeconds: 3600
extensions:
  - skills
---
Search for hardcoded secrets, outdated dependencies, and insecure patterns.
Report findings to the team.
```

### Review all new PRs on main

```md
---
id: pr-security-review
title: Security Review for PRs
workspaceRoot: /path/to/repo
event: github.pull_request.opened
filters:
  pullRequest:
    baseBranch: main
cooldownSeconds: 300
maxParallel: 3
---
Summarize the changes, check for security risks, and recommend approval or changes.
```

## See also

- [Architecture automation overview](../../ARCHITECTURE.md#automation) — runtime architecture and flow details.
- [`plugins/automation-events.ts`](../plugins/automation-events.ts) — plugin event emission.
- [Trumbo SDK Examples](../) — other integration examples.
