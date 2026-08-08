//! `grok trumbo` subcommand — Trumbo device auth + subscription status.

use anyhow::Result;
use clap::{Args, Subcommand};

#[derive(Debug, Clone, Args)]
pub struct TrumboCmd {
    #[command(subcommand)]
    pub command: TrumboSubcommand,
}

#[derive(Debug, Clone, Subcommand)]
pub enum TrumboSubcommand {
    /// Sign in to Trumbo via device auth and verify your subscription
    Login,
    /// Show Trumbo auth + subscription / rate-limit status
    Status,
    /// Clear the stored Trumbo token
    Logout,
}

pub async fn run(cmd: TrumboCmd) -> Result<()> {
    match cmd.command {
        TrumboSubcommand::Login => xai_grok_shell::trumbo::login().await,
        TrumboSubcommand::Status => xai_grok_shell::trumbo::status().await,
        TrumboSubcommand::Logout => {
            xai_grok_shell::trumbo::logout()?;
            println!("Signed out of Trumbo.");
            Ok(())
        }
    }
}
