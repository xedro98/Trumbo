//! Trumbo authentication + entitlement for the grok-build TUI.
//!
//! This replaces the xAI auth with Trumbo's Better Auth device flow:
//!   - `POST {root}/api/auth/device/code` → user_code + verification URI
//!   - `POST {root}/api/auth/device/token` (device-code grant) → bearer token
//!   - `POST {root}/api/v1/auth/refresh` → refresh
//!   - `GET  {root}/api/v1/users/me/plan` → subscription + rate-limit windows
//!
//! The bearer token is stored in trumbo's `auth.json` under the `xai::api_key`
//! scope, so trumbo's existing BYOK/API-key auth path sends
//! `Authorization: Bearer <token>` to the Trumbo OpenAI-compatible endpoint.

use anyhow::{anyhow, bail, Context, Result};
use reqwest::header::AUTHORIZATION;
use serde_json::Value;
use std::time::{Duration, Instant};

use crate::auth::{clear_api_key, read_api_key, store_api_key};

const TRUMBO_CLIENT_ID: &str = "trumbo-cli";
const DEVICE_CODE_POLL_TIMEOUT: Duration = Duration::from_secs(300);

/// Provider (OpenAI-compatible) base: `{root}/api/v1`.
pub(crate) fn provider_base() -> String {
    let mut base = if std::env::var("TRUMBO_ENVIRONMENT")
        .map(|v| v.trim().eq_ignore_ascii_case("local"))
        .unwrap_or(false)
    {
        "http://localhost:8787"
    } else {
        "https://api.trumbo.dev"
    }
    .to_owned();
    if let Ok(url) = std::env::var("TRUMBO_API_BASE_URL") {
        let trimmed = url.trim().trim_end_matches('/').to_owned();
        if !trimmed.is_empty() {
            base = trimmed;
        }
    }
    let root = base
        .trim_end_matches('/')
        .trim_end_matches("/api/v1")
        .trim_end_matches('/');
    format!("{root}/api/v1")
}

/// Trumbo API root (auth + plan endpoints), without `/api/v1`.
fn api_root() -> String {
    provider_base()
        .trim_end_matches('/')
        .trim_end_matches("/api/v1")
        .to_string()
}

/// The stored Trumbo bearer token (or an `XAI_API_KEY`/`TRUMBO_TOKEN` override).
pub(crate) fn current_token() -> Option<String> {
    if let Ok(t) = std::env::var("TRUMBO_TOKEN") {
        if !t.trim().is_empty() {
            return Some(t);
        }
    }
    read_api_key(&xai_grok_config::grok_home())
}

fn open_browser(url: &str) {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd")
        .args(["/c", "start", "", url])
        .spawn();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(url).spawn();
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(url).spawn();
}

/// Fetch the current plan (`GET /api/v1/users/me/plan`). Returns the envelope
/// `data` value (or `Value::Null` when the account has no subscription).
async fn fetch_plan(client: &reqwest::Client, token: &str) -> Result<Value> {
    let resp = client
        .get(format!("{}/users/me/plan", provider_base()))
        .header(AUTHORIZATION, format!("Bearer {token}"))
        .timeout(Duration::from_secs(20))
        .send()
        .await
        .context("failed to fetch Trumbo plan")?;
    let status = resp.status();
    let body = resp
        .json::<Value>()
        .await
        .context("invalid Trumbo plan response")?;
    if !status.is_success() {
        let fallback = format!("HTTP {status}");
        let msg = body["error"]
            .as_str()
            .or_else(|| body["message"].as_str())
            .unwrap_or(&fallback);
        bail!("Trumbo plan check failed: {msg}");
    }
    Ok(body["data"].clone())
}

/// Assert the account is subscribed and within all plan rate-limit windows.
fn assert_can_use(plan: &Value) -> Result<()> {
    if plan.is_null() {
        bail!("An active Trumbo subscription is required to use this agent. Visit https://platform.trumbo.dev to upgrade.");
    }
    let subscribed = plan["subscription"]["id"].as_str().is_some_and(|s| !s.is_empty());
    if !subscribed {
        bail!("An active Trumbo subscription is required to use this agent. Visit https://platform.trumbo.dev to upgrade.");
    }
    if let Some(limits) = plan["rateLimits"].as_object() {
        for (window, label) in [
            ("fiveHour", "5-hour"),
            ("daily", "daily"),
            ("weekly", "weekly"),
        ] {
            if let Some(w) = limits.get(window) {
                let used = w["used"].as_u64().unwrap_or(0);
                let limit = w["limit"].as_u64().unwrap_or(0);
                if limit > 0 && used >= limit {
                    let resets = w["resetsAtSec"].as_i64().unwrap_or(0);
                    bail!(
                        "Trumbo {label} rate limit reached: {used}/{limit} requests used{}.",
                        if resets > 0 {
                            format!(" (resets {})", human_reset(resets))
                        } else {
                            String::new()
                        }
                    );
                }
            }
        }
    }
    Ok(())
}

