//! Single source of truth for the Trumbo (grok) home directory: `$TRUMBO_HOME`,
//! `$GROK_HOME`, or `<home>/.trumbo`. Shared by `xai-grok-config` and
//! `xai-fast-worktree`.
//!
//! Which function to call:
//! - [`grok_home`]: the usual choice, a cached, created path to build on.
//! - [`user_grok_home`]: `None` instead of a cwd fallback when no home resolves.
//! - [`default_grok_home`]: the `<home>/.trumbo` default, ignoring the env vars, so callers can detect an override.
//! - [`resolve_grok_home`]: a fresh, uncached resolve.
//!
//! A legacy `~/.grok` tree is migrated into `~/.trumbo` on first use, entry by
//! entry, keeping any target that already exists. The internal `grok` command/
//! crate names are retained for compatibility; only the user-visible home,
//! env var and default directory are branded Trumbo.
//!
//! TODO: collapse these getters by threading the path through config as an
//! explicit value.

use std::ffi::OsStr;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

/// `<home>/.trumbo`, canonicalized via `dunce` (not `std::fs::canonicalize`,
/// which yields Windows verbatim paths).
fn grok_home_in(home: &Path) -> PathBuf {
    dunce::canonicalize(home)
        .unwrap_or_else(|_| home.to_path_buf())
        .join(".trumbo")
}

/// Legacy `~/.grok`, migrated once to `~/.trumbo`.
fn legacy_grok_home_in(home: &Path) -> PathBuf {
    home.join(".grok")
}

/// Merge a legacy `~/.grok` into `~/.trumbo`, entry by entry, keeping any
/// target that already exists (e.g. an agent dir).
fn migrate_legacy_home(legacy: &Path, target: &Path) {
    if legacy == target || !legacy.is_dir() {
        return;
    }
    let Ok(entries) = std::fs::read_dir(legacy) else { return };
    for entry in entries.flatten() {
        let name = entry.file_name();
        let dst = target.join(&name);
        if dst.exists() {
            continue;
        }
        let _ = std::fs::rename(entry.path(), &dst);
    }
}

/// `$TRUMBO_HOME`, else `$GROK_HOME`, verbatim when non-empty, else
/// `<home>/.trumbo`. The env value is used as-is (not canonicalized) so it
/// stays stable and comparable: callers do literal prefix checks against it, and
/// downstream symlink guards must still see its original components.
fn resolve_grok_home_from(
    trumbo_home_env: Option<&OsStr>,
    grok_home_env: Option<&OsStr>,
    os_home: Option<&Path>,
) -> Option<PathBuf> {
    for env in [trumbo_home_env, grok_home_env] {
        if let Some(env) = env.filter(|env| !env.is_empty()) {
            return Some(PathBuf::from(env));
        }
    }
    os_home.map(grok_home_in)
}

/// Resolve the Trumbo home from the environment (fresh, no cache); `None` if neither resolves.
pub fn resolve_grok_home() -> Option<PathBuf> {
    resolve_grok_home_from(
        std::env::var_os("TRUMBO_HOME").as_deref(),
        std::env::var_os("GROK_HOME").as_deref(),
        dirs::home_dir().as_deref(),
    )
}

/// The default `<home>/.trumbo`, used when `$TRUMBO_HOME`/`$GROK_HOME` are unset.
pub fn default_grok_home() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    grok_home_in(&home)
}

/// The Trumbo home, migrated from a legacy `~/.grok`, created if missing and
/// cached for the process.
pub fn grok_home() -> PathBuf {
    static GROK_HOME: OnceLock<PathBuf> = OnceLock::new();
    GROK_HOME
        .get_or_init(|| {
            if let Some(home) = resolve_grok_home() {
                let _ = std::fs::create_dir_all(&home);
                return home;
            }
            let home = home_dir_for_default();
            let trumbo = grok_home_in(&home);
            migrate_legacy_home(&legacy_grok_home_in(&home), &trumbo);
            if let Err(err) = std::fs::create_dir_all(&trumbo) {
                tracing::warn!(path = %trumbo.display(), %err, "failed to create Trumbo home");
            }
            trumbo
        })
        .clone()
}

fn home_dir_for_default() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

/// Like [`grok_home`], but `None` when no home resolves (no cwd fallback).
pub fn user_grok_home() -> Option<PathBuf> {
    resolve_grok_home().is_some().then(grok_home)
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;
    use std::ffi::OsString;

    #[test]
    fn env_wins_over_os_home() {
        let resolved = resolve_grok_home_from(
            Some(OsStr::new("/custom/trumbo")),
            None,
            Some(Path::new("/home/u")),
        );
        assert_eq!(resolved, Some(PathBuf::from("/custom/trumbo")));
    }

    #[test]
    fn grok_home_env_falls_through_to_trumbo_home() {
        let resolved = resolve_grok_home_from(
            Some(OsStr::new("/trumbo/override")),
            Some(OsStr::new("/grok/override")),
            Some(Path::new("/home/u")),
        );
        assert_eq!(resolved, Some(PathBuf::from("/trumbo/override")));
    }

    #[test]
    fn env_used_verbatim_even_when_it_exists() {
        let tmp = tempfile::tempdir().unwrap();
        let resolved = resolve_grok_home_from(Some(tmp.path().as_os_str()), None, None);
        assert_eq!(resolved, Some(tmp.path().to_path_buf()));
    }

    #[test]
    fn empty_env_falls_through_to_os_home() {
        let tmp = tempfile::tempdir().unwrap();
        let resolved =
            resolve_grok_home_from(Some(&OsString::new()), Some(&OsString::new()), Some(tmp.path()));
        assert_eq!(
            resolved,
            Some(dunce::canonicalize(tmp.path()).unwrap().join(".trumbo"))
        );
    }

    #[test]
    fn default_grok_home_has_no_verbatim_prefix() {
        let home = default_grok_home();
        assert!(!home.to_string_lossy().starts_with(r"\\?\"));
        assert!(home.ends_with(".trumbo"));
    }

    #[test]
    fn none_when_nothing_resolves() {
        assert_eq!(resolve_grok_home_from(None, None, None), None);
    }
}
