use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(name = "sdt")]
#[command(author, version, about = "Solana Developer Tools CLI", long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,

    /// API base URL
    #[arg(long, global = true, env = "SDT_API_BASE_URL")]
    pub api_url: Option<String>,

    /// Output format
    #[arg(long, global = true, value_parser = ["json", "table", "text"])]
    pub output: Option<String>,

    /// Disable colored output
    #[arg(long, global = true)]
    pub no_color: bool,

    /// Verbose logging
    #[arg(short, long, global = true)]
    pub verbose: bool,

    /// Quiet mode (suppress non-error output)
    #[arg(short, long, global = true, conflicts_with = "verbose")]
    pub quiet: bool,
}

#[derive(Debug, Subcommand)]
pub enum Commands {
    /// Authentication management
    Auth {
        #[command(subcommand)]
        command: AuthCommands,
    },

    /// Airdrop operations
    Airdrop {
        #[command(subcommand)]
        command: AirdropCommands,
    },

    /// API key management
    #[command(name = "api-key")]
    ApiKey {
        #[command(subcommand)]
        command: ApiKeyCommands,
    },

    /// Configuration management
    Config {
        #[command(subcommand)]
        command: ConfigCommands,
    },
}

#[derive(Debug, Subcommand)]
pub enum AuthCommands {
    /// Login to authenticate with the API
    Login,

    /// Logout and clear stored credentials
    Logout,

    /// Show current authentication status
    Status,
}

#[derive(Debug, Subcommand)]
pub enum AirdropCommands {
    /// Request a SOL airdrop
    Request {
        /// Amount of SOL to airdrop
        amount: f64,

        /// Recipient wallet address
        recipient: String,
    },

    /// View airdrop history
    History {
        /// Maximum number of records to show
        #[arg(long, default_value = "50")]
        limit: u32,

        /// Offset for pagination
        #[arg(long, default_value = "0")]
        offset: u32,
    },

    /// Show airdrop usage statistics
    Usage,
}

#[derive(Debug, Subcommand)]
pub enum ApiKeyCommands {
    /// Create a new API key
    Create {
        /// Name for the API key
        name: String,
    },

    /// List all API keys
    List,

    /// Revoke an API key
    Revoke {
        /// API key ID to revoke
        key_id: String,
    },

    /// Show API key usage statistics
    Usage {
        /// API key ID
        key_id: String,
    },
}

#[derive(Debug, Subcommand)]
pub enum ConfigCommands {
    /// Set a configuration value
    Set {
        /// Configuration key (e.g., api.base_url)
        key: String,

        /// Configuration value
        value: String,
    },

    /// Get a configuration value
    Get {
        /// Configuration key
        key: String,
    },

    /// List all configuration values
    List,

    /// Reset configuration to defaults
    Reset,
}