fn human_reset(resets_at_sec: i64) -> String {
    let secs = (resets_at_sec - chrono::Utc::now().timestamp()).max(0);
    let h = secs / 3600;
    let m = (secs % 3600) / 60;
    if h > 0 {
        format!("{h}h {m}m")
    } else if m > 0 {
        format!("{m}m")
    } else {
        format!("{secs}s")
    }
}

/// Run the Trumbo device-code login flow and store the token.
pub async fn login() -> Result<()> {
    if let Some(existing) = current_token() {
        // Already have a token; verify entitlement without re-authenticating.
        if let Ok(plan) = fetch_plan(&reqwest::Client::new(), &existing).await {
            assert_can_use(&plan)?;
            println!("Already signed in to Trumbo.");
            return Ok(());
        }
    }

    let client = reqwest::Client::new();
    let root = api_root();

    // 1. Request a device code.
    let body = client
        .post(format!("{root}/api/auth/device/code"))
        .json(&serde_json::json!({ "client_id": TRUMBO_CLIENT_ID }))
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .context("failed to start Trumbo device auth")?;
    let body: Value = body
        .json()
        .await
        .context("invalid device auth response")?;
    let device_code = body["device_code"]
        .as_str()
        .context("device auth missing device_code")?
        .to_string();
    let user_code = body["user_code"]
        .as_str()
        .context("device auth missing user_code")?
        .to_string();
    let uri = body["verification_uri_complete"]
        .as_str()
        .or_else(|| body["verification_uri"].as_str())
        .context("device auth missing verification_uri")?
        .to_string();
    let expires = Duration::from_secs(body["expires_in"].as_u64().unwrap_or(300).min(600));
    let mut interval = Duration::from_secs(body["interval"].as_u64().unwrap_or(5).max(1));

    println!();
    println!("  Sign in to Trumbo");
    println!();
    println!("  1. Open this URL in your browser:");
    println!("     {uri}");
    println!("  2. Enter this code:");
    println!("     {user_code}");
    println!();
    open_browser(&uri);

    // 2. Poll for the token.
    let deadline = Instant::now() + expires.min(DEVICE_CODE_POLL_TIMEOUT);
    let token = loop {
        let resp = client
            .post(format!("{root}/api/auth/device/token"))
            .json(&serde_json::json!({
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                "device_code": device_code,
                "client_id": TRUMBO_CLIENT_ID,
            }))
            .timeout(Duration::from_secs(30))
            .send()
            .await
            .context("failed to poll Trumbo device token")?;
        let status = resp.status();
        let payload = resp
            .json::<Value>()
            .await
            .context("invalid device token response")?;
        if status.is_success() {
            if let Some(t) = payload["access_token"].as_str() {
                break t.to_string();
            }
        }
        match payload["error"].as_str() {
            Some("authorization_pending") => {}
            Some("slow_down") => interval += Duration::from_secs(1),
            Some("access_denied") => bail!("Access denied."),
            Some("expired_token") | Some("invalid_grant") => bail!("Device code expired or invalid."),
            _ => bail!(
                "Device auth failed: {}",
                payload["error_description"].as_str().unwrap_or("unknown error")
            ),
        }
        if Instant::now() > deadline {
            bail!("Device authentication timed out.");
        }
        tokio::time::sleep(interval).await;
    };

    // 3. Verify entitlement, then persist.
    let plan = fetch_plan(&client, &token).await?;
    assert_can_use(&plan)?;

    let home = xai_grok_config::grok_home();
    store_api_key(&home, &token)
        .map_err(|e| anyhow!("failed to store Trumbo token: {e}"))?;

    println!("✔ Signed in to Trumbo.");
    let tier = plan["planTier"].as_str().unwrap_or("pro");
    println!("  Plan: {tier}");
    Ok(())
}

/// Print auth + entitlement status.
pub async fn status() -> Result<()> {
    match current_token() {
        Some(token) => {
            let plan = fetch_plan(&reqwest::Client::new(), &token).await?;
            match assert_can_use(&plan) {
                Ok(()) => {
                    let tier = plan["planTier"].as_str().unwrap_or("pro");
                    println!("Signed in to Trumbo. Plan: {tier}");
                    Ok(())
                }
                Err(e) => bail!("Signed in, but blocked: {e}"),
            }
        }
        None => {
            println!("Not signed in to Trumbo. Run `trumbo trumbo login`.");
            Ok(())
        }
    }
}

/// Clear the stored Trumbo token.
pub fn logout() -> Result<()> {
    clear_api_key(&xai_grok_config::grok_home())
        .map_err(|e| anyhow!("failed to clear Trumbo token: {e}"))
}
