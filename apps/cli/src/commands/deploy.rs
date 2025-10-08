use crate::cli::DeployCommands;
use crate::auth::CredentialsStore;
use crate::error::{CliError, Result};
use colored::Colorize;
use indicatif::{ProgressBar, ProgressStyle};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize)]
struct InitiateDeployRequest {
    #[serde(rename = "projectName")]
    project_name: String,
    #[serde(rename = "programName")]
    program_name: String,
    description: Option<String>,
    cluster: String,
    #[serde(rename = "programPath")]
    program_path: Option<String>,
}

#[derive(Debug, Deserialize)]
struct InitiateDeployResponse {
    project: ProjectResponse,
    #[serde(rename = "programId")]
    program_id: String,
}

#[derive(Debug, Deserialize)]
struct ProjectResponse {
    id: String,
    name: String,
    cluster: String,
}

pub async fn handle_deploy_command(command: DeployCommands, api_url: &str) -> Result<()> {
    match command {
        DeployCommands::Program {
            program_path,
            project,
            name,
            cluster,
            description,
        } => {
            deploy_program(
                api_url,
                program_path,
                project,
                name,
                cluster,
                description,
            )
            .await
        }
    }
}

async fn deploy_program(
    api_url: &str,
    program_path: PathBuf,
    project_name: Option<String>,
    program_name: Option<String>,
    cluster: String,
    description: Option<String>,
) -> Result<()> {
    // Get API token
    let credentials = CredentialsStore::load()?;
    let api_token = &credentials.api_token;

    println!(
        "{} {}",
        "🚀".bold(),
        "Initiating program deployment...".bold()
    );

    // Derive program name from path if not provided
    let program_name = program_name.unwrap_or_else(|| {
        program_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("program")
            .to_string()
    });

    // Derive project name from current directory if not provided
    let project_name = project_name.unwrap_or_else(|| {
        std::env::current_dir()
            .ok()
            .and_then(|p| p.file_name().and_then(|s| s.to_str()).map(|s| s.to_string()))
            .unwrap_or_else(|| "default".to_string())
    });

    // Verify program file exists
    if !program_path.exists() {
        return Err(CliError::InvalidInput(format!(
            "Program file not found: {}",
            program_path.display()
        )));
    }

    println!("  {} {}", "Project:".dimmed(), project_name.cyan());
    println!("  {} {}", "Program:".dimmed(), program_name.cyan());
    println!("  {} {}", "Cluster:".dimmed(), cluster.cyan());
    println!(
        "  {} {}",
        "File:".dimmed(),
        program_path.display().to_string().cyan()
    );
    println!();

    // Step 1: Call API to initiate deployment (creates project/program records)
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Registering deployment with API...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/projects/deploy", api_url))
        .bearer_auth(&api_token)
        .json(&InitiateDeployRequest {
            project_name: project_name.clone(),
            program_name: program_name.clone(),
            description: description.clone(),
            cluster: cluster.clone(),
            program_path: Some(program_path.display().to_string()),
        })
        .send()
        .await?;

    if !response.status().is_success() {
        spinner.finish_and_clear();
        let error_text = response.text().await.unwrap_or_default();
        return Err(CliError::ApiError(format!(
            "Failed to initiate deployment: {}",
            error_text
        )));
    }

    let deploy_response: InitiateDeployResponse = response
        .json()
        .await
        .map_err(|e| CliError::ApiError(format!("Failed to parse response: {}", e)))?;

    spinner.finish_with_message("✓ Deployment registered".green().to_string());

    println!();
    println!(
        "  {} {}",
        "Project ID:".dimmed(),
        deploy_response.project.id.cyan()
    );
    println!(
        "  {} {}",
        "Program ID:".dimmed(),
        deploy_response.program_id.cyan()
    );
    println!();

    // Step 2: TODO - Actual deployment will happen here
    // This will be implemented when the Solana program deployment logic is ready
    println!(
        "{}",
        "⏳ Actual deployment logic will be implemented when the Solana program is ready"
            .yellow()
    );
    println!();
    println!(
        "{}",
        "For now, the program record has been created in the database.".dimmed()
    );
    println!(
        "{}",
        "The CLI will update the program address after deployment.".dimmed()
    );

    Ok(())
}
