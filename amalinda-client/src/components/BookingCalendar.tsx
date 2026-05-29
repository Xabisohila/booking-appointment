import { useState } from 'react'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 07:00 – 17:00
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const statusColors: Record<string, string> = {
  Confirmed: 'bg-blue-100 border-blue-300 text-blue-800',
  Reminded:  'bg-yellow-100 border-yellow-300 text-yellow-800',
  Completed: 'bg-green-100 border-green-300 text-green-800',
  Cancelled: 'bg-red-100 border-red-300 text-red-500 line-through',
  NoShow:    'bg-slate-100 border-slate-300 text-slate-500',
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmt(date: Date) {
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export default function BookingCalendar({ bookings }: { bookings: any[] }) {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(startOfWeek(today))

  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  const getBookings = (day: Date, hour: number) =>
    bookings.filter(b => {
      const d = new Date(b.scheduledAt)
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate() &&
        d.getHours() === hour
      )
    })

  const isToday = (d: Date) => d.toDateString() === today.toDateString()

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">← Prev</button>
        <span className="text-sm font-medium text-slate-700">
          {fmt(weekStart)} – {fmt(addDays(weekStart, 5))}
        </span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Next →</button>
        <button onClick={() => setWeekStart(startOfWeek(today))}
          className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">Today</button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: '56px repeat(6, 1fr)', minWidth: 640 }}>
          {/* Header */}
          <div className="border-b border-slate-200 bg-slate-50" />
          {weekDays.map((day, i) => (
            <div key={i} className={`px-2 py-2 text-center text-xs font-semibold border-b border-l border-slate-200 bg-slate-50 ${isToday(day) ? 'text-blue-600' : 'text-slate-600'}`}>
              <div>{DAYS[i]}</div>
              <div className={`text-base font-bold mt-0.5 ${isToday(day) ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto' : ''}`}>
                {day.getDate()}
              </div>
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map(hour => (
            <>
              <div key={`h-${hour}`} className="border-b border-slate-100 px-1 pt-2 text-right text-xs text-slate-400">
                {String(hour).padStart(2, '0')}:00
              </div>
              {weekDays.map((day, di) => {
                const slots = getBookings(day, hour)
                return (
                  <div key={`${hour}-${di}`} className="border-b border-l border-slate-100 p-1 min-h-[52px]">
                    {slots.map(b => (
                      <div key={b.id} className={`text-xs px-1.5 py-1 rounded border mb-0.5 leading-tight ${statusColors[b.status] ?? ''}`}>
                        <div className="font-medium truncate">{b.lead?.name || '—'}</div>
                        <div className="opacity-70 truncate">{b.lead?.concern || ''}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
