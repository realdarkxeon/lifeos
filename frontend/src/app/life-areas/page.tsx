'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { LifeArea } from '@/types'

const PRESET_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#DB2777', '#0891B2', '#4F7942',
]

export default function LifeAreasPage() {
  const [areas, setAreas] = useState<LifeArea[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.lifeAreas.list().then(setAreas).finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const area = await api.lifeAreas.create({ name: name.trim(), icon: icon.trim() || undefined, color })
      setAreas(prev => [...prev, area])
      setName('')
      setIcon('')
      setColor(PRESET_COLORS[0])
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><span className="text-[#888] text-sm">Loading…</span></div>
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Life Areas</h1>
          <p className="text-[#888] text-sm">Each area holds a pool of goals</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-[#eee] transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Area'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 bg-[#111] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
          <h2 className="text-white text-sm font-medium">New Life Area</h2>
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Health, Career, Deen" autoFocus />
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
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving || !name.trim()}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-[#eee] transition-colors disabled:opacity-40">
            {saving ? 'Saving…' : 'Create Area'}
          </button>
        </form>
      )}

      {areas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#555] text-sm mb-2">No life areas yet.</p>
          <p className="text-[#444] text-xs">Add your first area above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {areas.map(area => (
            <Link key={area.id} href={`/life-areas/${area.id}`}
              className="flex items-center gap-4 bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#333] transition-colors group">
              <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg"
                style={{ backgroundColor: `${area.color}20`, border: `1px solid ${area.color ?? '#333'}30` }}>
                {area.icon ?? <span style={{ color: area.color ?? '#888' }}>{area.name[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: area.color ?? '#888' }} />
                  <h3 className="text-white text-sm font-medium">{area.name}</h3>
                </div>
              </div>
              <span className="text-[#555] text-xs group-hover:text-[#888] transition-colors shrink-0">View goals →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
