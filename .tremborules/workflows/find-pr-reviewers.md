# Find best reviewers for the current branch

Analyze the current branch to recommend the best people to review the PR, based on **domain expertise** and git history.

## Steps

1. Get the current branch name and verify it is not `main`.
2. Get the diff between the current branch and `origin/main`:
   - `git diff origin/main...HEAD --name-only` for changed files
   - `git diff origin/main...HEAD` to understand the nature and spirit of the changes
3. **Identify the domain/feature area** being changed:
   - Read the diff carefully to understand WHAT is changing conceptually (e.g. "slash commands", "authentication", "API client", "UI components")
   - This semantic understanding is what drives the right reviewer selection
4. Find domain experts by searching for related files and their contributors:
   - Identify all files related to the feature/domain, not just the ones changed
   - Example: if changing slash commands, find ALL slash-command-related files across the codebase
   - Use `git log --format="%an <%ae>" -- <related-files-pattern>` to find who has expertise in that domain
5. For additional context, also gather:
   - `git blame -L <start>,<end> origin/main -- <file-path>` for exact lines changed
   - Recent commit activity on related files
6. Score and rank contributors by:
   - **Highest weight: domain expertise** — who has the most commits to files in this feature area (even files not touched by this PR)
   - **Medium weight: direct file expertise** — commits to the specific files being changed
   - **Lower weight: line-level ownership** — authored the exact lines being modified
7. Exclude yourself (check against `git config user.email`).
8. Present the top 5 reviewers as an ordered list.

## Output Format

Output an ordered list:

1. **Name** - Domain expert: 15 commits to slash-command related files, authored core parsing logic
2. **Name** - 8 commits to affected files, recently added the feature being modified
3. ...

## Commands Reference
```bash
git config user.email
git diff origin/main...HEAD --name-only
git diff origin/main...HEAD
# Find related files for a domain (adjust pattern based on what you learn from the diff)
find . -type f \( -name "*slash-command*" -o -name "*SlashCommand*" \) | head -20
# Get contributors for related files
find . -type f \( -name "*slash-command*" -o -name "*SlashCommand*" \) -print0 | xargs -0 git log --format="%an <%ae>" -- | sort | uniq -c | sort -rn
git log --format="%an <%ae>" -- <file> | sort | uniq -c | sort -rn
git blame -L 10,20 origin/main -- <file>
```

Do NOT ask questions - analyze the changes, identify the domain, and output the reviewer list.
