# Vanuatu Smart Transport

A full-stack transport booking app with a React frontend and Express backend.

## Project structure

- `frontend/` — React app and deployment build output
- `backend/` — Express server and API routes

## Prerequisites

- Node 18.x
- npm 9.x or newer

## Local setup

From the project root, install dependencies for both sides:

```bash
npm install --prefix frontend
npm install --prefix backend
```

## Run locally

Open two terminals and start each part separately.

Terminal 1: backend server

```bash
npm start --prefix backend
```

Terminal 2: frontend development app

```bash
npm start --prefix frontend
```

The React app runs at `http://localhost:3000` and the backend API runs at `http://localhost:5001` by default.

## Build for production

From the project root:

```bash
npm run build --prefix frontend
```

Then start the server with the built frontend assets:

```bash
npm start --prefix backend
```

The backend is already configured to serve static files from `frontend/build`.

## Environment variables

Frontend environment files live in `frontend/`:

- `frontend/.env.development`
- `frontend/.env.production`
- `frontend/.env.staging`

For Render or production hosting, set any secret values through the service dashboard or add local `.env.*.local` files.

The backend reads `process.env.PORT` and uses port `5001` when not set.

## Render deployment

This repository includes automatic Render deployment configuration for a Node web service.

Render service configuration:

```yaml
services:
  - type: web
    name: vanuatu-smart-transport
    env: node
    plan: free
    buildCommand: npm install --prefix ./frontend && npm install --prefix ./backend && npm run build --prefix ./frontend
    startCommand: node ./backend/server.js
    envVars:
      - key: NODE_ENV
        value: production
```

Render URLs:

- Staging: `https://vanuatu-smart-transport-2.onrender.com`
- Production: `https://vanuatu-smart-transport-4.onrender.com`


Render build command:

```bash
npm install --prefix ./frontend && npm install --prefix ./backend && npm run build --prefix ./frontend
```

Render start command:

```bash
node ./backend/server.js
```

## Available scripts

### Frontend

From the project root:

```bash
npm start --prefix frontend
npm run build --prefix frontend
npm test --prefix frontend
```

### Backend

From the project root:

```bash
npm start --prefix backend
npm run dev --prefix backend
```

## Notes

- Keep frontend and backend dependency installations separate.
- The backend serves the React frontend from `frontend/build` in production.
- Do not commit built files or `node_modules`; this repo is configured for source-only deployment.
