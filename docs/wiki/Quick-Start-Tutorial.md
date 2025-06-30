# Quick Start Tutorial

This 5-minute tutorial will get you up and running with DotLake Community, ingesting live Polkadot data and exploring it through the web interface.

## 🎯 What You'll Learn

By the end of this tutorial, you'll have:
- ✅ Set up DotLake Community
- ✅ Started live data ingestion from Polkadot
- ✅ Explored blockchain data through the web interface
- ✅ Created your first data visualization

## ⏱️ Prerequisites Check

Before we begin, ensure you have:

```bash
# Check Docker
docker --version
# Should show: Docker version 20.x.x or higher

# Check Python
python3 --version
# Should show: Python 3.8.x or higher

# Check Git
git --version
# Should show: git version 2.x.x or higher
```

If any of these fail, follow the [Installation Guide](Getting-Started#prerequisites) first.

## 🚀 Step 1: Clone and Setup (1 minute)

```bash
# Clone the repository
git clone https://github.com/your-org/dotlake-community.git
cd dotlake-community

# Copy the sample configuration
cp config-sample/config-internal.yaml config.yaml
```

## ⚙️ Step 2: Configure for Polkadot (1 minute)

Edit `config.yaml` with your favorite text editor:

```yaml
# Chain Configuration
chain:
  relay_chain: Polkadot
  name: Polkadot
  wss_endpoint: wss://polkadot-rpc.dwellir.com

# Ingest Configuration
ingest:
  mode: live

# Database Configuration
database:
  local:
    enabled: true
    retain_after_cleanup: false
```

**What this does:**
- Connects to Polkadot mainnet via public RPC
- Starts live data ingestion (real-time)
- Creates a local PostgreSQL database

## 🎬 Step 3: Start Services (2 minutes)

```bash
# Start all services
python3 launch_dotlake.py
```

**Watch for these success messages:**
```
✅ Substrate API Sidecar started on port 8080
✅ Block Ingest Service started on port 8501
✅ Apache Superset started on port 8088
✅ React Frontend started on port 3000
```

**If you see errors:**
- Check that ports 3000, 8080, 8088, and 8501 are available
- Ensure Docker is running
- Verify your internet connection

## 🌐 Step 4: Explore the Data (1 minute)

Open your browser and navigate to: **http://localhost:3000**

You should see the DotLake Explorer interface with:
- **Blocks**: Recent blockchain blocks
- **Events**: Recent blockchain events
- **Extrinsics**: Recent transactions
- **Accounts**: Account information

### Navigate to Blocks Page

1. Click on "Blocks" in the navigation
2. You should see a table of recent blocks
3. Each block shows:
   - Block number
   - Timestamp
   - Hash
   - Number of extrinsics
   - Number of events

### Navigate to Events Page

1. Click on "Events" in the navigation
2. You'll see recent blockchain events
3. Events include:
   - Transfer events
   - Governance events
   - System events

## 📊 Step 5: Create Your First Visualization (1 minute)

### Access Apache Superset

1. Open **http://localhost:8088** in your browser
2. Login with:
   - Username: `admin`
   - Password: `admin`

### Create a Simple Chart

1. Click "Charts" → "Create Chart"
2. Select "Blocks" as your dataset
3. Choose "Table" as chart type
4. Add columns: `number`, `timestamp`, `extrinsics_count`
5. Click "Create Chart"

**Congratulations!** You've created your first blockchain data visualization.

## 🔍 What's Happening Behind the Scenes

While you explore the interface, DotLake is:

1. **Connecting to Polkadot**: Via WebSocket to the RPC endpoint
2. **Fetching New Blocks**: Every 6 seconds, checking for new blocks
3. **Processing Data**: Extracting blocks, events, and extrinsics
4. **Storing in Database**: Saving structured data to PostgreSQL
5. **Serving Web Interface**: React app queries the database
6. **Powering Visualizations**: Superset connects to the same database

## 📈 Monitor Progress

Check that data is being ingested:

```bash
# View ingest service logs
docker logs -f dotlake-ingest

# You should see messages like:
# "Processed block 12345678"
# "No new blocks to process. Retrying in 6 seconds."
```

## 🛑 Stop Services

When you're done exploring:

```bash
# Stop all services and clean up
bash cleanup.sh
```

This will:
- Stop all Docker containers
- Remove containers (since `retain_after_cleanup: false`)
- Clean up temporary files

## 🎉 What You've Accomplished

✅ **Set up a complete blockchain data pipeline**
✅ **Connected to Polkadot mainnet**
✅ **Started real-time data ingestion**
✅ **Explored blockchain data through web interface**
✅ **Created your first data visualization**

## 🚀 Next Steps

Now that you have the basics working, explore:

### Immediate Next Steps
- **[Live Data Ingestion](Live-Ingestion)**: Understand real-time processing
- **[Data Exploration](Data-Exploration)**: Master the frontend interface
- **[Configuration Guide](Configuration-Guide)**: Learn advanced configuration

### Advanced Topics
- **[Historical Data Ingestion](Historical-Ingestion)**: Backfill historical data
- **[Custom Chain Integration](Custom-Chain-Integration)**: Add your own chains
- **[Database Optimization](Database-Optimization)**: Performance tuning
- **[API Reference](API-Reference)**: Programmatic access

### Practical Use Cases
- **[DeFi Monitoring](DeFi-Monitoring)**: Track DEX activity
- **[Governance Tracking](Governance-Tracking)**: Monitor proposals and voting
- **[Transaction Analysis](Transaction-Analysis)**: Analyze transaction patterns

## 🔧 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check if ports are in use
sudo lsof -i :3000
sudo lsof -i :8080
sudo lsof -i :8088
sudo lsof -i :8501
```

**No data appearing:**
```bash
# Check ingest logs
docker logs dotlake-ingest

# Check database connection
docker exec -it dotlake-postgres psql -U postgres -d dotlake -c "SELECT COUNT(*) FROM blocks;"
```

**Configuration errors:**
```bash
# Test your configuration
python3 test_config.py
```

### Getting Help

- **Documentation**: Check the [Troubleshooting Guide](Troubleshooting)
- **Issues**: [GitHub Issues](https://github.com/your-org/dotlake-community/issues)
- **Community**: [GitHub Discussions](https://github.com/your-org/dotlake-community/discussions)

---

**🎯 Ready for more?** Check out our [Live Data Ingestion](Live-Ingestion) guide to understand how real-time processing works! 