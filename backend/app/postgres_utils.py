import psycopg2
from psycopg2 import Error
import pandas as pd
import json

def connect_to_postgres(host, port, database, user, password):
    """
    Establish a connection to the PostgreSQL database.

    Args:
        host (str): The database host.
        port (int): The database port.
        database (str): The name of the database.
        user (str): The database user.
        password (str): The database password.

    Returns:
        psycopg2.extensions.connection: A connection object if successful, None otherwise.
    """
    try:
        connection = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        print("Successfully connected to PostgreSQL database")
        return connection
    except Error as e:
        print(f"Error connecting to PostgreSQL database: {e}")
        return None

def create_tables(connection, chain, relay_chain):
    """
    Create necessary tables in the PostgreSQL database if they don't exist.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
        chain (str): The name of the chain.
        relay_chain (str): The name of the relay chain.
    """
    try:
        cursor = connection.cursor()

        delete_table(connection, f"blocks_{relay_chain}_{chain}")

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS blocks_{relay_chain}_{chain} (
                relay_chain VARCHAR(255),
                chain VARCHAR(255),
                timestamp BIGINT,
                number VARCHAR(255) PRIMARY KEY,
                hash VARCHAR(255),
                parenthash VARCHAR(255),
                stateroot VARCHAR(255),
                extrinsicsroot VARCHAR(255),
                authorid VARCHAR(255),
                finalized BOOLEAN,
                oninitialize JSONB,
                onfinalize JSONB,
                logs JSONB,
                extrinsics JSONB
            )
        """)
        connection.commit()
        print("Tables created successfully")
    except Error as e:
        print(f"Error creating tables: {e}")

def insert_block_data(connection, block_data, chain, relay_chain):
    """
    Insert processed block data into the PostgreSQL database.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
        block_data (dict): The block data to be inserted.
        chain (str): The name of the chain.
        relay_chain (str): The name of the relay chain.
    """
    try:
        cursor = connection.cursor()
        
        insert_query = f"""
        INSERT INTO blocks_{relay_chain}_{chain} 
        (relay_chain, chain, timestamp, number, hash, parenthash, stateroot, extrinsicsroot, authorid, finalized, oninitialize, onfinalize, logs, extrinsics)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (number) DO UPDATE SET
        relay_chain = EXCLUDED.relay_chain,
        chain = EXCLUDED.chain,
        timestamp = EXCLUDED.timestamp,
        hash = EXCLUDED.hash,
        parenthash = EXCLUDED.parenthash,
        stateroot = EXCLUDED.stateroot,
        extrinsicsroot = EXCLUDED.extrinsicsroot,
        authorid = EXCLUDED.authorid,
        finalized = EXCLUDED.finalized,
        oninitialize = EXCLUDED.oninitialize,
        onfinalize = EXCLUDED.onfinalize,
        logs = EXCLUDED.logs,
        extrinsics = EXCLUDED.extrinsics
        """
        
        values = (
            block_data['relay_chain'],
            block_data['chain'],
            block_data['timestamp'],
            block_data['number'],
            block_data['hash'],
            block_data['parentHash'],
            block_data['stateRoot'],
            block_data['extrinsicsRoot'],
            block_data['authorId'],
            block_data['finalized'],
            json.dumps(block_data['onInitialize']),
            json.dumps(block_data['onFinalize']),
            json.dumps(block_data['logs']),
            json.dumps(block_data['extrinsics'])
        )
        
        cursor.execute(insert_query, values)
        connection.commit()
        print(f"Block {block_data['number']} inserted/updated successfully")
    except Error as e:
        print(f"Error inserting block data: {e}")

def close_connection(connection):
    """
    Safely close the PostgreSQL database connection.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
    """
    if connection:
        connection.close()
        print("PostgreSQL connection closed")


def delete_table(connection, table_name):
    """
    Delete a table from the PostgreSQL database.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
        table_name (str): The name of the table to be deleted.
    """
    try:
        cursor = connection.cursor()
        
        # SQL query to delete the table
        delete_query = f"DROP TABLE IF EXISTS {table_name}"
        
        # Execute the query
        cursor.execute(delete_query)
        
        # Commit the changes
        connection.commit()
        
        print(f"Table '{table_name}' has been successfully deleted.")
    except Error as e:
        print(f"Error deleting table: {e}")
    finally:
        if cursor:
            cursor.close()


def query(connection, query_str):
    try:
        cursor = connection.cursor()
        cursor.execute(query_str)
        columns = [desc[0] for desc in cursor.description]
        results = cursor.fetchall()
        df = pd.DataFrame(results, columns=columns)
        return df
    except Error as e:
        print(f"Error executing query: {e}")
        return None
    finally:
        if cursor:
            cursor.close() 