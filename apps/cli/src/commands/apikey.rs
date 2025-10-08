use crate::auth::CredentialsStore;
use crate::cli::ApiKeyCommands;
use crate::client::ApiClient;
use crate::config::manager::ConfigManager;
use crate::error::Result;
use colored::Colorize;
use comfy_table::{Cell, Color, Table};
use std::time::Duration;

pub async fn handle_apikey_command(command: ApiKeyCommands, api_url: &str) -> Result<()> {
    match command {
        ApiKeyCommands::Create { name } => create_key(api_url, &name).await,
        ApiKeyCommands::List => list_keys(api_url).await,
        ApiKeyCommands::Revoke { key_id } => revoke_key(api_url, &key_id).await,
        ApiKeyCommands::Usage { key_id } => show_key_usage(api_url, &key_id).await,
    }
}

async fn create_key(api_url: &str, name: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Load config for timeout
    let config = ConfigManager::new()?.load()?;
    let timeout = Duration::from_secs(config.api.timeout_seconds);

    // Create API client
    let client = ApiClient::new(api_url.to_string(), timeout)?.with_credentials(credentials);

    // Show spinner
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Creating API key...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // Create key
    let token = client.create_api_key(name).await?;

    spinner.finish_and_clear();

    // Display result
    println!();
    println!("{}", "✓ API key created successfully".green().bold());
    println!();
    println!("  Name:  {}", name.bright_cyan());
    println!("  Token: {}", token.bright_yellow());
    println!();
    println!(
        "  {}",
        "⚠ Save this token securely - it won't be shown again!".yellow()
    );
    println!();

    Ok(())
}

async fn list_keys(api_url: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Load config for timeout
    let config = ConfigManager::new()?.load()?;
    let timeout = Duration::from_secs(config.api.timeout_seconds);

    // Create API client
    let client = ApiClient::new(api_url.to_string(), timeout)?.with_credentials(credentials);

    // Show spinner
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Fetching API keys...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // List keys
    let keys = client.list_api_keys().await?;

    spinner.finish_and_clear();

    if keys.is_empty() {
        println!("{}", "No API keys found.".yellow());
        println!();
        println!("Create one with: sdt api-key create <name>");
        return Ok(());
    }

    // Create table
    let mut table = Table::new();
    table.set_header(vec![
        Cell::new("ID").fg(Color::Cyan),
        Cell::new("Name").fg(Color::Cyan),
        Cell::new("Created").fg(Color::Cyan),
        Cell::new("Last Used").fg(Color::Cyan),
    ]);

    for key in &keys {
        // Format dates
        let created_date = key
            .created_at
            .split('T')
            .next()
            .unwrap_or(&key.created_at);

        let last_used: String = if let Some(ref last_used_at) = key.last_used_at {
            last_used_at
                .split('T')
                .next()
                .unwrap_or(last_used_at)
                .to_string()
        } else {
            "Never".to_string()
        };

        // Truncate ID for display
        let id_display = if key.id.len() > 12 {
            format!("{}...{}", &key.id[..6], &key.id[key.id.len() - 6..])
        } else {
            key.id.clone()
        };

        table.add_row(vec![
            Cell::new(id_display),
            Cell::new(&key.name),
            Cell::new(created_date),
            Cell::new(last_used),
        ]);
    }

    println!();
    println!("{}", table);
    println!();

    Ok(())
}

async fn revoke_key(api_url: &str, key_id: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Load config for timeout
    let config = ConfigManager::new()?.load()?;
    let timeout = Duration::from_secs(config.api.timeout_seconds);

    // Create API client
    let client = ApiClient::new(api_url.to_string(), timeout)?.with_credentials(credentials);

    // Show spinner
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Revoking API key...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // Revoke key
    client.revoke_api_key(key_id).await?;

    spinner.finish_and_clear();

    // Display result
    println!();
    println!("{}", "✓ API key revoked successfully".green().bold());
    println!();

    Ok(())
}

async fn show_key_usage(api_url: &str, key_id: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Load config for timeout
    let config = ConfigManager::new()?.load()?;
    let timeout = Duration::from_secs(config.api.timeout_seconds);

    // Create API client
    let client = ApiClient::new(api_url.to_string(), timeout)?.with_credentials(credentials);

    // Show spinner
    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Fetching usage statistics...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    // Get usage stats
    let usage = client.get_api_key_usage(key_id).await?;

    spinner.finish_and_clear();

    // Display stats
    println!();
    println!("{}", "API Key Usage Statistics".bold());
    println!("{}", "=".repeat(40));
    println!();
    println!("  Key ID:        {}", key_id.bright_cyan());
    println!(
        "  Total Requests: {}",
        usage.total_requests.to_string().bright_yellow()
    );

    if let Some(last_used) = usage.last_used_at {
        println!("  Last Used:     {}", last_used.bright_blue());
    } else {
        println!("  Last Used:     {}", "Never".bright_black());
    }

    println!();

    Ok(())
}
