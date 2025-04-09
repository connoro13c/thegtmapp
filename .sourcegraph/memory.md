# Build/Lint/Test Commands

## Build
- Project: `npm run build`
- Frontend: `npm run build:frontend` or `cd frontend && npm run build`
- Backend: `npm run build:backend` or `cd backend && npm run build`

## Lint
- Project: `npm run lint` or `npm run lint:fix`
- Frontend: `npm run lint:frontend` or `cd frontend && npm run lint`
- Backend: `npm run lint:backend` or `cd backend && npm run lint`

## Tests
- All tests: `npm test`
- Frontend: `npm run test:frontend` or `cd frontend && npm run test`
- Backend: `npm run test:backend` or `cd backend && npm run test`
- Watch mode: `npm run test:watch`
- Single test (frontend): `cd frontend && npm run test:watch -- -t "test name"`
- Single test (backend): `cd backend && npm run test:watch -- -t "test name"`

## Docker
- Start with Docker: `npm run start:docker`
- Check Docker status: `npm run docker:check`
- Reset Docker: `npm run docker:reset`
- Rebuild Docker: `npm run docker:rebuild`

# Code Style Guidelines
- Use TypeScript for type safety
- Frontend uses React with hooks and functional components
- Backend uses Express with Prisma ORM
- Use camelCase for variables and functions
- Use PascalCase for component names, interfaces, and types
- Use descriptive variable/function names
- Organize imports: React first, then external libraries, then relative imports
- Handle errors with try/catch blocks and proper error responses
- Use async/await for asynchronous operations