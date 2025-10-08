use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(name = "sdt")]
#[command(author, version)]
#[command(about = "Solana Developer Tools CLI")]
#[command(long_about = "\
Solana Developer Tools (sdt) - Essential utilities for Solana developers

GETTING STARTED:
  1. Authenticate:     sdt auth login
  2. Request airdrop:  sdt airdrop request 1.0 <your-address>
  3. Send RPC calls:   sdt rpc call getHealth

FEATURES:
  • Device flow authentication with secure credential storage
  • Devnet SOL airdrops with rate limiting
  • Authenticated RPC proxy with load balancing across providers
  • API key management for programmatic access

Use 'sdt <command> --help' for more information about a specific command.
")]
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
    #[command(long_about = "\
Manage authentication with the Solana Developer Tools API

WORKFLOW:
  1. Run 'sdt auth login' to start device flow authentication
  2. Open the browser URL displayed and enter the verification code
  3. Complete authentication in browser
  4. CLI will automatically receive and store your API token

Your credentials are stored securely in your system keyring.
")]
    Auth {
        #[command(subcommand)]
        command: AuthCommands,
    },

    /// Airdrop operations
    #[command(long_about = "\
Request devnet SOL airdrops with rate limiting

The airdrop service provides free devnet SOL for testing and development.
Rate limits apply per user (check usage stats for current limits).

EXAMPLES:
  Request 1 SOL:     sdt airdrop request 1.0 <your-wallet-address>
  View history:      sdt airdrop history
  Check your usage:  sdt airdrop usage
")]
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

    /// RPC operations (send JSON-RPC requests through authenticated proxy)
    #[command(long_about = "\
Send Solana JSON-RPC requests through authenticated load-balanced proxy

All RPC requests are routed through the API's proxy service which:
  • Requires authentication
  • Load balances across multiple RPC providers
  • Provides consistent access without managing your own endpoints

EXAMPLES:
  Check cluster health:   sdt rpc call getHealth
  Get current slot:       sdt rpc call getSlot
  Get account balance:    sdt rpc call getBalance --params '[\"<address>\"]'
  Get block height:       sdt rpc call getBlockHeight
  Show provider info:     sdt rpc info

Note: Params must be valid JSON array format when provided.
")]
    Rpc {
        #[command(subcommand)]
        command: RpcCommands,
    },

    /// Deploy Solana programs with rent-free hosting
    #[command(long_about = "\
Deploy Solana programs with rent-free temporary hosting

Programs are deployed and hosted for free with a 7-day expiration period.
You must claim authority within 7 days or the program will be reclaimed.

Projects automatically organize your program deployments. If a project
doesn't exist, it will be created automatically.

EXAMPLES:
  Deploy to devnet:     sdt deploy program ./target/deploy/my_program.so
  Deploy to testnet:    sdt deploy program ./target/deploy/my_program.so --cluster testnet
  Custom project name:  sdt deploy program ./program.so --project my-project
  With description:     sdt deploy program ./program.so --description 'My awesome program'
")]
    Deploy {
        #[command(subcommand)]
        command: DeployCommands,
    },
}

#[derive(Debug, Subcommand)]
pub enum AuthCommands {
    /// Login to authenticate with the API
    #[command(long_about = "\
Start device flow authentication

This will:
  1. Request a verification code from the API
  2. Open your browser to the authentication page
  3. Wait for you to enter the code and complete login
  4. Store your credentials securely

EXAMPLE:
  sdt auth login
")]
    Login,

    /// Logout and clear stored credentials
    #[command(long_about = "\
Remove stored credentials from system keyring

This will log you out locally but does not invalidate API tokens.
Use API key management to revoke tokens if needed.

EXAMPLE:
  sdt auth logout
")]
    Logout,

    /// Show current authentication status
    #[command(long_about = "\
Display current authentication status and user information

Shows whether you're logged in, your user ID, and a truncated view
of your API token.

EXAMPLE:
  sdt auth status
")]
    Status,
}

