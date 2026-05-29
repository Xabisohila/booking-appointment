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

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading…</div>

  const activeDays = settings.workingDays.split(',').map((d: string) => d.trim())

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Settings</h2>
      <p className="text-sm text-slate-500 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
        These settings are read from <code className="text-xs bg-yellow-100 px-1 py-0.5 rounded">appsettings.json</code> on the server.
        To change them, update that file and restart the backend.
      </p>

      <div className="space-y-6">
        {/* Practice */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Practice</h3>
          <div className="space-y-3">
            <Row label="Practice Name" value={settings.practiceName} />
            <Row label="Google Review Link" value={settings.googleReviewLink} isLink />
          </div>
        </div>

        {/* Working hours */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Working Hours</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Working Days</p>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(d => (
                  <span key={d} className={`px-2.5 py-1 rounded-full text-xs font-medium ${activeDays.includes(d) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                    {d.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
            <Row label="Start Time" value={settings.workingStart} />
            <Row label="End Time" value={settings.workingEnd} />
            <Row label="Slot Duration" value={`${settings.slotMinutes} minutes`} />
          </div>
        </div>

        {/* Auth */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Authentication</h3>
          <p className="text-xs text-slate-400 mb-4">Username and password are set in <code className="bg-slate-100 px-1 py-0.5 rounded">appsettings.json</code> under <code className="bg-slate-100 px-1 py-0.5 rounded">Auth</code>.</p>
          <p className="text-sm text-slate-600">To change your password, update <code className="bg-slate-100 text-xs px-1 py-0.5 rounded">Auth:Password</code> and restart the backend.</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate max-w-xs">{value}</a>
      ) : (
        <span className="text-sm font-medium text-slate-800">{value || '—'}</span>
      )}
    </div>
  )
}
