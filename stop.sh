#!/bin/bash

# Terminal colors for better visibility
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Define standard ports for consistency
FRONTEND_PORT=3000
BACKEND_PORT=3002
CHROMA_PORT=8000
POSTGRES_PORT=5433

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}=======================================${NC}"
echo -e "${RED}GTM App Shutdown Script${NC}"
echo -e "${BLUE}=======================================${NC}"

# Function to stop the frontend
stop_frontend() {
  echo -e "\n${YELLOW}Stopping frontend server...${NC}"
  if [ -f "$PROJECT_DIR/frontend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/frontend.pid")
    if ps -p $PID > /dev/null; then
      kill $PID
      echo -e "${GREEN}✓ Frontend server stopped (PID: $PID)${NC}"
    else
      echo -e "${YELLOW}Frontend server was not running${NC}"
    fi
    rm -f "$PROJECT_DIR/frontend.pid"
  else
    echo -e "${YELLOW}No frontend PID file found${NC}"
  fi
}

# Function to stop the backend
stop_backend() {
  echo -e "\n${YELLOW}Stopping backend server...${NC}"
  if [ -f "$PROJECT_DIR/backend.pid" ]; then
    PID=$(cat "$PROJECT_DIR/backend.pid")
    if ps -p $PID > /dev/null; then
      kill $PID
      echo -e "${GREEN}✓ Backend server stopped (PID: $PID)${NC}"
    else
      echo -e "${YELLOW}Backend server was not running${NC}"
    fi
    rm -f "$PROJECT_DIR/backend.pid"
  else
    echo -e "${YELLOW}No backend PID file found${NC}"
  fi
}

# Function to stop ChromaDB
stop_chroma() {
  echo -e "\n${YELLOW}Stopping ChromaDB container...${NC}"
  if docker ps | grep -q "gtmapp-chroma"; then
    docker stop gtmapp-chroma
    echo -e "${GREEN}✓ ChromaDB container stopped${NC}"
  else
    echo -e "${YELLOW}ChromaDB container was not running${NC}"
  fi
}

# Function to stop PostgreSQL
stop_postgres() {
  echo -e "\n${YELLOW}Stopping PostgreSQL container...${NC}"
  if docker ps | grep -q "gtmapp-db"; then
    docker stop gtmapp-db
    echo -e "${GREEN}✓ PostgreSQL container stopped${NC}"
  else
    echo -e "${YELLOW}PostgreSQL container was not running${NC}"
  fi
}

# Function to check for Docker
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Warning: Docker is not running. Cannot stop containers.${NC}"
    return 1
  fi
  return 0
}

# Function to kill processes using specific ports
kill_port_processes() {
  echo -e "\n${YELLOW}Checking for processes using application ports...${NC}"
  
  # Check and kill processes on frontend port
  local pid=$(lsof -ti:$FRONTEND_PORT)
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}Killing process using frontend port $FRONTEND_PORT (PID: $pid)...${NC}"
    kill -9 $pid
    echo -e "${GREEN}✓ Process killed${NC}"
  fi
  
  # Check and kill processes on backend port
  local pid=$(lsof -ti:$BACKEND_PORT)
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}Killing process using backend port $BACKEND_PORT (PID: $pid)...${NC}"
    kill -9 $pid
    echo -e "${GREEN}✓ Process killed${NC}"
  fi
  
  # Check and kill processes on Chroma port
  local pid=$(lsof -ti:$CHROMA_PORT)
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}Found process using ChromaDB port $CHROMA_PORT (PID: $pid)${NC}"
    echo -e "${YELLOW}This might be the Docker container or another process${NC}"
    # We don't forcefully kill this as Docker will handle it
  fi
  
  # Check and kill processes on Postgres port
  local pid=$(lsof -ti:$POSTGRES_PORT)
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}Found process using PostgreSQL port $POSTGRES_PORT (PID: $pid)${NC}"
    echo -e "${YELLOW}This might be the Docker container or another process${NC}"
    # We don't forcefully kill this as Docker will handle it
  fi
}

# Main script execution
stop_frontend
stop_backend

# Kill any other processes that might be using our ports
kill_port_processes

# Only try to stop Docker containers if Docker is running
if check_docker; then
  stop_chroma
  stop_postgres
fi

echo -e "\n${BLUE}=======================================${NC}"
echo -e "${GREEN}GTM App has been stopped${NC}"
echo -e "${BLUE}=======================================${NC}"

# Offer to clean up logs
echo -e "\n${YELLOW}Would you like to clean up log files? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  rm -f "$PROJECT_DIR/frontend.log" "$PROJECT_DIR/backend.log"
  echo -e "${GREEN}✓ Log files removed${NC}"
fi

echo -e "\n${GREEN}To restart the application, run:${NC} ./start.sh"
echo -e "${BLUE}=======================================${NC}"
