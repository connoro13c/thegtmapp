#!/bin/bash

echo "Starting PostgreSQL database..."

# Check if PostgreSQL container is already running
if docker ps | grep -q "gtmapp-db"; then
  echo "PostgreSQL container is already running"
else
  # Check if the container exists but is stopped
  if docker ps -a | grep -q "gtmapp-db"; then
    echo "Starting existing PostgreSQL container"
    docker start gtmapp-db
  else
    echo "Creating and starting new PostgreSQL container"
    docker run --name gtmapp-db --network gtmapp-network -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=gtmapp -p 5433:5432 -d postgres:14
    # Wait for PostgreSQL to initialize
    sleep 3
  fi
fi

# Initialize database schema if needed
cd backend

# Check if the database schema is initialized
if ! npx prisma db pull --print | grep -q "model Trial"; then
  echo "Initializing database schema..."
  bash ./initialize-db.sh
fi

# Start backend in a new terminal window
cd ..
gnome-terminal -- bash -c "cd backend && ./run-local.sh" || \
xterm -e "cd backend && ./run-local.sh" || \
terminal -e "cd backend && ./run-local.sh" || \
open -a Terminal.app "$(pwd)/backend/run-local.sh" || \
echo "Could not open a new terminal window for backend. Please start manually with: cd backend && ./run-local.sh"

# Start frontend in this terminal
cd frontend
npm run dev