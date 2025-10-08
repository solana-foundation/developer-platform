use serde::{Deserialize, Serialize};

pub mod manager;

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub api: ApiConfig,

    #[serde(default)]
    pub output: OutputConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            api: ApiConfig::default(),
            output: OutputConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiConfig {
    #[serde(default = "default_base_url")]
    pub base_url: String,

    #[serde(default = "default_timeout")]
    pub timeout_seconds: u64,
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            base_url: default_base_url(),
            timeout_seconds: default_timeout(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputConfig {
    #[serde(default = "default_format")]
    pub format: OutputFormat,

    #[serde(default = "default_color")]
    pub color: bool,
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            format: default_format(),
            color: default_color(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    Table,
    Json,
    Text,
}

fn default_base_url() -> String {
    "http://localhost:3000".to_string()
}

fn default_timeout() -> u64 {
    30
}

fn default_format() -> OutputFormat {
    OutputFormat::Table
}

fn default_color() -> bool {
    true
}
