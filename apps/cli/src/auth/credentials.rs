use crate::error::{CliError, Result};
use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "solana-dev-tools";

/// Stored credentials
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credentials {
    pub user_id: String,
    pub api_token: String,
}

/// Secure credentials storage using system keyring
pub struct CredentialsStore;

impl CredentialsStore {
    /// Save credentials to the system keyring
    pub fn save(credentials: &Credentials) -> Result<()> {
        let entry = Entry::new(SERVICE_NAME, &credentials.user_id)?;
        let json = serde_json::to_string(credentials)?;
        entry.set_password(&json)?;
        Ok(())
    }

    /// Load credentials from the system keyring
    pub fn load() -> Result<Credentials> {
        // Try to find any stored credentials
        // We'll use a well-known key to store the last logged-in user
        let entry = Entry::new(SERVICE_NAME, "current_user")?;

        match entry.get_password() {
            Ok(user_id) => {
                // Now load the actual credentials for this user
                let creds_entry = Entry::new(SERVICE_NAME, &user_id)?;
                let json = creds_entry.get_password()?;
                let credentials: Credentials = serde_json::from_str(&json)?;
                Ok(credentials)
            }
            Err(_) => Err(CliError::NotAuthenticated),
        }
    }

    /// Check if credentials exist
    pub fn exists() -> bool {
        let entry = Entry::new(SERVICE_NAME, "current_user");
        if let Ok(entry) = entry {
            entry.get_password().is_ok()
        } else {
            false
        }
    }

    /// Delete stored credentials
    pub fn delete() -> Result<()> {
        // First get the current user
        let entry = Entry::new(SERVICE_NAME, "current_user")?;

        if let Ok(user_id) = entry.get_password() {
            // Delete the actual credentials
            let creds_entry = Entry::new(SERVICE_NAME, &user_id)?;
            creds_entry.delete_credential()?;
        }

        // Delete the current user marker
        entry.delete_credential().ok();

        Ok(())
    }

    /// Save with tracking of current user
    pub fn save_with_tracking(credentials: &Credentials) -> Result<()> {
        // Save the actual credentials
        let entry = Entry::new(SERVICE_NAME, &credentials.user_id)?;
        let json = serde_json::to_string(credentials)?;
        entry.set_password(&json)?;

        // Track this as the current user
        let current_entry = Entry::new(SERVICE_NAME, "current_user")?;
        current_entry.set_password(&credentials.user_id)?;

        Ok(())
    }
}
