# Solana Developer Tools CLI (`sdt`)

Command-line interface for Solana developer tools maintained by the Solana Foundation.

## Features

- **Device Flow Authentication** - Secure browser-based authentication with system keyring storage
- **Airdrop Management** - Request SOL airdrops and view history on devnet
- **API Key Management** - Create, list, and revoke API keys
- **Configuration Management** - Persistent configuration with sensible defaults
- **Beautiful Output** - Colored tables, progress indicators, and error messages

## Installation

### Build from Source

```bash
cd apps/cli
cargo build --release
```

The binary will be at `target/release/sdt`.

### Add to PATH (Optional)

```bash
# macOS/Linux
sudo cp target/release/sdt /usr/local/bin/

# Or add to your shell profile
export PATH="$PATH:$(pwd)/target/release"
```

## Quick Start

1. **Authenticate with the API**

```bash
sdt auth login
```

This will open a browser window for authentication.

2. **Request an airdrop**

```bash
sdt airdrop request 1.0 <your-wallet-address>
```

3. **View airdrop history**

```bash
sdt airdrop history
```

## Commands

### Authentication (`auth`)

```bash
# Login with device flow
sdt auth login

# Check authentication status
sdt auth status

# Logout and clear credentials
sdt auth logout
```

### Airdrops (`airdrop`)

```bash
# Request a SOL airdrop
sdt airdrop request <amount> <recipient-address>

# View airdrop history
sdt airdrop history [--limit 50] [--offset 0]

# Show usage statistics
sdt airdrop usage
```

### API Keys (`api-key`)

```bash
# Create a new API key
sdt api-key create <name>

# List all API keys
sdt api-key list

# Revoke an API key
sdt api-key revoke <key-id>

# Show key usage stats
sdt api-key usage <key-id>
```

### Configuration (`config`)

```bash
# Set a configuration value
sdt config set api.base_url http://localhost:3000

# Get a configuration value
sdt config get api.base_url

# List all configuration
sdt config list

# Reset to defaults
sdt config reset
```

## Global Options

- `--api-url <URL>` - Override API base URL
- `--output <format>` - Output format: `json`, `table`, or `text`
- `--no-color` - Disable colored output
- `-v, --verbose` - Enable verbose logging
- `-q, --quiet` - Suppress non-error output

## Configuration

Configuration is stored at:

- **macOS**: `~/Library/Application Support/rs.solana-dev-tools/default-config.toml`
- **Linux**: `~/.config/solana-dev-tools/default-config.toml`
- **Windows**: `%APPDATA%\solana-dev-tools\config\default-config.toml`

### Configuration Keys

| Key                   | Default                 | Description                       |
| --------------------- | ----------------------- | --------------------------------- |
| `api.base_url`        | `http://localhost:3000` | API server URL                    |
| `api.timeout_seconds` | `30`                    | Request timeout                   |
| `output.format`       | `table`                 | Output format (table, json, text) |
| `output.color`        | `true`                  | Enable colored output             |

### Environment Variables

You can override config with environment variables:

- `SDT_API_BASE_URL` - API base URL

## Credential Storage

Credentials are securely stored in your system's keyring:

- **macOS**: Keychain
- **Linux**: Secret Service (via D-Bus)
- **Windows**: Credential Manager

## Examples

### Request an airdrop and view on Solscan

```bash
$ sdt airdrop request 1.0 HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH

✓ Airdrop requested successfully

  Transaction: 5KqR8...
  Amount:      1.0 SOL
  Recipient:   HN7cAB...

  View on Solscan:
  https://solscan.io/tx/5KqR8...?cluster=devnet
```

### View airdrop history

```bash
$ sdt airdrop history --limit 10

┌────────────┬─────────┬────────────────┬───────────┬──────────────┐
│ Date       │ Amount  │ Recipient      │ Status    │ Signature    │
├────────────┼─────────┼────────────────┼───────────┼──────────────┤
│ 2025-01-15 │ 1.0 SOL │ HN7cAB...4YWrH │ completed │ 5KqR8...3xD2 │
│ 2025-01-14 │ 0.5 SOL │ 8jPQw2...9mK1  │ completed │ 3nM7x...1vB9 │
└────────────┴─────────┴────────────────┴───────────┴──────────────┘

Showing 1 - 2 of 2 total airdrops
```

### Create an API key for CI/CD

```bash
$ sdt api-key create "GitHub Actions"

✓ API key created successfully

  Name:  GitHub Actions
  Token: ak_1a2b3c4d5e6f7g8h9i0j

  ⚠ Save this token securely - it won't be shown again!
```

## Development

### Prerequisites

- Rust 1.70+ (2021 edition)
- API server running (see `apps/api`)

### Running tests

```bash
cargo test
```

### Project Structure

```
src/
├── main.rs              # Entry point
├── lib.rs               # Library exports
├── cli.rs               # Clap command definitions
├── error.rs             # Error types
├── auth/
│   ├── credentials.rs   # Keyring integration
│   └── device_flow.rs   # Device flow auth
├── client/
│   └── api.rs           # HTTP client
├── commands/
│   ├── auth.rs          # Auth commands
│   ├── airdrop.rs       # Airdrop commands
│   ├── apikey.rs        # API key commands
│   └── config.rs        # Config commands
└── config/
    ├── mod.rs           # Config types
    └── manager.rs       # Config management
```

## Troubleshooting

### Authentication Issues

If authentication fails:

```bash
# Clear stored credentials
sdt auth logout

# Try logging in again
sdt auth login
```

### API Connection Issues

Check if the API is running:

```bash
curl http://localhost:3000/health
```

Override the API URL:

```bash
sdt --api-url http://localhost:3000 auth status
```

### Keyring Access Issues

On Linux, ensure the Secret Service is running:

```bash
systemctl --user status gnome-keyring-daemon
```

## License

MIT
