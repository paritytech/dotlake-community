import os
import sys
import yaml
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from config_models import DotLakeConfig

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConfigurationManager:
    """Manages configuration loading, validation, and environment setup"""
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = Path(config_path)
        self.config: Optional[DotLakeConfig] = None
        self._load_and_validate_config()
    
    def _load_and_validate_config(self) -> None:
        """Load and validate configuration from YAML file (new format only)"""
        try:
            if not self.config_path.exists():
                raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
            
            with open(self.config_path, 'r') as file:
                raw_config = yaml.safe_load(file)
            
            self.config = DotLakeConfig(**raw_config)
            logger.info(f"Configuration loaded successfully from {self.config_path}")
            
        except FileNotFoundError as e:
            logger.error(f"Configuration file error: {e}")
            sys.exit(1)
        except yaml.YAMLError as e:
            logger.error(f"YAML parsing error in {self.config_path}: {e}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Configuration validation error: {e}")
            sys.exit(1)
    
    def setup_environment_variables(self) -> None:
        """Set up environment variables from validated configuration"""
        if not self.config:
            raise RuntimeError("Configuration not loaded")
        
        env_vars = self.config.get_environment_variables()
        
        # Set environment variables
        for key, value in env_vars.items():
            os.environ[key] = value
            logger.debug(f"Set {key}={value}")
        
        logger.info("Environment variables configured successfully")
    
    def get_docker_compose_file(self) -> str:
        """Determine which docker compose file to use based on configuration"""
        if not self.config:
            raise RuntimeError("Configuration not loaded")
        return self.config.get_docker_compose_file()
    
    def validate_database_connection(self) -> bool:
        """Validate database connection parameters"""
        if not self.config:
            raise RuntimeError("Configuration not loaded")
        
        if self.config.database.local.enabled:
            logger.info("Using local database - no external connection validation needed")
            return True
        
        if not self.config.database.external or not self.config.database.external.enabled:
            logger.error("No external database configuration found")
            return False
        
        # All validation is handled by Pydantic models
        logger.info(f"Database configuration validated for {self.config.database.external.type.value}")
        return True
    
    def get_config_summary(self) -> Dict[str, Any]:
        """Get a summary of the current configuration"""
        if not self.config:
            return {}
        
        summary = {
            'relay_chain': self.config.chain.relay_chain,
            'chain': self.config.chain.name,
            'wss_endpoint': self.config.chain.wss_endpoint,
            'ingest_mode': self.config.ingest.mode.value,
            'docker_compose_file': self.get_docker_compose_file(),
        }
        
        if self.config.ingest.block_range:
            summary['block_range'] = f"{self.config.ingest.block_range.start} - {self.config.ingest.block_range.end}"
        
        if self.config.database.local.enabled:
            summary['database'] = {
                'type': 'local_postgres',
                'retain_after_cleanup': self.config.database.local.retain_after_cleanup,
            }
        elif self.config.database.external and self.config.database.external.enabled:
            conn = self.config.database.external.connection
            summary['database'] = {
                'type': self.config.database.external.type.value,
                'host': conn.host,
                'port': conn.port,
                'name': conn.name,
            }
        
        return summary
    
    def print_config_summary(self) -> None:
        """Print a human-readable configuration summary"""
        summary = self.get_config_summary()
        
        logger.info("=== Configuration Summary ===")
        logger.info(f"Relay Chain: {summary.get('relay_chain')}")
        logger.info(f"Chain: {summary.get('chain')}")
        logger.info(f"WSS Endpoint: {summary.get('wss_endpoint')}")
        logger.info(f"Ingest Mode: {summary.get('ingest_mode')}")
        logger.info(f"Docker Compose File: {summary.get('docker_compose_file')}")
        
        if 'block_range' in summary:
            logger.info(f"Block Range: {summary['block_range']}")
        
        if 'database' in summary:
            db = summary['database']
            if db['type'] == 'local_postgres':
                logger.info(f"Database: Local PostgreSQL (retain: {db['retain_after_cleanup']})")
            else:
                logger.info(f"Database: {db['type']}://{db['host']}:{db['port']}/{db['name']}")
        
        logger.info("=============================")
    
    def create_example_config(self, output_path: str = "config-example.yaml") -> None:
        """Create an example configuration file"""
        example_config = {
            'chain': {
                'relay_chain': 'Polkadot',
                'name': 'PolkadotAssetHub',
                'wss_endpoint': 'wss://polkadot-asset-hub-rpc.polkadot.io',
            },
            'ingest': {
                'mode': 'historical',
                'block_range': {
                    'start': 9000000,
                    'end': 9076000,
                },
            },
            'database': {
                'local': {
                    'enabled': True,
                    'retain_after_cleanup': False,
                    'restore_from': None,
                },
                'external': {
                    'enabled': False,
                    'type': 'postgres',
                    'connection': {
                        'host': 'host.docker.internal',
                        'port': 5432,
                        'name': 'dotlake',
                        'user': 'username',
                        'password': 'password',
                    },
                },
            },
        }
        
        with open(output_path, 'w') as f:
            yaml.dump(example_config, f, default_flow_style=False, indent=2)
        
        logger.info(f"Example configuration created: {output_path}") 