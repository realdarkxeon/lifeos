# API Endpoints

Base URL: http://localhost:8000

## Life Areas
- GET    /life-areas/                        → list all
- POST   /life-areas/                        → create { name, icon, color, order }
- PATCH  /life-areas/{id}                    → update
- DELETE /life-areas/{id}                    → delete
- GET    /life-areas/{id}/goals              → list goals for area

## Goals
- POST   /goals/                             → create { life_area_id, title, description? }
- PATCH  /goals/{id}                         → update { title?, description? }
- DELETE /goals/{id}                         → delete

## Cycles (activation)
- POST   /cycles/                            → activate goal {
                                                 big_goal_id,
                                                 start_date,
                                                 key_results: [{ title, unit, unit_type, target }]
                                               }
- GET    /cycles/{id}                        → get cycle with key_results
- GET    /cycles/{id}/tasks                  → get tasks, optional ?status=backlog|sprint|done

## Tasks
- POST   /tasks/                             → create {
                                                 cycle_id,
                                                 key_result_id?,
                                                 title,
                                                 notes?,
                                                 kr_value?
                                               }
- PATCH  /tasks/{id}                         → update any task fields
- DELETE /tasks/{id}                         → delete

## Sprint
- POST   /sprints/{cycle_id}/pull            → pull tasks into sprint { task_ids: [...] }
- POST   /sprints/{cycle_id}/complete/{task_id} → mark done, auto-updates KR.current
- POST   /sprints/{cycle_id}/reflect         → save reflection { reflection }

## Dashboard
- GET    /dashboard/                         → full summary (active goals, sprint, KR progress)

## Settings
- GET    /settings/{key}                     → get setting value
- POST   /settings/                          → upsert { key, value }
