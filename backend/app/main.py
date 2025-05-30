from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from dotenv import load_dotenv
from .database_utils import connect_to_database, query_recent_blocks, query_last_block, close_connection
from .postgres_utils import query

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Dotlake Block Explorer API",
    description="API for exploring blockchain blocks and transactions",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://172.18.0.1:3000", "http://172.18.0.1:3001"],  # Frontend development servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Database configuration
DATABASE_CONFIG = {
    "database": os.getenv("DATABASE_TYPE", "postgres"),
    "host": os.getenv("DATABASE_HOST"),
    "port": os.getenv("DATABASE_PORT"),
    "user": os.getenv("DATABASE_USER"),
    "password": os.getenv("DATABASE_PASSWORD"),
    "name": os.getenv("DATABASE_NAME"),
    "project": os.getenv("DATABASE_PROJECT"),
    "dataset": os.getenv("DATABASE_DATASET"),
    "table": os.getenv("DATABASE_TABLE"),
    "cred_path": os.getenv("DATABASE_CRED_PATH"),
}

# Pydantic models for request/response validation
class BlockResponse(BaseModel):
    relay_chain: str
    chain: str
    timestamp: int
    number: str
    hash: str
    parenthash: str
    stateroot: str
    extrinsicsroot: str
    authorid: str
    finalized: bool
    extrinsics_count: int
    events_count: int
    logs_count: int

class EventResponse(BaseModel):
    relay_chain: str
    chain: str
    timestamp: int
    number: str
    hash: str
    extrinsic_id: Optional[str]
    event_id: str
    pallet: str
    method: str
    data: Dict[str, Any]
    source: str

