'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Cycle, Task, KeyResult, LifeArea, BigGoal } from '@/types'

interface Props { cycleId: string }

function calcWeek(startDate: string): number {
  const delta = Date.now() - new Date(startDate).getTime()
  const days = delta / (1000 * 60 * 60 * 24)
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), 12)
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function UpdateKrModal({ kr, color, onClose, onSaved }: {
  kr: KeyResult; color: string; onClose: () => void; onSaved: (val: number) => void
}) {
  const [value, setValue] = useState(String(kr.current ?? 0))
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-sm p-6">
        <h2 className="text-white font-semibold mb-1">Update Progress</h2>
        <p className="text-[#888] text-xs mb-5">{kr.title}</p>
        <div className="mb-5">
          <input type="number" value={value} onChange={e => setValue(e.target.value)} min="0" step="any" autoFocus />
          <p className="text-xs text-[#555] mt-1.5">
            Target: {kr.target ?? '—'}{kr.unit ? ` ${kr.unit}` : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onSaved(Number(value))}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors text-white" style={{ backgroundColor: color }}>
            Save
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-[#888] text-sm hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function AddTaskModal({ cycle, krs, color, onClose, onAdded }: {
  cycle: Cycle; krs: KeyResult[]; color: string; onClose: () => void; onAdded: (task: Task) => void
}) {
  const [title, setTitle] = useState('')
  const [krId, setKrId] = useState('')
  const [krValue, setKrValue] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const task = await api.tasks.create({
        cycle_id: cycle.id,
        title: title.trim(),
        key_result_id: krId || undefined,
        kr_value: krId && krValue ? Number(krValue) : undefined,
        notes: notes.trim() || undefined,
      })
      onAdded(task)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-white font-semibold mb-5">Add Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
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
              <label className="text-xs text-[#888] mb-1.5 block">Progress value when completed (optional)</label>
              <input type="number" value={krValue} onChange={e => setKrValue(e.target.value)} placeholder="e.g. 1"
                min="0" step="any" />
              <p className="text-xs text-[#555] mt-1">Completing this task adds this value to KR progress</p>
            </div>
          )}
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional context…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || !title.trim()}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors text-white disabled:opacity-40"
              style={{ backgroundColor: color }}>
              {saving ? 'Adding…' : 'Add Task'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[#888] text-sm hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      </div>
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
              className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors text-white disabled:opacity-40"
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

export default function ActiveGoalDetail({ cycleId }: Props) {
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [area, setArea] = useState<LifeArea | null>(null)
  const [goal, setGoal] = useState<BigGoal | null>(null)
  const [krs, setKrs] = useState<KeyResult[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'backlog' | 'sprint'>('backlog')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pulling, setPulling] = useState(false)
  const [updatingKr, setUpdatingKr] = useState<KeyResult | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const [uncompleting, setUncompleting] = useState<string | null>(null)
  const [returning, setReturning] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [cycleData, tasksData, dashboard] = await Promise.all([
      api.cycles.get(cycleId),
      api.cycles.tasks(cycleId),
      api.dashboard.get(),
    ])
    setCycle(cycleData)
    setKrs(cycleData.key_results)
    setAllTasks(tasksData)
    const week = calcWeek(cycleData.start_date)
    setCurrentWeek(week)
    const summary = dashboard.active_goals.find(s => s.cycle.id === cycleId)
    if (summary) {
      setArea(summary.life_area)
      setGoal(summary.big_goal)
    }
  }, [cycleId])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  async function handlePullToSprint() {
    if (selectedIds.size === 0) return
    setPulling(true)
    try {
      await api.sprint.pull(cycleId, { task_ids: Array.from(selectedIds) })
      setSelectedIds(new Set())
      setTab('sprint')
      await load()
    } finally {
      setPulling(false)
    }
  }

  async function handleComplete(task: Task) {
    if (completing) return
    setCompleting(task.id)
    try {
      await api.sprint.complete(cycleId, task.id)
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

  async function handleDeleteTask(taskId: string) {
    await api.tasks.delete(taskId)
    setAllTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function handleUpdateKr(val: number) {
    if (!updatingKr) return
    const updated = await api.keyResults.update(updatingKr.id, { current: val })
    setKrs(prev => prev.map(kr => kr.id === updated.id ? updated : kr))
    setUpdatingKr(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><span className="text-[#888] text-sm">Loading…</span></div>
  }

  if (!cycle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#888] text-sm mb-2">Cycle not found.</p>
          <Link href="/life-areas" className="text-xs text-white underline underline-offset-2">Back to Life Areas</Link>
        </div>
      </div>
    )
  }

  const color = area?.color ?? '#2563EB'
  const weekPct = (currentWeek / 12) * 100
  const backlog = allTasks.filter(t => t.status === 'backlog')
  const sprintTasks = allTasks.filter(t => t.sprint_week === currentWeek)

  const startStr = new Date(cycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = new Date(cycle.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-8 max-w-3xl">
      <Link href={`/life-areas/${area?.id ?? ''}`} className="text-xs text-[#888] hover:text-white transition-colors mb-6 block">
        ← {area?.name ?? 'Life Areas'}
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-[#888] uppercase tracking-wider">{area?.name}</span>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-1">{goal?.title}</h1>
        <p className="text-[#555] text-xs mb-4">{startStr} — {endStr}</p>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-[#888]">Week {currentWeek} of 12</span>
          <span className="text-xs text-[#555]">{Math.round(weekPct)}% through</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${weekPct}%`, backgroundColor: color }} />
        </div>
      </div>

      {/* Key Results */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-[#888] uppercase tracking-widest mb-4">Key Results</h2>
        {krs.length === 0 ? (
          <p className="text-[#555] text-sm">No key results defined.</p>
        ) : (
          <div className="space-y-3">
            {krs.map(kr => {
              const cur = kr.current ?? 0
              const tgt = kr.target ?? 0
              const pct = tgt > 0 ? Math.min(Math.round((cur / tgt) * 100), 100) : 0
              return (
                <div key={kr.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-white text-sm">{kr.title}</p>
                      {kr.unit_type === 'boolean' && <p className="text-xs text-[#555] mt-0.5">Yes / No</p>}
                    </div>
                    <button onClick={() => setUpdatingKr(kr)} className="text-xs text-[#888] hover:text-white transition-colors shrink-0">Edit</button>
                  </div>
                  <ProgressBar value={cur} max={tgt || 1} color={color} />
                  <div className="flex justify-between text-xs text-[#555] mt-2">
                    <span>{cur}{kr.unit ? ` ${kr.unit}` : ''} / {tgt}{kr.unit ? ` ${kr.unit}` : ''}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Tasks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {(['backlog', 'sprint'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === t ? 'bg-white/10 text-white' : 'text-[#888] hover:text-white'
                }`}>
                {t === 'backlog' ? `Backlog (${backlog.length})` : `Sprint week ${currentWeek} (${sprintTasks.length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {tab === 'backlog' && selectedIds.size > 0 && (
              <button onClick={handlePullToSprint} disabled={pulling}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-white disabled:opacity-40"
                style={{ backgroundColor: color }}>
                {pulling ? 'Pulling…' : `Pull ${selectedIds.size} to Sprint`}
              </button>
            )}
            <button onClick={() => setShowAddTask(true)}
              className="text-xs px-3 py-1.5 rounded-lg text-[#888] border border-[#1a1a1a] hover:text-white hover:border-[#333] transition-colors">
              + Add Task
            </button>
          </div>
        </div>

        {tab === 'backlog' && (
          backlog.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#555] text-sm">Backlog is empty.</p>
              <p className="text-[#444] text-xs mt-1">Add tasks and pull them into your sprint.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-[#555] mb-3">Select tasks to pull into the current sprint week.</p>
              {backlog.map(task => {
                const selected = selectedIds.has(task.id)
                const linkedKr = krs.find(kr => kr.id === task.key_result_id)
                return (
                  <div key={task.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                    selected ? 'border-[#333] bg-white/5' : 'border-[#1a1a1a] bg-[#111] hover:border-[#2a2a2a]'
                  }`} onClick={() => toggleSelect(task.id)}>
                    <div className="w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-colors"
                      style={selected ? { backgroundColor: color, borderColor: color } : { borderColor: '#333' }}>
                      {selected && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {linkedKr && <p className="text-xs text-[#555] truncate">{linkedKr.title}</p>}
                        {task.kr_value && <p className="text-xs text-[#555]">+{task.kr_value}</p>}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setEditingTask(task) }}
                      className="text-[#555] hover:text-white text-xs px-1 transition-colors shrink-0">✎</button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteTask(task.id) }}
                      className="text-[#555] hover:text-red-400 text-xs px-1 transition-colors shrink-0">×</button>
                  </div>
                )
              })}
            </div>
          )
        )}

        {tab === 'sprint' && (
          sprintTasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#555] text-sm">No tasks in sprint this week.</p>
              <p className="text-[#444] text-xs mt-1">Switch to Backlog to pull tasks in.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sprintTasks.map(task => {
                const linkedKr = krs.find(kr => kr.id === task.key_result_id)
                const busy = completing === task.id || uncompleting === task.id
                return (
                  <div key={task.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                    task.is_completed ? 'border-[#1a1a1a] opacity-60' : 'border-[#1a1a1a] bg-[#111] hover:border-[#2a2a2a]'
                  }`}>
                    <button
                      onClick={() => task.is_completed ? handleUncomplete(task) : handleComplete(task)}
                      disabled={busy}
                      title={task.is_completed ? 'Undo completion' : 'Mark complete'}
                      className="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors disabled:cursor-default"
                      style={task.is_completed ? { backgroundColor: color, borderColor: 'transparent' } : { borderColor: '#333' }}>
                      {task.is_completed && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.is_completed ? 'line-through text-[#555]' : 'text-white'}`}>{task.title}</p>
                      {linkedKr && <p className="text-xs text-[#555] mt-0.5">{linkedKr.title}{task.kr_value ? ` · +${task.kr_value}` : ''}</p>}
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
          )
        )}
      </section>

      {updatingKr && (
        <UpdateKrModal kr={updatingKr} color={color} onClose={() => setUpdatingKr(null)} onSaved={handleUpdateKr} />
      )}
      {showAddTask && cycle && (
        <AddTaskModal cycle={cycle} krs={krs} color={color} onClose={() => setShowAddTask(false)}
          onAdded={task => { setAllTasks(prev => [...prev, task]); setShowAddTask(false) }} />
      )}
      {editingTask && (
        <EditTaskModal task={editingTask} krs={krs} color={color} onClose={() => setEditingTask(null)}
          onSaved={updated => { setAllTasks(prev => prev.map(t => t.id === updated.id ? updated : t)); setEditingTask(null) }} />
      )}
    </div>
  )
}
