import { useEffect, useState } from 'react'
import axios from 'axios'
import { API } from '../config'
import BarChart from '../components/BarChart'

const bookingStatusColors: Record<string, string> = {
  Confirmed: 'bg-indigo-100 text-indigo-700',
  Reminded:  'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-600',
  NoShow:    'bg-slate-100 text-slate-500',
}

const leadStatusColors: Record<string, string> = {
  New:        'bg-slate-100 text-slate-600',
  Qualifying: 'bg-amber-100 text-amber-700',
  Qualified:  'bg-emerald-100 text-emerald-700',
  Booked:     'bg-indigo-100 text-indigo-700',
  Lost:       'bg-red-100 text-red-500',
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [trends, setTrends] = useState<any>(null)

  const load = () => Promise.all([
    axios.get(`${API}/stats`).then(r => setStats(r.data)),
    axios.get(`${API}/stats/trends`).then(r => setTrends(r.data)),
  ])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const conversionRate = stats
    ? stats.totalLeads > 0 ? Math.round((stats.booked / stats.totalLeads) * 100) : 0
    : null

  const statCards = [
    { label: 'Total Leads',  value: stats?.totalLeads  ?? '—', icon: '🎯', from: 'from-indigo-500', to: 'to-blue-600',    shadow: 'shadow-indigo-500/30' },
    { label: 'Booked',       value: stats?.booked      ?? '—', icon: '📅', from: 'from-violet-500', to: 'to-purple-600',  shadow: 'shadow-violet-500/30' },
    { label: 'Reviews Sent', value: stats?.reviewsSent ?? '—', icon: '⭐', from: 'from-amber-400',  to: 'to-orange-500',  shadow: 'shadow-amber-400/30'  },
    { label: 'Conversion',   value: conversionRate !== null ? `${conversionRate}%` : '—', icon: '📈', from: 'from-emerald-500', to: 'to-teal-500', shadow: 'shadow-emerald-500/30' },
  ]

  const maxFunnel = stats?.totalLeads || 1
  const funnelSteps = stats ? [
    { label: 'Total Leads', value: stats.totalLeads, pct: 100,                                                     color: 'bg-slate-300' },
    { label: 'Qualifying',  value: stats.qualifying,  pct: Math.round((stats.qualifying  / maxFunnel) * 100),      color: 'bg-amber-400' },
    { label: 'Qualified',   value: stats.qualified,   pct: Math.round((stats.qualified   / maxFunnel) * 100),      color: 'bg-emerald-400' },
    { label: 'Booked',      value: stats.booked,      pct: Math.round((stats.booked      / maxFunnel) * 100),      color: 'bg-indigo-500' },
  ] : []

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Practice overview — updates every 30 seconds</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon, from, to, shadow }) => (
          <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br ${from} ${to} text-white shadow-lg ${shadow}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</p>
              <span className="text-xl opacity-80">{icon}</span>
            </div>
            <p className="text-4xl font-extrabold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Three panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Lead Funnel</h3>
              <p className="text-xs text-slate-400 mt-0.5">Qualification pipeline</p>
            </div>
            {stats && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{stats.totalLeads} total</span>}
          </div>
          <div className="space-y-3">
            {funnelSteps.map(step => (
              <div key={step.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">{step.label}</span>
                  <span className="font-bold text-slate-700">{step.value} <span className="text-slate-400 font-normal">({step.pct}%)</span></span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${step.color}`} style={{ width: `${step.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {stats && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-4 text-xs">
              <span className="text-red-400 font-medium">✕ Lost: {stats.lost}</span>
              <span className="text-slate-400 font-medium">No-shows: {stats.noShowsTotal}</span>
            </div>
          )}
        </div>

        {/* Today */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Today's Appointments</h3>
              <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            {stats?.todayBookings?.length > 0 && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg">
                {stats.todayBookings.length}
              </span>
            )}
          </div>
          {!stats || stats.todayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-sm font-medium text-slate-500">No appointments today</p>
              <p className="text-xs text-slate-400 mt-1">Enjoy the quiet!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.todayBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-600">
                        {(b.patientName || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{b.patientName || '—'}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[120px]">{b.concern || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-slate-700">{b.time}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${bookingStatusColors[b.status] ?? ''}`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="font-semibold text-slate-900 text-sm">Recent Leads</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest patient enquiries</p>
          </div>
          {!stats || stats.recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-sm font-medium text-slate-500">No leads yet</p>
              <p className="text-xs text-slate-400 mt-1">They'll appear here when patients message</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.recentLeads.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-violet-600">
                        {(l.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{l.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[120px]">{l.concern || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${leadStatusColors[l.status] ?? ''}`}>{l.status}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(l.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      {trends && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="font-semibold text-slate-900 text-sm">Weekly Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last 8 weeks — leads, bookings and no-shows</p>
          </div>
          <BarChart
            labels={trends.weeks}
            series={[
              { label: 'New Leads',  values: trends.leads,    color: '#6366f1' },
              { label: 'Bookings',   values: trends.bookings, color: '#10b981' },
              { label: 'No-shows',   values: trends.noShows,  color: '#f87171' },
            ]}
            height={160}
          />
        </div>
      )}
    </div>
  )
}
