use crate::error::{CliError, Result};
use colored::Colorize;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceAuthRequest {
    pub token: String,
    #[serde(rename = "verificationUrl")]
    pub verification_url: String,
    #[serde(rename = "userCode")]
    pub user_code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceAuthPollResponse {
    pub status: String,
    #[serde(rename = "apiToken")]
    pub api_token: Option<String>,
    #[serde(rename = "userId")]
    pub user_id: Option<String>,
}

/// Device flow authentication handler
pub struct DeviceFlowAuth {
    client: reqwest::Client,
    base_url: String,
}

impl DeviceFlowAuth {
    /// Create a new device flow authenticator
    pub fn new(base_url: String) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self { client, base_url }
    }

    /// Request authentication and get the verification URL and user code
    pub async fn request_auth(&self) -> Result<DeviceAuthRequest> {
        let url = format!("{}/cli-auth/request", self.base_url);

        let response = self
            .client
            .post(&url)
            .send()
            .await
            .map_err(|e| CliError::NetworkError(e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let auth_request: DeviceAuthRequest = response.json().await?;
        Ok(auth_request)
    }

    /// Poll for authentication completion
    pub async fn poll(&self, token: &str) -> Result<DeviceAuthPollResponse> {
        let url = format!("{}/cli-auth/poll/{}", self.base_url, token);

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| CliError::NetworkError(e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let poll_response: DeviceAuthPollResponse = response.json().await?;
        Ok(poll_response)
    }

    /// Complete the device flow authentication process with polling
    pub async fn authenticate(&self) -> Result<(String, String)> {
        // Step 1: Request authentication
        let auth_request = self.request_auth().await?;

        // Step 2: Display instructions to user and open browser
        println!("\n{}", "=".repeat(60));
        println!("  Authentication Required");
        println!("{}", "=".repeat(60));
        println!();
        println!("  Opening browser to authenticate...");
        println!();
        println!("  URL: {}", auth_request.verification_url.bright_blue());
        println!("  Code: {}", auth_request.user_code.bright_yellow());
        println!();
        println!("{}", "=".repeat(60));
        println!();

        // Try to open the browser automatically
        if let Err(e) = open::that(&auth_request.verification_url) {
            eprintln!(
                "{}",
                format!("Note: Could not open browser automatically: {}", e).yellow()
            );
            println!("Please visit the URL above manually.");
            println!();
        }

        // Step 3: Poll for completion
        let spinner = indicatif::ProgressBar::new_spinner();
        spinner.set_message("Waiting for browser authentication...");
        spinner.enable_steady_tick(Duration::from_millis(100));

        let max_attempts = 60; // 5 minutes with 5-second intervals
        let poll_interval = Duration::from_secs(5);

        for _ in 0..max_attempts {
            tokio::time::sleep(poll_interval).await;

            match self.poll(&auth_request.token).await {
                Ok(response) => {
                    match response.status.as_str() {
                        "verified" => {
                            spinner.finish_with_message("Authentication successful!");
                            if let (Some(api_token), Some(user_id)) =
                                (response.api_token, response.user_id)
                            {
                                return Ok((api_token, user_id));
                            } else {
                                return Err(CliError::ApiError(
                                    "Authentication verified but no token returned".to_string(),
                                ));
                            }
                        }
                        "expired" => {
                            spinner.finish_with_message("Authentication session expired");
                            return Err(CliError::AuthTimeout);
                        }
                        _ => {
                            // Still pending, continue polling
                            continue;
                        }
                    }
                }
                Err(e) => {
                    spinner.finish_with_message("Authentication failed");
                    return Err(e);
                }
            }
        }

        spinner.finish_with_message("Authentication timed out");
        Err(CliError::AuthTimeout)
    }
}
