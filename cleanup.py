#!/usr/bin/env python3
"""
Python script to cleanup DotLake services and resources.
Translates the functionality of cleanup.sh into Python.
"""

import argparse
import os
import subprocess
import sys
import yaml
from pathlib import Path


def run_command(command, check=True, capture_output=True, verbose=False):
    """Run a shell command and return the result."""
    if verbose:
        print(f"Running command: {command}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=check,
            capture_output=capture_output,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command '{command}': {e}")
        return e


def read_config(config_path=None):
    """Read configuration from config.yaml file."""
    if config_path is None:
        config_path = Path("config.yaml")
    else:
        config_path = Path(config_path)
    
    if not config_path.exists():
        print(f"Error: {config_path} not found")
        sys.exit(1)
    
    try:
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        return config
    except yaml.YAMLError as e:
        print(f"Error parsing {config_path}: {e}")
        sys.exit(1)


def stop_docker_compose(verbose=False):
    """Stop docker-compose services."""
    print("Stopping docker-compose services...")
    
    # Change to ingest/docker directory
    docker_dir = Path("ingest/docker")
    if not docker_dir.exists():
        print("Error: ingest/docker directory not found")
        return False
    
    original_dir = os.getcwd()
    os.chdir(docker_dir)
    
    try:
        result = run_command("docker compose down", check=False, verbose=verbose)
        if result.returncode == 0:
            print("Docker compose services stopped successfully.")
            return True
        else:
            print("No docker compose files found in ingest/docker directory.")
            return False
    finally:
        os.chdir(original_dir)


def stop_individual_containers(retain_db=False, verbose=False):
    """Stop and remove individual Docker containers."""
    containers = [
        "dotlake_sidecar_instance",
        "subindex-ingest", 
        "superset",
        "dotlake-backend",
        "dotlake-frontend",
        "dotlake-db-maintenance"
    ]
    
    # Add postgres_db if not retaining database
    if not retain_db:
        containers.append("postgres_db")
    
    print(f"Stopping containers: {', '.join(containers)}")
    
    # Stop containers
    stop_result = run_command(f"docker stop {' '.join(containers)}", check=False, verbose=verbose)
    
    # Remove containers
    rm_result = run_command(f"docker rm {' '.join(containers)}", check=False, verbose=verbose)
    
    if retain_db:
        print("Docker services stopped successfully (keeping postgres running).")
    else:
        print("All docker services including database stopped and removed.")
    
    return stop_result.returncode == 0 and rm_result.returncode == 0


def remove_docker_network(verbose=False):
    """Remove the dotlake_network if it exists."""
    print("Checking for dotlake_network...")
    
    # Check if network exists
    result = run_command("docker network ls", check=False, verbose=verbose)
    if result.returncode != 0:
        print("Error checking Docker networks")
        return False
    
    if "dotlake_network" in result.stdout:
        # Remove the network
        rm_result = run_command("docker network rm dotlake_network", check=False, verbose=verbose)
        if rm_result.returncode == 0:
            print("Removed dotlake_network.")
            return True
        else:
            # Check if the error is because network doesn't exist
            if "not found" in rm_result.stderr:
                print("dotlake_network not found.")
                return True
            else:
                print(f"Error removing dotlake_network: {rm_result.stderr}")
                return False
    else:
        print("dotlake_network not found.")
        return True


def main():
    """Main cleanup function."""
    parser = argparse.ArgumentParser(
        description="Cleanup DotLake services and resources",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cleanup.py                    # Use default config.yaml
  python cleanup.py --config my.yaml  # Use custom config file
  python cleanup.py --verbose         # Show detailed output
  python cleanup.py --help            # Show this help message
        """
    )
    
    parser.add_argument(
        "--config", 
        default="config.yaml",
        help="Path to configuration file (default: config.yaml)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed output of commands being executed"
    )
    
    args = parser.parse_args()
    
    print("Starting DotLake cleanup...")
    
    # Read configuration
    try:
        config = read_config(args.config)
        retain_db = config.get('retain_db', False)
        
    except Exception as e:
        print(f"Error reading configuration: {e}")
        sys.exit(1)
    
    stop_individual_containers(retain_db=retain_db, verbose=args.verbose)
    
    remove_docker_network(verbose=args.verbose)
    
    print("Cleanup complete.")


if __name__ == "__main__":
    main() 