# Dotlake Block Explorer Backend

This is the FastAPI backend for the Dotlake Block Explorer. It provides APIs to access blockchain data stored in various databases (PostgreSQL, MySQL, or BigQuery).

## Setup

### Option 1: Local Development

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy the environment file and configure it:
```bash
cp .env.example .env
```
Edit the `.env` file with your database and chain configuration.

### Option 2: Docker Development

1. Make sure you have Docker and Docker Compose installed
2. Build and start the containers:
```bash
docker-compose up --build
```

The API will be available at `http://localhost:8000`

## Running the Server

### Local Development
```bash
uvicorn app.main:app --reload
```

### Docker Development
```bash
# Start the containers
docker-compose up

# Stop the containers
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f
```

## API Documentation

Once the server is running, you can access:
- Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## API Endpoints

### GET /
- Root endpoint
- Returns welcome message

### GET /blocks/recent
- Get recent blocks
- Query parameters:
  - `limit`: Number of blocks to return (default: 50)

### GET /blocks/{block_number}
- Get block details by block number
- Path parameters:
  - `block_number`: The block number to fetch

### GET /blocks/search
- Search blocks with filters
- Query parameters:
  - `block_number`: Filter by block number
  - `hash`: Filter by block hash
  - `author`: Filter by block author
  - `finalized`: Filter by finalized status
  - `limit`: Number of results to return (default: 50)

## Development

The project structure:
```
backend/
├── app/
│   └── main.py          # Main FastAPI application
├── requirements.txt     # Python dependencies
├── .env.example        # Example environment configuration
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
└── README.md           # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 