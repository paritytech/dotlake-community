from pydantic import BaseModel, Field, validator, model_validator
from typing import List, Optional, Union
from enum import Enum
from pathlib import Path


class IngestMode(str, Enum):
    LIVE = "live"
    HISTORICAL = "historical"


class DatabaseType(str, Enum):
    POSTGRES = "postgres"
    MYSQL = "mysql"


class ChainConfig(BaseModel):
    """Chain configuration settings"""
    relay_chain: str = Field(default="solo", description="Relay chain name")
    name: str = Field(default="substrate_chain", description="Chain name")
    wss_endpoint: str = Field(..., description="WebSocket endpoint URL")

    @validator('wss_endpoint')
    def validate_wss_endpoint(cls, v):
        if not v.startswith(('ws://', 'wss://')):
            raise ValueError('WSS endpoint must be a valid WebSocket URL starting with ws:// or wss://')
        return v


class BlockRange(BaseModel):
    """Block range configuration for historical ingest"""
    start: int = Field(..., ge=0, description="Starting block number")
    end: int = Field(..., ge=0, description="Ending block number")

    @validator('end')
    def validate_end_block(cls, v, values):
        if 'start' in values and v <= values['start']:
            raise ValueError('end_block must be greater than start_block')
        return v


class IngestConfig(BaseModel):
    """Ingest configuration settings"""
    mode: IngestMode = Field(default=IngestMode.LIVE, description="Ingest mode")
    block_range: Optional[BlockRange] = Field(default=None, description="Block range for historical ingest")

    @model_validator(mode='after')
    def validate_block_range_for_historical(self):
        if self.mode == IngestMode.HISTORICAL and not self.block_range:
            raise ValueError('block_range is required for historical ingest mode')
        
        if self.mode == IngestMode.LIVE and self.block_range:
            raise ValueError('block_range should not be specified for live ingest mode')
        
        return self


class DatabaseConnection(BaseModel):
    """External database connection settings"""
    host: str = Field(..., description="Database host")
    port: int = Field(..., ge=1, le=65535, description="Database port")
    name: str = Field(..., description="Database name")
    user: str = Field(..., description="Database username")
    password: str = Field(..., description="Database password")

    @validator('host', pre=True)
    def validate_host(cls, v):
        if v == "0.0.0.0":
            return "host.docker.internal"
        return v


class LocalDatabase(BaseModel):
    """Local database configuration"""
    enabled: bool = Field(default=False, description="Whether to use local database")
    retain_after_cleanup: bool = Field(default=False, description="Whether to retain database after cleanup")
    restore_from: Optional[str] = Field(default=None, description="Path to database backup file to restore from")

    @validator('restore_from')
    def validate_restore_path(cls, v):
        if v is not None and not Path(v).exists():
            raise ValueError(f'Restore file not found: {v}')
        return v


class ExternalDatabase(BaseModel):
    """External database configuration"""
    enabled: bool = Field(default=False, description="Whether to use external database")
    type: DatabaseType = Field(..., description="Database type")
    connection: DatabaseConnection = Field(..., description="Database connection details")


class DatabaseConfig(BaseModel):
    """Database configuration with local or external options"""
    local: LocalDatabase = Field(default_factory=LocalDatabase)
    external: Optional[ExternalDatabase] = Field(default=None)

    @model_validator(mode='after')
    def validate_database_config(self):
        if self.local.enabled and self.external and self.external.enabled:
            raise ValueError('Cannot enable both local and external database')
        
        if not self.local.enabled and (not self.external or not self.external.enabled):
            raise ValueError('Either local or external database must be enabled')
        
        return self

    def get_sqlalchemy_uri(self) -> str:
        """Generate SQLAlchemy URI based on configuration"""
        if self.local.enabled:
            return "postgresql://postgres:postgres@host.docker.internal:5432/dotlake"
        
        if self.external and self.external.enabled:
            conn = self.external.connection
            if self.external.type == DatabaseType.POSTGRES:
                return f"postgres+psycopg2://{conn.user}:{conn.password}@{conn.host}:{conn.port}/{conn.name}"
            elif self.external.type == DatabaseType.MYSQL:
                return f"mysql+mysqldb://{conn.user}:{conn.password}@{conn.host}:{conn.port}/{conn.name}"
        
        return ""


class DotLakeConfig(BaseModel):
    """Main configuration model for DotLake"""
    chain: ChainConfig = Field(..., description="Chain configuration")
    ingest: IngestConfig = Field(..., description="Ingest configuration")
    database: DatabaseConfig = Field(..., description="Database configuration")

    class Config:
        # Allow extra fields for backward compatibility
        extra = "allow"
        # Use enum values in JSON
        use_enum_values = True

    def get_docker_compose_file(self) -> str:
        """Determine which docker compose file to use"""
        if self.database.local.enabled:
            return "docker/docker-internal-db.yaml"
        return "docker/docker-compose.yaml"

    def get_environment_variables(self) -> dict:
        """Get all environment variables from configuration"""
        env_vars = {
            'RELAY_CHAIN': self.chain.relay_chain,
            'CHAIN': self.chain.name,
            'WSS': self.chain.wss_endpoint,
            'INGEST_MODE': self.ingest.mode.value,
            'SQLALCHEMY_URI': self.database.get_sqlalchemy_uri(),
        }

        # Add block range for historical mode
        if self.ingest.block_range:
            env_vars.update({
                'START_BLOCK': str(self.ingest.block_range.start),
                'END_BLOCK': str(self.ingest.block_range.end),
            })
        else:
            env_vars.update({
                'START_BLOCK': '',
                'END_BLOCK': '',
            })

        # Add database-specific variables
        if self.database.local.enabled:
            env_vars.update({
                'DB_TYPE': 'postgres',
                'DB_HOST': 'host.docker.internal',
                'DB_PORT': '5432',
                'DB_NAME': 'dotlake',
                'DB_USER': 'postgres',
                'DB_PASSWORD': 'postgres',
                'DB_RESTORE_PATH': self.database.local.restore_from or '',
            })
        elif self.database.external and self.database.external.enabled:
            conn = self.database.external.connection
            env_vars.update({
                'DB_TYPE': self.database.external.type.value,
                'DB_HOST': conn.host,
                'DB_PORT': str(conn.port),
                'DB_NAME': conn.name,
                'DB_USER': conn.user,
                'DB_PASSWORD': conn.password,
                'DB_RESTORE_PATH': '',
            })

        return env_vars