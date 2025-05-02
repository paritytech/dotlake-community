from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from dotenv import load_dotenv
from .database_utils import connect_to_database, query_recent_blocks, query_last_block, close_connection

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
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    extrinsics: List[Dict[str, Any]]
    onfinalize: Dict[str, Any]
    oninitialize: Dict[str, Any]
    logs: List[Dict[str, Any]]

class EventResponse(BaseModel):
    pallet: str
    method: str
    data: Dict[str, Any]
    source: str  # 'extrinsic', 'onInitialize', or 'onFinalize'
    extrinsic_index: Optional[str] = None  # Only for events from extrinsics

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
    events: List[Dict[str, Any]]
    success: bool
    pays_fee: bool
    index: str  # Position in the block

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
        blocks = query_recent_blocks(db_connection, DATABASE_CONFIG, 
                                   os.getenv("CHAIN"), os.getenv("RELAY_CHAIN"), limit)
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
        block = query_last_block(db_connection, DATABASE_CONFIG, 
                               os.getenv("CHAIN"), os.getenv("RELAY_CHAIN"), block_number)
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
        blocks = query_recent_blocks(db_connection, DATABASE_CONFIG, 
                                   os.getenv("CHAIN"), os.getenv("RELAY_CHAIN"))
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
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(50, ge=1, le=100, description="Number of events per page")
):
    """
    Get all events for a specific block, including events from extrinsics,
    onInitialize, and onFinalize. Supports filtering by pallet and method,
    and pagination.
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        block = query_last_block(db_connection, DATABASE_CONFIG, 
                               os.getenv("CHAIN"), os.getenv("RELAY_CHAIN"), block_number)
        close_connection(db_connection, DATABASE_CONFIG)
        
        if block.empty:
            raise HTTPException(status_code=404, detail="Block not found")
            
        all_events = []
        
        # Get database type to handle JSON parsing correctly
        db_type = DATABASE_CONFIG["database"]
        
        # Process events from extrinsics
        extrinsics = block['extrinsics'].iloc[0]
        if db_type == 'mysql':
            extrinsics = json.loads(extrinsics)
        
        for idx, extrinsic in enumerate(extrinsics):
            for event in extrinsic.get('events', []):
                if db_type == 'mysql':
                    event['data'] = json.loads(event['data'])
                # Ensure data is a dictionary
                event_data = event['data'] if isinstance(event['data'], dict) else {'raw': event['data']}
                all_events.append({
                    'pallet': event['method']['pallet'],
                    'method': event['method']['method'],
                    'data': event_data,
                    'source': 'extrinsic',
                    'extrinsic_index': f'{block_number}-{idx}'
                })
        
        # Process events from onInitialize
        on_initialize = block['oninitialize'].iloc[0]
        if db_type == 'mysql':
            on_initialize = json.loads(on_initialize)
        
        for event in on_initialize.get('events', []):
            if db_type == 'mysql':
                event['data'] = json.loads(event['data'])
            # Ensure data is a dictionary
            event_data = event['data'] if isinstance(event['data'], dict) else {'raw': event['data']}
            all_events.append({
                'pallet': event['method']['pallet'],
                'method': event['method']['method'],
                'data': event_data,
                'source': 'onInitialize',
                'extrinsic_index': None
            })
        
        # Process events from onFinalize
        on_finalize = block['onfinalize'].iloc[0]
        if db_type == 'mysql':
            on_finalize = json.loads(on_finalize)
        
        for event in on_finalize.get('events', []):
            if db_type == 'mysql':
                event['data'] = json.loads(event['data'])
            # Ensure data is a dictionary
            event_data = event['data'] if isinstance(event['data'], dict) else {'raw': event['data']}
            all_events.append({
                'pallet': event['method']['pallet'],
                'method': event['method']['method'],
                'data': event_data,
                'source': 'onFinalize',
                'extrinsic_index': None
            })
        
        # Apply filters if specified
        if pallet:
            all_events = [event for event in all_events if event['pallet'].lower() == pallet.lower()]
        if method:
            all_events = [event for event in all_events if event['method'].lower() == method.lower()]
        
        # Calculate pagination
        total_events = len(all_events)
        total_pages = (total_events + page_size - 1) // page_size
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        # Apply pagination
        paginated_events = all_events[start_idx:end_idx]
        
        return {
            'events': paginated_events,
            'total': total_events,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
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
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(50, ge=1, le=100, description="Number of extrinsics per page")
):
    """
    Get all extrinsics for a specific block. Supports filtering by pallet, method,
    success status, and pays_fee status, with pagination.
    """
    try:
        db_connection = connect_to_database(DATABASE_CONFIG)
        block = query_last_block(db_connection, DATABASE_CONFIG, 
                               os.getenv("CHAIN"), os.getenv("RELAY_CHAIN"), block_number)
        close_connection(db_connection, DATABASE_CONFIG)
        
        if block.empty:
            raise HTTPException(status_code=404, detail="Block not found")
            
        # Get database type to handle JSON parsing correctly
        db_type = DATABASE_CONFIG["database"]
        
        # Get extrinsics and parse JSON if needed
        extrinsics = block['extrinsics'].iloc[0]
        if db_type == 'mysql':
            extrinsics = json.loads(extrinsics)
        
        # Process and filter extrinsics
        processed_extrinsics = []
        for idx, extrinsic in enumerate(extrinsics):
            # Parse JSON fields if needed
            if db_type == 'mysql':
                extrinsic['args'] = json.loads(extrinsic['args'])
                extrinsic['info'] = json.loads(extrinsic['info'])
                for event in extrinsic.get('events', []):
                    event['data'] = json.loads(event['data'])
            else:
                # For other database types, ensure fields are parsed if they're strings
                if isinstance(extrinsic.get('args'), str):
                    try:
                        extrinsic['args'] = json.loads(extrinsic['args'])
                    except json.JSONDecodeError:
                        extrinsic['args'] = {'raw': extrinsic['args']}
                if isinstance(extrinsic.get('info'), str):
                    try:
                        extrinsic['info'] = json.loads(extrinsic['info'])
                    except json.JSONDecodeError:
                        extrinsic['info'] = {'raw': extrinsic['info']}
                for event in extrinsic.get('events', []):
                    if isinstance(event.get('data'), str):
                        try:
                            event['data'] = json.loads(event['data'])
                        except json.JSONDecodeError:
                            event['data'] = {'raw': event['data']}
            
            # Apply filters
            if pallet and extrinsic['method']['pallet'].lower() != pallet.lower():
                continue
            if method and extrinsic['method']['method'].lower() != method.lower():
                continue
            if success is not None and extrinsic['success'] != success:
                continue
            if pays_fee is not None and extrinsic['paysFee'] != pays_fee:
                continue
            
            processed_extrinsics.append({
                'method': extrinsic['method'],
                'signature': extrinsic.get('signature'),
                'nonce': extrinsic.get('nonce'),
                'args': extrinsic['args'],
                'tip': extrinsic.get('tip'),
                'hash': extrinsic.get('hash'),
                'info': extrinsic['info'],
                'era': extrinsic.get('era'),
                'events': extrinsic.get('events', []),
                'success': extrinsic['success'],
                'pays_fee': extrinsic['paysFee'],
                'index': f'{block_number}-{idx}' # Convert index to string
            })
        
        # Calculate pagination
        total_extrinsics = len(processed_extrinsics)
        total_pages = (total_extrinsics + page_size - 1) // page_size
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        # Apply pagination
        paginated_extrinsics = processed_extrinsics[start_idx:end_idx]
        
        return {
            'extrinsics': paginated_extrinsics,
            'total': total_extrinsics,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 