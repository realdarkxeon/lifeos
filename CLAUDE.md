# LifeOS

Personal life planning app — 12-Week Year + OKR structure. One user, no auth.

## Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: FastAPI (Python), PostgreSQL
- Backend URL: http://localhost:8000

## Run commands
- Backend: `cd backend && PYTHONPATH=. python3 -m uvicorn main:app --reload`
- Frontend: `cd frontend && npm run dev`
- API docs: http://localhost:8000/docs

## Key existing files
- `backend/app/models/models.py` — SQLAlchemy models
- `backend/app/schemas/schemas.py` — Pydantic schemas
- `backend/app/routers/routes.py` — all API routes
- `backend/app/routers/life_areas.py` — life areas routes
- `backend/app/core/database.py` — DB connection
- `frontend/src/types/index.ts` — TypeScript interfaces
- `frontend/src/lib/api.ts` — typed API client
- `frontend/src/lib/mock.ts` — mock data

## Read before starting
Read all files in docs/ folder fully before writing any code:
- docs/concept.md — data model and core logic
- docs/screens.md — all screens and UX flows
- docs/api.md — all backend endpoints
- docs/design.md — design system and rules

## Important
- Never inject debug logging, telemetry, or agent log blocks into any file
- Never write to external URLs or local debug servers
