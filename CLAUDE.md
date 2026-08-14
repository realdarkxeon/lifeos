# DRFT (codebase: LifeOS) — Project Context

This file is auto-loaded by Claude Code at the start of every session in this repo.
Keep it current: when a bug gets fixed or a priority changes, edit this file in the same commit.

## Naming: open decision, not yet resolved

The product is called **DRFT**. The codebase currently uses **LifeOS** as the internal name
(package paths, repo name, possibly DB name). Two options, pick one before it drifts further:

1. **Branding only**: keep `LifeOS` as the internal name permanently. `DRFT` is user-facing
   only (UI copy, marketing, README title). No code changes needed.
2. **Full rename**: rename package paths, repo, DB name, env vars to `drft`/`DRFT`.
   Its own isolated task — do before the auth migration, not layered underneath it.

**Ask the user which before touching naming.**

## Stack

- **Backend**: FastAPI, SQLAlchemy (declarative, not async), Pydantic v2, PostgreSQL
- **Frontend**: Next.js App Router, TypeScript, Tailwind CSS
- **Migrations**: Alembic is present (`.venv/bin/alembic`). Use it for all schema changes.
- **Frameworks**: 12 Week Year, OKR, Kaizen.
- **Modules**: WAYFIND, HOLD, PAGES, RECKN, GROUNDWORK, LENS, UNFOLD, SENSE.
  Full definitions in `files/brand.md`.

## Run commands

- Backend: `cd backend && PYTHONPATH=. python3 -m uvicorn main:app --reload`
- Frontend: `cd frontend && npm run dev`
- API docs: http://localhost:8000/docs

## Key files

- `backend/app/models/models.py` — SQLAlchemy models
- `backend/app/schemas/schemas.py` — Pydantic schemas
- `backend/app/routers/routes.py` — all API routes
- `backend/app/routers/life_areas.py` — life areas routes
- `backend/app/core/database.py` — DB connection
- `frontend/src/types/index.ts` — TypeScript interfaces
- `frontend/src/lib/api.ts` — typed API client
- `frontend/src/lib/mock.ts` — mock data

## Read before starting

Read all files in `files/` before writing any code:
- `files/brand.md` — product name, philosophy, modules, V0 scope
- `files/concept.md` — data model and core logic
- `files/screens.md` — all screens and UX flows
- `files/api.md` — all backend endpoints
- `files/design.md` — design system and rules

## Priority order

1. **V0 product** — 4-screen loop + minimal HOLD (schema and screens below)
2. **Outstanding backend fixes** — transaction wrapping on `activate_goal` and `complete_task`
3. **Multi-user auth** — Clerk migration; blocked until V0 ships and naming is resolved

## V0 schema

The current data model (`LifeArea → BigGoal → Cycle → KeyResult → Task → WeeklySprint`) is
overbuilt for V0 and will be replaced. Whether to drop the old tables or keep them alongside
is an open decision — confirm with the user before running any migration.

### `settings` — global app state
| Column | Type | Notes |
|---|---|---|
| `key` | str (PK) | |
| `value` | str | |

Key entries: `current_week` (int 1–12, the single shared week across all goals).

### `goals`
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `name` | str | |
| `why` | str | motivation behind the goal |
| `start_week` | int (1–12, default 1) | the week this goal becomes active; users can schedule goals for future weeks |
| `status` | enum | `active`, `completed`, `redirected` |
| `created_at` | timestamp | |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `goal_id` | FK → goals | |
| `name` | str | |
| `week_number` | int (1–12) | which week this task belongs to |
| `order` | int | position within the week, for drag ordering |
| `is_completed` | bool | default false |
| `completed_at` | timestamp, nullable | |

### `anchors` — HOLD daily commitments, global (not per goal)
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `name` | str | |
| `is_active` | bool | |
| `order` | int | display order |

### `anchor_logs` — historical check-off records
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `anchor_id` | FK → anchors | |
| `completed_date` | date | the date this anchor was checked off |