#[derive(Debug, Subcommand)]
pub enum AirdropCommands {
    /// Request a SOL airdrop
    #[command(long_about = "\
Request devnet SOL to be sent to a wallet address

Rate limits apply:
  • Maximum amount per request
  • Daily volume limit
  • Daily request count limit

Check 'sdt airdrop usage' to see your current limits and usage.

EXAMPLE:
  sdt airdrop request 1.0 9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde
")]
    Request {
        /// Amount of SOL to airdrop
        amount: f64,

        /// Recipient wallet address
        recipient: String,
    },

    /// View airdrop history
    #[command(long_about = "\
Display paginated list of past airdrops

Shows transaction signatures with Solscan explorer links, amounts,
recipients, and timestamps.

EXAMPLES:
  sdt airdrop history
  sdt airdrop history --limit 100 --offset 50
")]
    History {
        /// Maximum number of records to show
        #[arg(long, default_value = "50")]
        limit: u32,

        /// Offset for pagination
        #[arg(long, default_value = "0")]
        offset: u32,
    },

    /// Show airdrop usage statistics
    #[command(long_about = "\
Display your airdrop usage statistics and limits

Shows:
  • Today's usage (requests and volume)
  • Total usage across all time
  • Your daily limits

EXAMPLE:
  sdt airdrop usage
")]
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

#[derive(Debug, Subcommand)]
pub enum RpcCommands {
    /// Send a JSON-RPC request to Solana
    #[command(long_about = "\
Send a Solana JSON-RPC method call through the authenticated proxy

The request will be automatically formatted as JSON-RPC 2.0 and sent
to one of the configured RPC providers via round-robin load balancing.

COMMON METHODS:
  getHealth              - Check if the RPC node is healthy
  getSlot                - Get the current slot
  getBlockHeight         - Get the current block height
  getBalance             - Get account balance (requires address param)
  getAccountInfo         - Get account info (requires address param)
  getTransaction         - Get transaction details (requires signature param)

EXAMPLES:
  sdt rpc call getHealth
  sdt rpc call getSlot
  sdt rpc call getBalance --params '[\"9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde\"]'
  sdt rpc call getAccountInfo --params '[\"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\"]'

Full RPC method reference: https://solana.com/docs/rpc
")]
    Call {
        /// RPC method name (e.g., getHealth, getSlot, getBalance)
        method: String,

        /// JSON-encoded parameters array (e.g., '["address"]')
        #[arg(long)]
        params: Option<String>,
    },

    /// Show RPC provider information
    #[command(long_about = "\
Display information about configured RPC providers

Shows the total number of RPC providers configured in the load balancer
and lists each provider endpoint.

EXAMPLE:
  sdt rpc info
")]
    Info,
}

#[derive(Debug, Subcommand)]
pub enum DeployCommands {
    /// Deploy a Solana program
    #[command(long_about = "\
Deploy a Solana program with rent-free temporary hosting

The program will be deployed to the specified cluster and hosted for 7 days.
You must claim authority within this period or it will be reclaimed.

If you don't specify a project name, the current directory name will be used.
If you don't specify a program name, the filename will be used.

EXAMPLES:
  Basic deploy:         sdt deploy program ./target/deploy/my_program.so
  Custom names:         sdt deploy program ./program.so --project my-dapp --program token-mint
  With description:     sdt deploy program ./program.so --description 'Token minting program'
  Deploy to testnet:    sdt deploy program ./program.so --cluster testnet
")]
    Program {
        /// Path to the compiled program (.so file)
        program_path: std::path::PathBuf,

        /// Project name (defaults to current directory name)
        #[arg(short, long)]
        project: Option<String>,

        /// Program name (defaults to filename)
        #[arg(short = 'n', long)]
        name: Option<String>,

        /// Target cluster
        #[arg(short, long, default_value = "devnet", value_parser = ["devnet", "testnet", "mainnet-beta"])]
        cluster: String,

        /// Program description
        #[arg(short, long)]
        description: Option<String>,
    },
}
