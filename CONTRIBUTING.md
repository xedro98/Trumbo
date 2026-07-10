<div align="center">
<pre>
+++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++++++++++++++++++++++++++++++++
+++++                                  ++++++
+++++                                  ++++++
+++++    +++++++++++++++++++++++++++++++++++++++++++++
+++++    +++++++++++++++++++++++++++++++++++++++++++++
+++++    +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++                                 ++++++
+++++    ++++++                                 ++++++
+++++    ++++++   +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++   +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++   +++++++++++++++++++++++++++++++++++++++++++++
+++++    ++++++   ++++++                                  +++++
+++++    ++++++   ++++++                                  +++++
+++++    ++++++   ++++++     +++++++                      +++++
+++++++++++++++   ++++++    +++++++++                     +++++
+++++++++++++++   ++++++    ++++++++++                    +++++
+++++++++++++++   ++++++    ++++++++++                    +++++
         ++++++   ++++++     ++++++++                     +++++
         ++++++   ++++++                                  +++++
         +++++++++++++++                                  +++++
         +++++++++++++++                                  +++++
         +++++++++++++++                                 ++++++
                  ++++++                                 ++++++
                  ++++++                                +++++++
                  +++++++++++++++                      +++++++
                  +++++++++++++++                     +++++++
                  +++++++++++++++                    ++++++++
                            +++++                 +++++++++
                            +++++              ++++++++++
                            +++++++++++++++++++++++++++
                            ++++++++++++++++++++++++
                            ++++++++++++++++++++
</pre>
</div>

# Contributing to Trumbo

Thanks for your interest in Trumbo. This guide covers how to report issues, set up the project, and submit pull requests. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs

Before opening a new issue, [search existing ones](https://github.com/xedro98/Trumbo/issues) to avoid duplicates. When you're ready, [open a new issue](https://github.com/xedro98/Trumbo/issues/new/choose) and fill in the template.

> **Security:** If you find a security vulnerability, do **not** open a public issue. Report it privately via [GitHub Security Advisories](https://github.com/xedro98/Trumbo/security/advisories/new). See [SECURITY.md](SECURITY.md).

## Before you build a feature

All non-trivial changes start with a GitHub issue:

1. Check the [Discussions](https://github.com/xedro98/Trumbo/discussions) for similar ideas.
2. If your idea is new, open a feature request.
3. Wait for a maintainer to ack it before implementing.
4. Open a PR once it's approved.

PRs that change behavior without an approved issue may be closed.

## Finding something to work on

Look for issues labeled [`good first issue`](https://github.com/xedro98/Trumbo/labels/good%20first%20issue) or [`help wanted`](https://github.com/xedro98/Trumbo/labels/help%20wanted). Docs improvements are always welcome — browse [`book/`](./book) and send a PR.

## Development setup

### Prerequisites

- [Node.js](https://nodejs.org) 22+
- [Bun](https://bun.sh)
- [Git LFS](https://git-lfs.com) (the repo stores binary assets via LFS)

### Clone and install

```bash
git clone https://github.com/xedro98/Trumbo.git
cd Trumbo
bun install
```

### Build the SDK (required before first run)

```bash
bun run build:sdk
```

### Run the CLI

```bash
bun --conditions=development --cwd projects/console dev
```

## Submitting a pull request

1. Keep PRs focused — one feature or fix each. Split larger work into stacked PRs.
2. Format and lint: `bun run format:fix` and `bun run lint`.
3. Test: `bun test`.
4. Rebase on the latest `main` and make sure the branch builds.
5. Write a clear PR description: what changed, how to test it, any breaking changes, screenshots for UI work.
6. Reference the issue (`Closes #123`).

## Commit style

Use conventional commits — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` — and reference issues by number.

## Versioning

Maintainers handle releases and the changelog. You don't need to write changeset files for normal PRs.

## License

By submitting a PR, you agree your contributions are licensed under the project's [Apache 2.0](LICENSE) license.
