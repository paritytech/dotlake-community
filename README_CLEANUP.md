# DotLake Cleanup Scripts

This directory contains cleanup scripts for DotLake services and resources.

## Available Scripts

### 1. `cleanup.sh` (Bash)
Original bash script for cleanup operations.

### 2. `cleanup.py` (Python) - **Recommended**
Enhanced Python version with additional features and better error handling.

## Python Cleanup Script Usage

The Python cleanup script (`cleanup.py`) provides the same functionality as the bash script with additional features:

### Basic Usage
```bash
python cleanup.py
```

### Command Line Options

- `--config CONFIG`: Specify a custom configuration file (default: `config.yaml`)
- `--verbose, -v`: Show detailed output of commands being executed
- `--help, -h`: Show help message

### Examples

```bash
# Use default config.yaml
python cleanup.py

# Use custom configuration file
python cleanup.py --config my-config.yaml

# Show detailed output
python cleanup.py --verbose

# Show help
python cleanup.py --help
```

## Features

### Configuration Reading
- Reads `config.yaml` to determine cleanup behavior
- Supports custom configuration file paths
- Handles YAML parsing errors gracefully

### Docker Operations
- **Docker Compose Mode**: When `create_db: false`, uses `docker compose down`
- **Individual Container Mode**: When `create_db: true`, stops and removes individual containers
- **Database Retention**: Respects `retain_db` setting to preserve PostgreSQL database
- **Network Cleanup**: Removes `dotlake_network` if it exists

### Error Handling
- Graceful handling of missing containers/networks
- Detailed error messages for troubleshooting
- Non-blocking execution (continues even if some operations fail)

### Verbose Mode
- Shows all Docker commands being executed
- Displays configuration values being used
- Useful for debugging and understanding what the script is doing

## Dependencies

The Python script requires:
- Python 3.6+
- PyYAML (already included in `requirements.txt`)
- Docker CLI (must be available in PATH)

## Migration from Bash Script

The Python script is a direct translation of the bash script functionality:

| Bash Script | Python Script |
|-------------|---------------|
| `yq '.create_db' config.yaml` | `config.get('create_db', False)` |
| `yq '.retain_db' config.yaml` | `config.get('retain_db', False)` |
| `docker compose down` | `run_command("docker compose down")` |
| `docker stop/rm` | `run_command("docker stop/rm")` |
| `docker network ls/rm` | `run_command("docker network ls/rm")` |

## Benefits of Python Version

1. **Cross-platform**: Works on Windows, macOS, and Linux
2. **Better error handling**: More detailed error messages and graceful failures
3. **Command-line arguments**: Flexible configuration options
4. **Verbose mode**: Better debugging capabilities
5. **Maintainable**: Easier to extend and modify
6. **Type safety**: Better IDE support and error detection

## Troubleshooting

### Common Issues

1. **"config.yaml not found"**: Ensure you're running the script from the project root directory
2. **"Docker command not found"**: Make sure Docker CLI is installed and in your PATH
3. **Permission errors**: Ensure you have permission to run Docker commands

### Debug Mode

Use the `--verbose` flag to see exactly what commands are being executed:

```bash
python cleanup.py --verbose
```

This will show all Docker commands and help identify any issues. 