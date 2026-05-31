// ── Life Area ──────────────────────────────────────────────────────────────

export interface LifeArea {
  id: string
  name: string
  icon: string | null
  color: string | null
  order: number
  created_at: string
}

// ── Big Goal ───────────────────────────────────────────────────────────────

export interface BigGoal {
  id: string
  life_area_id: string
  title: string
  description: string | null
  created_at: string
  has_active_cycle: boolean
  active_cycle_id: string | null
}

// ── Key Result ─────────────────────────────────────────────────────────────

export interface KeyResult {
  id: string
  cycle_id: string
  title: string
  unit: string | null
  unit_type: string
  target: number | null
  current: number | null
  order: number
  created_at: string
}

// ── Cycle ──────────────────────────────────────────────────────────────────

export interface Cycle {
  id: string
  big_goal_id: string
  start_date: string
  end_date: string
  is_active: boolean
  execution_score: number | null
  key_results: KeyResult[]
  created_at: string
}

// ── Task ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'sprint' | 'done'

export interface Task {
  id: string
  cycle_id: string
  key_result_id: string | null
  title: string
  notes: string | null
  status: TaskStatus
  is_completed: boolean
  sprint_week: number | null
  kr_value: number | null
  created_at: string
  completed_at: string | null
}

// ── Weekly Sprint ──────────────────────────────────────────────────────────

export interface WeeklySprint {
  id: string
  cycle_id: string
  week_number: number
  planned_count: number
  completed_count: number
  execution_score: number | null
  reflection: string | null
  tasks: Task[]
  created_at: string
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface ActiveGoalSummary {
  life_area: LifeArea
  big_goal: BigGoal
  cycle: Cycle
  backlog_count: number
  sprint_tasks: Task[]
  current_week: number
}

export interface Dashboard {
  active_goals: ActiveGoalSummary[]
  current_week_sprint: WeeklySprint | null
}

// ── Settings ───────────────────────────────────────────────────────────────

export type Settings = Record<string, string>

// ── API Payloads ───────────────────────────────────────────────────────────

export interface CreateLifeArea {
  name: string
  icon?: string
  color?: string
  order?: number
}

export interface CreateBigGoal {
  life_area_id: string
  title: string
  description?: string
}

export interface CreateKeyResult {
  title: string
  unit?: string
  unit_type?: string
  target?: number
  order?: number
}

export interface CreateCycle {
  big_goal_id: string
  start_date: string
  key_results: CreateKeyResult[]
}

export interface CreateTask {
  cycle_id: string
  key_result_id?: string
  title: string
  notes?: string
  kr_value?: number
}

export interface UpdateTask {
  title?: string
  notes?: string | null
  key_result_id?: string | null
  status?: TaskStatus
  is_completed?: boolean
  kr_value?: number | null
}

export interface UpdateKeyResult {
  title?: string
  unit?: string
  unit_type?: string
  target?: number
  current?: number
}

export interface SprintPull {
  task_ids: string[]
}
