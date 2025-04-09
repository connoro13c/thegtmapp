#!/bin/bash

# Ensure the script exits if any command fails
set -e

echo "Initializing database..."

# Create a temporary Prisma schema with the current_step field
cat > prisma/schema.prisma.new << EOF
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id           String   @id @default(cuid())
  name         String
  industry     String?
  revenue      Float?
  employees    Int?
  location     String?
  score        Float?
  segmentId    String?
  territoryId  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  segment      Segment?  @relation(fields: [segmentId], references: [id])
  territory    Territory? @relation(fields: [territoryId], references: [id])
}

model Territory {
  id           String   @id @default(cuid())
  name         String
  region       String?
  owner        String?
  accounts     Account[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Segment {
  id           String   @id @default(cuid())
  name         String
  description  String?
  accounts     Account[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Trial {
  id             String   @id @default(cuid())
  userId         String?
  status         String   @default("ACTIVE") // ACTIVE, EXPIRED, CONVERTED
  startedAt      DateTime @default(now())
  expiresAt      DateTime
  currentStep    Int      @default(0)       // Current step in the wizard
  icpDefinition  Json?    // Stores the ICP definition JSON
  accountsData   Json?    // Stores the account data JSON
  segmentsData   Json?    // Stores the segmentation data JSON
  territoriesData Json?   // Stores the territory data JSON
  metricsData    Json?    // Stores metrics and results JSON
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
EOF

# Replace the schema
echo "Updating schema file..."
mv prisma/schema.prisma.new prisma/schema.prisma

# Push the schema to the database
echo "Pushing schema to the database..."
npx prisma db push --force-reset

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Database initialization complete!"