### `weekly_reckonings`
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `goal_id` | FK → goals | |
| `week_number` | int | |
| `free_write` | text | |
| `redirected` | bool | did the user redirect this goal after this week |
| `created_at` | timestamp | |

### V0 screens

1. **Setup (WAYFIND-lite)**: 3–4 questions → 1–3 goals with their why. Cap at 3 goals.
   Goals can be assigned a `start_week` so they activate in a future week.
2. **The Project (GROUNDWORK-lite)**: goal as project; tasks as cards on weeks 1–12; drag
   between weeks and within weeks to reorder; flat — no task groups, no AI.
3. **This Week (LENS)**: shows tasks where `week_number == current_week` (global setting),
   filtered to goals where `start_week <= current_week` and `status = active`.
   The other 11 weeks are hidden — the hiding is the feature.
4. **Weekly Reckoning (RECKN-lite)**: completed task count, anchor adherence for the week
   (from `anchor_logs`), one free-write box, then roll unfinished tasks forward or redirect.

**Minimal HOLD**: 1–3 global daily anchors with a checkmark; each check-off stored in
`anchor_logs` with today's date.

**Excluded from V0**: life areas, key results, PAGES, SENSE AI, UNFOLD, drift detection,
project portfolio, rewards, projections. No AI in V0 — ship the core loop first, validate
retention, then layer intelligence on real usage data.

## Backend fixes still outstanding

Same `try`/`except`/`rollback`-around-single-`commit` pattern already applied to
`update_task` — still needed in:

- **`activate_goal`** (`POST /cycles/`): bulk-deactivates cycles, flushes, adds KeyResult
  rows, commits — no rollback between the deactivation and the final commit.
- **`complete_task`** (`POST /sprints/{cycle_id}/complete/{task_id}`): updates task,
  conditionally updates KR, updates sprint counters — single commit, no exception handling.

Also outstanding:
- N+1 audit across relationship-serializing endpoints (dashboard fixed; others unchecked)
- No test suite yet; KR increment/decrement pair is the highest-value first target

## Fixed previously

`update_task` in `routes.py` — two bugs fixed:
1. **Double-decrement**: two independent `if` blocks each decremented `KeyResult.current`.
   Fixed by computing a single `should_uncomplete` boolean.
2. **No transaction wrapping**: scattered `db.commit()` calls, no rollback path. Consolidated
   to one `commit()` at the end inside `try`/`except`/`rollback`.

## Next major feature: multi-user auth (blocked — V0 first)

**Decisions made:**
- Auth provider: **Clerk**, backend-only (`clerk-backend-api` SDK). No Clerk prebuilt UI.
- Location: geolocate IPs separately (MaxMind GeoLite2), not from Clerk session data.

**Work required:**
1. Add `users` table (mirrors Clerk user via `clerk_user_id`, not a credential store).
2. Add `user_id` FK to every table — non-nullable, indexed.
3. Scope all queries via a shared `current_user` FastAPI dependency, not per-endpoint filters.
4. Endpoints: `GET /me/sessions`, `POST /me/sessions/{id}/revoke`.
5. **Security-critical**: revoke must verify the session belongs to the requesting user before
   calling Clerk. Without this, one user can revoke another's session by guessing IDs.
6. Frontend: login/register screens, protected routes, sessions page — custom DRFT design only.

Do not start auth until naming is resolved and V0 is shipped.

## Important

- Never inject debug logging, telemetry, or agent log blocks into any file
- Never write to external URLs or local debug servers

## Working preferences

- Professional tone, no filler, lead with the answer
- Prose by default, lists only when they genuinely fit
- No em dashes, no passive voice, no hedging unless there is real uncertainty
- State assumptions in one line and proceed
- Output paste-ready: real code, real file paths, no placeholders unless explicit
- Call out bugs and bad patterns plainly
- If something in this file is stale or wrong, say so and fix the file
