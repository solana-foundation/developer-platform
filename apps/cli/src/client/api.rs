use crate::auth::credentials::Credentials;
use crate::error::{CliError, Result};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize)]
pub struct CreateAirdropRequest {
    pub amount: f64,
    pub recipient: String,
}

#[derive(Debug, Deserialize)]
pub struct AirdropResponse {
    pub signature: String,
    pub amount: f64,
    pub recipient: String,
}

#[derive(Debug, Deserialize)]
pub struct AirdropHistoryResponse {
    pub airdrops: Vec<AirdropRecord>,
    pub pagination: Pagination,
}

#[derive(Debug, Deserialize)]
pub struct AirdropRecord {
    pub id: String,
    pub signature: String,
    pub recipient: String,
    pub amount: f64,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "explorerUrl")]
    pub explorer_url: String,
}

#[derive(Debug, Deserialize)]
pub struct Pagination {
    pub total: u32,
    pub limit: u32,
    pub offset: u32,
    #[serde(rename = "hasMore")]
    pub has_more: bool,
}

#[derive(Debug, Deserialize)]
pub struct UsageStats {
    pub usage: UsageStatsData,
}

#[derive(Debug, Deserialize)]
pub struct UsageStatsData {
    pub today: DailyUsage,
    pub total: TotalUsage,
}

#[derive(Debug, Deserialize)]
pub struct DailyUsage {
    pub requests: u32,
    pub amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct TotalUsage {
    pub requests: u32,
    pub amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct ApiKeyResponse {
    pub token: String,
}

#[derive(Debug, Deserialize)]
pub struct ApiKeysListResponse {
    #[serde(rename = "apiKeys")]
    pub api_keys: Vec<ApiKeyRecord>,
}

#[derive(Debug, Deserialize)]
pub struct ApiKeyRecord {
    pub id: String,
    pub name: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "lastUsedAt")]
    pub last_used_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ApiKeyUsageResponse {
    pub usage: ApiKeyUsageStats,
}

#[derive(Debug, Deserialize)]
pub struct ApiKeyUsageStats {
    #[serde(rename = "totalRequests")]
    pub total_requests: u32,
    #[serde(rename = "lastUsedAt")]
    pub last_used_at: Option<String>,
}

/// HTTP client for interacting with the API
pub struct ApiClient {
    client: reqwest::Client,
    base_url: String,
    credentials: Option<Credentials>,
}

impl ApiClient {
    /// Create a new API client
    pub fn new(base_url: String, timeout: Duration) -> Result<Self> {
        let client = reqwest::Client::builder().timeout(timeout).build()?;

        Ok(Self {
            client,
            base_url,
            credentials: None,
        })
    }

    /// Set credentials for authenticated requests
    pub fn with_credentials(mut self, credentials: Credentials) -> Self {
        self.credentials = Some(credentials);
        self
    }

    /// Build headers with authorization
    fn build_headers(&self) -> Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        if let Some(ref creds) = self.credentials {
            let auth_value =
                HeaderValue::from_str(&format!("Bearer {}", creds.api_token)).map_err(|_| {
                    CliError::Other("Invalid authorization header value".to_string())
                })?;
            headers.insert(AUTHORIZATION, auth_value);
        }

        Ok(headers)
    }

    /// Request a SOL airdrop
    pub async fn request_airdrop(&self, amount: f64, recipient: &str) -> Result<AirdropResponse> {
        let url = format!("{}/airdrop", self.base_url);
        let headers = self.build_headers()?;

        let payload = CreateAirdropRequest {
            amount,
            recipient: recipient.to_string(),
        };

        let response = self
            .client
            .post(&url)
            .headers(headers)
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let airdrop_response: AirdropResponse = response.json().await?;
        Ok(airdrop_response)
    }

    /// Get airdrop history
    pub async fn get_airdrop_history(
        &self,
        limit: u32,
        offset: u32,
    ) -> Result<AirdropHistoryResponse> {
        let url = format!(
            "{}/airdrop/history?limit={}&offset={}",
            self.base_url, limit, offset
        );
        let headers = self.build_headers()?;

        let response = self.client.get(&url).headers(headers).send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let history: AirdropHistoryResponse = response.json().await?;
        Ok(history)
    }

    /// Get airdrop usage statistics
    pub async fn get_airdrop_usage(&self) -> Result<UsageStats> {
        let url = format!("{}/airdrop/usage", self.base_url);
        let headers = self.build_headers()?;

        let response = self.client.get(&url).headers(headers).send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let usage: UsageStats = response.json().await?;
        Ok(usage)
    }

    /// Create a new API key
    pub async fn create_api_key(&self, name: &str) -> Result<String> {
        let url = format!("{}/auth/api-keys", self.base_url);
        let headers = self.build_headers()?;

        let payload = serde_json::json!({ "name": name });

        let response = self
            .client
            .post(&url)
            .headers(headers)
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let key_response: ApiKeyResponse = response.json().await?;
        Ok(key_response.token)
    }

    /// List all API keys
    pub async fn list_api_keys(&self) -> Result<Vec<ApiKeyRecord>> {
        let url = format!("{}/auth/api-keys", self.base_url);
        let headers = self.build_headers()?;

        let response = self.client.get(&url).headers(headers).send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let keys_response: ApiKeysListResponse = response.json().await?;
        Ok(keys_response.api_keys)
    }

    /// Revoke an API key
    pub async fn revoke_api_key(&self, key_id: &str) -> Result<()> {
        let url = format!("{}/auth/api-keys/{}", self.base_url, key_id);
        let headers = self.build_headers()?;

        let response = self.client.delete(&url).headers(headers).send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        Ok(())
    }

    /// Get API key usage statistics
    pub async fn get_api_key_usage(&self, key_id: &str) -> Result<ApiKeyUsageStats> {
        let url = format!("{}/auth/api-keys/{}/usage", self.base_url, key_id);
        let headers = self.build_headers()?;

        let response = self.client.get(&url).headers(headers).send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(CliError::ApiResponseError {
                status: status.as_u16(),
                message: text,
            });
        }

        let usage_response: ApiKeyUsageResponse = response.json().await?;
        Ok(usage_response.usage)
    }
}
