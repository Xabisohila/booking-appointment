import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { exportCsv } from '../utils/csv'
import BookingCalendar from '../components/BookingCalendar'
import { API } from '../config'

const statusColors: Record<string, string> = {
  Confirmed: 'bg-indigo-100 text-indigo-700',
  Reminded:  'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-500',
  NoShow:    'bg-slate-100 text-slate-500',
}

const STATUS_TABS = ['All', 'Confirmed', 'Reminded', 'Completed', 'Cancelled', 'NoShow']

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [view, setView] = useState<'table' | 'calendar'>('table')

  const load = () => axios.get(`${API}/bookings`).then(r => setBookings(r.data))

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return bookings.filter(b =>
      (statusFilter === 'All' || b.status === statusFilter) &&
      (!q || b.lead?.name?.toLowerCase().includes(q) || b.lead?.phone?.includes(q) || b.lead?.concern?.toLowerCase().includes(q))
    )
  }, [bookings, search, statusFilter])

  const markComplete = async (id: number) => {
    await axios.post(`${API}/bookings/${id}/complete`, null)
    load()
  }

  const markNoShow = async (id: number) => {
    await axios.post(`${API}/bookings/${id}/noshow`)
    load()
  }

  const sendReminder = async (id: number) => {
    await axios.post(`${API}/bookings/${id}/remind`)
    load()
  }

  const handleExport = () => {
    exportCsv(
      filtered.map(b => ({
        Patient:     b.lead?.name || '',
        Phone:       b.lead?.phone || '',
        Concern:     b.lead?.concern || '',
        Appointment: new Date(b.scheduledAt).toLocaleString(),
        Status:      b.status,
        Notes:       b.notes || '',
      })),
      'bookings'
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bookings</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage appointments</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 text-sm font-medium transition-all ${view === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Table
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 text-sm font-medium border-l border-slate-300 transition-all ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 bg-white shadow-sm"
          >
            ↓ Export
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {view === 'calendar' && <BookingCalendar bookings={bookings} />}

      {/* Table view */}
      {view === 'table' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name, phone or concern…"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
            {STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto shadow-sm">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Patient', 'Phone', 'Concern', 'Appointment', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{b.lead?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{b.lead?.phone}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{b.lead?.concern || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(b.scheduledAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[b.status] ?? ''}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {(b.status === 'Confirmed' || b.status === 'Reminded') && (
                        <div className="flex gap-1.5 flex-wrap">
                          {b.status === 'Confirmed' && (
                            <button onClick={() => sendReminder(b.id)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">
                              Remind
                            </button>
                          )}
                          <button onClick={() => markComplete(b.id)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                            Done ✓
                          </button>
                          <button onClick={() => markNoShow(b.id)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200">
                            No-show
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
