---
title: "GitHub Actions Integration"
description: "Automatically respond to GitHub issues by mentioning @trumbo in comments using Trumbo CLI in GitHub Actions."
---
Automate GitHub issue analysis with AI. Mention `@trumbo` in any issue comment to trigger an autonomous investigation that reads files, analyzes code, and provides actionable insights — all running automatically in GitHub Actions.

::: tip
**New to Trumbo CLI?** This sample assumes you understand Trumbo CLI basics and have completed the [Installation Guide](../../getting-started/installing-trumbo). If you're new to Trumbo CLI, we recommend starting with the [GitHub RCA sample](./github-issue-rca) first, as it's simpler and will help you understand the fundamentals before setting up GitHub Actions.
:::

## The Workflow

Trigger Trumbo by mentioning `@trumbo` in any issue comment:

Trumbo's automated analysis appears as a new comment, with insights drawn from your actual codebase:

The entire investigation runs autonomously in GitHub Actions - from file exploration to posting results.

Let's configure your repository.

## Prerequisites

Before you begin, you'll need:

- **Trumbo CLI knowledge** - Completed the [Installation Guide](../../getting-started/installing-trumbo) and understand basic usage
- **GitHub repository** - With admin access to configure Actions and secrets
- **GitHub Actions familiarity** - Basic understanding of workflows and CI/CD
- **API provider account** - OpenRouter, Anthropic, or similar with API key

## Setup

### 1. Copy the Workflow File

Copy the workflow file from this sample to your repository. The workflow file must be placed in the `.github/workflows/` directory in your repository root for GitHub Actions to detect and run it. In this case, we'll name it `trumbo-responder.yml`.

```bash
# In your repository root
mkdir -p .github/workflows
curl -o .github/workflows/trumbo-responder.yml https://raw.githubusercontent.com/xedro98/trembo/main/src/samples/cli/github-integration/trumbo-responder.yml
```

Alternatively, you can copy the full workflow file directly into `.github/workflows/trumbo-responder.yml`:

::: details Click to view the complete trumbo-responder.yml workflow
```yaml
name: Trumbo Issue Assistant

on:
  issue_comment:
    types: [created, edited]

permissions:
  issues: write

jobs:
  respond:
    runs-on: ubuntu-latest
    environment: trumbo-actions
    steps:
      - name: Check for @trumbo mention
        id: detect
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.comment?.body || "";
            const isPR = !!context.payload.issue?.pull_request;
            const hit = body.toLowerCase().includes("@trumbo");
            core.setOutput("hit", (!isPR && hit) ? "true" : "false");
            core.setOutput("issue_number", String(context.payload.issue?.number || ""));
            core.setOutput("issue_url", context.payload.issue?.html_url || "");
            core.setOutput("comment_body", body);

      - name: Checkout repository
        if: steps.detect.outputs.hit == 'true'
        uses: actions/checkout@v4

# Node v20+ is needed for Trumbo CLI on GitHub Actions Linux
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install Trumbo CLI
        if: steps.detect.outputs.hit == 'true'
        run: npm install -g @trumbodev/cli

      - name: Configure Trumbo Authentication
        if: steps.detect.outputs.hit == 'true'
        env:
          TRUMBO_DIR: $&#123;&#123; runner.temp &#125;&#125;/trumbo
        run: |
# Configure API key using the auth command
          trumbo auth --provider openrouter --apikey "$&#123;&#123; secrets.OPENROUTER_API_KEY &#125;&#125;"

      - name: Download analyze script
        if: steps.detect.outputs.hit == 'true'
        run: |
          export GITORG="YOUR-GITHUB-ORG"
          export GITREPO="YOUR-GITHUB-REPO"

          curl -L https://raw.githubusercontent.com/${GITORG}/${GITREPO}/refs/heads/main/git-scripts/analyze-issue.sh -o analyze-issue.sh
          chmod +x analyze-issue.sh

      - name: Run analysis
        if: steps.detect.outputs.hit == 'true'
        id: analyze
        env:
          ISSUE_URL: $&#123;&#123; steps.detect.outputs.issue_url &#125;&#125;
          COMMENT: $&#123;&#123; steps.detect.outputs.comment_body &#125;&#125;
        run: |
          set -euo pipefail
          
          RESULT=$(./analyze-issue.sh "${ISSUE_URL}" "Analyze this issue. The user asked: ${COMMENT}")
          
          {
            echo 'result<> "$GITHUB_OUTPUT"

      - name: Post response
        if: steps.detect.outputs.hit == 'true'
        uses: actions/github-script@v7
        env:
          ISSUE_NUMBER: $&#123;&#123; steps.detect.outputs.issue_number &#125;&#125;
          RESULT: $&#123;&#123; steps.analyze.outputs.result &#125;&#125;
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: Number(process.env.ISSUE_NUMBER),
              body: process.env.RESULT || "(no output)"
            });
```

