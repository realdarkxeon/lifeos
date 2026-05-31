'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { LifeArea, BigGoal, Cycle, CreateKeyResult } from '@/types'

interface Props { areaId: string }

const PRESET_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#DB2777', '#0891B2', '#4F7942',
]

function EditAreaModal({ area, onClose, onSaved }: {
  area: LifeArea; onClose: () => void; onSaved: (updated: LifeArea) => void
}) {
  const [name, setName] = useState(area.name)
  const [icon, setIcon] = useState(area.icon ?? '')
  const [color, setColor] = useState(area.color ?? PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const updated = await api.lifeAreas.update(area.id, { name: name.trim(), icon: icon.trim() || undefined, color })
      onSaved(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-white font-semibold mb-5">Edit Life Area</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Icon (emoji)</label>
            <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="e.g. 🌿 💼 📖" className="w-24" />
          </div>
          <div>
            <label className="text-xs text-[#888] mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving || !name.trim()}
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

function EditGoalModal({ goal, color, onClose, onSaved }: {
  goal: BigGoal; color: string; onClose: () => void; onSaved: (updated: BigGoal) => void
}) {
  const [title, setTitle] = useState(goal.title)
  const [desc, setDesc] = useState(goal.description ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const updated = await api.goals.update(goal.id, { title: title.trim(), description: desc.trim() || undefined })
      onSaved(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-md p-6">
        <h2 className="text-white font-semibold mb-5">Edit Goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Description (optional)</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this goal about?" />
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

function ActivateModal({ goal, area, currentActiveGoal, onClose, onActivated }: {
  goal: BigGoal; area: LifeArea; currentActiveGoal: BigGoal | null
  onClose: () => void; onActivated: (cycle: Cycle) => void
}) {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [krs, setKrs] = useState([
    { title: '', target: '', unit: '', unit_type: 'number' },
    { title: '', target: '', unit: '', unit_type: 'number' },
  ])
  const [saving, setSaving] = useState(false)

  function updateKr(i: number, field: string, val: string) {
    setKrs(prev => prev.map((kr, idx) => idx === i ? { ...kr, [field]: val } : kr))
  }
  function addKr() { if (krs.length < 5) setKrs(prev => [...prev, { title: '', target: '', unit: '', unit_type: 'number' }]) }
  function removeKr(i: number) { if (krs.length > 1) setKrs(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validKrs: CreateKeyResult[] = krs.filter(kr => kr.title.trim()).map(kr => ({
      title: kr.title.trim(),
      target: kr.target ? Number(kr.target) : undefined,
      unit: kr.unit.trim() || undefined,
      unit_type: kr.unit_type,
    }))
    if (validKrs.length === 0) return
    setSaving(true)
    try {
      const cycle = await api.cycles.activate({ big_goal_id: goal.id, start_date: new Date(startDate).toISOString(), key_results: validKrs })
      onActivated(cycle)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-[#1a1a1a]">
          <h2 className="text-white font-semibold">Start 12-Week Cycle</h2>
          <p className="text-[#888] text-xs mt-1">{goal.title}</p>
          {currentActiveGoal && (
            <p className="text-[#f59e0b] text-xs mt-2">
              This will end the active cycle for &ldquo;{currentActiveGoal.title}&rdquo;.
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-[#888]">Key Results</label>
              {krs.length < 5 && (
                <button type="button" onClick={addKr} className="text-xs text-[#888] hover:text-white transition-colors">+ Add KR</button>
              )}
            </div>
            <div className="space-y-3">
              {krs.map((kr, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={kr.title} onChange={e => updateKr(i, 'title', e.target.value)} placeholder={`KR ${i + 1} — what will you achieve?`} className="flex-1" />
                    {krs.length > 1 && (
                      <button type="button" onClick={() => removeKr(i)} className="text-[#555] hover:text-[#888] px-1 transition-colors shrink-0">×</button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="number" value={kr.target} onChange={e => updateKr(i, 'target', e.target.value)} placeholder="Target" className="w-24" min="0" step="any" />
                    <input type="text" value={kr.unit} onChange={e => updateKr(i, 'unit', e.target.value)} placeholder="Unit (e.g. posts, km)" className="flex-1" />
                    <select value={kr.unit_type} onChange={e => updateKr(i, 'unit_type', e.target.value)} className="w-36">
                      <option value="number">Number</option>
                      <option value="percentage">Percentage</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors text-white disabled:opacity-40"
              style={{ backgroundColor: area.color ?? '#2563EB' }}>
              {saving ? 'Activating…' : 'Start Cycle'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[#888] text-sm hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GoalPool({ areaId }: Props) {
  const router = useRouter()
  const [area, setArea] = useState<LifeArea | null>(null)
  const [goals, setGoals] = useState<BigGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)
  const [activatingGoal, setActivatingGoal] = useState<BigGoal | null>(null)
  const [editingGoal, setEditingGoal] = useState<BigGoal | null>(null)
  const [editingArea, setEditingArea] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadData() {
    const [areas, gs] = await Promise.all([api.lifeAreas.list(), api.lifeAreas.goals(areaId)])
    setArea(areas.find(a => a.id === areaId) ?? null)
    setGoals(gs)
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [areaId])

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!goalTitle.trim()) return
    setSavingGoal(true)
    try {
      await api.goals.create({ life_area_id: areaId, title: goalTitle.trim(), description: goalDesc.trim() || undefined })
      setGoalTitle(''); setGoalDesc(''); setShowAddGoal(false)
      await loadData()
    } finally {
      setSavingGoal(false)
    }
  }

  async function handleDeleteGoal(goal: BigGoal) {
    const label = goal.has_active_cycle
      ? `Delete "${goal.title}"? This will also delete its active cycle and all tasks.`
      : `Delete "${goal.title}"?`
    if (!window.confirm(label)) return
    setDeletingId(goal.id)
    try {
      await api.goals.delete(goal.id)
      setGoals(prev => prev.filter(g => g.id !== goal.id))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteArea() {
    if (!area) return
    const hasActive = goals.some(g => g.has_active_cycle)
    const msg = hasActive
      ? `Delete "${area.name}"? This will delete all its goals, active cycles, and tasks.`
      : `Delete "${area.name}"? This will delete all its goals.`
    if (!window.confirm(msg)) return
    await api.lifeAreas.delete(area.id)
    router.push('/life-areas')
  }

  async function handleActivated(cycle: Cycle) {
    setActivatingGoal(null)
    await loadData()
    router.refresh()
    router.push(`/goals/${cycle.id}`)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><span className="text-[#888] text-sm">Loading…</span></div>
  }

  const color = area?.color ?? '#888'
  const currentActiveGoal = goals.find(g => g.has_active_cycle) ?? null

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/life-areas" className="text-xs text-[#888] hover:text-white transition-colors mb-4 block">← Life Areas</Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {area?.icon && <span className="text-2xl">{area.icon}</span>}
            <h1 className="text-2xl font-semibold text-white">{area?.name ?? 'Area'}</h1>
            <button onClick={() => setEditingArea(true)} className="text-[#555] hover:text-white text-sm transition-colors" title="Edit area">✎</button>
            <button onClick={handleDeleteArea} className="text-[#555] hover:text-red-400 text-sm transition-colors" title="Delete area">×</button>
          </div>
          <button onClick={() => setShowAddGoal(v => !v)}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-[#eee] transition-colors">
            {showAddGoal ? 'Cancel' : '+ Add Goal'}
          </button>
        </div>
      </div>

      {showAddGoal && (
        <form onSubmit={handleAddGoal} className="mb-6 bg-[#111] border border-[#1a1a1a] rounded-xl p-5 space-y-3">
          <h2 className="text-white text-sm font-medium">New Goal</h2>
          <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="What do you want to achieve?" autoFocus />
          <input type="text" value={goalDesc} onChange={e => setGoalDesc(e.target.value)} placeholder="Description (optional)" />
          <button type="submit" disabled={savingGoal || !goalTitle.trim()}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-[#eee] transition-colors disabled:opacity-40">
            {savingGoal ? 'Saving…' : 'Add Goal'}
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#555] text-sm">No goals yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-[#888] uppercase tracking-widest mb-3">Goal Pool</h2>
          {goals.map(goal => (
            <div key={goal.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {goal.has_active_cycle && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${color}20`, color }}>Active</span>
                  )}
                  <h3 className="text-white text-sm font-medium">{goal.title}</h3>
                </div>
                {goal.description && <p className="text-[#888] text-xs">{goal.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setEditingGoal(goal)}
                  className="text-[#555] hover:text-white text-xs px-1 transition-colors">✎</button>
                <button onClick={() => handleDeleteGoal(goal)} disabled={deletingId === goal.id}
                  className="text-[#555] hover:text-red-400 text-xs px-1 transition-colors disabled:opacity-40">×</button>
                {goal.has_active_cycle && goal.active_cycle_id ? (
                  <Link href={`/goals/${goal.active_cycle_id}`}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: `${color}15`, color }}>
                    View →
                  </Link>
                ) : (
                  <button onClick={() => setActivatingGoal(goal)}
                    className="text-xs px-3 py-1.5 rounded-lg text-[#888] hover:text-white border border-[#1a1a1a] hover:border-[#333] transition-colors">
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activatingGoal && area && (
        <ActivateModal
          goal={activatingGoal}
          area={area}
          currentActiveGoal={currentActiveGoal?.id !== activatingGoal.id ? currentActiveGoal : null}
          onClose={() => setActivatingGoal(null)}
          onActivated={handleActivated}
        />
      )}
      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          color={color}
          onClose={() => setEditingGoal(null)}
          onSaved={updated => { setGoals(prev => prev.map(g => g.id === updated.id ? updated : g)); setEditingGoal(null) }}
        />
      )}
      {editingArea && area && (
        <EditAreaModal
          area={area}
          onClose={() => setEditingArea(false)}
          onSaved={updated => { setArea(updated); setEditingArea(false) }}
        />
      )}
    </div>
  )
}
