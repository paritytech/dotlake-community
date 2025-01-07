# dotlake-community

A data ingestion pipeline for Polkadot-based blockchains that combines Substrate API Sidecar with a custom block ingest service.

## Overview

dotlake-community enables comprehensive data extraction and processing from Polkadot-based networks through three key components:

- **Substrate API Sidecar**: REST service for blockchain data access
- **Custom Block Ingest Service**: Data processing and storage pipeline
- **Apache Superset**: Data visualization and analytics

## Prerequisites

- Docker and Docker Compose
- Access to a Substrate-based blockchain node (WSS endpoint)
- Sufficient storage space for blockchain data

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-org/dotlake-community.git
cd dotlake-community
```

2. Configure your settings in `config.yaml`:

The `config.yaml` file contains the following configuration options:

### Required Fields

- `relay_chain`: Name of the relay chain (e.g., "Polkadot", "Kusama", "solo"). Defaults to "solo" if not specified
- `chain`: Name of the chain to index (e.g., "Polkadot", "Kusama", "substrate_chain"). Defaults to "substrate_chain" if not specified
- `wss`: WebSocket endpoint URL for the chain node
- `ingest_mode`: Mode of operation ("live" or "historical")
- `start_block`: Starting block number for ingestion (only applies for historical mode)
- `end_block`: Ending block number for ingestion (only applies for historical mode)

### Database Configuration

- `create_db`: Set to `true` to create a new local PostgreSQL database, `false` to use existing database
- `retain_db`: Set to `true` to keep the database after cleanup, `false` to remove it (only applies when `create_db` is `true`)
- `databases`: Database connection details (required if create_db is false)
  ```yaml
  databases:
    - type: postgres         # Database type (postgres/mysql)
      host: 0.0.0.0          # Database host address
      port: 5432             # Database port
      name: dotlake          # Database name
      user: username         # Database username
      password: password     # Database password
  ```

3. Start the ingestion pipeline:
```bash
bash dotlakeIngest.sh
```

4. To stop the ingestion and cleanup resources:
```bash
bash cleanup.sh
```

## Architecture

### 1. Substrate API Sidecar
- Connects to blockchain node via WebSocket
- Exposes REST API on port 8080
- Provides standardized access to blockchain data

### 2. Custom Block Ingest Service
Processes blockchain data through multiple stages:
1. Data extraction from Sidecar API
2. Transformation and enrichment
3. Storage in PostgreSQL

### 3. Apache Superset Integration
- Custom visualization capabilities
- Direct connection to stored data

## Development

To contribute or modify:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

