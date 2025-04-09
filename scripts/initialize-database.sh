#!/bin/bash

# Check if .env file exists
if [ ! -f ./backend/.env ]; then
  echo "Creating .env file from .env.example"
  cp ./backend/.env.example ./backend/.env
fi

echo "Installing dependencies..."
cd backend && npm install

echo "Running initial Prisma migration..."
npx prisma migrate dev --name init

echo "Database initialization complete!"