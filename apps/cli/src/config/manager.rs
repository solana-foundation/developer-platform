use super::{Config, OutputFormat};
use crate::error::{CliError, Result};
use std::path::PathBuf;

const APP_NAME: &str = "solana-dev-tools";

/// Configuration manager for loading and saving config
pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    /// Create a new configuration manager
    pub fn new() -> Result<Self> {
        let config_path = confy::get_configuration_file_path(APP_NAME, None)?;
        Ok(Self { config_path })
    }

    /// Load configuration from file (or create default if not exists)
    pub fn load(&self) -> Result<Config> {
        let config = confy::load(APP_NAME, None)?;
        Ok(config)
    }

    /// Save configuration to file
    pub fn save(&self, config: &Config) -> Result<()> {
        confy::store(APP_NAME, None, config)?;
        Ok(())
    }

    /// Get the config file path
    pub fn config_path(&self) -> &PathBuf {
        &self.config_path
    }

    /// Set a configuration value by key path
    pub fn set_value(&self, key: &str, value: &str) -> Result<()> {
        let mut config = self.load()?;

        match key {
            "api.base_url" => config.api.base_url = value.to_string(),
            "api.timeout_seconds" => {
                config.api.timeout_seconds = value
                    .parse()
                    .map_err(|_| CliError::InvalidInput("Invalid timeout value".to_string()))?
            }
            "output.format" => {
                config.output.format = match value.to_lowercase().as_str() {
                    "table" => OutputFormat::Table,
                    "json" => OutputFormat::Json,
                    "text" => OutputFormat::Text,
                    _ => {
                        return Err(CliError::InvalidInput(
                            "Invalid format. Use: table, json, or text".to_string(),
                        ))
                    }
                }
            }
            "output.color" => {
                config.output.color = value
                    .parse()
                    .map_err(|_| CliError::InvalidInput("Invalid boolean value".to_string()))?
            }
            _ => return Err(CliError::InvalidInput(format!("Unknown config key: {}", key))),
        }

        self.save(&config)?;
        Ok(())
    }

    /// Get a configuration value by key path
    pub fn get_value(&self, key: &str) -> Result<String> {
        let config = self.load()?;

        let value = match key {
            "api.base_url" => config.api.base_url,
            "api.timeout_seconds" => config.api.timeout_seconds.to_string(),
            "output.format" => match config.output.format {
                OutputFormat::Table => "table".to_string(),
                OutputFormat::Json => "json".to_string(),
                OutputFormat::Text => "text".to_string(),
            },
            "output.color" => config.output.color.to_string(),
            _ => return Err(CliError::InvalidInput(format!("Unknown config key: {}", key))),
        };

        Ok(value)
    }

    /// List all configuration values
    pub fn list_all(&self) -> Result<Vec<(String, String)>> {
        let config = self.load()?;

        let format_str = match config.output.format {
            OutputFormat::Table => "table",
            OutputFormat::Json => "json",
            OutputFormat::Text => "text",
        };

        Ok(vec![
            ("api.base_url".to_string(), config.api.base_url),
            (
                "api.timeout_seconds".to_string(),
                config.api.timeout_seconds.to_string(),
            ),
            ("output.format".to_string(), format_str.to_string()),
            ("output.color".to_string(), config.output.color.to_string()),
        ])
    }

    /// Reset configuration to defaults
    pub fn reset(&self) -> Result<()> {
        let default_config = Config::default();
        self.save(&default_config)?;
        Ok(())
    }
}

impl Default for ConfigManager {
    fn default() -> Self {
        Self::new().expect("Failed to create config manager")
    }
}