:::

::: warning
**You MUST edit the workflow file before committing!**

Open `.github/workflows/trumbo-responder.yml` and update the "Download analyze script" step within the workflow to specify your GitHub organization and repository where the analysis script is stored:

```yaml
export GITORG="YOUR-GITHUB-ORG"      # Change this!
export GITREPO="YOUR-GITHUB-REPO"    # Change this!
```

**Example:** If your repository is `github.com/acme/myproject`, set:
```yaml
export GITORG="acme"
export GITREPO="myproject"
```

This tells the workflow where to download the analysis script from your repository after you commit it in step 3.
:::

The workflow will look for new or updated issues, check for `@trumbo` mentions, and then
start up the Trumbo CLI to dig into the issue, providing feedback as a reply to the issue.

### 2. Configure API Keys

Add your AI provider API keys as repository secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environment** and Add a new environment.

   

   Make sure to name it "trumbo-actions" so that it matches the `environment`
   value at the top of the `trumbo-responder.yml` file.

3. Click **New repository secret**
4. Add a secret for the `OPENROUTER_API_KEY` with a value of an API key from
   [openrouter.com](https://openrouter.com).

   

5. Verify your secret is configured:

   

Now you're ready to supply Trumbo with the credentials it needs in a GitHub Action.

### 3. Add Analysis Script

Add the analysis script from the `github-issue-rca` sample to your repository. **First, you'll need to create a `git-scripts` directory in your repository root where the script will be located.** Choose one of these options:

**Option A: Download directly (Recommended)**

```bash
# In your repository root, create the directory and download the script
mkdir -p git-scripts
curl -o git-scripts/analyze-issue.sh https://raw.githubusercontent.com/xedro98/trembo/main/src/samples/cli/github-issue-rca/analyze-issue.sh
chmod +x git-scripts/analyze-issue.sh
```

**Option B: Manual copy-paste**

Create the directory and file manually, then paste the script content:

```bash
# In your repository root
mkdir -p git-scripts
# Create and edit the file with your preferred editor
nano git-scripts/analyze-issue.sh  # or use vim, code, etc.
```

::: details Click to view the complete analyze-issue.sh script
```bash
#!/bin/bash
# Analyze a GitHub issue using Trumbo CLI

if [ -z "$1" ]; then
    echo "Usage: $0 <github-issue-url> [prompt]"
    echo "Example: $0 https://github.com/owner/repo/issues/123"
    echo "Example: $0 https://github.com/owner/repo/issues/123 'What is the root cause of this issue?'"
    exit 1
fi

# Gather the args
ISSUE_URL="$1"
PROMPT="${2:-What is the root cause of this issue?}"

# Ask Trumbo for its analysis, showing only the summary
trumbo --auto-approve true --json "$PROMPT: $ISSUE_URL" | \
    jq -r 'select(.type == "agent_event" and .event.type == "done") | .event.text' | \
    sed 's/\\n/\n/g'
```

After pasting the script content, make it executable:
```bash
chmod +x git-scripts/analyze-issue.sh
```

:::

This analysis script calls Trumbo to execute a prompt on a GitHub issue,
summarizing the output to populate the reply to the issue.

### 4. Commit and Push

```bash
git add .github/workflows/trumbo-responder.yml
git add git-scripts/analyze-issue.sh
git commit -m "Add Trumbo issue assistant workflow"
git push
```

## Usage

Once set up, simply mention `@trumbo` in any issue comment:

```text
@trumbo what's causing this error?

@trumbo analyze the root cause

@trumbo what are the security implications?
```

GitHub Actions will:
1. Detect the `@trumbo` mention
2. Start a Trumbo CLI instance
3. Download the analysis script
4. Analyze the issue using Act mode with auto-approval enabled
5. Post Trumbo's analysis as a new comment

**Note**: The workflow only triggers on issue comments, not pull request
comments.

## How It Works

The workflow (`trumbo-responder.yml`):

1. **Triggers** on issue comments (created or edited)
2. **Detects** `@trumbo` mentions (case-insensitive)
3. **Installs** Trumbo CLI globally using npm
4. **Configures** authentication using `trumbo auth --provider openrouter --apikey ...`
6. **Downloads** the reusable `analyze-issue.sh` script from the
   `github-issue-rca` sample
7. **Runs** analysis in Trumbo CLI
8. **Posts** the analysis result as a comment

## Related Samples

- **[github-issue-rca](./github-issue-rca)**: The reusable script that powers this integration
