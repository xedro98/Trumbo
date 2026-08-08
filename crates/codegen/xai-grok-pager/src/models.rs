//! `trumbo models` subcommand.

use anyhow::Result;
use tokio_util::sync::CancellationToken;
use xai_grok_shell::agent::config::Config as AgentConfig;
use xai_grok_shell::cli_models::{AuthStatus, list_models};

use crate::client_identity::{PAGER_CLIENT_TYPE, PAGER_CLIENT_VERSION};

pub async fn list_available_models(agent_config: &AgentConfig) -> Result<()> {
    match AuthStatus::resolve(agent_config) {
        AuthStatus::ApiKey => println!("You are using XAI_API_KEY."),
        AuthStatus::LoggedIn(host) => println!("You are logged in with {}.", host),
        AuthStatus::ModelCredentials(model) => {
            println!("Model '{model}' is using its own API key.");
        }
        AuthStatus::DeploymentKey => println!("You are authenticated via deployment key."),
        AuthStatus::NotAuthenticated => println!("You are not authenticated."),
    }
    println!();

    let cancel = CancellationToken::new();
    // A utility command is not a startup: latch so nothing records or mirrors.
    xai_grok_telemetry::startup::clear();
    let spawned = crate::acp::spawn::spawn_grok_shell(agent_config.clone(), &cancel, None).await?;
    // Cancel + join on every return path, including the `?` below.
    let _agent_guard =
        crate::acp::spawn::AgentShutdownGuard::new(cancel.clone(), Some(spawned.thread_handle));

    let state = list_models(&spawned.channel.tx, PAGER_CLIENT_TYPE, PAGER_CLIENT_VERSION).await?;

    println!("Default model: {}", state.current_model_id.0);
    println!();
    println!("Available models:");
    for m in state.available_models {
        if m.model_id == state.current_model_id {
            println!("  * {} (default)", m.model_id.0);
        } else {
            println!("  - {}", m.model_id.0);
        }
    }

    // Trumbo subscription models — the live catalog for the signed-in account.
    match xai_grok_shell::trumbo::recommended_models().await {
        Ok(catalog) if !catalog.is_empty() => {
            println!();
            println!("Trumbo subscription models:");
            for m in &catalog {
                let is_default = m.id.ends_with("quartz-1.0");
                let marker = if is_default { "  * (default)" } else { "" };
                let family = if m.family == "trumbo-pass" { " (rollout)" } else { "" };
                println!("  - {}{}{}", m.id, family, marker);
            }
        }
        _ => {
            // Not signed in, or the catalog is unavailable — the embedded
            // defaults already printed above.
        }
    }

    Ok(())
}
