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
        delete_table(connection, f"extrinsics_{relay_chain}_{chain}")
        delete_table(connection, f"events_{relay_chain}_{chain}")
        delete_table(connection, f"logs_{relay_chain}_{chain}")

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
                extrinsics_count INT,
                events_count INT,
                logs_count INT
            )
        """)

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS extrinsics_{relay_chain}_{chain} (
                relay_chain VARCHAR(255),
                chain VARCHAR(255),
                timestamp BIGINT,
                number VARCHAR(255),
                hash VARCHAR(255),
                extrinsic_id VARCHAR(255),
                pallet VARCHAR(255),
                method VARCHAR(255),
                args JSONB,
                info JSONB,
                extrinsic_hash VARCHAR(255),
                tip VARCHAR(255),
                nonce VARCHAR(255),
                signature VARCHAR(255),
                era VARCHAR(255),
                success BOOLEAN,
                pays_fee BOOLEAN,
                event_count INT
            )
        """)    

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS events_{relay_chain}_{chain} (
                relay_chain VARCHAR(255),
                chain VARCHAR(255),
                timestamp BIGINT,
                number VARCHAR(255),
                hash VARCHAR(255),
                extrinsic_id VARCHAR(255),
                event_id VARCHAR(255),
                pallet VARCHAR(255),
                method VARCHAR(255),
                data JSONB,
                source VARCHAR(255)
            )
        """)

        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS logs_{relay_chain}_{chain} (
                relay_chain VARCHAR(255),   
                chain VARCHAR(255),
                timestamp BIGINT,
                number VARCHAR(255),
                hash VARCHAR(255),
                type VARCHAR(255),
                index VARCHAR(255), 
                value JSONB
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

def insert_basic_block_data(connection, basic_block_data, chain, relay_chain):
    """
    Insert basic block data into the PostgreSQL database.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
        basic_block_data (dict): The basic block data to be inserted.
        chain (str): The name of the chain.
        relay_chain (str): The name of the relay chain.
    """
    try:
        cursor = connection.cursor()
        
        insert_query = f"""
        INSERT INTO blocks_{relay_chain}_{chain} 
        (relay_chain, chain, timestamp, number, hash, parenthash, stateroot, extrinsicsroot, authorid, finalized, extrinsics_count, events_count, logs_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
        extrinsics_count = EXCLUDED.extrinsics_count,
        events_count = EXCLUDED.events_count,
        logs_count = EXCLUDED.logs_count
        """

        values = (
            basic_block_data['relay_chain'],
            basic_block_data['chain'],
            basic_block_data['timestamp'],
            basic_block_data['number'],
            basic_block_data['block_hash'],
            basic_block_data['parent_hash'],
            basic_block_data['state_root'],
            basic_block_data['extrinsics_root'],
            basic_block_data['author'],
            basic_block_data['finalized'],
            basic_block_data['extrinsics_count'],
            basic_block_data['events_count'],
            basic_block_data['logs_count']
        )

        cursor.execute(insert_query, values)
        connection.commit()
        print(f"Block {basic_block_data['number']} inserted/updated successfully")  
    except Error as e:
        print(f"Error inserting basic block data: {e}")

def insert_extrinsics(connection, extrinsics, chain, relay_chain):
    """
    Insert extrinsics data into the PostgreSQL database.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
        extrinsics (dict): The extrinsics data to be inserted.
        chain (str): The name of the chain.
        relay_chain (str): The name of the relay chain.
    """
    try:
        cursor = connection.cursor()
        
        insert_query = f"""
        INSERT INTO extrinsics_{relay_chain}_{chain} 
        (relay_chain, chain, timestamp, number, hash, extrinsic_id, pallet, method, args, info, extrinsic_hash, tip, nonce, signature, era, success, pays_fee, event_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            extrinsics['relay_chain'],
            extrinsics['chain'],
            extrinsics['timestamp'],
            extrinsics['number'],
            extrinsics['block_hash'],
            extrinsics['extrinsic_id'],
            extrinsics['pallet'],
            extrinsics['method'],
            json.dumps(extrinsics['args']),
            json.dumps(extrinsics['info']),
            extrinsics['extrinsic_hash'],
            extrinsics['tip'],
            extrinsics['nonce'],
            json.dumps(extrinsics['signature']),
            json.dumps(extrinsics['era']),
            extrinsics['success'],
            extrinsics['pays_fee'],
            extrinsics['event_count']
        )

        cursor.execute(insert_query, values)
        connection.commit() 
        print(f"Extrinsics {extrinsics['extrinsic_id']} inserted/updated successfully")
    except Error as e:
        print(f"Error inserting extrinsics: {e}")

def insert_events(connection, events, chain, relay_chain):
    """
    Insert events data into the PostgreSQL database.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
        events (dict): The events data to be inserted.
        chain (str): The name of the chain.
        relay_chain (str): The name of the relay chain.
    """
    try:
        cursor = connection.cursor()
        
        insert_query = f"""
        INSERT INTO events_{relay_chain}_{chain} 
        (relay_chain, chain, timestamp, number, hash, extrinsic_id, event_id, pallet, method, data, source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            events['relay_chain'],
            events['chain'],
            events['timestamp'],
            events['number'],
            events['block_hash'],
            events['extrinsic_id'],
            events['event_id'],
            events['pallet'],   
            events['method'],
            json.dumps(events['data']),
            events['source']
        )

        cursor.execute(insert_query, values)
        connection.commit()
        print(f"Event {events['event_id']} inserted/updated successfully")
    except Error as e:
        print(f"Error inserting events: {e}")

def insert_logs(connection, logs, chain, relay_chain):
    """
    Insert logs data into the PostgreSQL database.

    Args:
        connection (psycopg2.extensions.connection): The database connection object.
        logs (dict): The logs data to be inserted.
        chain (str): The name of the chain.
        relay_chain (str): The name of the relay chain.
    """
    try:
        cursor = connection.cursor()
        
        insert_query = f"""
        INSERT INTO logs_{relay_chain}_{chain} 
        (relay_chain, chain, timestamp, number, hash, type, index, value)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            logs['relay_chain'],
            logs['chain'],
            logs['timestamp'],
            logs['number'],
            logs['block_hash'],
            logs['type'],
            logs['index'],
            json.dumps(logs['value'])
        )

        cursor.execute(insert_query, values)
        connection.commit()
        print(f"Log {logs['index']} inserted/updated successfully")
    except Error as e:
        print(f"Error inserting logs: {e}") 

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
