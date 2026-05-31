# Screens

## Navigation (sidebar)
Dashboard | Life Areas | Weekly Sprint | Settings

---

## 1. Dashboard
- Global cycle progress bar at top: "Week X of 12" + start/end dates
- Cards for each active goal, grouped by life area color accent
- Each card: goal title, KR progress bars (colored by life area), sprint tasks this week, backlog count
- Goals on custom cycles show their own "Week X of 12" separately
- Quick-complete sprint tasks directly from card

---

## 2. Life Areas (/areas)
- Grid of life area cards: name, icon, color, goal count, active indicator
- Click card → Goal Pool for that area
- Add new life area (name, icon emoji, color picker)
- Edit/delete inline

---

## 3. Goal Pool (/areas/[areaId])
- Area header with color, icon, name
- Active goal (if any) pinned at top — highlighted, shows cycle week + end date
- Pool of inactive goals below
- Each goal: title, description, Activate button (disabled if one already active)
- Add new goal button
- Click Activate → /activate/[goalId]

---

## 4. Activation Wizard (/activate/[goalId])
Full-screen, three steps with a stepper indicator at top.

**Step 1 — Dates**
- Show goal title
- Default: "Using global cycle start: [date]"
- Toggle "Use custom start date" → date picker
- Show auto-calculated end date (start + 84 days)
- CTA: Continue

**Step 2 — Key Results**
- Heading: "What does success look like in 12 weeks?"
- 2-3 KR rows, each: title input, unit input (text), unit_type dropdown (Number/Minutes/Times/Checkbox), target input
- Add/remove KR rows (min 1, max 5)
- CTA: Continue

**Step 3 — Review & Launch**
- Summary: goal title, life area, date range, week count, KR list
- Reminder text: "Add tasks to your backlog and pull them into your sprint every Monday."
- CTA: "Start Cycle" (feels like a commitment, primary button)
- On success: redirect to /goals/[cycleId]

---

## 5. Active Goal Detail (/goals/[cycleId])
- Header: goal title, life area chip, "Week X of 12", end date
- KR section: each KR as a card — title, progress bar (current/target unit), percentage, color by life area
- Backlog section: tasks grouped under their KR (tasks with no KR at bottom under "General")
- Each task: title, linked KR chip, kr_value, status badge, complete/delete actions
- Add task form: title, notes, KR dropdown (optional), kr_value (shown if KR selected)
- "Pull into sprint" checkbox per task or bulk select

---

## 6. Weekly Sprint (/sprint)
- Header: "Week X of 12" + Monday date of current week
- Execution score: X% (completed/planned)
- Reflection box: "What matters most this week?" — saves on blur
- Sprint tasks: checkbox list — checking completes task + updates KR live
- Completed tasks: greyed, strikethrough, shown below
- "Pull from backlog" button → slide-over panel showing all backlog tasks across active goals, select to add to sprint

---

## 7. Settings (/settings)
- Global cycle start date: date picker + save
- Life areas management: reorder (drag), edit, delete
