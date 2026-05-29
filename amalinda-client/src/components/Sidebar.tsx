import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../auth'
import { API } from '../config'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/leads', label: 'Leads', icon: '🎯' },
  { to: '/bookings', label: 'Bookings', icon: '📅' },
  { to: '/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/simulate', label: 'Test AI', icon: '🤖' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const [practiceName, setPracticeName] = useState('Dental Practice')

  useEffect(() => {
    axios.get(`${API}/config`).then(r => setPracticeName(r.data.practiceName))
  }, [])

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-200">
        <h1 className="text-lg font-bold text-blue-700 leading-tight">{practiceName}</h1>
        <p className="text-xs text-slate-500 mt-0.5">AI Receptionist</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <span>🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
