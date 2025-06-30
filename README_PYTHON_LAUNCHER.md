# DotLake Python Launcher

This is a Python equivalent of the `dotlakeIngest.sh` shell script, designed to run within Docker containers to launch DotLake services.

## Features

- **YAML Configuration**: Reads configuration from `config.yaml` file
- **Environment Variable Management**: Sets up all necessary environment variables
- **Docker Compose Integration**: Launches services using Docker Compose
- **Apache Superset Setup**: Automatically configures Superset with database connections
- **Multi-Database Support**: Supports PostgreSQL, MySQL, and BigQuery
- **Error Handling**: Comprehensive error handling and logging

## Files

- `dotlake_ingest.py` - Main Python launcher script
- `launch_dotlake.py` - Simple launcher script with virtual environment management
- `test_config.py` - Test script to verify configuration
- `requirements.txt` - Python dependencies
- `Dockerfile` - Docker image for running the launcher
- `docker-compose.launcher.yaml` - Docker Compose file for the launcher
- `config.yaml` - Configuration file (same as original shell script)

## Usage

### Option 1: Simple Launcher (Recommended)

```bash
# Run the simple launcher (automatically handles virtual environment)
python3 launch_dotlake.py

# Or with custom config file
python3 launch_dotlake.py /path/to/custom/config.yaml
```

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Unix/Linux/macOS
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt

# Test configuration
python test_config.py

# Run the launcher
python dotlake_ingest.py

# Or with custom config file
python dotlake_ingest.py /path/to/custom/config.yaml
```

### Option 3: Run with Docker

```bash
# Build and run the launcher container
docker-compose -f docker-compose.launcher.yaml up --build

# Or run directly with docker
docker build -t dotlake-launcher .
docker run --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/app \
  -p 8080:8080 -p 8501:8501 -p 8088:8088 \
  dotlake-launcher
```

## Configuration

The script uses the same `config.yaml` file as the original shell script:

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

## Key Differences from Shell Script

1. **No yq dependency**: Uses Python's `PyYAML` library instead of `yq`
2. **Better error handling**: More robust error handling and logging
3. **Object-oriented design**: Organized into a class for better maintainability
4. **Type hints**: Includes type hints for better code documentation
5. **Docker-friendly**: Designed to run within Docker containers
6. **Virtual environment management**: Automatic setup and management of Python virtual environments

## Services Launched

The script will launch the following services:

- **Substrate API Sidecar**: http://localhost:8080
- **Block Ingest Service**: http://localhost:8501
- **Apache Superset**: http://localhost:8088

## Testing

Before running the main launcher, you can test your configuration:

```bash
python test_config.py
```

This will verify:
- Configuration file can be loaded
- Required directories and files exist
- Database configuration is valid

## Troubleshooting

### Docker Permission Issues

If you encounter Docker permission issues, ensure the container has access to the Docker socket:

```bash
# Make sure docker group exists and user is in it
sudo usermod -aG docker $USER

# Or run with sudo (not recommended for production)
sudo docker-compose -f docker-compose.launcher.yaml up
```

### Configuration Issues

- Ensure `config.yaml` is properly formatted
- Check that all required database credentials are provided
- Verify that the `ingest/` directory contains the necessary Docker Compose files
- Run `python test_config.py` to verify configuration

### Network Issues

The launcher uses host networking mode to ensure proper communication between services. If you're running in a cloud environment, you may need to adjust the networking configuration.

### Python Environment Issues

If you encounter Python environment issues:

```bash
# Remove existing virtual environment
rm -rf venv

# Run the simple launcher to recreate it
python3 launch_dotlake.py
```

## Development

To modify the launcher:

1. Edit `dotlake_ingest.py`
2. Update `requirements.txt` if adding new dependencies
3. Rebuild the Docker image: `docker build -t dotlake-launcher .`

## License

Same license as the original DotLake project. 