import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000/api'

const statusColors: Record<string, string> = {
  New:        'bg-slate-100 text-slate-600',
  Qualifying: 'bg-yellow-100 text-yellow-700',
  Qualified:  'bg-green-100 text-green-700',
  Booked:     'bg-blue-100 text-blue-700',
  Lost:       'bg-red-100 text-red-700',
}

const bookingColors: Record<string, string> = {
  Confirmed: 'bg-blue-100 text-blue-700',
  Reminded:  'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
  NoShow:    'bg-slate-100 text-slate-500',
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)

  const load = () => axios.get(`${API}/stats`).then(r => setStats(r.data))

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const conversionRate = stats
    ? stats.totalLeads > 0 ? Math.round((stats.booked / stats.totalLeads) * 100) : 0
    : null

  const funnelSteps = stats ? [
    { label: 'Total Leads',  value: stats.totalLeads, color: 'bg-slate-200' },
    { label: 'Qualifying',   value: stats.qualifying,  color: 'bg-yellow-300' },
    { label: 'Qualified',    value: stats.qualified,   color: 'bg-green-300' },
    { label: 'Booked',       value: stats.booked,      color: 'bg-blue-400' },
  ] : []

  const maxFunnel = funnelSteps[0]?.value || 1

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads',    value: stats?.totalLeads  ?? '—', color: 'bg-blue-50 text-blue-700' },
          { label: 'Booked',         value: stats?.booked      ?? '—', color: 'bg-purple-50 text-purple-700' },
          { label: 'Reviews Sent',   value: stats?.reviewsSent ?? '—', color: 'bg-orange-50 text-orange-700' },
          { label: 'Conversion',     value: conversionRate !== null ? `${conversionRate}%` : '—', color: 'bg-green-50 text-green-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-5 ${color}`}>
            <p className="text-sm font-medium opacity-70">{label}</p>
            <p className="text-4xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Conversion funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Lead Funnel</h3>
          <div className="space-y-2">
            {funnelSteps.map(step => (
              <div key={step.label}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{step.label}</span>
                  <span className="font-semibold text-slate-700">{step.value}</span>
                </div>
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${step.color}`}
                    style={{ width: `${Math.round((step.value / maxFunnel) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {stats && (
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-red-400">Lost: {stats.lost}</span>
                <span className="text-slate-400">No-shows: {stats.noShowsTotal}</span>
              </div>
            )}
          </div>
        </div>

        {/* Today's appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">
            Today's Appointments
            {stats?.todayBookings?.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {stats.todayBookings.length}
              </span>
            )}
          </h3>
          {!stats || stats.todayBookings.length === 0 ? (
            <div className="text-center text-slate-400 py-6">
              <p className="text-2xl mb-1">📅</p>
              <p className="text-sm">No appointments today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.todayBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{b.patientName || '—'}</p>
                    <p className="text-xs text-slate-500">{b.concern || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{b.time}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bookingColors[b.status] ?? ''}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Leads</h3>
          {!stats || stats.recentLeads.length === 0 ? (
            <div className="text-center text-slate-400 py-6">
              <p className="text-2xl mb-1">🎯</p>
              <p className="text-sm">No leads yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentLeads.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{l.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{l.concern || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[l.status] ?? ''}`}>
                      {l.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
