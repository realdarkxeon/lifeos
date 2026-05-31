import type {
  LifeArea, BigGoal, Cycle, KeyResult, Task, WeeklySprint, Dashboard, Settings,
  CreateLifeArea, CreateBigGoal, CreateCycle, CreateTask, UpdateTask, UpdateKeyResult, SprintPull
} from '@/types'
import { mockApi } from './mock'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API ${res.status}: ${err}`)
  }
  return res.json()
}

const realApi = {
  lifeAreas: {
    list: () => req<LifeArea[]>('/life-areas/'),
    create: (data: CreateLifeArea) => req<LifeArea>('/life-areas/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateLifeArea>) => req<LifeArea>(`/life-areas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req(`/life-areas/${id}`, { method: 'DELETE' }),
    goals: (id: string) => req<BigGoal[]>(`/life-areas/${id}/goals`),
  },

  goals: {
    create: (data: CreateBigGoal) => req<BigGoal>('/goals/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateBigGoal>) => req<BigGoal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req(`/goals/${id}`, { method: 'DELETE' }),
  },

  cycles: {
    activate: (data: CreateCycle) => req<Cycle>('/cycles/', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => req<Cycle>(`/cycles/${id}`),
    tasks: (id: string, status?: string) => req<Task[]>(`/cycles/${id}/tasks${status ? `?status=${status}` : ''}`),
  },

  keyResults: {
    update: (id: string, data: UpdateKeyResult) => req<KeyResult>(`/key-results/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  tasks: {
    create: (data: CreateTask) => req<Task>('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTask) => req<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req(`/tasks/${id}`, { method: 'DELETE' }),
  },

  sprint: {
    pull: (cycleId: string, data: SprintPull) => req<WeeklySprint>(`/sprints/${cycleId}/pull`, { method: 'POST', body: JSON.stringify(data) }),
    complete: (cycleId: string, taskId: string) => req<Task>(`/sprints/${cycleId}/complete/${taskId}`, { method: 'POST' }),
    reflect: (cycleId: string, reflection: string) => req<WeeklySprint>(`/sprints/${cycleId}/reflect`, { method: 'POST', body: JSON.stringify({ reflection }) }),
  },

  dashboard: {
    get: () => req<Dashboard>('/dashboard/'),
  },

  settings: {
    get: () => req<Settings>('/settings/'),
    update: (data: Partial<Settings>) => req<Settings>('/settings/', { method: 'PATCH', body: JSON.stringify(data) }),
  },
}

export const api = USE_MOCK ? mockApi : realApi
