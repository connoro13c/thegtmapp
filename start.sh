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
echo -e "${GREEN}GTM App Startup Script${NC}"
echo -e "${BLUE}=======================================${NC}"

# Function to check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Docker is running${NC}"
}

# Function to create Docker network if it doesn't exist
setup_network() {
  if ! docker network ls | grep -q "gtmapp-network"; then
    echo -e "${YELLOW}Creating gtmapp-network...${NC}"
    docker network create gtmapp-network
  else
    echo -e "${GREEN}✓ Docker network gtmapp-network exists${NC}"
  fi
}

# Function to start PostgreSQL
start_postgres() {
  echo -e "\n${YELLOW}Starting PostgreSQL database...${NC}"
  
  # Check if PostgreSQL container is already running
  if docker ps | grep -q "gtmapp-db"; then
    echo -e "${GREEN}✓ PostgreSQL container is already running${NC}"
  else
    # Check if the container exists but is stopped
    if docker ps -a | grep -q "gtmapp-db"; then
      echo -e "${YELLOW}Starting existing PostgreSQL container...${NC}"
      docker start gtmapp-db
    else
      echo -e "${YELLOW}Creating and starting new PostgreSQL container...${NC}"
      docker run --name gtmapp-db \
        --network gtmapp-network \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_DB=gtmapp \
        -p $POSTGRES_PORT:5432 \
        -d postgres:14
    fi
    
    # Wait for PostgreSQL to initialize
    echo -e "${YELLOW}Waiting for PostgreSQL to initialize...${NC}"
    sleep 3
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
  fi
}

# Function to start ChromaDB
start_chroma() {
  echo -e "\n${YELLOW}Starting ChromaDB...${NC}"
  
  # Check if ChromaDB container is already running
  if docker ps | grep -q "gtmapp-chroma"; then
    echo -e "${GREEN}✓ ChromaDB container is already running${NC}"
  else
    # Check if the container exists but is stopped
    if docker ps -a | grep -q "gtmapp-chroma"; then
      echo -e "${YELLOW}Starting existing ChromaDB container...${NC}"
      docker start gtmapp-chroma
    else
      echo -e "${YELLOW}Creating and starting new ChromaDB container...${NC}"
      docker run --name gtmapp-chroma \
        --network gtmapp-network \
        -p $CHROMA_PORT:8000 \
        -v "$PROJECT_DIR/chromadb_data:/chroma/chroma" \
        -d chromadb/chroma:latest
    fi
    
    # Wait for ChromaDB to initialize
    echo -e "${YELLOW}Waiting for ChromaDB to initialize...${NC}"
    sleep 5
    echo -e "${GREEN}✓ ChromaDB is ready${NC}"
  fi
}

# Function to check if a port is in use
check_port_in_use() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
    return 0  # Port is in use
  else
    return 1  # Port is free
  fi
}

# Function to kill processes using specific ports
kill_port_processes() {
  echo -e "\n${YELLOW}Checking for processes using application ports...${NC}"
  
  # Check processes on frontend port
  local pids=$(lsof -ti:$FRONTEND_PORT)
  if [ ! -z "$pids" ]; then
    echo -e "${YELLOW}Port $FRONTEND_PORT is in use by processes: $pids${NC}"
    
    # Check if these are likely our Node.js processes, not browser
    for pid in $pids; do
      local process_info=$(ps -p $pid -o command= | grep -E 'node|npm')
      if [ ! -z "$process_info" ]; then
        echo -e "${YELLOW}Killing Node.js process (PID: $pid)...${NC}"
        kill $pid 2>/dev/null || true # Use regular kill, not -9
        # If process is still running after 2 seconds, try harder
        sleep 2
        if kill -0 $pid 2>/dev/null; then
          echo -e "${YELLOW}Process still running, sending stronger signal...${NC}"
          kill -15 $pid 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ Process terminated${NC}"
      else
        echo -e "${RED}⚠️  Not killing non-Node process (PID: $pid)${NC}"
        echo -e "${RED}⚠️  This might be a browser. Please close any tabs using localhost:$FRONTEND_PORT${NC}"
      fi
    done
    sleep 1
  fi
  
  # Check processes on backend port
  local pids=$(lsof -ti:$BACKEND_PORT)
  if [ ! -z "$pids" ]; then
    echo -e "${YELLOW}Port $BACKEND_PORT is in use by processes: $pids${NC}"
    
    # Check if these are likely our Node.js processes
    for pid in $pids; do
      local process_info=$(ps -p $pid -o command= | grep -E 'node|npm')
      if [ ! -z "$process_info" ]; then
        echo -e "${YELLOW}Killing Node.js process (PID: $pid)...${NC}"
        kill $pid 2>/dev/null || true # Use regular kill, not -9
        # If process is still running after 2 seconds, try harder
        sleep 2
        if kill -0 $pid 2>/dev/null; then
          echo -e "${YELLOW}Process still running, sending stronger signal...${NC}"
          kill -15 $pid 2>/dev/null || true
        fi
        echo -e "${GREEN}✓ Process terminated${NC}"
      else
        echo -e "${RED}⚠️  Not killing non-Node process (PID: $pid)${NC}"
      fi
    done
    sleep 1
  fi
}

