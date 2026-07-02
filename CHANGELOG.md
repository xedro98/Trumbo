<div align="center">
<pre>
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
</pre>
</div>

# Trumbo Changelog

All notable changes to the Trumbo monorepo are recorded here. This file was
restarted from scratch for the Trumbo brand — earlier history is not carried
over.

## [Unreleased]

### Added
- Trumbo brand: renamed packages, CLI binary (`trumbo`), config directory
  (`~/.trumbo`), environment variables (`TRUMBO_*`), and a new TRUMBO banner.
- Restructured monorepo layout: `sdk/` → `engine/`, `apps/` → `projects/`
  (`cli` → `console`, `examples` → `samples`, `hub`), `docs/` → `book/`,
  `evals/` → `bench/`.

### Fixed
- CLI BYOK provider routing now persists across restarts. A fresh run no longer
  pins a default provider before onboarding, and the deprecated OAuth pass
  options are hidden from the onboarding menu.
