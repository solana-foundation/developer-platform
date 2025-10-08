use crate::auth::CredentialsStore;
use crate::cli::RpcCommands;
use crate::client::api::ApiClient;
use crate::error::Result;
use colored::Colorize;
use comfy_table::{Cell, Table};
use std::time::Duration;

pub async fn handle_rpc_command(command: RpcCommands, api_url: &str) -> Result<()> {
    match command {
        RpcCommands::Call { method, params } => handle_rpc_call(method, params, api_url).await,
        RpcCommands::Info => handle_rpc_info(api_url).await,
    }
}

async fn handle_rpc_call(method: String, params: Option<String>, api_url: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Parse params if provided
    let parsed_params = if let Some(params_str) = params {
        let value: serde_json::Value = serde_json::from_str(&params_str)
            .map_err(|e| crate::error::CliError::InvalidInput(format!("Invalid JSON params: {}", e)))?;
        Some(value)
    } else {
        None
    };

    // Create API client
    let client = ApiClient::new(api_url.to_string(), Duration::from_secs(30))?
        .with_credentials(credentials);

    // Send RPC request
    let response = client.send_rpc_request(&method, parsed_params).await?;

    // Check for RPC error
    if let Some(error) = response.error {
        eprintln!(
            "{}: [{}] {}",
            "RPC Error".red(),
            error.code,
            error.message
        );
        return Err(crate::error::CliError::Other(error.message));
    }

    // Display result
    if let Some(result) = response.result {
        println!("{}", serde_json::to_string_pretty(&result)?);
    } else {
        println!("{}", "No result returned".yellow());
    }

    Ok(())
}

async fn handle_rpc_info(api_url: &str) -> Result<()> {
    // Load credentials
    let credentials = CredentialsStore::load()?;

    // Create API client
    let client = ApiClient::new(api_url.to_string(), Duration::from_secs(30))?
        .with_credentials(credentials);

    // Get provider info
    let info = client.get_rpc_info().await?;

    // Display as table
    let mut table = Table::new();
    table.set_header(vec![
        Cell::new("Property").fg(comfy_table::Color::Cyan),
        Cell::new("Value").fg(comfy_table::Color::Cyan),
    ]);

    table.add_row(vec![
        Cell::new("Total Providers"),
        Cell::new(info.total.to_string()),
    ]);

    table.add_row(vec![
        Cell::new("Providers"),
        Cell::new(info.providers.join("\n")),
    ]);

    println!("{}", table);

    Ok(())
}
