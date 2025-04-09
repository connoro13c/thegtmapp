# GTM App

A comprehensive Go-To-Market application that helps sales teams optimize their territory management, account scoring, and market segmentation.

## Features

- **ICP Definition**: Define your Ideal Customer Profile with AI assistance
- **Account Scoring**: Score accounts based on fit and coverage metrics
- **Territory Management**: Visualize and manage sales territories
- **Segmentation Generator**: Create market segments based on your data
- **Account Assignment**: Intelligently assign accounts to the right territories
- **Territory Health Analysis**: Assess the health and potential of your territories

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/connoro13c/thegtmapp.git
cd thegtmapp

# Install dependencies
npm install

# Start the application with Docker
npm run start:docker
```

### Development

```bash
# Start frontend development server
npm run dev:frontend

# Start backend development server
npm run dev:backend

# Run tests
npm test
```

## License

[MIT](LICENSE)