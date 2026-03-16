# Online Learning Platform - Frontend

This repository contains the frontend code for an online learning platform built with React, Vite, TailwindCSS and Ant Design. It provides UI components, routing, and API integration to the backend services.

## Project structure

- `src/` - Main source code
  - `api/` - API modules for interacting with backend endpoints
  - `components/` - Reusable UI components and layout pieces
  - `hooks/` - Custom React hooks
  - `pages/` - Route-based pages for different user roles and features
  - `store/` - Redux store and slice definitions
  - `utils/` - Utility functions
  - `App.jsx`, `main.jsx` - App entry points

- `public/` - Static assets
- `.env` - Environment variables (not committed by default)

## Prerequisites

- Node.js >= 18
- npm >= 10 (or yarn)

## Install

```bash
cd frontend
npm install
```

## Available scripts

- `npm run dev` - Start local development server
- `npm run build` - Build production bundles
- `npm run preview` - Preview built app
- `npm run lint` - Run ESLint on project files

## Environment

Create a `.env` file from `.env.example` (if provided), or define the following as needed:

- `VITE_BASE_URL` - Backend API base URL (e.g., `http://localhost:8080`)

## AI Prompt Integration

This frontend includes AI prompt features under `src/pages/Lessons/AiQuizPage.jsx` and related modules.

- Prompt generation and answer scoring are handled in the AI quiz workflow.
- Ensure your backend AI endpoint is configured and accessible via `VITE_BASE_URL`.

## Notes

- Uses Vite with React and TypeScript type support (via `@types/react` packages).
- State management with Redux Toolkit and Redux Persist.
- UI components built with Ant Design.
- API integration via Axios modules in `src/api`.

## Quick start

1. Start backend service (from `backend/`):
   - `cd backend`
   - `./mvnw spring-boot:run` (or `mvnw.cmd` on Windows)
2. Start frontend:
   - `cd frontend`
   - `npm run dev`
3. Open `http://localhost:5173` in your browser.

## Troubleshooting

- If CORS issues happen, ensure backend CORS config allows `http://localhost:5173`.
- If the app does not recompile, restart the Vite server and clear browser cache.
