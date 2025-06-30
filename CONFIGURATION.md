# DotLake Configuration Guide

This document describes the improved configuration system for DotLake, which provides better validation, clearer structure, and enhanced error handling.

## Overview

The new configuration system uses Pydantic for validation and provides a more intuitive structure that groups related settings together. It maintains backward compatibility with existing configurations while offering a cleaner, more maintainable approach.

## Configuration Structure

### New Format (Recommended)

```yaml
# Chain Configuration
chain:
  relay_chain: Polkadot
  name: PolkadotAssetHub
  wss_endpoint: wss://polkadot-asset-hub-rpc.polkadot.io

# Ingest Configuration
ingest:
  mode: historical  # live | historical
  block_range:
    start: 9000000
    end: 9076000

# Database Configuration
database:
  # Option 1: Local database (creates PostgreSQL container)
  local:
    enabled: true
    retain_after_cleanup: false
    restore_from: null  # Path to backup file if restoring
  
  # Option 2: External database
  external:
    enabled: false
    type: postgres  # postgres | mysql
    connection:
      host: host.docker.internal
      port: 5432
      name: dotlake
      user: username
      password: password
```

## Configuration Sections

### 1. Chain Configuration (`chain`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `relay_chain` | string | No | `"solo"` | Name of the relay chain |
| `name` | string | No | `"substrate_chain"` | Name of the chain to index |
| `wss_endpoint` | string | **Yes** | - | WebSocket endpoint URL |

**Example:**
```yaml
chain:
  relay_chain: Polkadot
  name: PolkadotAssetHub
  wss_endpoint: wss://polkadot-asset-hub-rpc.polkadot.io
```

### 2. Ingest Configuration (`ingest`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `mode` | string | No | `"live"` | Ingest mode: `"live"` or `"historical"` |
| `block_range` | object | Conditional | - | Block range for historical mode |

**Block Range Object:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | integer | **Yes** | Starting block number (≥ 0) |
| `end` | integer | **Yes** | Ending block number (must be > start) |

**Examples:**

Live Mode:
```yaml
ingest:
  mode: live
  # block_range not needed for live mode
```

Historical Mode:
```yaml
ingest:
  mode: historical
  block_range:
    start: 9000000
    end: 9076000
```

### 3. Database Configuration (`database`)

You must choose between local or external database configuration.

#### Local Database (`local`)

Creates a PostgreSQL container for you.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | boolean | **Yes** | `false` | Whether to use local database |
| `retain_after_cleanup` | boolean | No | `false` | Whether to retain database after cleanup |
| `restore_from` | string | No | `null` | Path to database backup file |

**Example:**
```yaml
database:
  local:
    enabled: true
    retain_after_cleanup: false
    restore_from: null
```

#### External Database (`external`)

Connect to an existing database.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | boolean | **Yes** | `false` | Whether to use external database |
| `type` | string | **Yes** | - | Database type: `"postgres"` or `"mysql"` |
| `connection` | object | **Yes** | - | Database connection details |

**Connection Object:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `host` | string | **Yes** | Database host (use `host.docker.internal` for local) |
| `port` | integer | **Yes** | Database port (1-65535) |
| `name` | string | **Yes** | Database name |
| `user` | string | **Yes** | Database username |
| `password` | string | **Yes** | Database password |

**Examples:**

PostgreSQL:
```yaml
database:
  local:
    enabled: false
  external:
    enabled: true
    type: postgres
    connection:
      host: host.docker.internal
      port: 5432
      name: dotlake
      user: username
      password: password
```

MySQL:
```yaml
database:
  local:
    enabled: false
  external:
    enabled: true
    type: mysql
    connection:
      host: host.docker.internal
      port: 3306
      name: dotlake
      user: username
      password: password
```

## Validation and Error Handling

The new system provides comprehensive validation:

### Automatic Validation
- **Data types**: Ensures correct types for all fields
- **Required fields**: Validates that required fields are present
- **Value ranges**: Checks port numbers, block numbers, etc.
- **Logical consistency**: Ensures block ranges are valid, database choice is clear

### Error Messages
Clear, actionable error messages help you fix configuration issues:

```
Configuration validation error: 
  - chain.wss_endpoint: WSS endpoint must be a valid WebSocket URL starting with ws:// or wss://
  - ingest.block_range.end: end_block must be greater than start_block
  - database: Either local or external database must be enabled
```

## Example Configurations

### 1. Local Database with Historical Ingest

```yaml
chain:
  relay_chain: Polkadot
  name: PolkadotAssetHub
  wss_endpoint: wss://polkadot-asset-hub-rpc.polkadot.io

ingest:
  mode: historical
  block_range:
    start: 9000000
    end: 9076000

database:
  local:
    enabled: true
    retain_after_cleanup: false
    restore_from: null
```

### 2. External PostgreSQL with Live Ingest

```yaml
chain:
  relay_chain: Polkadot
  name: Polkadot
  wss_endpoint: wss://polkadot-rpc.dwellir.com

ingest:
  mode: live

database:
  local:
    enabled: false
  external:
    enabled: true
    type: postgres
    connection:
      host: your-postgres-host.com
      port: 5432
      name: dotlake
      user: your_username
      password: your_password
```

### 3. External MySQL with Historical Ingest

```yaml
chain:
  relay_chain: Kusama
  name: Kusama
  wss_endpoint: wss://kusama-rpc.dwellir.com

ingest:
  mode: historical
  block_range:
    start: 10000000
    end: 10010000

database:
  local:
    enabled: false
  external:
    enabled: true
    type: mysql
    connection:
      host: your-mysql-host.com
      port: 3306
      name: dotlake
      user: your_username
      password: your_password
```

## Best Practices

1. **Use the new format**: The new structure is clearer and more maintainable
2. **Validate early**: The system validates configuration at startup
3. **Use meaningful names**: Choose descriptive names for your chains
4. **Secure credentials**: Store database passwords securely
5. **Test configurations**: Validate your config before deployment
6. **Document changes**: Keep track of configuration changes

## Troubleshooting

### Common Issues

1. **"WSS endpoint must be a valid WebSocket URL"**
   - Ensure your endpoint starts with `ws://` or `wss://`
   - Check that the URL is accessible

2. **"end_block must be greater than start_block"**
   - Verify your block range is correct
   - Ensure start_block < end_block

3. **"Either local or external database must be enabled"**
   - Choose either local or external database
   - Don't enable both or neither

4. **"Database configuration validation failed"**
   - Check that all required database fields are provided
   - Verify database credentials and connectivity

### Getting Help

- Check the configuration summary printed at startup
- Review the example configurations in `config-sample/`
- Validate your configuration with the new system 