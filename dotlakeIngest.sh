#!/bin/bash

# Check the operating system and install yq if not already installed
if [[ $(uname) == "Darwin" ]]; then
    # macOS
    if ! command -v yq &> /dev/null; then
        echo "yq is not installed. Installing yq..."
        brew install yq
    fi
elif [[ $(uname) == "Linux" ]]; then
    # Linux
    if ! command -v yq &> /dev/null; then
        echo "yq is not installed. Installing yq..."
        go install github.com/mikefarah/yq/v4@latest
    fi
else
    echo "Unsupported operating system. Please install yq manually."
    exit 1
fi

# Check if yq is installed
if ! command -v yq &> /dev/null; then
    echo "yq is not installed. Please install it to parse YAML files."
    exit 1
fi

# Read configuration from config.yaml
RELAY_CHAIN=$(yq '.relay_chain' config.yaml)
CHAIN=$(yq '.chain' config.yaml)
WSS=$(yq '.wss' config.yaml)
INGEST_MODE=$(yq '.ingest_mode' config.yaml)
START_BLOCK=$(yq '.start_block' config.yaml)
END_BLOCK=$(yq '.end_block' config.yaml)
CREATE_DB=$(yq '.create_db' config.yaml)
RETAIN_DB=$(yq '.retain_db' config.yaml)


# Database configuration
DB_TYPE=$(yq '.databases[0].type' config.yaml)
DB_HOST=$(yq '.databases[0].host' config.yaml)
DB_PORT=$(yq '.databases[0].port' config.yaml)
DB_NAME=$(yq '.databases[0].name' config.yaml)
DB_USER=$(yq '.databases[0].user' config.yaml)
DB_PASSWORD=$(yq '.databases[0].password' config.yaml)
DB_PROJECT=$(yq '.databases[0].project_id' config.yaml)
DB_CRED_PATH=$(yq '.databases[0].credentials_path' config.yaml)
DB_DATASET=$(yq '.databases[0].dataset' config.yaml)
DB_TABLE=$(yq '.databases[0].table' config.yaml)

# Set default values for relay_chain and chain if empty
if [[ -z "$RELAY_CHAIN" ]]; then
    echo "relay_chain not set in config.yaml, using default value 'solo'"
    RELAY_CHAIN="solo"
fi

if [[ -z "$CHAIN" ]]; then
    echo "chain not set in config.yaml, using default value 'substrate_chain'"
    CHAIN="substrate_chain" 
fi

# Create SQLAlchemy URI for Postgres or MySQL
if [[ "$CREATE_DB" == "true" ]]; then
    echo "Using local PostgreSQL database"
    DB_TYPE="postgres"
    DB_HOST="172.18.0.1" 
    DB_PORT="5432"
    DB_NAME="dotlake"
    DB_USER="postgres"
    DB_PASSWORD="postgres"
    SQLALCHEMY_URI="postgresql://${DB_USER}:${DB_PASSWORD}@host.docker.internal:${DB_PORT}/${DB_NAME}"
elif [[ $(yq '.databases[0].type' config.yaml) == "postgres" ]]; then
    SQLALCHEMY_URI="postgres+psycopg2://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
elif [[ $(yq '.databases[0].type' config.yaml) == "mysql" ]]; then
    SQLALCHEMY_URI="mysql+mysqldb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
elif [[ $(yq '.databases[0].type' config.yaml) == "bigquery" ]]; then
    SQLALCHEMY_URI="bigquery://${DB_PROJECT}"
fi

echo "SQLAlchemy URI created: ${SQLALCHEMY_URI}"

# Start Block Ingest Service
echo "Starting Block Ingest Service..."
export RELAY_CHAIN="$RELAY_CHAIN"
export CHAIN="$CHAIN"
export WSS="$WSS"
export DB_TYPE="$DB_TYPE"
export DB_HOST="$DB_HOST"
export DB_PORT="$DB_PORT"
export DB_NAME="$DB_NAME"
export DB_USER="$DB_USER"
export DB_PASSWORD="$DB_PASSWORD"
export DB_PROJECT="$DB_PROJECT"
export CREDENTIALS_PATH="$DB_CRED_PATH"
export DB_DATASET="$DB_DATASET"
export DB_TABLE="$DB_TABLE"
export SQLALCHEMY_URI="$SQLALCHEMY_URI"
export INGEST_MODE="$INGEST_MODE"
export START_BLOCK="$START_BLOCK" 
export END_BLOCK="$END_BLOCK"
if [[ -n "$DB_CRED_PATH" ]]; then
    DB_CREDENTIALS=$(<"$DB_CRED_PATH")
    export DB_CREDENTIALS="$DB_CREDENTIALS"
fi


cd ingest
if [[ "$CREATE_DB" == "true" ]]; then
    docker compose -f docker/docker-internal-db.yaml up -d
    # Wait for postgres to be ready
    sleep 30
else
    docker compose -f docker/docker-compose.yaml up -d
fi
sleep 10
docker exec -it superset superset fab create-admin \
               --username admin \
               --firstname Superset \
               --lastname Admin \
               --email admin@superset.com \
               --password admin

docker exec -it superset superset db upgrade
if [[ $DB_NAME == "bigquery" ]]; then
    docker exec -it superset superset set_database_uri -d "$DB_NAME" -u "$SQLALCHEMY_URI" -se "{\"credentials_info\": $DB_CREDENTIALS}"
else
    docker exec -it superset superset set_database_uri -d "$DB_NAME" -u "$SQLALCHEMY_URI"
fi

cd ..

if [ $? -eq 0 ]; then
    echo "Block Ingest Service started successfully."
else
    echo "Failed to start Block Ingest Service."
    exit 1
fi

echo "Starting the services....this will take couple of minutes...."
sleep 120
echo "All services are now running!"
echo "You can access:"
echo "  • Substrate API Sidecar: http://localhost:8080"
echo "  • Block Ingest Service: http://localhost:8501" 
echo "  • Apache Superset: http://localhost:8088"
