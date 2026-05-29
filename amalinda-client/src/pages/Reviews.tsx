import { useEffect, useState } from 'react'
import axios from 'axios'
import { API } from '../config'

export default function Reviews() {
  const [bookings, setBookings] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [ratingBookingId, setRatingBookingId] = useState<number | null>(null)
  const [ratingDraft, setRatingDraft] = useState(0)
  const [ratingText, setRatingText] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => axios.get(`${API}/bookings`).then(r =>
    setBookings(r.data.filter((b: any) => b.status === 'Completed'))
  )

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const startEdit = (b: any) => {
    setEditingId(b.id)
    setNotesDraft(b.job?.dentistNotes ?? '')
  }

  const saveRating = async (bookingId: number) => {
    if (ratingDraft === 0) return
    setSaving(true)
    try {
      await axios.patch(`${API}/bookings/${bookingId}/review`, { rating: ratingDraft, text: ratingText || null }, {
        headers: { 'Content-Type': 'application/json' }
      })
      await load()
      setRatingBookingId(null)
    } finally { setSaving(false) }
  }

  const saveNotes = async (bookingId: number) => {
    setSaving(true)
    try {
      await axios.patch(`${API}/bookings/${bookingId}/notes`, JSON.stringify(notesDraft), {
        headers: { 'Content-Type': 'application/json' }
      })
      await load()
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Reviews</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Patient', 'Concern', 'Date', 'Dentist Notes', 'Review', 'Rating'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No completed appointments yet</td></tr>
            )}
            {bookings.map(b => (
              <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50 align-top">
                <td className="px-4 py-3 font-medium">{b.lead?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{b.lead?.concern || '—'}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {b.job ? new Date(b.job.completedAt).toLocaleDateString() : '—'}
                </td>

                {/* Dentist notes — inline edit */}
                <td className="px-4 py-3 max-w-xs">
                  {editingId === b.id ? (
                    <div className="space-y-1">
                      <textarea
                        value={notesDraft}
                        onChange={e => setNotesDraft(e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveNotes(b.id)}
                          disabled={saving}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-slate-500 text-xs rounded hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEdit(b)}
                      className="group cursor-pointer"
                      title="Click to edit"
                    >
                      {b.job?.dentistNotes ? (
                        <p className="text-slate-600 text-xs leading-relaxed group-hover:text-blue-600">
                          {b.job.dentistNotes}
                        </p>
                      ) : (
                        <p className="text-slate-300 text-xs italic group-hover:text-blue-400">
                          Click to add notes…
                        </p>
                      )}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  {b.job?.reviewRequested
                    ? <span className="text-green-600 font-medium">Sent</span>
                    : <span className="text-slate-400">Pending</span>}
                </td>
                <td className="px-4 py-3">
                  {ratingBookingId === b.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button" onClick={() => setRatingDraft(star)}
                            className={`text-xl transition-colors ${star <= ratingDraft ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}>
                            ★
                          </button>
                        ))}
                      </div>
                      <input value={ratingText} onChange={e => setRatingText(e.target.value)}
                        placeholder="Review text (optional)"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <div className="flex gap-1">
                        <button onClick={() => saveRating(b.id)} disabled={saving || ratingDraft === 0}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                          {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setRatingBookingId(null)}
                          className="px-2 py-1 text-slate-500 text-xs rounded hover:bg-slate-100">Cancel</button>
                      </div>
                    </div>
                  ) : b.job?.reviewRating ? (
                    <button onClick={() => { setRatingBookingId(b.id); setRatingDraft(b.job.reviewRating); setRatingText(b.job.reviewText ?? '') }}
                      className="font-medium text-yellow-500 hover:underline text-sm">
                      {'★'.repeat(b.job.reviewRating)}{'☆'.repeat(5 - b.job.reviewRating)} {b.job.reviewRating}/5
                    </button>
                  ) : (
                    <button onClick={() => { setRatingBookingId(b.id); setRatingDraft(0); setRatingText('') }}
                      className="text-xs text-slate-400 hover:text-blue-500 italic">
                      + Log rating
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
