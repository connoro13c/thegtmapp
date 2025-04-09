
# Technical Reference

## 1. Common Commands
-------------------

### Build

-   **Frontend:** `npm run build`

-   **Backend:** `npm run build`

### Test

-   **Run Tests:** `npm run test`

-   **Watch Mode:** `npm run test:watch`

### Lint

-   **Lint Checks:** `npm run lint`

-   **Auto-fix Lint Issues:** `npm run lint:fix`

* * * * *

## 2. Code Conventions & Patterns Specific to Project
---------------------------------------------------

### Code Style

-   **React:** Functional components with hooks preferred

-   **Naming:** PascalCase for components, camelCase for functions/variables

-   **Imports:** Group React/libraries first, then components, then styles

-   **CSS:** Component-scoped CSS files with matching names (Component.jsx, Component.css)

-   **Testing:** Jest + React Testing Library (frontend), Jest + Supertest (backend)

-   **Target:** 80%+ code coverage

-   Keep **component files organized** by feature or page.

-   Adopt **single-responsibility principle (SRP)** for components and services.

-   Always provide **inline documentation/comments** for complex logic.

-   Keep styles encapsulated using **Tailwind CSS**.

* * * * *

## 3. Tech Stack and Environment Documentation
--------------------------------------------

### Tech Stack

-   **Frontend:** React, React Router, Framer Motion, Vite

-   **Styling:** Tailwind CSS

-   **UI Components:** shadcn/ui

-   **State Management:** Zustand

-   **Charts & Visualizations:** Recharts

-   **Backend:** Express.js, PostgreSQL, TypeORM

-   **ORM:** Prisma

-   **ML Service:** Python (likely Flask or FastAPI)

-   **Authentication:** JWT

-   **Testing:** Jest, React Testing Library, Cypress (E2E)

### 3c. Environment Variables Documentation

-   **Frontend:**

    -   `REACT_APP_API_URL`: URL for API endpoints

    -   `REACT_APP_AUTH0_DOMAIN`: Auth0 authentication domain

    -   `REACT_APP_AUTH0_CLIENT_ID`: Auth0 Client ID

-   **Backend:**

    -   `DATABASE_URL`: Connection string for PostgreSQL

    -   `JWT_SECRET`: Secret key for JWT authentication

    -   `AUTH0_CLIENT_SECRET`: Client secret for Auth0 integration

    -   `NODE_ENV`: Environment indicator (development, test, production)

* * * * *

## 4. Authentication Flow Documentation
-------------------------------------

-   **Auth Provider:** JWT

-   **Login Flow:**

    1.  User visits login page.

    2.  Authenticates with credentials.

    3.  Receives JWT token upon successful authentication.

    4.  Token stored securely in local storage or cookies.

-   **Session Validation:**

    -   Validate JWT token on every protected API request.

    -   Redirect to login if token invalid or expired.

* * * * *

## 5. API Documentation & Endpoints
---------------------------------

-   **GET /accounts** - Retrieves list of accounts.

-   **POST /accounts/score** - Initiates scoring via selected ML model.

-   **GET /accounts/:id** - Fetch details for a specific account.

-   **PUT /accounts/:id** - Updates account information.

-   **GET /territories** - Retrieves all territory data.

-   **POST /territories/calculate** - Recalculates territory assignments.

-   **GET /segments** - Retrieves current segmentation.

* * * * *

## 6. Docker
---------

-   Services containerized with individual Dockerfiles

-   Orchestrated with docker-compose.yml

-   Helper scripts: docker-check.sh, reset-docker.sh

-   Database initialization: initialize-database.sh