class PaginatedEventResponse(BaseModel):
    events: List[EventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class RecentBlocksResponse(BaseModel):
    blocks: List[BlockResponse]

class ExtrinsicResponse(BaseModel):
    method: Dict[str, str]  # Contains pallet and method
    signature: Optional[Dict[str, Any]]
    nonce: Optional[str]
    args: Dict[str, Any]
    tip: Optional[str]
    hash: Optional[str]
    info: Optional[Dict[str, Any]]
    era: Optional[Dict[str, Any]]
    success: bool
    pays_fee: bool
    index: str  # Position in the block
    relay_chain: str
    chain: str
    timestamp: int
    number: str
    block_hash: str
    event_count: int

class PaginatedExtrinsicResponse(BaseModel):
    extrinsics: List[ExtrinsicResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

@app.get("/")
async def root():
    return {"message": "Welcome to Dotlake Block Explorer API"}

@app.get("/blocks/recent", response_model=RecentBlocksResponse)
async def get_recent_blocks(limit: int = 50):
    """
    Get the most recent blocks
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        blocks = query(db_connection, f"SELECT * FROM blocks_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')} ORDER BY number DESC LIMIT {limit}")
        close_connection(db_connection, DATABASE_CONFIG)
        return {"blocks": blocks.to_dict('records')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/blocks/{block_number}", response_model=BlockResponse)
async def get_block(block_number: str):
    """
    Get block details by block number
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        block = query(db_connection, f"SELECT * FROM blocks_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')} WHERE number = '{block_number}'")
        close_connection(db_connection, DATABASE_CONFIG)
        
        if block.empty:
            raise HTTPException(status_code=404, detail="Block not found")
            
        return block.iloc[0].to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/blocks/search")
async def search_blocks(
    block_number: Optional[str] = None,
    hash: Optional[str] = None,
    author: Optional[str] = None,
    finalized: Optional[bool] = None,
    limit: int = 50
):
    """
    Search blocks with various filters
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        blocks = query(db_connection, f"SELECT * FROM blocks_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')} ORDER BY number DESC LIMIT {limit}")
        close_connection(db_connection, DATABASE_CONFIG)
        
        # Apply filters
        if block_number:
            blocks = blocks[blocks['number'] == block_number]
        if hash:
            blocks = blocks[blocks['hash'] == hash]
        if author:
            blocks = blocks[blocks['authorid'] == author]
        if finalized is not None:
            blocks = blocks[blocks['finalized'] == finalized]
            
        return {"blocks": blocks.head(limit).to_dict('records')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/blocks/{block_number}/events", response_model=PaginatedEventResponse)
async def get_block_events(
    block_number: str,
    pallet: Optional[str] = Query(None, description="Filter events by pallet name"),
    method: Optional[str] = Query(None, description="Filter events by method name"),
    extrinsic_id: Optional[str] = Query(None, description="Filter events by extrinsic ID"),
    page: int = Query(1, ge=1, description="Page number for pagination"), 
    page_size: int = Query(50, ge=1, le=100, description="Number of events per page")
):
    """
    Get all events for a specific block from the events table.
    Supports filtering by pallet, method, and extrinsic ID, and pagination.
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        
        # Build the query with filters
        query_filters = [f"number = '{block_number}'"]
        if pallet:
            query_filters.append(f"pallet = '{pallet}'")
        if method:
            query_filters.append(f"method = '{method}'")
        if extrinsic_id:
            query_filters.append(f"extrinsic_id = '{extrinsic_id}'")
            
        where_clause = " AND ".join(query_filters)
        
        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        # Get total count
        count_query = f"""
            SELECT COUNT(*) as count 
            FROM events_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')}
            WHERE {where_clause}
        """
        count_result = query(db_connection, count_query)
        total_events = count_result['count'].iloc[0]
        
        # Get paginated events
        events_query = f"""
            SELECT * 
            FROM events_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')}
            WHERE {where_clause}
            ORDER BY event_id
            LIMIT {page_size} OFFSET {offset}
        """
        events = query(db_connection, events_query)
        close_connection(db_connection, DATABASE_CONFIG)

        if events.empty and page == 1:
            raise HTTPException(status_code=404, detail="No events found for this block")
            
        # Process events
        processed_events = []
        for _, event in events.iterrows():
            # Parse JSON data field
            data = event['data']
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    data = {'raw': data}
            
            # If data is a list, convert it to a dictionary with index keys
            if isinstance(data, list):
                data = {str(i): item for i, item in enumerate(data)}
                    
            processed_events.append({
                'relay_chain': event['relay_chain'],
                'chain': event['chain'],
                'timestamp': event['timestamp'],
                'number': event['number'],
                'hash': event['hash'],
                'extrinsic_id': event['extrinsic_id'],
                'event_id': event['event_id'],
                'pallet': event['pallet'],
                'method': event['method'],
                'data': data,
                'source': event['source']
            })
            
        total_pages = (total_events + page_size - 1) // page_size
        
        return {
            'events': processed_events,
            'total': total_events,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/extrinsics/recent", response_model=PaginatedExtrinsicResponse)
async def get_recent_extrinsics(
    pallet: Optional[str] = Query(None, description="Filter extrinsics by pallet name"),
    method: Optional[str] = Query(None, description="Filter extrinsics by method name"),
    success: Optional[bool] = Query(None, description="Filter by success status"), 
    pays_fee: Optional[bool] = Query(None, description="Filter by pays_fee status"),
    limit: int = Query(50, ge=1, le=100, description="Number of recent extrinsics to return")
):
    """
    Get the most recent extrinsics. Supports filtering by pallet, method,
    success status and pays_fee status, with a configurable limit.
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)

        # Build WHERE clause
        where_clauses = []
        if pallet:
            where_clauses.append(f"LOWER(pallet) = LOWER('{pallet}')")
        if method:
            where_clauses.append(f"LOWER(method) = LOWER('{method}')")
        if success is not None:
            where_clauses.append(f"success = {success}")
        if pays_fee is not None:
            where_clauses.append(f"pays_fee = {pays_fee}")

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

        # Get extrinsics ordered by block number and extrinsic ID
        extrinsics_query = f"""
            SELECT *
            FROM extrinsics_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')}
            WHERE {where_clause}
            ORDER BY CAST(split_part(number, '-', 1) AS BIGINT) DESC, 
                     CAST(split_part(extrinsic_id, '-', 2) AS INTEGER) DESC
            LIMIT {limit}
        """
        
        extrinsics = query(db_connection, extrinsics_query)
        close_connection(db_connection, DATABASE_CONFIG)

        if extrinsics.empty:
            raise HTTPException(status_code=404, detail="No extrinsics found")

        # Process extrinsics
        processed_extrinsics = []
        for _, extrinsic in extrinsics.iterrows():
            # Parse JSON fields
            args = extrinsic['args']
            info = extrinsic['info']
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError:
                    args = {'raw': args}
            if isinstance(info, str):
                try:
                    info = json.loads(info)
                except json.JSONDecodeError:
                    info = {'raw': info}

            processed_extrinsics.append({
                'method': {
                    'pallet': extrinsic['pallet'],
                    'method': extrinsic['method']
                },
                'signature': json.loads(extrinsic['signature']) if extrinsic['signature'] else None,
                'nonce': extrinsic['nonce'],
                'args': args,
                'tip': extrinsic['tip'],
                'hash': extrinsic['extrinsic_hash'],
                'info': info,
                'era': json.loads(extrinsic['era']) if extrinsic['era'] else None,
                'success': extrinsic['success'],
                'pays_fee': extrinsic['pays_fee'],
                'index': extrinsic['extrinsic_id'],
                'relay_chain': extrinsic['relay_chain'],
                'chain': extrinsic['chain'],
                'timestamp': extrinsic['timestamp'],
                'number': extrinsic['number'],
                'block_hash': extrinsic['hash'],
                'event_count': extrinsic['event_count']
            })

        return {
            'extrinsics': processed_extrinsics,
            'total': len(processed_extrinsics),
            'page': 1,
            'page_size': limit,
            'total_pages': 1
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/blocks/{block_number}/extrinsics", response_model=PaginatedExtrinsicResponse)
async def get_block_extrinsics(
    block_number: str,
    pallet: Optional[str] = Query(None, description="Filter extrinsics by pallet name"),
    method: Optional[str] = Query(None, description="Filter extrinsics by method name"), 
    success: Optional[bool] = Query(None, description="Filter by success status"),
    pays_fee: Optional[bool] = Query(None, description="Filter by pays_fee status"),
    extrinsic_id: Optional[str] = Query(None, description="Filter by extrinsic ID"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(50, ge=1, le=100, description="Number of extrinsics per page")
):
    """
    Get all extrinsics for a specific block. Supports filtering by pallet, method,
    success status, pays_fee status and extrinsic_id, with pagination.
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)

        # Build WHERE clause
        where_clauses = [f"number = '{block_number}'"]
        if pallet:
            where_clauses.append(f"LOWER(pallet) = LOWER('{pallet}')")
        if method:
            where_clauses.append(f"LOWER(method) = LOWER('{method}')")
        if success is not None:
            where_clauses.append(f"success = {success}")
        if pays_fee is not None:
            where_clauses.append(f"pays_fee = {pays_fee}")
        if extrinsic_id:
            where_clauses.append(f"extrinsic_id = '{extrinsic_id}'")

        where_clause = " AND ".join(where_clauses)

        # Get total count
        count_query = f"""
            SELECT COUNT(*) as count
            FROM extrinsics_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')}
            WHERE {where_clause}
        """
        count_result = query(db_connection, count_query)
        total_extrinsics = count_result['count'].iloc[0]

        # Calculate pagination
        offset = (page - 1) * page_size
        total_pages = (total_extrinsics + page_size - 1) // page_size

        # Get paginated extrinsics
        extrinsics_query = f"""
            SELECT *
            FROM extrinsics_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')}
            WHERE {where_clause}
            ORDER BY extrinsic_id
            LIMIT {page_size} OFFSET {offset}
        """
        extrinsics = query(db_connection, extrinsics_query)
        close_connection(db_connection, DATABASE_CONFIG)

        if extrinsics.empty and page == 1:
            raise HTTPException(status_code=404, detail="No extrinsics found for this block")

        # Process extrinsics
        processed_extrinsics = []
        for _, extrinsic in extrinsics.iterrows():
            # Parse JSON fields
            args = extrinsic['args']
            info = extrinsic['info']
            signature = extrinsic['signature']
            era = extrinsic['era']

            if isinstance(args, str):
                args = json.loads(args)
            if isinstance(info, str):
                info = json.loads(info)
            if isinstance(signature, str):
                signature = json.loads(signature)
            if isinstance(era, str):
                era = json.loads(era)

            processed_extrinsics.append({
                'method': {
                    'pallet': extrinsic['pallet'],
                    'method': extrinsic['method']
                },
                'signature': signature,
                'nonce': extrinsic['nonce'],
                'args': args,
                'tip': extrinsic['tip'],
                'hash': extrinsic['extrinsic_hash'],
                'info': info,
                'era': era,
                'success': extrinsic['success'],
                'pays_fee': extrinsic['pays_fee'],
                'index': extrinsic['extrinsic_id'],
                'relay_chain': extrinsic['relay_chain'],
                'chain': extrinsic['chain'],
                'timestamp': extrinsic['timestamp'],
                'number': extrinsic['number'],
                'block_hash': extrinsic['hash'],
                'event_count': extrinsic['event_count']
            })

        return {
            'extrinsics': processed_extrinsics,
            'total': total_extrinsics,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/blocks/{block_number}/logs")
async def get_block_logs(block_number: str):
    """
    Get logs for a specific block number
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        logs_query = f"""
            SELECT * FROM logs_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')} 
            WHERE number = '{block_number}'
            ORDER BY index
        """
        logs = query(db_connection, logs_query)
        close_connection(db_connection, DATABASE_CONFIG)

        if logs.empty:
            raise HTTPException(status_code=404, detail="No logs found for this block")

        processed_logs = []
        for _, log in logs.iterrows():
            # Parse JSON value field if it's stored as a string
            value = log['value']
            if isinstance(value, str):
                value = json.loads(value)

            processed_logs.append({
                'type': log['type'],
                'index': log['index'],
                'value': value
            })

        return {'logs': processed_logs}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/blocks/hash/{block_hash}", response_model=BlockResponse)
async def get_block_by_hash(block_hash: str):
    """
    Get block details by block hash
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        block = query(db_connection, f"SELECT * FROM blocks_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')} WHERE hash = '{block_hash}'")
        close_connection(db_connection, DATABASE_CONFIG)
        
        if block.empty:
            raise HTTPException(status_code=404, detail="Block not found")
            
        return block.iloc[0].to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/extrinsics/hash/{extrinsic_hash}", response_model=ExtrinsicResponse)
async def get_extrinsic_by_hash(extrinsic_hash: str):
    """
    Get extrinsic details by extrinsic hash
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        extrinsic_query = f"""
            SELECT *
            FROM extrinsics_{os.getenv('RELAY_CHAIN')}_{os.getenv('CHAIN')}
            WHERE extrinsic_hash = '{extrinsic_hash}'
        """
        extrinsic = query(db_connection, extrinsic_query)
        close_connection(db_connection, DATABASE_CONFIG)

        if extrinsic.empty:
            raise HTTPException(status_code=404, detail="Extrinsic not found")

        # Process the extrinsic
        row = extrinsic.iloc[0]
        
        # Parse JSON fields
        args = row['args']
        info = row['info']
        signature = row['signature']
        era = row['era']

        if isinstance(args, str):
            args = json.loads(args)
        if isinstance(info, str):
            info = json.loads(info)
        if isinstance(signature, str):
            signature = json.loads(signature)
        if isinstance(era, str):
            era = json.loads(era)

        return {
            'method': {
                'pallet': row['pallet'],
                'method': row['method']
            },
            'signature': signature,
            'nonce': row['nonce'],
            'args': args,
            'tip': row['tip'],
            'hash': row['extrinsic_hash'],
            'info': info,
            'era': era,
            'success': row['success'],
            'pays_fee': row['pays_fee'],
            'index': row['extrinsic_id'],
            'relay_chain': row['relay_chain'],
            'chain': row['chain'],
            'timestamp': row['timestamp'],
            'number': row['number'],
            'block_hash': row['hash'],
            'event_count': row['event_count']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 