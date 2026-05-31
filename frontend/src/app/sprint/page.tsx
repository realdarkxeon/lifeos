'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Dashboard, Task, KeyResult } from '@/types'

function ScoreRing({ score, size = 90 }: { score: number; size?: number }) {
  const r = size * 0.35
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const center = size / 2
  const sw = size * 0.07
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" stroke="#1a1a1a" strokeWidth={sw} />
        <circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <span className="absolute font-bold text-white" style={{ fontSize: size * 0.2 }}>{score}%</span>
    </div>
  )
}

function EditTaskModal({ task, krs, color, onClose, onSaved }: {
  task: Task; krs: KeyResult[]; color: string; onClose: () => void; onSaved: (updated: Task) => void
}) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [krId, setKrId] = useState(task.key_result_id ?? '')
  const [krValue, setKrValue] = useState(task.kr_value !== null ? String(task.kr_value) : '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const updated = await api.tasks.update(task.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        key_result_id: krId || null,
        kr_value: krId && krValue ? Number(krValue) : null,
      })
      onSaved(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-white font-semibold mb-5">Edit Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Key Result (optional)</label>
            <select value={krId} onChange={e => { setKrId(e.target.value); setKrValue('') }}>
              <option value="">No key result</option>
              {krs.map(kr => <option key={kr.id} value={kr.id}>{kr.title}</option>)}
            </select>
          </div>
          {krId && (
            <div>
              <label className="text-xs text-[#888] mb-1.5 block">Progress value when completed</label>
              <input type="number" value={krValue} onChange={e => setKrValue(e.target.value)} min="0" step="any" />
            </div>
          )}
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional context…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || !title.trim()}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-40"
              style={{ backgroundColor: color }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[#888] text-sm hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SprintPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [reflections, setReflections] = useState<Record<string, string>>({})
  const [savingReflection, setSavingReflection] = useState<Record<string, boolean>>({})
  const [completing, setCompleting] = useState<string | null>(null)
  const [uncompleting, setUncompleting] = useState<string | null>(null)
  const [returning, setReturning] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const load = useCallback(async () => {
    const d = await api.dashboard.get()
    setData(d)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleComplete(task: Task) {
    if (completing) return
    setCompleting(task.id)
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        active_goals: prev.active_goals.map(s => ({
          ...s,
          sprint_tasks: s.sprint_tasks.map(t => t.id === task.id ? { ...t, is_completed: true, status: 'done' as const } : t),
        })),
      }
    })
    try {
      await api.sprint.complete(task.cycle_id, task.id)
      await load()
    } finally {
      setCompleting(null)
    }
  }

  async function handleUncomplete(task: Task) {
    if (uncompleting) return
    setUncompleting(task.id)
    try {
      await api.tasks.update(task.id, { is_completed: false })
      await load()
    } finally {
      setUncompleting(null)
    }
  }

  async function handleReturnToBacklog(task: Task) {
    if (returning) return
    setReturning(task.id)
    try {
      await api.tasks.update(task.id, { status: 'backlog' })
      await load()
    } finally {
      setReturning(null)
    }
  }

  async function handleReflect(cycleId: string) {
    const text = reflections[cycleId] ?? ''
    if (!text.trim()) return
    setSavingReflection(prev => ({ ...prev, [cycleId]: true }))
    try {
      await api.sprint.reflect(cycleId, text.trim())
    } finally {
      setSavingReflection(prev => ({ ...prev, [cycleId]: false }))
    }
  }

  function getKrsForTask(task: Task): KeyResult[] {
    if (!data) return []
    return data.active_goals.find(s => s.cycle.id === task.cycle_id)?.cycle.key_results ?? []
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><span className="text-[#888] text-sm">Loading…</span></div>
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen"><span className="text-[#888] text-sm">Failed to load.</span></div>
  }

  const activeGoals = data.active_goals.filter(s => s.sprint_tasks.length > 0)
  const allSprint = data.active_goals.flatMap(s => s.sprint_tasks)
  const completedCount = allSprint.filter(t => t.is_completed).length
  const score = allSprint.length > 0 ? Math.round(completedCount / allSprint.length * 100) : 0
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Weekly Sprint</h1>
          <p className="text-[#888] text-sm">Complete tasks, track execution, reflect</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ScoreRing score={score} />
          <span className="text-xs text-[#888]">score</span>
          <span className="text-xs text-[#555]">{completedCount}/{allSprint.length}</span>
        </div>
      </div>

      <div className="mb-8 bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#888] uppercase tracking-widest">Execution Score</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
            {score >= 80 ? 'Excellent' : score >= 50 ? 'On Track' : 'Needs Focus'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
        </div>
        <div className="flex justify-between text-xs text-[#555] mt-2">
          <span>{completedCount} completed</span>
          <span>{allSprint.length - completedCount} remaining</span>
        </div>
      </div>

      {activeGoals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#555] text-sm mb-2">No tasks in sprint this week.</p>
          <p className="text-[#444] text-xs">Go to an active goal and pull tasks from the backlog.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {data.active_goals.map(summary => {
            if (summary.sprint_tasks.length === 0) return null
            const { life_area, big_goal, cycle, sprint_tasks, current_week } = summary
            const color = life_area.color ?? '#888'
            const done = sprint_tasks.filter(t => t.is_completed).length

            return (
              <section key={cycle.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <h2 className="text-sm font-medium text-white">{life_area.name}</h2>
                    <span className="text-xs text-[#555]">— {big_goal.title}</span>
                    <span className="text-xs text-[#444]">Week {current_week}/12</span>
                  </div>
                  <span className="text-xs text-[#555]">{done}/{sprint_tasks.length}</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  {sprint_tasks.map(task => {
                    const busy = completing === task.id || uncompleting === task.id
                    return (
                      <div key={task.id}
                        className={`flex items-center gap-3 px-4 py-3 bg-[#111] border rounded-lg transition-colors ${
                          task.is_completed ? 'border-[#1a1a1a] opacity-60' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                        }`}>
                        <button
                          onClick={() => task.is_completed ? handleUncomplete(task) : handleComplete(task)}
                          disabled={busy}
                          title={task.is_completed ? 'Undo completion' : 'Mark complete'}
                          className="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors disabled:cursor-default"
                          style={task.is_completed ? { backgroundColor: color, borderColor: 'transparent' } : { borderColor: '#333' }}>
                          {task.is_completed && (
                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                              <path d="M1 4.5L4 7.5L10 1.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <span className={`text-sm ${task.is_completed ? 'line-through text-[#555]' : 'text-white'}`}>
                            {task.title}
                          </span>
                          {task.kr_value && !task.is_completed && (
                            <span className="text-xs text-[#555] ml-2">+{task.kr_value}</span>
                          )}
                        </div>
                        <button onClick={() => setEditingTask(task)}
                          className="text-[#555] hover:text-white text-xs px-1 transition-colors shrink-0">✎</button>
                        {!task.is_completed && (
                          <button onClick={() => handleReturnToBacklog(task)} disabled={returning === task.id}
                            title="Return to backlog"
                            className="text-[#555] hover:text-[#888] text-xs px-1 transition-colors shrink-0 disabled:opacity-40">↩</button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                  <label className="text-xs text-[#888] mb-2 block uppercase tracking-wider">Reflection</label>
                  <textarea
                    value={reflections[cycle.id] ?? ''}
                    onChange={e => setReflections(prev => ({ ...prev, [cycle.id]: e.target.value }))}
                    placeholder="What went well? What needs adjustment?"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                  <button
                    onClick={() => handleReflect(cycle.id)}
                    disabled={savingReflection[cycle.id] || !(reflections[cycle.id] ?? '').trim()}
                    className="mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white disabled:opacity-40"
                    style={{ backgroundColor: color }}>
                    {savingReflection[cycle.id] ? 'Saving…' : 'Save Reflection'}
                  </button>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          krs={getKrsForTask(editingTask)}
          color={data.active_goals.find(s => s.cycle.id === editingTask.cycle_id)?.life_area.color ?? '#2563EB'}
          onClose={() => setEditingTask(null)}
          onSaved={() => { setEditingTask(null); load() }}
        />
      )}
    </div>
  )
}
