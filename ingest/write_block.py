import requests
from google.cloud import storage
import datetime
import json
import logging

def writeBlock(request, database_info):
    request_json = request
    logging.basicConfig(level='INFO')
    logging.getLogger('writeBlock-logger')
    logger = logging.getLogger('writeBlock-logger')
    block_id = request_json['blockId']
    url = request_json['endpoint']
    chain_name = request_json['chainName']
    relay_chain = request_json['relayChain']
    bucket = request_json['bucket']
    block_data = requests.get(f'{url}/blocks/{block_id}').json()
    if int(block_id) != int(block_data['number']):
        raise Exception(f"Block Id mismatch for {block_id}. Sidecar cloud run service returned wrong block. "
                        f"Returned block data {block_data}")
    block_id = block_data['number']

    ts = [ex['args']['now'] for ex in block_data['extrinsics'] if ex['method']['pallet'] == 'timestamp']

    try:
        timestamp = ts[0]
        timestamp = int(timestamp)
        dt = datetime.datetime.fromtimestamp(int(timestamp) / 1000)
        block_data['timestamp'] = timestamp
    except ValueError:
        timestamp = 0
        dt = datetime.datetime(2020, 5, 1, 16, 20, 0)
        block_data['timestamp'] = timestamp
    except IndexError:
        # Might be genesis, or very first blocks.
        timestamp = 0
        dt = datetime.datetime(2020, 4, 1, 16, 20, 0)
        block_data['timestamp'] = timestamp

    block_data['relay_chain'] = relay_chain
    block_data['chain'] = chain_name

    for log in block_data['logs']:
        log['value'] = json.dumps(log['value'])

    for event in block_data['onInitialize']['events']:
        event['data'] = json.dumps(event['data'])

    for event in block_data['onFinalize']['events']:
        event['data'] = json.dumps(event['data'])

    for extrinsic in block_data['extrinsics']:
        if extrinsic['success'] is not True and extrinsic['success'] is not False:
            return False
        if extrinsic['paysFee'] is not True and extrinsic['paysFee'] is not False:
            return False
        extrinsic['args'] = json.dumps(extrinsic['args'])
        extrinsic['info'] = json.dumps(extrinsic['info'])
        for event in extrinsic['events']:
            event['data'] = json.dumps(event['data'])

    if block_data['finalized'] is not True and block_data['finalized'] is not False:
        return False


    #TODO: Write to BigQuery
    #TODO: Write to S3
    #TODO: Write to duckDB  https://duckdb.org/docs/guides/python/install 

    try:
            if database_info['database'] == 'postgres':
                from postgres_utils import connect_to_postgres, close_connection, insert_block_data
                db_connection = connect_to_postgres(database_info['database_host'], database_info['db_port'], database_info['db_name'], database_info['db_user'], database_info['db_password'])
                insert_block_data(db_connection, block_data, chain_name, relay_chain)
                print(f"Successfully inserted block {block_id} into Postgres")
                close_connection(db_connection)
            elif database_info['database'] == 'duckdb':
                from duckdb_utils import connect_to_db, close_connection, insert_block
                db_connection = connect_to_db(database_info['db_path'])
                insert_block(db_connection, block_data)
                print(f"Successfully inserted block {block_id} into DuckDB")
                close_connection(db_connection)
            elif database_info['database'] == 'bigquery':
                from bigquery_utils import connect_to_bigquery, insert_block
                db_connection = connect_to_bigquery(database_info['database_project'], database_info['database_cred_path'])
                insert_block(db_connection, database_info['database_dataset'], database_info['database_table'], block_data)
                print(f"Successfully inserted block {block_id} into BigQuery")
    except Exception as e:
        print(f"Error inserting block {block_id} into DuckDB: {str(e)}")
        return False
    

    return True

