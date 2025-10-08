use crate::auth::CredentialsStore;
use crate::cli::AirdropCommands;
use crate::client::ApiClient;
use crate::config::manager::ConfigManager;
use crate::error::Result;
use colored::Colorize;
use comfy_table::{Cell, Color, Table};
use std::time::Duration;

pub async fn handle_airdrop_command(command: AirdropCommands, api_url: &str) -> Result<()> {
    match command {
        AirdropCommands::Request { amount, recipient } => {
            request_airdrop(api_url, amount, &recipient).await
        }
        AirdropCommands::History { limit, offset } => {
            show_history(api_url, limit, offset).await
        }
        AirdropCommands::Usage => show_usage(api_url).await,
    }
}

async fn request_airdrop(api_url: &str, amount: f64, recipient: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Load config for timeout
    let config = ConfigManager::new()?.load()?;
    let timeout = Duration::from_secs(config.api.timeout_seconds);

    // Create API client
    let client = ApiClient::new(api_url.to_string(), timeout)?
        .with_credentials(credentials);

    // Show spinner
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Requesting airdrop...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // Request airdrop
    let response = client.request_airdrop(amount, recipient).await?;

    spinner.finish_and_clear();

    // Display result
    println!();
    println!("{}", "✓ Airdrop requested successfully".green().bold());
    println!();
    println!("  Transaction: {}", response.signature.bright_blue());
    println!("  Amount:      {} SOL", response.amount.to_string().bright_yellow());
    println!("  Recipient:   {}", response.recipient.bright_cyan());
    println!();
    println!("  View on Solscan:");
    println!("  https://solscan.io/tx/{}?cluster=devnet", response.signature);
    println!();

    Ok(())
}

async fn show_history(api_url: &str, limit: u32, offset: u32) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Load config for timeout
    let config = ConfigManager::new()?.load()?;
    let timeout = Duration::from_secs(config.api.timeout_seconds);

    // Create API client
    let client = ApiClient::new(api_url.to_string(), timeout)?
        .with_credentials(credentials);

    // Show spinner
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Fetching airdrop history...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // Get history
    let response = client.get_airdrop_history(limit, offset).await?;

    spinner.finish_and_clear();

    if response.airdrops.is_empty() {
        println!("{}", "No airdrops found.".yellow());
        return Ok(());
    }

    // Create table
    let mut table = Table::new();
    table.set_header(vec![
        Cell::new("Date").fg(Color::Cyan),
        Cell::new("Amount").fg(Color::Cyan),
        Cell::new("Recipient").fg(Color::Cyan),
        Cell::new("Status").fg(Color::Cyan),
        Cell::new("Signature").fg(Color::Cyan),
    ]);

    for airdrop in &response.airdrops {
        let status_cell = match airdrop.status.as_str() {
            "completed" => Cell::new(&airdrop.status).fg(Color::Green),
            "pending" => Cell::new(&airdrop.status).fg(Color::Yellow),
            "failed" => Cell::new(&airdrop.status).fg(Color::Red),
            _ => Cell::new(&airdrop.status),
        };

        // Format date (take just the date part)
        let date_part = airdrop.created_at.split('T').next().unwrap_or(&airdrop.created_at);

        // Truncate signature for display
        let sig_display = if airdrop.signature.len() > 12 {
            format!("{}...{}", &airdrop.signature[..6], &airdrop.signature[airdrop.signature.len()-6..])
        } else {
            airdrop.signature.clone()
        };

        // Truncate recipient for display
        let recipient_display = if airdrop.recipient.len() > 12 {
            format!("{}...{}", &airdrop.recipient[..6], &airdrop.recipient[airdrop.recipient.len()-6..])
        } else {
            airdrop.recipient.clone()
        };

        table.add_row(vec![
            Cell::new(date_part),
            Cell::new(format!("{} SOL", airdrop.amount)),
            Cell::new(recipient_display),
            status_cell,
            Cell::new(sig_display),
        ]);
    }

    println!();
    println!("{}", table);
    println!();

    // Show pagination info
    println!(
        "Showing {} - {} of {} total airdrops",
        offset + 1,
        offset + response.airdrops.len() as u32,
        response.pagination.total
    );

    if response.pagination.has_more {
        println!(
            "{}",
            format!(
                "Use --offset {} to see more",
                offset + response.airdrops.len() as u32
            )
            .bright_black()
        );
    }

    println!();

    Ok(())
}

async fn show_usage(api_url: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Load config for timeout
    let config = ConfigManager::new()?.load()?;
    let timeout = Duration::from_secs(config.api.timeout_seconds);

    // Create API client
    let client = ApiClient::new(api_url.to_string(), timeout)?
        .with_credentials(credentials);

    // Show spinner
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Fetching usage statistics...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // Get usage stats
    let response = client.get_airdrop_usage().await?;

    spinner.finish_and_clear();

    // Display stats
    println!();
    println!("{}", "Airdrop Usage Statistics".bold());
    println!("{}", "=".repeat(40));
    println!();
    println!("{}", "Today:".bright_cyan());
    println!("  Requests: {}", response.usage.today.requests);
    println!("  Amount:   {} SOL", response.usage.today.amount);
    println!();
    println!("{}", "Total:".bright_cyan());
    println!("  Requests: {}", response.usage.total.requests);
    println!("  Amount:   {} SOL", response.usage.total.amount);
    println!();

    Ok(())
}
