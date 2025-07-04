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

    # for log in block_data['logs']:
    #     log['value'] = json.dumps(log['value'])

    # for event in block_data['onInitialize']['events']:
    #     event['data'] = json.dumps(event['data'])

    # for event in block_data['onFinalize']['events']:
    #     event['data'] = json.dumps(event['data'])

    # for extrinsic in block_data['extrinsics']:
    #     if extrinsic['success'] is not True and extrinsic['success'] is not False:
    #         return False
    #     if extrinsic['paysFee'] is not True and extrinsic['paysFee'] is not False:
    #         return False
    #     extrinsic['args'] = json.dumps(extrinsic['args'])
    #     extrinsic['info'] = json.dumps(extrinsic['info'])
    #     for event in extrinsic['events']:
    #         event['data'] = json.dumps(event['data'])

    # if block_data['finalized'] is not True and block_data['finalized'] is not False:
    #     return False

    extrinsics = []
    for index, extrinsic in enumerate(block_data['extrinsics']):
        extrinsics.append({
            'number': block_id,
            'block_hash': block_data['hash'],
            'chain': chain_name,
            'relay_chain': relay_chain,
            'timestamp': block_data['timestamp'],
            'extrinsic_id': f'{block_id}-{index}',
            'pallet': extrinsic['method']['pallet'],
            'method': extrinsic['method']['method'],
            'args': extrinsic['args'],
            'info': extrinsic['info'],
            'extrinsic_hash': extrinsic['hash'],
            'tip': extrinsic['tip'],
            'nonce': extrinsic['nonce'],
            'signature': extrinsic['signature'],
            'era': extrinsic['era'],
            'success': extrinsic['success'],
            'pays_fee': extrinsic['paysFee'],
            'event_count': len(extrinsic['events'])
        })

    events = []
    for index, event in enumerate(block_data['onInitialize']['events']):
        events.append({
            'number': block_id,
            'block_hash': block_data['hash'],
            'chain': chain_name,
            'relay_chain': relay_chain,
            'timestamp': block_data['timestamp'],
            'extrinsic_id': None,
            'event_id': f'{block_id}-{len(events) + 1}',
            'pallet': event['method']['pallet'],
            'method': event['method']['method'],
            'data': event['data'],
            'source': 'onInitialize'
        })

    for index, event in enumerate(block_data['onFinalize']['events']):
        events.append({
            'number': block_id,
            'block_hash': block_data['hash'],
            'chain': chain_name,
            'relay_chain': relay_chain,
            'timestamp': block_data['timestamp'],
            'extrinsic_id': None,
            'event_id': f'{block_id}-{len(events) + 1}',
            'pallet': event['method']['pallet'],
            'method': event['method']['method'],
            'data': event['data'],
            'source': 'onFinalize'
        })

    for extrinsic_index, extrinsic in enumerate(block_data['extrinsics']):
        for index, event in enumerate(extrinsic['events']):
            events.append({
                'number': block_id,
                'block_hash': block_data['hash'],
                'chain': chain_name,
                'relay_chain': relay_chain,
                'timestamp': block_data['timestamp'],
                'extrinsic_id': f'{block_id}-{extrinsic_index}',
                'event_id': f'{block_id}-{len(events) + 1}',
                'pallet': event['method']['pallet'],
                'method': event['method']['method'],
                'data': event['data'],
                'source': 'extrinsic'
            })

    logs = []
    for log in block_data['logs']:
        logs.append({
            'number': block_id,
            'block_hash': block_data['hash'],
            'chain': chain_name,
            'relay_chain': relay_chain,
            'timestamp': block_data['timestamp'],
            'type': log['type'],
            'index': log['index'],
            'value': log['value']
        })

    basic_block_data = {
        'number': block_id,
        'block_hash': block_data['hash'],
        'parent_hash': block_data['parentHash'],
        'state_root': block_data['stateRoot'],
        'extrinsics_root': block_data['extrinsicsRoot'],
        'author': block_data['authorId'],
        'timestamp': block_data['timestamp'],
        'relay_chain': relay_chain,
        'chain': chain_name,
        'finalized': block_data['finalized'],
        'extrinsics_count': len(extrinsics),
        'events_count': len(events),
        'logs_count': len(logs)
    }

    # try:
    from database_utils import connect_to_database, insert_block_data, close_connection, insert_basic_block_data, insert_extrinsics, insert_events, insert_logs
    
    db_connection = connect_to_database(database_info)
    # insert_block_data(database_info , db_connection, block_data, chain_name, relay_chain)
    insert_basic_block_data(database_info, db_connection, basic_block_data, chain_name, relay_chain)
    insert_extrinsics(database_info, db_connection, extrinsics, chain_name, relay_chain)
    insert_events(database_info, db_connection, events, chain_name, relay_chain)
    insert_logs(database_info, db_connection, logs, chain_name, relay_chain)
    print(f"Successfully inserted block {block_id} into {database_info['database']}")
    close_connection(db_connection, database_info)
    # except Exception as e:
    #     print(f"Error inserting block {block_id} into {database_info['database']}: {str(e)}")
    #     return False

    return True
