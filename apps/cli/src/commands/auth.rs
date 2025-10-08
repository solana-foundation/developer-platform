use crate::auth::{credentials::Credentials, CredentialsStore, DeviceFlowAuth};
use crate::cli::AuthCommands;
use crate::error::Result;
use colored::Colorize;

pub async fn handle_auth_command(command: AuthCommands, api_url: &str) -> Result<()> {
    match command {
        AuthCommands::Login => login(api_url).await,
        AuthCommands::Logout => logout().await,
        AuthCommands::Status => status().await,
    }
}

async fn login(api_url: &str) -> Result<()> {
    // Check if already logged in
    if CredentialsStore::exists() {
        println!("{}", "Already authenticated.".yellow());
        println!("Run 'sdt auth logout' first if you want to log in with a different account.");
        return Ok(());
    }

    // Initialize device flow
    let device_flow = DeviceFlowAuth::new(api_url.to_string());

    // Perform authentication
    let (api_token, user_id) = device_flow.authenticate().await?;

    // Store credentials
    let credentials = Credentials { user_id, api_token };
    CredentialsStore::save_with_tracking(&credentials)?;

    println!();
    println!("{}", "✓ Successfully authenticated!".green().bold());
    println!("You can now use the CLI to interact with the API.");
    println!();

    Ok(())
}

async fn logout() -> Result<()> {
    if !CredentialsStore::exists() {
        println!("{}", "Not currently authenticated.".yellow());
        return Ok(());
    }

    CredentialsStore::delete()?;

    println!("{}", "✓ Successfully logged out.".green());
    println!("Your credentials have been removed from the system keyring.");

    Ok(())
}

async fn status() -> Result<()> {
    if !CredentialsStore::exists() {
        println!("{}", "Not authenticated".red());
        println!();
        println!("Run 'sdt auth login' to authenticate.");
        return Ok(());
    }

    let credentials = CredentialsStore::load()?;

    println!("{}", "Authenticated".green().bold());
    println!();
    println!("User ID: {}", credentials.user_id.bright_blue());
    println!(
        "Token:   {}...{}",
        &credentials.api_token[..8].bright_black(),
        &credentials.api_token[credentials.api_token.len() - 8..].bright_black()
    );

    Ok(())
}
