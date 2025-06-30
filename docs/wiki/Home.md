# DotLake Community

A comprehensive data ingestion pipeline for Polkadot-based blockchains that transforms raw blockchain data into actionable insights.

## 🚀 Quick Start

Get up and running in 3 simple steps:

1. **Clone & Configure**
   ```bash
   git clone https://github.com/your-org/dotlake-community.git
   cd dotlake-community
   cp config-sample/config-internal.yaml config.yaml
   # Edit config.yaml with your settings
   ```

2. **Start Services**
   ```bash
   python3 launch_dotlake.py
   ```

3. **Explore Data**
   - Frontend: http://localhost:3000
   - Superset: http://localhost:8088
   - API Sidecar: http://localhost:8080

## 🏗️ Architecture

DotLake combines four powerful components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Polkadot      │    │  Substrate API   │    │  Block Ingest   │
│   Blockchain    │───▶│     Sidecar      │───▶│    Service      │
│                 │    │   (Port 8080)    │    │   (Port 8501)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React         │    │   PostgreSQL/    │    │   Apache        │
│   Frontend      │◀───│   MySQL/BigQuery │◀───│   Superset      │
│  (Port 3000)    │    │                  │    │  (Port 8088)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ✨ Key Features

- **🔗 Multi-Chain Support**: Polkadot, Kusama, and custom parachains
- **📊 Real-time & Historical**: Live data streaming and historical backfilling
- **🗄️ Multi-Database**: PostgreSQL, MySQL support
- **🎯 Data Visualization**: Built-in Apache Superset integration
- **🔍 Interactive Explorer**: React-based data exploration interface
- **⚡ High Performance**: Optimized for large-scale blockchain data
- **🐳 Docker Ready**: Complete containerized deployment

## 📚 Documentation

### Getting Started
- [Installation Guide](Getting-Started) - Set up your environment
- [Configuration Guide](Configuration-Guide) - Configure your deployment
- [Quick Start Tutorial](Quick-Start-Tutorial) - 5-minute setup guide

### Usage
- [Architecture Overview](Architecture) - System components and data flow
- [Live Data Ingestion](Live-Ingestion) - Real-time blockchain monitoring
- [Historical Data Ingestion](Historical-Ingestion) - Backfilling block ranges
- [Data Exploration](Data-Exploration) - Using the frontend interface

### Advanced
- [Development Guide](Development-Guide) - Contributing and development
- [API Reference](API-Reference) - Complete API documentation
- [Troubleshooting](Troubleshooting) - Common issues and solutions
- [Configuration Examples](Configuration-Examples) - Sample configurations

## 🎯 Use Cases

- **Blockchain Analytics**: Track transaction patterns and network activity
- **DeFi Monitoring**: Monitor DEX activity, liquidity pools, and yield farming
- **Governance Tracking**: Follow proposal voting and treasury spending
- **Developer Tools**: Build applications on top of processed blockchain data
- **Research & Analysis**: Academic and commercial blockchain research

## 🛠️ Supported Chains

| Chain | Relay Chain | Status | Example Config |
|-------|-------------|--------|----------------|
| Polkadot | - | ✅ Supported | [Polkadot Example](Configuration-Examples#polkadot) |
| Kusama | - | ✅ Supported | [Kusama Example](Configuration-Examples#kusama) |
| Polkadot Asset Hub | Polkadot | ✅ Supported | [Asset Hub Example](Configuration-Examples#asset-hub) |
| Moonbeam | Polkadot | ✅ Supported | [Moonbeam Example](Configuration-Examples#moonbeam) |
| Custom Parachains | Any | ✅ Supported | [Custom Chain Guide](Custom-Chain-Integration) |

## 🚀 Quick Examples

### Live Polkadot Monitoring
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
```

### Historical Kusama Backfill
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
```

## 🤝 Contributing

We welcome contributions! See our [Development Guide](Development-Guide) for details on:
- Setting up a development environment
- Code contribution guidelines
- Testing procedures
- Release process

## 📞 Support

- **Documentation**: Check our [Troubleshooting Guide](Troubleshooting)
- **Issues**: [GitHub Issues](https://github.com/your-org/dotlake-community/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/dotlake-community/discussions)
- **Community**: Join our [Discord/Telegram] (links to be added)

## 📄 License

[License information to be added]

---

**Ready to get started?** Check out our [Quick Start Tutorial](Quick-Start-Tutorial) for a guided walkthrough! 