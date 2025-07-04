# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with DotLake Community. If you don't find your issue here, check our [GitHub Issues](https://github.com/your-org/dotlake-community/issues) or create a new one.

## 🔍 Quick Diagnosis

Start here to identify your issue:

```bash
# 1. Check if all services are running
docker ps

# 2. Check service logs
docker logs dotlake-sidecar
docker logs dotlake-ingest
docker logs dotlake-postgres
docker logs dotlake-frontend

# 3. Test configuration
python3 test_config.py

# 4. Check network connectivity
curl http://localhost:8080/blocks/head
```

## 🚨 Common Issues

### 1. Docker Permission Errors

**Symptoms:**
```
Got permission denied while trying to connect to the Docker daemon socket
```

**Solutions:**

**Option A: Add user to docker group (Recommended)**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes (log out and back in, or run:)
newgrp docker

# Test
docker ps
```

**Option B: Use sudo (Temporary)**
```bash
sudo docker ps
sudo python3 launch_dotlake.py
```

**Option C: Fix Docker socket permissions**
```bash
sudo chmod 666 /var/run/docker.sock
```

### 2. Port Already in Use

**Symptoms:**
```
Error starting userland proxy: listen tcp 0.0.0.0:8080: bind: address already in use
```

**Solutions:**

**Check what's using the ports:**
```bash
# Check all ports used by DotLake
sudo lsof -i :3000  # Frontend
sudo lsof -i :8080  # API Sidecar
sudo lsof -i :8088  # Superset
sudo lsof -i :8501  # Ingest Service
sudo lsof -i :5432  # PostgreSQL
```

**Kill processes using the ports:**
```bash
# Kill process by PID
sudo kill -9 <PID>

# Or kill all processes on a port
sudo fuser -k 8080/tcp
```

**Alternative: Use different ports**
```yaml
# In your config.yaml, you can modify ports in docker-compose files
# But this requires editing the docker-compose files directly
```

### 3. Configuration Validation Errors

**Symptoms:**
```
Configuration validation error:
  - chain.wss_endpoint: WSS endpoint must be a valid WebSocket URL
```

**Common Solutions:**

**Invalid WSS Endpoint:**
```yaml
# ❌ Wrong
chain:
  wss_endpoint: https://polkadot-rpc.dwellir.com

# ✅ Correct
chain:
  wss_endpoint: wss://polkadot-rpc.dwellir.com
```

**Invalid Block Range:**
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

**Multiple Database Configurations:**
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

### 4. Network Connectivity Issues

**Symptoms:**
```
Connection refused
WebSocket connection failed
Timeout waiting for response
```

**Solutions:**

**Test WSS endpoint connectivity:**
```bash
# Test WebSocket connection
wscat -c wss://polkadot-rpc.dwellir.com

# Test HTTP endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getBlock","params":[],"id":1}' \
  https://polkadot-rpc.dwellir.com
```

**Try alternative RPC endpoints:**
```yaml
# Alternative Polkadot endpoints
chain:
  wss_endpoint: wss://polkadot.api.onfinality.io/public-ws
  # or
  wss_endpoint: wss://polkadot-rpc-tn.dwellir.com
  # or
  wss_endpoint: wss://rpc.polkadot.io
```

**Check firewall/proxy settings:**
```bash
# Test if you can reach external services
curl https://google.com
curl https://polkadot-rpc.dwellir.com
```

### 5. Database Connection Issues

**Symptoms:**
```
psycopg2.OperationalError: could not connect to server
MySQL connection failed
```

**Solutions:**

**Local PostgreSQL Issues:**
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs dotlake-postgres

# Restart PostgreSQL container
docker restart dotlake-postgres

# Check database connectivity
docker exec -it dotlake-postgres psql -U postgres -d dotlake -c "SELECT 1;"
```

**External Database Issues:**
```yaml
# For local external database, use host.docker.internal
database:
  external:
    connection:
      host: host.docker.internal  # Not localhost
      port: 5432
```

**Test external database connection:**
```bash
# Test PostgreSQL
psql -h host.docker.internal -p 5432 -U username -d dotlake

# Test MySQL
mysql -h host.docker.internal -P 3306 -u username -p dotlake
```

### 6. No Data Being Ingested

**Symptoms:**
- Frontend shows no blocks/events
- Database tables are empty
- No progress in logs

**Diagnosis Steps:**

**Check ingest service logs:**
```bash
docker logs -f dotlake-ingest
```

**Look for these messages:**
```
✅ Connected to database and created tables
✅ Processing block 12345678
✅ No new blocks to process. Retrying in 6 seconds.
```

**Check API Sidecar connectivity:**
```bash
# Test API Sidecar
curl http://localhost:8080/blocks/head

# Should return JSON like:
# {"number":"12345678","hash":"0x..."}
```

**Check database tables:**
```bash
# Connect to database
docker exec -it dotlake-postgres psql -U postgres -d dotlake

# Check if tables exist
\dt

# Check recent blocks
SELECT COUNT(*) FROM blocks;
SELECT * FROM blocks ORDER BY number DESC LIMIT 5;
```

**Solutions:**

