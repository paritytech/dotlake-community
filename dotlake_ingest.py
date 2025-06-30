#!/usr/bin/env python3
"""
DotLake Ingest Service Launcher
Python equivalent of dotlakeIngest.sh for running within Docker containers
"""

import os
import sys
import time
import subprocess
import shutil
from pathlib import Path
from config_manager import ConfigurationManager


class DotLakeIngestLauncher:
    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = config_path
        self.config_manager = ConfigurationManager(config_path)
        self.ingest_dir = Path("ingest")
        
    def _check_yq_installation(self) -> bool:
        """Check if yq is installed (for compatibility)"""
        return shutil.which('yq') is not None
    
    def _run_docker_compose(self, compose_file: str, detach: bool = True) -> bool:
        """Run docker compose command"""
        try:
            cmd = ["docker", "compose", "-f", compose_file]
            if detach:
                cmd.extend(["up", "-d"])
            else:
                cmd.extend(["up"])
            
            print(f"Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, cwd=self.ingest_dir, check=True, 
                                  capture_output=True, text=True)
            print(result.stdout)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error running docker compose: {e}")
            print(f"Stderr: {e.stderr}")
            return False
    
    def _run_docker_exec(self, container: str, command: list) -> bool:
        """Run docker exec command"""
        try:
            cmd = ["docker", "exec", "-it", container] + command
            print(f"Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print(result.stdout)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error running docker exec: {e}")
            print(f"Stderr: {e.stderr}")
            return False
    
    def _setup_superset(self) -> None:
        """Set up Apache Superset"""
        print("Setting up Apache Superset...")
        
        # Create admin user
        self._run_docker_exec("superset", [
            "superset", "fab", "create-admin",
            "--username", "admin",
            "--firstname", "Superset",
            "--lastname", "Admin",
            "--email", "admin@superset.com",
            "--password", "admin"
        ])
        
        # Upgrade database
        self._run_docker_exec("superset", ["superset", "db", "upgrade"])
        
        # Set database URI
        sqlalchemy_uri = os.environ.get('SQLALCHEMY_URI', '')
        db_name = os.environ.get('DB_NAME', '')
        
        if sqlalchemy_uri:
            self._run_docker_exec("superset", [
                "superset", "set_database_uri", 
                "-d", db_name, 
                "-u", sqlalchemy_uri
            ])
    
    def launch_services(self) -> None:
        """Main method to launch all services"""
        print("Starting Block Ingest Service...")
        
        # Print configuration summary
        self.config_manager.print_config_summary()
        
        # Set up environment variables
        self.config_manager.setup_environment_variables()
        
        # Validate database configuration
        if not self.config_manager.validate_database_connection():
            print("Database configuration validation failed")
            sys.exit(1)
        
        # Change to ingest directory
        if not self.ingest_dir.exists():
            print(f"Error: {self.ingest_dir} directory not found")
            sys.exit(1)
        
        # Get docker compose file based on configuration
        compose_file = self.config_manager.get_docker_compose_file()
        
        if self.config_manager.config.database.local.enabled:
            print("Starting with internal database...")
            success = self._run_docker_compose(compose_file)
            if not success:
                print("Failed to start services with internal database")
                sys.exit(1)
            print("Waiting for PostgreSQL to be ready...")
            time.sleep(30)
        else:
            print("Starting with external database...")
            success = self._run_docker_compose(compose_file)
            if not success:
                print("Failed to start services")
                sys.exit(1)
        
        # Wait for services to start
        print("Waiting for services to start...")
        time.sleep(10)
        
        # Set up Superset
        self._setup_superset()
        
        # Wait for all services to be ready
        print("Starting the services....this will take couple of minutes....")
        time.sleep(120)
        
        print("All services are now running!")
        print("You can access:")
        print("  • Substrate API Sidecar: http://localhost:8080")
        print("  • Block Ingest Service: http://localhost:8501")
        print("  • Apache Superset: http://localhost:8088")


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
    else:
        config_path = "config.yaml"
    
    launcher = DotLakeIngestLauncher(config_path)
    launcher.launch_services()


if __name__ == "__main__":
    main() 