# Release

Prepare and publish a release directly from `main`.

## Overview

This workflow walks you through:
1. Selecting and confirming the target version
2. Curating `CHANGELOG.md` entries manually for end users
3. Ensuring `package.json` version matches the changelog
4. Creating and pushing a release commit + tag
5. Triggering the publish workflow
6. Updating GitHub release notes and sharing a summary

## Process

### 1) Sync and determine the version

```bash
git checkout main
git pull origin main
cat package.json | grep '"version"'
```

Confirm the release version with the maintainer (patch/minor/major).

### 2) Curate changelog and version

- Edit `CHANGELOG.md` for the target version using human-friendly release notes.
- Ensure version headers use bracket format, e.g. `## [3.66.1]`.
- Update `package.json` version to the same value.

### 3) Commit and tag

```bash
git add CHANGELOG.md package.json package-lock.json
git commit -m "v<version> Release Notes"
git push origin main
git tag v<version>
git push origin v<version>
```

### 4) Trigger the publish workflow

Tell the maintainer to run:
https://github.com/xedro98/trembo/actions/workflows/ext-vscode-publish-stable.yml

Use `v<version>` as the release tag.

### 5) Update GitHub release notes

After publish completes:

```bash
gh release view v<version> --json body --jq '.body'
gh release edit v<version> --notes "<final curated release notes>"
```

### 6) Final summary

Provide:
- Released version/tag
- Link to the release page
- Summary of top end-user changes
