#!/bin/bash

# This script runs the backend locally, connecting to the Docker PostgreSQL instance

# Make sure we're using the correct database URL
export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/gtmapp?schema=public

# Run the provided command or default to starting the server
if [ $# -eq 0 ]; then
  echo "Starting backend server..."
  npm run dev
else
  echo "Running command: $@"
  "$@"
fi