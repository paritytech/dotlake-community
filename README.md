# DotLake Community

A data ingestion pipeline for Polkadot-based blockchains with Substrate API Sidecar, block ingest service, and Apache Superset visualization.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.6+
- WSS endpoint for your blockchain node

### 1. Clone & Setup
```bash
git clone https://github.com/your-org/dotlake-community.git
cd dotlake-community
cp config-example.yaml config.yaml
# Edit config.yaml with your settings
```

### 2. Launch Services
```bash
# Recommended: Simple launcher
python3 launch_dotlake.py

# Or manual setup
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python dotlake_ingest.py
```

### 3. Access Services
- **API Sidecar**: http://localhost:8080
- **Ingest Service**: http://localhost:8501  
- **Superset**: http://localhost:8088

### 4. Cleanup
```bash
python cleanup.py
```

## ⚙️ Configuration

Key settings in `config.yaml`:
```yaml
relay_chain: Polkadot
chain: PolkadotAssetHub
wss: wss://your-node-endpoint
ingest_mode: historical  # or live
start_block: 9000000
end_block: 9076000
create_db: true
```

## 🏗️ Architecture

- **Substrate API Sidecar** - Blockchain data access (port 8080)
- **Block Ingest Service** - Data processing pipeline (port 8501)
- **Apache Superset** - Data visualization (port 8088)
- **Web Frontend** - React-based interface

## 🛠️ Development

```bash
# Backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend && npm install && npm run dev

# Test config
python test_config.py
```

## 📚 More Info

- **[Python Launcher Guide](README_PYTHON_LAUNCHER.md)** - Detailed launcher docs
- **[Cleanup Guide](README_CLEANUP.md)** - Maintenance scripts
- **[Wiki](docs/wiki/)** - Full documentation
- **[Config Examples](config-sample/)** - Sample configurations

## 🔧 Troubleshooting

- Run `python test_config.py` to verify configuration
- Use `--verbose` flag for detailed output
- Check [Troubleshooting Guide](docs/wiki/Troubleshooting.md)

---

**Need help?** Check the [Configuration Guide](docs/wiki/Configuration-Guide.md) or report issues on GitHub.