# Function to start the backend
start_backend() {
  echo -e "\n${YELLOW}Starting backend server...${NC}"
  cd "$PROJECT_DIR/backend"
  
  # Check if required environment variables are set
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating default .env file for backend...${NC}"
    cat > .env << EOL
PORT=$BACKEND_PORT
OPENAI_API_KEY=your_openai_api_key
CHROMA_HOST=localhost
CHROMA_PORT=$CHROMA_PORT
EOL
    echo -e "${RED}⚠️  Please update the OpenAI API key in backend/.env file${NC}"
  fi
  
  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ] || [ ! -f "node_modules/.install-stamp" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
    touch node_modules/.install-stamp
  fi
  
  # Start backend in background
  echo -e "${YELLOW}Starting backend server in background...${NC}"
  npm run dev > "$PROJECT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  echo $BACKEND_PID > "$PROJECT_DIR/backend.pid"
  echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID, logs: backend.log)${NC}"
}

# Function to start the frontend
start_frontend() {
  echo -e "\n${YELLOW}Starting frontend server...${NC}"
  cd "$PROJECT_DIR/frontend"
  
  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ] || [ ! -f "node_modules/.install-stamp" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    touch node_modules/.install-stamp
  fi
  
  # Start frontend in background
  echo -e "${YELLOW}Starting frontend server in background...${NC}"
  npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > "$PROJECT_DIR/frontend.pid"
  echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID, logs: frontend.log)${NC}"
}

# Function to display app URLs
show_urls() {
  echo -e "\n${BLUE}=======================================${NC}"
  echo -e "${GREEN}GTM App is now running!${NC}"
  echo -e "${BLUE}=======================================${NC}"
  echo -e "${YELLOW}Frontend URL:${NC} http://localhost:$FRONTEND_PORT"
  echo -e "${YELLOW}Backend API:${NC} http://localhost:$BACKEND_PORT"
  echo -e "${YELLOW}ChromaDB:${NC} http://localhost:$CHROMA_PORT"
  echo -e "${YELLOW}PostgreSQL:${NC} localhost:$POSTGRES_PORT"
  echo -e "\n${YELLOW}To stop the application:${NC} ./stop.sh"
  echo -e "${BLUE}=======================================${NC}"
}

# Main script execution
check_docker
setup_network

# Check and kill any processes that might be using our ports
echo -e "\nChecking for processes using application ports..."
kill_port_processes

# Start all components
start_postgres
start_chroma
start_backend
start_frontend

# Display information about the running services
show_urls

# Initialize database schema if needed (comment out as our services are already started)
# cd backend
# if ! npx prisma db pull --print | grep -q "model Trial"; then
#   echo "Initializing database schema..."
#   bash ./initialize-db.sh
# fi
# cd ..

# Note: We're not starting additional terminal windows or processes
# as we already started the backend and frontend in the background