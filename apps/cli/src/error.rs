use thiserror::Error;

/// Main error type for the CLI application
#[derive(Debug, Error)]
pub enum CliError {
    #[error("Authentication required. Run 'sdt auth login' first.")]
    NotAuthenticated,

    #[error("API request failed: {0}")]
    ApiError(String),

    #[error("API returned error {status}: {message}")]
    ApiResponseError { status: u16, message: String },

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Credential storage error: {0}")]
    KeyringError(#[from] keyring::Error),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Configuration file error: {0}")]
    ConfyError(#[from] confy::ConfyError),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Authentication timeout. Please try again.")]
    AuthTimeout,

    #[error("Operation cancelled by user")]
    Cancelled,

    #[error("{0}")]
    Other(String),
}

/// Result type alias for CLI operations
pub type Result<T> = std::result::Result<T, CliError>;
