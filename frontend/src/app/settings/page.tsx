'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Settings } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.settings.get().then(setSettings).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.settings.update(settings)
      setSettings(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><span className="text-[#888] text-sm">Loading…</span></div>
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white mb-1">Settings</h1>
        <p className="text-[#888] text-sm">App preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
          <h2 className="text-white text-sm font-medium">General</h2>
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Display name</label>
            <input
              type="text"
              value={settings.display_name ?? ''}
              onChange={e => setSettings(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs text-[#888] mb-1.5 block">Week start</label>
            <select
              value={settings.week_start ?? 'monday'}
              onChange={e => setSettings(prev => ({ ...prev, week_start: e.target.value }))}
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="px-5 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-[#eee] transition-colors disabled:opacity-40">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && <span className="text-xs text-green-400">Saved</span>}
        </div>
      </form>

      <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
        <h2 className="text-xs font-medium text-[#888] uppercase tracking-widest mb-4">About</h2>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">Version</span>
            <span className="text-white">0.1.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">Method</span>
            <span className="text-white">12-Week Year</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">Mode</span>
            <span className="text-white">{process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? 'Mock' : 'Live'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
