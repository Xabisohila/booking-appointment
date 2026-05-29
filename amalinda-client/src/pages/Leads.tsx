import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { exportCsv } from '../utils/csv'
import { API } from '../config'

const statusColors: Record<string, string> = {
  New: 'bg-slate-100 text-slate-600',
  Qualifying: 'bg-yellow-100 text-yellow-700',
  Qualified: 'bg-green-100 text-green-700',
  Booked: 'bg-blue-100 text-blue-700',
  Lost: 'bg-red-100 text-red-700',
}

const STATUS_TABS = ['All', 'New', 'Qualifying', 'Qualified', 'Booked', 'Lost']
const emptyForm = { name: '', phone: '', concern: '', isNewPatient: true }

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [convo, setConvo] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [bookForm, setBookForm] = useState({ scheduledAt: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = () => axios.get(`${API}/leads`).then(r => setLeads(r.data))

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l =>
      (statusFilter === 'All' || l.status === statusFilter) &&
      (!q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.concern?.toLowerCase().includes(q))
    )
  }, [leads, search, statusFilter])

  const openLead = async (id: number) => {
    const r = await axios.get(`${API}/leads/${id}`)
    setSelected(r.data)
    setConvo(r.data.conversations ?? [])
  }

  const handleAdd = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.post(`${API}/leads`, form)
      await load()
      setShowAddModal(false)
      setForm(emptyForm)
    } finally { setSaving(false) }
  }

  const handleBook = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await axios.post(`${API}/bookings`, {
        leadId: selected.id,
        scheduledAt: new Date(bookForm.scheduledAt).toISOString(),
        notes: bookForm.notes || null,
      })
      await load()
      const r = await axios.get(`${API}/leads/${selected.id}`)
      setSelected(r.data)
      setShowBookModal(false)
      setBookForm({ scheduledAt: '', notes: '' })
    } finally { setSaving(false) }
  }

  const handleExport = () => {
    exportCsv(
      filtered.map(l => ({
        Name: l.name || '',
        Phone: l.phone,
        Concern: l.concern || '',
        Status: l.status,
        'Patient Type': l.address || '',
        Date: new Date(l.createdAt).toLocaleDateString(),
      })),
      'leads'
    )
  }

  const canBook = selected && !['Booked', 'Lost'].includes(selected.status)

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Leads</h2>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Export CSV
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Add Patient
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-4">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone or concern…"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-4">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Phone', 'Concern', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No leads found</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} onClick={() => openLead(lead.id)}
                  className={`border-b border-slate-100 cursor-pointer transition-colors ${selected?.id === lead.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3 font-medium">{lead.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.concern || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] ?? ''}`}>{lead.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversation panel */}
      {selected && (
        <div className="w-96 border-l border-slate-200 bg-white flex flex-col h-full shadow-lg">
          <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">WhatsApp Conversation</p>
              <h3 className="font-bold text-slate-800 text-base">{selected.name || selected.phone}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selected.phone}</p>
              {selected.concern && <p className="text-xs text-slate-600 mt-1 italic">"{selected.concern}"</p>}
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none mt-0.5">✕</button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50">
            {convo.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">This lead hasn't replied on WhatsApp</p>
              </div>
            ) : convo
              .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
              .map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'assistant' ? 'bg-white text-slate-700 rounded-tl-sm' : 'bg-green-500 text-white rounded-tr-sm'}`}>
                    {msg.message}
                    <p className={`text-[10px] mt-1 ${msg.role === 'assistant' ? 'text-slate-400' : 'text-green-100'}`}>
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selected.status] ?? ''}`}>{selected.status}</span>
              <span className="text-xs text-slate-400 ml-2">
                {selected.address === 'NewPatient' ? 'New patient' : selected.address === 'ReturningPatient' ? 'Returning patient' : ''}
              </span>
            </div>
            {canBook && (
              <button onClick={() => setShowBookModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Book Appointment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Patient modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Add Patient Manually</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone (WhatsApp)</label>
                <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+27821234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                <input required value={form.concern} onChange={e => setForm(f => ({ ...f, concern: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Toothache, check-up, cleaning…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Patient Type</label>
                <div className="flex gap-3">
                  {[{ label: 'New patient', value: true }, { label: 'Returning patient', value: false }].map(opt => (
                    <button key={opt.label} type="button" onClick={() => setForm(f => ({ ...f, isNewPatient: opt.value }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.isNewPatient === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Appointment modal */}
      {showBookModal && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Book Appointment</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selected.name} · {selected.concern}</p>
              </div>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Date & Time</label>
                <input required type="datetime-local" value={bookForm.scheduledAt}
                  onChange={e => setBookForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={bookForm.notes} onChange={e => setBookForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Any special notes…"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowBookModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Booking…' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
