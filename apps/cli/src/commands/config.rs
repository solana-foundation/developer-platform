use crate::cli::ConfigCommands;
use crate::config::manager::ConfigManager;
use crate::error::Result;
use colored::Colorize;
use comfy_table::{Cell, Color, Table};

pub async fn handle_config_command(command: ConfigCommands) -> Result<()> {
    match command {
        ConfigCommands::Set { key, value } => set_config(&key, &value),
        ConfigCommands::Get { key } => get_config(&key),
        ConfigCommands::List => list_config(),
        ConfigCommands::Reset => reset_config(),
    }
}

fn set_config(key: &str, value: &str) -> Result<()> {
    let manager = ConfigManager::new()?;
    manager.set_value(key, value)?;

    println!();
    println!("{}", "✓ Configuration updated".green().bold());
    println!();
    println!("  {}: {}", key.bright_cyan(), value.bright_yellow());
    println!();

    Ok(())
}

fn get_config(key: &str) -> Result<()> {
    let manager = ConfigManager::new()?;
    let value = manager.get_value(key)?;

    println!("{}", value);

    Ok(())
}

fn list_config() -> Result<()> {
    let manager = ConfigManager::new()?;
    let config_items = manager.list_all()?;

    // Create table
    let mut table = Table::new();
    table.set_header(vec![
        Cell::new("Key").fg(Color::Cyan),
        Cell::new("Value").fg(Color::Cyan),
    ]);

    for (key, value) in config_items {
        table.add_row(vec![Cell::new(key), Cell::new(value)]);
    }

    println!();
    println!("{}", "Configuration".bold());
    println!("{}", "=".repeat(50));
    println!();
    println!("{}", table);
    println!();
    println!("Config file: {}", manager.config_path().display().to_string().bright_black());
    println!();

    Ok(())
}

fn reset_config() -> Result<()> {
    let manager = ConfigManager::new()?;
    manager.reset()?;

    println!();
    println!("{}", "✓ Configuration reset to defaults".green().bold());
    println!();

    Ok(())
}
