#!/bin/bash

# Stop all containers
echo "Stopping all Docker containers..."
docker-compose down

# Remove volumes
echo "Removing Docker volumes..."
docker volume rm $(docker volume ls -q -f name=thegtmapp) 2>/dev/null || true

# Build and start containers
echo "Building and starting Docker containers..."
docker-compose up -d --build

echo "Docker environment has been reset!"
exit 0