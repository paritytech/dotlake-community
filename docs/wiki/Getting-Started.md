# Getting Started

This guide will walk you through setting up DotLake Community from scratch, including all prerequisites and your first successful data ingestion.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Docker & Docker Compose**
  ```bash
  # macOS (using Homebrew)
  brew install --cask docker
  
  # Ubuntu/Debian
  sudo apt update
  sudo apt install docker.io docker-compose
  
  # Windows
  # Download from https://www.docker.com/products/docker-desktop
  ```

- **Python 3.8+**
  ```bash
  # macOS
  brew install python3
  
  # Ubuntu/Debian
  sudo apt install python3 python3-pip python3-venv
  
  # Windows
  # Download from https://www.python.org/downloads/
  ```

- **Git**
  ```bash
  # macOS
  brew install git
  
  # Ubuntu/Debian
  sudo apt install git
  
  # Windows
  # Download from https://git-scm.com/download/win
  ```

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 10GB free space (more for historical data)
- **Network**: Stable internet connection for blockchain node access
- **Ports**: Ensure ports 3000, 8080, 8088, and 8501 are available

### Blockchain Access

You'll need access to a Substrate-based blockchain node. Options include:

- **Public RPC Endpoints** (free, rate-limited)
- **Private RPC Endpoints** (paid, higher limits)
- **Local Node** (self-hosted, full control)

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/dotlake-community.git
cd dotlake-community
```

### Step 2: Verify Installation

Check that all required tools are available:

```bash
# Check Docker
docker --version
docker-compose --version

# Check Python
python3 --version

# Check Git
git --version
```

### Step 3: Prepare Configuration

Copy a sample configuration file:

```bash
# For local development (recommended for beginners)
cp config-sample/config-internal.yaml config.yaml

# Or for external database
cp config-sample/config-external-postgres.yaml config.yaml
```

## ⚙️ Configuration

### Basic Configuration

Edit your `config.yaml` file with the following essential settings:

```yaml
# Chain Configuration
chain:
  relay_chain: Polkadot
  name: Polkadot
  wss_endpoint: wss://polkadot-rpc.dwellir.com

# Ingest Configuration
ingest:
  mode: live  # or historical

# Database Configuration
database:
  local:
    enabled: true
    retain_after_cleanup: false
```

### Configuration Options Explained

#### Chain Settings
- **`relay_chain`**: The main relay chain (Polkadot, Kusama, or "solo" for standalone chains)
- **`name`**: The specific chain name (e.g., "Polkadot", "Kusama", "PolkadotAssetHub")
- **`wss_endpoint`**: WebSocket endpoint for the blockchain node

#### Ingest Settings
- **`mode`**: 
  - `live`: Real-time data ingestion
  - `historical`: Backfill specific block ranges

#### Database Settings
- **`local.enabled`**: Use local PostgreSQL container (recommended for beginners)
- **`retain_after_cleanup`**: Keep database data after stopping services

## 🎯 First Run

### Step 1: Start Services

Use the Python launcher (recommended):

```bash
python3 launch_dotlake.py
```

### Step 2: Monitor Startup

Watch the console output for:

```
✅ Substrate API Sidecar started on port 8080
✅ Block Ingest Service started on port 8501
✅ Apache Superset started on port 8088
✅ React Frontend started on port 3000
```

### Step 3: Verify Services

Check that all services are running:

```bash
# Check if services are responding
curl http://localhost:8080/blocks/head  # API Sidecar
curl http://localhost:8501              # Ingest Service
curl http://localhost:8088              # Superset
curl http://localhost:3000              # Frontend
```

### Step 4: Access Interfaces

Open your browser and navigate to:

- **Frontend Explorer**: http://localhost:3000
- **Apache Superset**: http://localhost:8088
- **API Sidecar**: http://localhost:8080

## 📊 Verify Data Ingestion

### Check Frontend

1. Open http://localhost:3000
2. Navigate to "Blocks" or "Events" page
3. You should see recent blockchain data

### Check Database

If using local PostgreSQL:

```bash
# Connect to the database container
docker exec -it dotlake-postgres psql -U postgres -d dotlake

# Check recent blocks
SELECT * FROM blocks ORDER BY number DESC LIMIT 5;

# Check events
SELECT * FROM events ORDER BY block_number DESC LIMIT 5;
```

### Check Logs

Monitor ingestion progress:

```bash
# View ingest service logs
docker logs -f dotlake-ingest

# View API sidecar logs
docker logs -f dotlake-sidecar
```

## 🛑 Stopping Services

To stop all services and clean up:

```bash
python3 cleanup.py
```

This will:
- Stop all Docker containers
- Remove containers (unless `retain_after_cleanup: true`)
- Clean up temporary files

## 🔧 Troubleshooting

### Common Issues

#### Docker Permission Errors
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in, or run:
newgrp docker
```

#### Port Already in Use
```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :8080
sudo lsof -i :8088
sudo lsof -i :8501

# Kill processes if needed
sudo kill -9 <PID>
```

#### Configuration Errors
```bash
# Test your configuration
python3 test_config.py
```

#### Network Connectivity Issues
```bash
# Test WSS endpoint
wscat -c wss://polkadot-rpc.dwellir.com

# Or use curl for HTTP endpoints
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getBlock","params":[],"id":1}' \
  https://polkadot-rpc.dwellir.com
```

### Getting Help

If you encounter issues:

1. **Check the logs**: `docker logs <container-name>`
2. **Verify configuration**: `python3 test_config.py`
3. **Check prerequisites**: Ensure Docker and Python are properly installed
4. **Search issues**: Check [GitHub Issues](https://github.com/your-org/dotlake-community/issues)
5. **Ask for help**: Create a new issue with detailed error information

## 🎉 Next Steps

Congratulations! You've successfully set up DotLake Community. Here's what to explore next:

- **[Configuration Guide](Configuration-Guide)**: Learn about advanced configuration options
- **[Live Data Ingestion](Live-Ingestion)**: Understand real-time data processing
- **[Historical Data Ingestion](Historical-Ingestion)**: Learn about backfilling historical data
- **[Data Exploration](Data-Exploration)**: Master the frontend interface
- **[Architecture Overview](Architecture)**: Understand the system components

## 📚 Additional Resources

- **[Configuration Examples](Configuration-Examples)**: Sample configurations for different chains
- **[API Reference](API-Reference)**: Complete API documentation
- **[Troubleshooting Guide](Troubleshooting)**: Detailed problem-solving guide
- **[Development Guide](Development-Guide)**: Contributing to the project 