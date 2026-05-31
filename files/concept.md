# Core Concept

## Data structure
```
Life Area (e.g. "Deen", "Building", "Family")
└── Big Goals Pool (many goals, added anytime)
    └── Active 12-Week Goal (one per area at a time)
        ├── Key Results (2-3, set at activation)
        └── Backlog (tasks added anytime, each linked to one KR or none)
            └── Weekly Sprint (tasks pulled from backlog every Monday)
```

## Cycle modes
Two modes for starting a 12-week cycle:
1. **Global cycle** (default) — one shared start date for all life areas, set in Settings. Activating a goal snaps to this date automatically.
2. **Custom cycle** — per-goal start date, toggled during the activation wizard.

## Key Result scoring
KR fields: title, unit (free text: "posts", "km", "hours"), unit_type (number | minutes | times | checkbox), target (float), current (float, auto-calculated).

Task fields: key_result_id (optional, one KR only), kr_value (float, default 1 — contribution to KR.current when task is completed).

When task marked done → KR.current += task.kr_value → progress = current/target → shown as % and progress bar.

One task links to one KR maximum. This is intentional — forces clarity of purpose.

## Backend model changes needed
Add to KeyResult: unit (str), unit_type (enum: number/minutes/times/checkbox), target (float), current (float default 0).
Add to Task: kr_value (float default 1).
Add Settings table: key (str), value (str).

Task completion endpoint must: mark task done → find KR via key_result_id → add kr_value to KR.current → recalculate sprint score.

## Settings
- global_cycle_start: date string — the shared start date for all life areas
