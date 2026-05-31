import type {
  LifeArea, BigGoal, KeyResult, Cycle, Task, WeeklySprint, Dashboard, Settings,
  CreateLifeArea, CreateBigGoal, CreateCycle, CreateTask, UpdateTask,
  UpdateKeyResult, SprintPull
} from '@/types'

function uid() { return Math.random().toString(36).slice(2) }
function now() { return new Date().toISOString() }

function calcWeek(startDate: string): number {
  const delta = Date.now() - new Date(startDate).getTime()
  const days = delta / (1000 * 60 * 60 * 24)
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), 12)
}

// ── Seed Data ───────────────────────────────────────────────────────────────

let lifeAreas: LifeArea[] = [
  { id: 'la-1', name: 'Deen', icon: '🌙', color: '#4F7942', order: 0, created_at: '2026-03-03T00:00:00Z' },
  { id: 'la-2', name: 'Building', icon: '⚡', color: '#2563EB', order: 1, created_at: '2026-03-03T00:00:00Z' },
  { id: 'la-3', name: 'Learning', icon: '📖', color: '#7C3AED', order: 2, created_at: '2026-03-03T00:00:00Z' },
  { id: 'la-4', name: 'Family', icon: '🏡', color: '#D97706', order: 3, created_at: '2026-03-03T00:00:00Z' },
  { id: 'la-5', name: 'Health', icon: '🌿', color: '#059669', order: 4, created_at: '2026-03-03T00:00:00Z' },
]

let goals: BigGoal[] = [
  { id: 'g-1', life_area_id: 'la-2', title: 'Ship LifeOS v1', description: 'Build and launch the personal OKR app', created_at: '2026-03-03T00:00:00Z', has_active_cycle: true, active_cycle_id: 'c-1' },
  { id: 'g-2', life_area_id: 'la-2', title: 'Learn FastAPI deeply', description: null, created_at: '2026-03-03T00:00:00Z', has_active_cycle: false, active_cycle_id: null },
  { id: 'g-3', life_area_id: 'la-3', title: 'Read 6 technical books', description: null, created_at: '2026-03-03T00:00:00Z', has_active_cycle: true, active_cycle_id: 'c-2' },
  { id: 'g-4', life_area_id: 'la-1', title: 'Memorize Surah Al-Baqarah', description: null, created_at: '2026-03-03T00:00:00Z', has_active_cycle: false, active_cycle_id: null },
  { id: 'g-5', life_area_id: 'la-5', title: 'Run a half marathon', description: null, created_at: '2026-03-03T00:00:00Z', has_active_cycle: false, active_cycle_id: null },
]

let keyResults: KeyResult[] = [
  { id: 'kr-1', cycle_id: 'c-1', title: 'Ship working MVP', unit: 'app', unit_type: 'number', target: 1, current: 0, order: 0, created_at: '2026-03-03T00:00:00Z' },
  { id: 'kr-2', cycle_id: 'c-1', title: 'Write build logs', unit: 'posts', unit_type: 'number', target: 8, current: 3, order: 1, created_at: '2026-03-03T00:00:00Z' },
  { id: 'kr-3', cycle_id: 'c-2', title: 'Books read', unit: 'books', unit_type: 'number', target: 6, current: 2, order: 0, created_at: '2026-04-07T00:00:00Z' },
]

// c-1 starts 2026-03-03, today 2026-05-30 = week 12
// c-2 starts 2026-04-07, today 2026-05-30 = week 8
let cycles: Cycle[] = [
  { id: 'c-1', big_goal_id: 'g-1', start_date: '2026-03-03T00:00:00Z', end_date: '2026-05-26T00:00:00Z', is_active: true, execution_score: null, key_results: [], created_at: '2026-03-03T00:00:00Z' },
  { id: 'c-2', big_goal_id: 'g-3', start_date: '2026-04-07T00:00:00Z', end_date: '2026-07-01T00:00:00Z', is_active: true, execution_score: null, key_results: [], created_at: '2026-04-07T00:00:00Z' },
]