**If API Sidecar is not responding:**
```bash
# Restart API Sidecar
docker restart dotlake-sidecar

# Check API Sidecar logs
docker logs dotlake-sidecar
```

**If ingest service is not processing:**
```bash
# Restart ingest service
docker restart dotlake-ingest

# Check for configuration errors
python3 test_config.py
```

### 7. Memory/Resource Issues

**Symptoms:**
```
Out of memory
Container killed
Service crashes repeatedly
```

**Solutions:**

**Check system resources:**
```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check Docker resource usage
docker stats
```

**Increase Docker resources:**
1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase Memory to 8GB+
4. Increase CPU to 4+

**Optimize for low-resource systems:**
```yaml
# Use smaller block ranges for historical ingestion
ingest:
  mode: historical
  block_range:
    start: 1000000
    end: 1000100  # Small range for testing
```

### 8. Python Environment Issues

**Symptoms:**
```
ModuleNotFoundError: No module named 'pydantic'
ImportError: No module named 'yaml'
```

**Solutions:**

**Recreate virtual environment:**
```bash
# Remove existing environment
rm -rf venv

# Run simple launcher to recreate
python3 launch_dotlake.py
```

**Manual virtual environment setup:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # Unix/Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

**Check Python version:**
```bash
python3 --version
# Should be 3.8 or higher
```

## 📋 Error Code Reference

### Configuration Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `WSS endpoint must be a valid WebSocket URL` | Invalid endpoint format | Use `wss://` not `https://` |
| `end_block must be greater than start_block` | Invalid block range | Ensure end > start |
| `Either local or external database must be enabled` | Database config conflict | Enable only one database type |
| `Database host must be a valid hostname` | Invalid host | Use `host.docker.internal` for local |

### Network Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Service not running | Check if containers are up |
| `WebSocket connection failed` | Network/RPC issue | Try alternative RPC endpoint |
| `Timeout waiting for response` | Slow network/RPC | Use different RPC provider |
| `Address already in use` | Port conflict | Kill process using port |

### Database Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `could not connect to server` | Database not accessible | Check host/port/credentials |
| `database does not exist` | Database not created | Check database name |
| `permission denied` | Wrong credentials | Verify username/password |
| `connection pool exhausted` | Too many connections | Restart database container |

## 🔧 Advanced Troubleshooting

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
export DOTLAKE_DEBUG=true

# Run with debug output
python3 launch_dotlake.py
```

### Manual Service Testing

Test each service individually:

```bash
# Test API Sidecar
docker run --rm -p 8080:8080 parity/substrate-api-sidecar:latest

# Test PostgreSQL
docker run --rm -e POSTGRES_PASSWORD=test postgres:13

# Test ingest service
python3 ingest/main.py --help
```

### Network Debugging

```bash
# Check Docker network
docker network ls
docker network inspect bridge

# Check container networking
docker exec dotlake-ingest ping google.com
docker exec dotlake-ingest curl http://dotlake-sidecar:8080/blocks/head
```

### Database Debugging

```bash
# Check PostgreSQL configuration
docker exec dotlake-postgres cat /var/lib/postgresql/data/postgresql.conf

# Check MySQL configuration
docker exec dotlake-mysql cat /etc/mysql/my.cnf

# Test database performance
docker exec dotlake-postgres psql -U postgres -d dotlake -c "EXPLAIN ANALYZE SELECT * FROM blocks LIMIT 1000;"
```

## 📞 Getting Help

### Before Asking for Help

1. **Check this guide** for your specific error
2. **Search existing issues** on GitHub
3. **Collect diagnostic information**:

```bash
# System information
uname -a
docker --version
python3 --version

# Configuration
cat config.yaml

# Service status
docker ps -a
docker logs dotlake-sidecar
docker logs dotlake-ingest
docker logs dotlake-postgres

# Network test
curl http://localhost:8080/blocks/head
```

### Creating a Good Issue Report

When creating a GitHub issue, include:

1. **Error message** (exact text)
2. **Configuration file** (sanitized)
3. **System information** (OS, Docker version, etc.)
4. **Steps to reproduce**
5. **Expected vs actual behavior**
6. **Logs** (relevant portions)

### Community Resources

- **[GitHub Issues](https://github.com/your-org/dotlake-community/issues)**: Bug reports and feature requests
- **[GitHub Discussions](https://github.com/your-org/dotlake-community/discussions)**: General questions and community help
- **[Documentation](Home)**: Complete documentation index
- **[Configuration Examples](Configuration-Examples)**: Sample configurations

## 🎯 Prevention Tips

### Best Practices

1. **Always test configuration** before running: `python3 test_config.py`
2. **Use stable RPC endpoints** for production
3. **Monitor system resources** during ingestion
4. **Keep Docker updated** to latest stable version
5. **Use external databases** for production deployments
6. **Backup important data** before major changes

### Regular Maintenance

```bash
# Clean up unused Docker resources
docker system prune -f

# Update base images
docker pull parity/substrate-api-sidecar:latest
docker pull postgres:13
docker pull mysql:8

# Check for updates
git pull origin main
```

---

**Still having issues?** Create a detailed issue report with the diagnostic information above, and our community will help you resolve it! 