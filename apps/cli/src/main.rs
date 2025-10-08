use clap::Parser;
use solana_dev_tools::{
    cli::{Cli, Commands},
    commands::{handle_apikey_command, handle_auth_command, handle_airdrop_command, handle_config_command},
    config::manager::ConfigManager,
    error::Result,
};
use std::process;

#[tokio::main]
async fn main() {
    // Install color_eyre for beautiful error messages
    if let Err(e) = color_eyre::install() {
        eprintln!("Failed to install color_eyre: {}", e);
    }

    // Run the CLI and handle errors
    if let Err(e) = run().await {
        eprintln!("{}: {}", colored::Colorize::red("Error"), e);
        process::exit(1);
    }
}

async fn run() -> Result<()> {
    // Parse CLI arguments
    let cli = Cli::parse();

    // Set up logging based on verbosity
    setup_logging(cli.verbose, cli.quiet);

    // Load configuration
    let config_manager = ConfigManager::new()?;
    let config = config_manager.load()?;

    // Determine API URL (CLI flag > env var > config file)
    let api_url = cli.api_url.unwrap_or(config.api.base_url);

    // Handle color output
    if cli.no_color {
        colored::control::set_override(false);
    }

    // Route to command handlers
    match cli.command {
        Commands::Auth { command } => {
            handle_auth_command(command, &api_url).await?;
        }
        Commands::Airdrop { command } => {
            handle_airdrop_command(command, &api_url).await?;
        }
        Commands::ApiKey { command } => {
            handle_apikey_command(command, &api_url).await?;
        }
        Commands::Config { command } => {
            handle_config_command(command).await?;
        }
    }

    Ok(())
}

fn setup_logging(verbose: bool, quiet: bool) {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};

    let filter = if quiet {
        EnvFilter::new("error")
    } else if verbose {
        EnvFilter::new("debug")
    } else {
        EnvFilter::new("info")
    };

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(false).without_time())
        .init();
}
