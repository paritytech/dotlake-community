FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    docker.io \
    docker-compose \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python script and configuration
COPY dotlake_ingest.py .
COPY config.yaml .

# Copy the ingest directory (needed for docker-compose files)
COPY ingest/ ./ingest/

# Make the script executable
RUN chmod +x dotlake_ingest.py

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose ports that the services will use
EXPOSE 8080 8501 8088

# Default command to run the launcher
CMD ["python", "dotlake_ingest.py"] 