let tasks: Task[] = [
  { id: 't-1', cycle_id: 'c-1', key_result_id: 'kr-1', title: 'Set up Next.js project', notes: null, status: 'done', is_completed: true, sprint_week: 12, kr_value: null, created_at: '2026-05-20T00:00:00Z', completed_at: '2026-05-21T00:00:00Z' },
  { id: 't-2', cycle_id: 'c-1', key_result_id: 'kr-1', title: 'Build Life Areas page', notes: null, status: 'sprint', is_completed: false, sprint_week: 12, kr_value: null, created_at: '2026-05-20T00:00:00Z', completed_at: null },
  { id: 't-3', cycle_id: 'c-1', key_result_id: 'kr-2', title: 'Write build log #4', notes: null, status: 'sprint', is_completed: false, sprint_week: 12, kr_value: 1, created_at: '2026-05-22T00:00:00Z', completed_at: null },
  { id: 't-4', cycle_id: 'c-1', key_result_id: 'kr-1', title: 'Build Sprint page', notes: null, status: 'backlog', is_completed: false, sprint_week: null, kr_value: null, created_at: '2026-05-22T00:00:00Z', completed_at: null },
  { id: 't-5', cycle_id: 'c-1', key_result_id: 'kr-2', title: 'Write build log #5', notes: null, status: 'backlog', is_completed: false, sprint_week: null, kr_value: 1, created_at: '2026-05-22T00:00:00Z', completed_at: null },
  { id: 't-6', cycle_id: 'c-1', key_result_id: null, title: 'Set up domain and hosting', notes: null, status: 'backlog', is_completed: false, sprint_week: null, kr_value: null, created_at: '2026-05-23T00:00:00Z', completed_at: null },
  { id: 't-7', cycle_id: 'c-1', key_result_id: 'kr-2', title: 'Write build log #6', notes: null, status: 'backlog', is_completed: false, sprint_week: null, kr_value: 1, created_at: '2026-05-23T00:00:00Z', completed_at: null },
  { id: 't-8', cycle_id: 'c-2', key_result_id: 'kr-3', title: 'Read Architecture Patterns with Python', notes: null, status: 'sprint', is_completed: false, sprint_week: 8, kr_value: 1, created_at: '2026-05-20T00:00:00Z', completed_at: null },
  { id: 't-9', cycle_id: 'c-2', key_result_id: 'kr-3', title: 'Read Designing Data-Intensive Apps', notes: null, status: 'backlog', is_completed: false, sprint_week: null, kr_value: 1, created_at: '2026-05-20T00:00:00Z', completed_at: null },
]

let sprints: WeeklySprint[] = [
  { id: 'sp-1', cycle_id: 'c-1', week_number: 12, planned_count: 3, completed_count: 1, execution_score: 33.3, reflection: null, tasks: [], created_at: '2026-05-26T00:00:00Z' },
]

let settingsState: Settings = {}

// ── Helpers ─────────────────────────────────────────────────────────────────

function cycleWithKRs(cycle: Cycle): Cycle {
  return { ...cycle, key_results: keyResults.filter(kr => kr.cycle_id === cycle.id) }
}

function goalResolved(goal: BigGoal): BigGoal {
  const ac = cycles.find(c => c.big_goal_id === goal.id && c.is_active)
  return { ...goal, has_active_cycle: !!ac, active_cycle_id: ac?.id ?? null }
}

function syncSprint(cycleId: string, week: number) {
  const sprint = sprints.find(s => s.cycle_id === cycleId && s.week_number === week)
  if (!sprint) return
  const wt = tasks.filter(t => t.cycle_id === cycleId && t.sprint_week === week)
  sprint.planned_count = wt.length
  sprint.completed_count = wt.filter(t => t.is_completed).length
  sprint.execution_score = sprint.planned_count > 0
    ? Math.round(sprint.completed_count / sprint.planned_count * 1000) / 10
    : null
}

// ── Mock API ─────────────────────────────────────────────────────────────────

