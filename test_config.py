#!/usr/bin/env python3
"""
Test script to verify configuration loading functionality
"""

import yaml
import sys
from pathlib import Path


def test_config_loading():
    """Test loading configuration from config.yaml"""
    config_path = "config.yaml"
    
    try:
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        
        print("✅ Configuration loaded successfully!")
        print(f"Relay Chain: {config.get('relay_chain', 'Not set')}")
        print(f"Chain: {config.get('chain', 'Not set')}")
        print(f"WSS: {config.get('wss', 'Not set')}")
        print(f"Create DB: {config.get('create_db', 'Not set')}")
        print(f"Ingest Mode: {config.get('ingest_mode', 'Not set')}")
        
        # Test database configuration
        databases = config.get('databases', [])
        if databases:
            db_config = databases[0]
            print(f"Database Type: {db_config.get('type', 'Not set')}")
            print(f"Database Host: {db_config.get('host', 'Not set')}")
            print(f"Database Port: {db_config.get('port', 'Not set')}")
            print(f"Database Name: {db_config.get('name', 'Not set')}")
        else:
            print("❌ No database configuration found")
            
        return True
        
    except FileNotFoundError:
        print(f"❌ Error: {config_path} not found")
        return False
    except yaml.YAMLError as e:
        print(f"❌ Error parsing {config_path}: {e}")
        return False


def test_ingest_directory():
    """Test if ingest directory exists and contains required files"""
    ingest_dir = Path("ingest")
    
    if not ingest_dir.exists():
        print("❌ Error: ingest directory not found")
        return False
    
    print("✅ Ingest directory found")
    
    # Check for docker compose files
    docker_files = [
        "docker/docker-compose.yaml",
        "docker/docker-internal-db.yaml"
    ]
    
    for docker_file in docker_files:
        file_path = ingest_dir / docker_file
        if file_path.exists():
            print(f"✅ Found {docker_file}")
        else:
            print(f"❌ Missing {docker_file}")
            return False
    
    return True


def main():
    """Main test function"""
    print("Testing DotLake Python Launcher Configuration...")
    print("=" * 50)
    
    success = True
    
    # Test configuration loading
    print("\n1. Testing configuration loading:")
    if not test_config_loading():
        success = False
    
    # Test ingest directory
    print("\n2. Testing ingest directory:")
    if not test_ingest_directory():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Configuration is ready.")
        print("You can now run: python dotlake_ingest.py")
    else:
        print("❌ Some tests failed. Please check the configuration.")
        sys.exit(1)


if __name__ == "__main__":
    main() 