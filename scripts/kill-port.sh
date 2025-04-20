#!/bin/bash

killPortIfInUse() {
  local PORT=$1
  local pid=$(lsof -t -i:$PORT)

  if [ -z "$pid" ]; then
    echo "No process found using port $PORT"
    return
  fi

  echo "Killing process $pid using port $PORT"
  kill -9 $pid
  echo "Process killed successfully on port $PORT"
}

# If specific port is provided, kill only that port
if [ ! -z "$1" ]; then
  killPortIfInUse $1
  exit 0
fi

# Otherwise kill both frontend and backend ports
echo "Killing processes on frontend and backend ports"
killPortIfInUse 3000  # Frontend port
killPortIfInUse 3002  # Backend port

exit 0