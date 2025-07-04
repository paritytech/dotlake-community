#!/usr/bin/env python3
"""
Simple launcher script for DotLake Python Ingest
This script sets up the virtual environment and runs the main launcher
"""

import os
import sys
import subprocess
from pathlib import Path


def check_venv():
    """Check if virtual environment exists and is activated"""
    venv_path = Path("venv")
    if not venv_path.exists():
        print("Virtual environment not found. Creating one...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("Virtual environment created successfully!")
    
    # Check if we're in the virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("Virtual environment not activated. Activating...")
        # Get the path to the virtual environment's Python
        if os.name == 'nt':  # Windows
            python_path = venv_path / "Scripts" / "python.exe"
        else:  # Unix/Linux/macOS
            python_path = venv_path / "bin" / "python"
        
        if not python_path.exists():
            print(f"Error: Python not found at {python_path}")
            sys.exit(1)
        
        # Install requirements if needed
        print("Installing requirements...")
        subprocess.run([str(python_path), "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        
        # Run the main script with the virtual environment's Python
        print("Running DotLake Ingest...")
        subprocess.run([str(python_path), "dotlake_ingest.py"] + sys.argv[1:], check=True)
    else:
        # We're already in a virtual environment, just run the script
        print("Virtual environment already active. Running DotLake Ingest...")
        subprocess.run([sys.executable, "dotlake_ingest.py"] + sys.argv[1:], check=True)


def main():
    """Main function"""
    print("DotLake Python Launcher")
    print("=" * 30)
    
    try:
        check_venv()
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)


if __name__ == "__main__":
    main() 