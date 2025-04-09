#!/bin/bash

# Check if port is provided
if [ -z "$1" ]; then
  echo "Please provide a port number. Example: ./kill-port.sh 3000"
  exit 1
fi

PORT=$1

# Find process using the port and kill it
pid=$(lsof -t -i:$PORT)

if [ -z "$pid" ]; then
  echo "No process found using port $PORT"
  exit 0
fi

echo "Killing process $pid using port $PORT"
kill -9 $pid

echo "Process killed successfully"
exit 0