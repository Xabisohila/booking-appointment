import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:5000/api'

export default function Jobs() {
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    axios.get(`${API}/bookings`).then(r =>
      setBookings(r.data.filter((b: any) => b.status === 'Completed'))
    )
  }, [])

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Completed Jobs</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Customer', 'Issue', 'Completed', 'Review Requested', 'Rating'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{b.lead?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{b.lead?.issue || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {b.job ? new Date(b.job.completedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {b.job?.reviewRequested
                    ? <span className="text-green-600 font-medium">Yes</span>
                    : <span className="text-slate-400">No</span>}
                </td>
                <td className="px-4 py-3">
                  {b.job?.reviewRating
                    ? <span className="font-medium">{b.job.reviewRating} / 5 ⭐</span>
                    : <span className="text-slate-400">Awaiting</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
