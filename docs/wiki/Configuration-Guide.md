# Configuration Guide

This guide covers all configuration options for DotLake Community, from basic setup to advanced customization.

## 📋 Configuration Overview

DotLake uses YAML configuration files to define all aspects of the system. The configuration system supports both legacy and new formats, with the new format providing better validation and structure.

## 🆕 New Configuration Format (Recommended)

The new configuration format uses Pydantic for validation and provides a cleaner, more intuitive structure:

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

## 🔧 Configuration Sections

### 1. Chain Configuration (`chain`)

Defines the blockchain connection and identity.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `relay_chain` | string | No | `"solo"` | Name of the relay chain |
| `name` | string | No | `"substrate_chain"` | Name of the chain to index |
| `wss_endpoint` | string | **Yes** | - | WebSocket endpoint URL |

**Examples:**

```yaml
# Polkadot mainnet
chain:
  relay_chain: Polkadot
  name: Polkadot
  wss_endpoint: wss://polkadot-rpc.dwellir.com

# Kusama mainnet
chain:
  relay_chain: Kusama
  name: Kusama
  wss_endpoint: wss://kusama-rpc.dwellir.com

# Polkadot Asset Hub parachain
chain:
  relay_chain: Polkadot
  name: PolkadotAssetHub
  wss_endpoint: wss://polkadot-asset-hub-rpc.polkadot.io

# Standalone chain (no relay)
chain:
  relay_chain: solo
  name: MyCustomChain
  wss_endpoint: wss://my-chain-rpc.example.com
```

### 2. Ingest Configuration (`ingest`)

Controls how data is ingested from the blockchain.

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

```yaml
# Live mode (real-time ingestion)
ingest:
  mode: live
  # block_range not needed for live mode

# Historical mode (backfill specific range)
ingest:
  mode: historical
  block_range:
    start: 9000000
    end: 9076000

# Historical mode (small range for testing)
ingest:
  mode: historical
  block_range:
    start: 1000000
    end: 1000100
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

```yaml
# PostgreSQL external database
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
      user: postgres
      password: mypassword

# MySQL external database
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
      user: root
      password: mypassword
```

## 📝 Legacy Configuration Format

The legacy format is still supported for backward compatibility:

```yaml
relay_chain: Polkadot
chain: PolkadotAssetHub
wss: wss://polkadot-asset-hub-rpc.polkadot.io
create_db: true
retain_db: false
restore_path: null
databases:
  - type: postgres
    host: 0.0.0.0
    port: 5432
    name: dotlake
    user: username
    password: password
ingest_mode: historical
start_block: 9000000
end_block: 9076000
```

**Legacy to New Format Mapping:**

| Legacy Field | New Field | Notes |
|--------------|-----------|-------|
| `relay_chain` | `chain.relay_chain` | Same |
| `chain` | `chain.name` | Same |
| `wss` | `chain.wss_endpoint` | Same |
| `create_db` | `database.local.enabled` | Inverted logic |
| `retain_db` | `database.local.retain_after_cleanup` | Same |
| `restore_path` | `database.local.restore_from` | Same |
| `databases` | `database.external` | Restructured |
| `ingest_mode` | `ingest.mode` | Same |
| `start_block` | `ingest.block_range.start` | Moved to object |
| `end_block` | `ingest.block_range.end` | Moved to object |

## ✅ Configuration Validation

The new configuration system provides comprehensive validation:

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

### Testing Configuration

Test your configuration before running:

```bash
python3 test_config.py
```

This will verify:
- Configuration file can be loaded
- Required directories and files exist
- Database configuration is valid
- All required fields are present

## 🔗 Popular RPC Endpoints

### Polkadot Ecosystem

| Chain | Endpoint | Type | Rate Limits |
|-------|----------|------|-------------|
| Polkadot | `wss://polkadot-rpc.dwellir.com` | Public | Medium |
| Polkadot | `wss://polkadot.api.onfinality.io/public-ws` | Public | Medium |
| Kusama | `wss://kusama-rpc.dwellir.com` | Public | Medium |
| Polkadot Asset Hub | `wss://polkadot-asset-hub-rpc.polkadot.io` | Public | Medium |
| Moonbeam | `wss://wss.api.moonbeam.network` | Public | Medium |

### Private Endpoints

For production use, consider private RPC providers:
- **OnFinality**: https://onfinality.io/
- **Dwellir**: https://dwellir.com/
- **Parity**: https://www.parity.io/
- **Self-hosted**: Run your own node

