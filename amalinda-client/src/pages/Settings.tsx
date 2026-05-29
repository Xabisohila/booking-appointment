import { useEffect, useState } from 'react'
import axios from 'axios'
import { API } from '../config'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Settings() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/settings`).then(r => {
      setSettings(r.data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      Loading settings…
    </div>
  )

  const activeDays = settings.workingDays.split(',').map((d: string) => d.trim())

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">Practice configuration — read from server</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 flex gap-3 items-start mb-6">
        <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
        <p className="text-sm text-amber-800">
          These settings are read from <code className="bg-amber-100 text-xs px-1.5 py-0.5 rounded-lg font-mono">appsettings.json</code> on the server.
          To change them, update that file and restart the backend.
        </p>
      </div>

      <div className="space-y-4">
        {/* Practice */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <span className="text-base">🦷</span>
            </div>
            <h3 className="font-semibold text-slate-900">Practice</h3>
          </div>
          <div className="space-y-0">
            <Row label="Practice Name" value={settings.practiceName} />
            <Row label="Google Review Link" value={settings.googleReviewLink} isLink />
          </div>
        </div>

        {/* Working hours */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-base">🕐</span>
            </div>
            <h3 className="font-semibold text-slate-900">Working Hours</h3>
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Days</p>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map(d => (
                <span key={d} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeDays.includes(d)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {d.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
          <Row label="Start Time" value={settings.workingStart} />
          <Row label="End Time" value={settings.workingEnd} />
          <Row label="Slot Duration" value={`${settings.slotMinutes} minutes`} />
        </div>

        {/* Auth */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
              <span className="text-base">🔐</span>
            </div>
            <h3 className="font-semibold text-slate-900">Authentication</h3>
          </div>
          <p className="text-sm text-slate-500">
            Username and password are set under <code className="bg-slate-100 text-xs px-1.5 py-0.5 rounded-lg font-mono">Auth</code> in{' '}
            <code className="bg-slate-100 text-xs px-1.5 py-0.5 rounded-lg font-mono">appsettings.json</code>.
            Update and restart the backend to change credentials.
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline truncate max-w-xs font-medium">
          {value}
        </a>
      ) : (
        <span className="text-sm font-semibold text-slate-800">{value || '—'}</span>
      )}
    </div>
  )
}