export const mockApi = {
  lifeAreas: {
    list: async (): Promise<LifeArea[]> => lifeAreas.map(a => ({ ...a })),

    create: async (data: CreateLifeArea): Promise<LifeArea> => {
      const area: LifeArea = { id: uid(), order: lifeAreas.length, created_at: now(), icon: null, color: null, ...data }
      lifeAreas.push(area)
      return { ...area }
    },

    update: async (id: string, data: Partial<CreateLifeArea>): Promise<LifeArea> => {
      const area = lifeAreas.find(a => a.id === id)!
      Object.assign(area, data)
      return { ...area }
    },

    delete: async (id: string) => {
      lifeAreas = lifeAreas.filter(a => a.id !== id)
      return { ok: true }
    },

    goals: async (id: string): Promise<BigGoal[]> =>
      goals.filter(g => g.life_area_id === id).map(goalResolved),
  },

  goals: {
    create: async (data: CreateBigGoal): Promise<BigGoal> => {
      const goal: BigGoal = { id: uid(), created_at: now(), description: null, has_active_cycle: false, active_cycle_id: null, ...data }
      goals.push(goal)
      return { ...goal }
    },

    update: async (id: string, data: Partial<CreateBigGoal>): Promise<BigGoal> => {
      const goal = goals.find(g => g.id === id)!
      Object.assign(goal, data)
      return goalResolved(goal)
    },

    delete: async (id: string) => {
      goals = goals.filter(g => g.id !== id)
      return { ok: true }
    },
  },

  cycles: {
    activate: async (data: CreateCycle): Promise<Cycle> => {
      const activatingGoal = goals.find(g => g.id === data.big_goal_id)
      const areaGoalIds = new Set(goals.filter(g => g.life_area_id === activatingGoal?.life_area_id).map(g => g.id))
      cycles.forEach(c => { if (areaGoalIds.has(c.big_goal_id) && c.is_active) c.is_active = false })
      goals.forEach(g => { if (areaGoalIds.has(g.id)) { g.has_active_cycle = false; g.active_cycle_id = null } })
      const start = new Date(data.start_date)
      const end = new Date(start)
      end.setDate(end.getDate() + 84)
      const cycleId = uid()
      const krs: KeyResult[] = data.key_results.map((kr, i) => ({
        id: uid(), cycle_id: cycleId, title: kr.title, unit: kr.unit ?? null,
        unit_type: kr.unit_type ?? 'number', target: kr.target ?? null, current: 0,
        order: kr.order ?? i, created_at: now(),
      }))
      const cycle: Cycle = {
        id: cycleId, big_goal_id: data.big_goal_id, start_date: start.toISOString(),
        end_date: end.toISOString(), is_active: true, execution_score: null, key_results: krs, created_at: now(),
      }
      keyResults.push(...krs)
      cycles.push(cycle)
      const goal = goals.find(g => g.id === data.big_goal_id)
      if (goal) { goal.has_active_cycle = true; goal.active_cycle_id = cycleId }
      return { ...cycle }
    },

    get: async (id: string): Promise<Cycle> => {
      const cycle = cycles.find(c => c.id === id)!
      return cycleWithKRs(cycle)
    },

    tasks: async (id: string, status?: string): Promise<Task[]> => {
      let result = tasks.filter(t => t.cycle_id === id)
      if (status) result = result.filter(t => t.status === status)
      return result.map(t => ({ ...t }))
    },
  },

  keyResults: {
    update: async (id: string, data: UpdateKeyResult): Promise<KeyResult> => {
      const kr = keyResults.find(k => k.id === id)!
      Object.assign(kr, data)
      return { ...kr }
    },
  },

  tasks: {
    create: async (data: CreateTask): Promise<Task> => {
      const task: Task = {
        id: uid(), notes: null, status: 'backlog', is_completed: false, sprint_week: null,
        kr_value: null, created_at: now(), completed_at: null, key_result_id: null, ...data,
      }
      tasks.push(task)
      return { ...task }
    },

    update: async (id: string, data: UpdateTask): Promise<Task> => {
      const task = tasks.find(t => t.id === id)!
      const wasCompleted = task.is_completed
      const oldSprintWeek = task.sprint_week
      const oldCycleId = task.cycle_id

      if (data.is_completed === false && wasCompleted) {
        task.is_completed = false
        task.completed_at = null
        if (!data.status) task.status = 'sprint'
        if (task.kr_value && task.key_result_id) {
          const kr = keyResults.find(k => k.id === task.key_result_id)
          if (kr) kr.current = Math.max(0, (kr.current ?? 0) - task.kr_value)
        }
      }

      if (data.status === 'backlog' && task.status !== 'backlog') {
        if (wasCompleted) {
          task.is_completed = false
          task.completed_at = null
          if (task.kr_value && task.key_result_id) {
            const kr = keyResults.find(k => k.id === task.key_result_id)
            if (kr) kr.current = Math.max(0, (kr.current ?? 0) - task.kr_value)
          }
        }
        task.sprint_week = null
      }

      if (data.is_completed === true && !wasCompleted) {
        task.completed_at = now()
        if (task.kr_value && task.key_result_id) {
          const kr = keyResults.find(k => k.id === task.key_result_id)
          if (kr) kr.current = (kr.current ?? 0) + task.kr_value
        }
      }

      Object.assign(task, data)
      if (data.status === 'backlog') task.sprint_week = null

      if (oldSprintWeek) syncSprint(oldCycleId, oldSprintWeek)
      return { ...task }
    },

    delete: async (id: string) => {
      tasks = tasks.filter(t => t.id !== id)
      return { ok: true }
    },
  },

  sprint: {
    pull: async (cycleId: string, data: SprintPull): Promise<WeeklySprint> => {
      const cycle = cycles.find(c => c.id === cycleId)!
      const week = calcWeek(cycle.start_date)
      let sprint = sprints.find(s => s.cycle_id === cycleId && s.week_number === week)
      if (!sprint) {
        sprint = { id: uid(), cycle_id: cycleId, week_number: week, planned_count: 0, completed_count: 0, execution_score: null, reflection: null, tasks: [], created_at: now() }
        sprints.push(sprint)
      }
      data.task_ids.forEach(tid => {
        const task = tasks.find(t => t.id === tid)
        if (task) { task.status = 'sprint'; task.sprint_week = week }
      })
      syncSprint(cycleId, week)
      const weekTasks = tasks.filter(t => t.cycle_id === cycleId && t.sprint_week === week)
      return { ...sprint, tasks: weekTasks.map(t => ({ ...t })) }
    },

    complete: async (cycleId: string, taskId: string): Promise<Task> => {
      const task = tasks.find(t => t.id === taskId && t.cycle_id === cycleId)!
      task.is_completed = true
      task.status = 'done'
      task.completed_at = now()
      if (task.kr_value && task.key_result_id) {
        const kr = keyResults.find(k => k.id === task.key_result_id)
        if (kr) kr.current = (kr.current ?? 0) + task.kr_value
      }
      const cycle = cycles.find(c => c.id === cycleId)!
      syncSprint(cycleId, calcWeek(cycle.start_date))
      return { ...task }
    },

    reflect: async (cycleId: string, reflection: string): Promise<WeeklySprint> => {
      const cycle = cycles.find(c => c.id === cycleId)!
      const week = calcWeek(cycle.start_date)
      let sprint = sprints.find(s => s.cycle_id === cycleId && s.week_number === week)
      if (!sprint) {
        sprint = { id: uid(), cycle_id: cycleId, week_number: week, planned_count: 0, completed_count: 0, execution_score: null, reflection: null, tasks: [], created_at: now() }
        sprints.push(sprint)
      }
      sprint.reflection = reflection
      return { ...sprint }
    },
  },

  dashboard: {
    get: async (): Promise<Dashboard> => {
      const activeCycles = cycles.filter(c => c.is_active)
      const active_goals = activeCycles.map(cycle => {
        const goal = goals.find(g => g.id === cycle.big_goal_id)!
        const area = lifeAreas.find(a => a.id === goal.life_area_id)!
        const week = calcWeek(cycle.start_date)
        const cycleTasks = tasks.filter(t => t.cycle_id === cycle.id)
        return {
          life_area: { ...area },
          big_goal: goalResolved(goal),
          cycle: cycleWithKRs(cycle),
          backlog_count: cycleTasks.filter(t => t.status === 'backlog').length,
          sprint_tasks: cycleTasks.filter(t => t.sprint_week === week).map(t => ({ ...t })),
          current_week: week,
        }
      })
      let current_week_sprint: WeeklySprint | null = null
      if (activeCycles.length > 0) {
        const cycle = activeCycles[0]
        const week = calcWeek(cycle.start_date)
        const sprint = sprints.find(s => s.cycle_id === cycle.id && s.week_number === week)
        if (sprint) {
          current_week_sprint = { ...sprint, tasks: tasks.filter(t => t.cycle_id === cycle.id && t.sprint_week === week).map(t => ({ ...t })) }
        }
      }
      return { active_goals, current_week_sprint }
    },
  },

  settings: {
    get: async (): Promise<Settings> => ({ ...settingsState }),
    update: async (data: Partial<Settings>): Promise<Settings> => {
      Object.assign(settingsState, data)
      return { ...settingsState }
    },
  },
}