## 🎯 Configuration Examples

### Example 1: Live Polkadot Monitoring

```yaml
chain:
  relay_chain: Polkadot
  name: Polkadot
  wss_endpoint: wss://polkadot-rpc.dwellir.com

ingest:
  mode: live

database:
  local:
    enabled: true
    retain_after_cleanup: true
```

### Example 2: Historical Kusama Backfill

```yaml
chain:
  relay_chain: Kusama
  name: Kusama
  wss_endpoint: wss://kusama-rpc.dwellir.com

ingest:
  mode: historical
  block_range:
    start: 10000000
    end: 10001000

database:
  local:
    enabled: true
    retain_after_cleanup: false
```

### Example 3: External PostgreSQL Database

```yaml
chain:
  relay_chain: Polkadot
  name: PolkadotAssetHub
  wss_endpoint: wss://polkadot-asset-hub-rpc.polkadot.io

ingest:
  mode: live

database:
  local:
    enabled: false
  external:
    enabled: true
    type: postgres
    connection:
      host: host.docker.internal
      port: 5432
      name: dotlake_prod
      user: dotlake_user
      password: secure_password
```

### Example 4: MySQL with Historical Data

```yaml
chain:
  relay_chain: solo
  name: MyCustomChain
  wss_endpoint: wss://my-chain-rpc.example.com

ingest:
  mode: historical
  block_range:
    start: 1
    end: 10000

database:
  local:
    enabled: false
  external:
    enabled: true
    type: mysql
    connection:
      host: host.docker.internal
      port: 3306
      name: dotlake_mysql
      user: root
      password: mysql_password
```

## 🔧 Advanced Configuration

### Environment Variables

You can override configuration values using environment variables:

```bash
export DOTLAKE_CHAIN_RELAY_CHAIN=Polkadot
export DOTLAKE_CHAIN_NAME=PolkadotAssetHub
export DOTLAKE_CHAIN_WSS_ENDPOINT=wss://polkadot-asset-hub-rpc.polkadot.io
export DOTLAKE_INGEST_MODE=live
export DOTLAKE_DATABASE_LOCAL_ENABLED=true
```

### Multiple Configuration Files

You can use different configuration files for different environments:

```bash
# Development
python3 launch_dotlake.py config-dev.yaml

# Production
python3 launch_dotlake.py config-prod.yaml

# Testing
python3 launch_dotlake.py config-test.yaml
```

### Configuration Inheritance

Create base configurations and extend them:

```yaml
# base-config.yaml
chain:
  relay_chain: Polkadot
  wss_endpoint: wss://polkadot-rpc.dwellir.com

database:
  local:
    enabled: true
    retain_after_cleanup: false

# prod-config.yaml (extends base)
chain:
  name: PolkadotAssetHub
  wss_endpoint: wss://polkadot-asset-hub-rpc.polkadot.io

ingest:
  mode: live

database:
  local:
    retain_after_cleanup: true
```

## 🚨 Common Configuration Mistakes

### 1. Invalid WSS Endpoint
```yaml
# ❌ Wrong
chain:
  wss_endpoint: https://polkadot-rpc.dwellir.com

# ✅ Correct
chain:
  wss_endpoint: wss://polkadot-rpc.dwellir.com
```

### 2. Invalid Block Range
```yaml
# ❌ Wrong (end < start)
ingest:
  mode: historical
  block_range:
    start: 1000
    end: 500

# ✅ Correct
ingest:
  mode: historical
  block_range:
    start: 500
    end: 1000
```

### 3. Multiple Database Configurations
```yaml
# ❌ Wrong (both enabled)
database:
  local:
    enabled: true
  external:
    enabled: true

# ✅ Correct
database:
  local:
    enabled: true
  external:
    enabled: false
```

### 4. Missing Required Fields
```yaml
# ❌ Wrong (missing wss_endpoint)
chain:
  relay_chain: Polkadot
  name: Polkadot

# ✅ Correct
chain:
  relay_chain: Polkadot
  name: Polkadot
  wss_endpoint: wss://polkadot-rpc.dwellir.com
```

## 📚 Next Steps

- **[Configuration Examples](Configuration-Examples)**: More detailed examples for specific use cases
- **[Troubleshooting](Troubleshooting)**: Common configuration issues and solutions
- **[API Reference](API-Reference)**: Understanding the data structure
- **[Development Guide](Development-Guide)**: Customizing the configuration system 