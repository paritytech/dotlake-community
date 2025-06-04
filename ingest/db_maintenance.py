import os
import time
import logging
from datetime import datetime
from database_utils import connect_to_database, close_connection

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Database configuration
DATABASE_CONFIG = {
    "database": os.getenv("DATABASE_TYPE", "postgres"),
    "database_host": os.getenv("DATABASE_HOST", "postgres"),  # Use the service name from docker-compose
    "database_port": os.getenv("DATABASE_PORT", "5432"),
    "database_name": os.getenv("DATABASE_NAME"),
    "database_user": os.getenv("DATABASE_USER"), 
    "database_password": os.getenv("DATABASE_PASSWORD"),
    "database_project": os.getenv("DATABASE_PROJECT"),
    "database_dataset": os.getenv("DATABASE_DATASET"),
    "database_table": os.getenv("DATABASE_TABLE"),
    "database_credentials": os.getenv("DATABASE_CREDENTIALS")
}

# Add debug logging for database configuration
logging.info("Database configuration:")
logging.info(f"Host: {DATABASE_CONFIG['database_host']}")
logging.info(f"Port: {DATABASE_CONFIG['database_port']}")
logging.info(f"Database: {DATABASE_CONFIG['database_name']}")
logging.info(f"User: {DATABASE_CONFIG['database_user']}")

def create_indexes(conn, relay_chain, chain):
    """Create all necessary indexes"""
    try:
        with conn.cursor() as cur:
            # Blocks table indexes
            cur.execute(f"""
                CREATE INDEX IF NOT EXISTS idx_blocks_number 
                ON blocks_{relay_chain}_{chain} (number);
                
                CREATE INDEX IF NOT EXISTS idx_blocks_hash 
                ON blocks_{relay_chain}_{chain} (hash);
                
                CREATE INDEX IF NOT EXISTS idx_blocks_timestamp 
                ON blocks_{relay_chain}_{chain} (timestamp DESC);
                
                CREATE INDEX IF NOT EXISTS idx_blocks_author 
                ON blocks_{relay_chain}_{chain} (authorid);
                
                CREATE INDEX IF NOT EXISTS idx_blocks_finalized 
                ON blocks_{relay_chain}_{chain} (finalized) 
                WHERE finalized = true;
            """)

            # Events table indexes
            cur.execute(f"""
                CREATE INDEX IF NOT EXISTS idx_events_block_number 
                ON events_{relay_chain}_{chain} (number);
                
                CREATE INDEX IF NOT EXISTS idx_events_extrinsic_id 
                ON events_{relay_chain}_{chain} (extrinsic_id);
                
                CREATE INDEX IF NOT EXISTS idx_events_pallet_method 
                ON events_{relay_chain}_{chain} (pallet, method);
                
                CREATE INDEX IF NOT EXISTS idx_events_timestamp 
                ON events_{relay_chain}_{chain} (timestamp DESC);
            """)

            # Extrinsics table indexes
            cur.execute(f"""
                CREATE INDEX IF NOT EXISTS idx_extrinsics_block_number 
                ON extrinsics_{relay_chain}_{chain} (number);
                
                CREATE INDEX IF NOT EXISTS idx_extrinsics_hash 
                ON extrinsics_{relay_chain}_{chain} (extrinsic_hash);
                
                CREATE INDEX IF NOT EXISTS idx_extrinsics_pallet_method 
                ON extrinsics_{relay_chain}_{chain} (pallet, method);
                
                CREATE INDEX IF NOT EXISTS idx_extrinsics_success 
                ON extrinsics_{relay_chain}_{chain} (success) 
                WHERE success = true;
                
                CREATE INDEX IF NOT EXISTS idx_extrinsics_timestamp 
                ON extrinsics_{relay_chain}_{chain} (timestamp DESC);
            """)

            # Logs table indexes
            cur.execute(f"""
                CREATE INDEX IF NOT EXISTS idx_logs_block_number 
                ON logs_{relay_chain}_{chain} (number);
                
                CREATE INDEX IF NOT EXISTS idx_logs_index 
                ON logs_{relay_chain}_{chain} (index);
            """)

        conn.commit()
        logging.info("Indexes created successfully")
    except Exception as e:
        conn.rollback()
        logging.error(f"Error creating indexes: {str(e)}")
        raise

def analyze_tables(conn, relay_chain, chain):
    """Analyze tables to update statistics"""
    try:
        with conn.cursor() as cur:
            tables = [
                f'blocks_{relay_chain}_{chain}',
                f'events_{relay_chain}_{chain}',
                f'extrinsics_{relay_chain}_{chain}',
                f'logs_{relay_chain}_{chain}'
            ]
            
            for table in tables:
                cur.execute(f"ANALYZE {table};")
                logging.info(f"Analyzed table: {table}")
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        logging.error(f"Error analyzing tables: {str(e)}")
        raise

def reindex_tables(conn, relay_chain, chain):
    """Reindex all tables"""
    try:
        with conn.cursor() as cur:
            tables = [
                f'blocks_{relay_chain}_{chain}',
                f'events_{relay_chain}_{chain}',
                f'extrinsics_{relay_chain}_{chain}',
                f'logs_{relay_chain}_{chain}'
            ]
            
            for table in tables:
                cur.execute(f"REINDEX TABLE {table};")
                logging.info(f"Reindexed table: {table}")
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        logging.error(f"Error reindexing tables: {str(e)}")
        raise

def maintenance_cycle():
    """Main maintenance cycle"""
    relay_chain = os.getenv('RELAY_CHAIN')
    chain = os.getenv('CHAIN')
    
    logging.info(f"Starting maintenance cycle for {relay_chain}_{chain}")
    
    # Initial delay to allow database to boot up
    logging.info("Waiting for database to be ready...")
    time.sleep(60)  # Wait for 1 minute
    
    while True:
        try:
            # Try to connect to the database
            max_retries = 5
            retry_count = 0
            conn = None
            
            while retry_count < max_retries:
                try:
                    conn = connect_to_database(DATABASE_CONFIG)
                    if conn is not None:
                        break
                except Exception as e:
                    retry_count += 1
                    logging.error(f"Connection attempt {retry_count} failed: {str(e)}")
                    if retry_count < max_retries:
                        logging.info(f"Retrying in 30 seconds... (Attempt {retry_count + 1}/{max_retries})")
                        time.sleep(30)
                    else:
                        raise Exception("Max retries reached. Could not connect to database.")
            
            logging.info("Starting maintenance cycle")
            
            # Create/update indexes
            create_indexes(conn, relay_chain, chain)
            
            # Analyze tables
            analyze_tables(conn, relay_chain, chain)
            
            # Reindex tables
            reindex_tables(conn, relay_chain, chain)
            
            close_connection(conn, DATABASE_CONFIG)
            logging.info("Maintenance cycle completed successfully")
            
            # Wait for 2 hours
            time.sleep(7200)  # 2 hours in seconds
            
        except Exception as e:
            logging.error(f"Error in maintenance cycle: {str(e)}")
            time.sleep(300)  # Wait 5 minutes before retrying

if __name__ == "__main__":
    maintenance_cycle() 