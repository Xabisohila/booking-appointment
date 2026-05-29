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
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const [practiceName, setPracticeName] = useState('Dental Practice')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    axios.get(`${API}/config`).then(r => setPracticeName(r.data.practiceName))
  }, [])

  const NavLinks = () => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <span className="text-base w-5 text-center">🚪</span>
          Sign out
        </button>
      </div>
    </>
  )

  const Brand = () => (
    <div className="px-5 py-5 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
          <span className="text-lg">🦷</span>
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-white leading-tight truncate">{practiceName}</h1>
          <p className="text-xs text-slate-500">AI Receptionist</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 min-h-screen bg-slate-900 flex-col flex-shrink-0">
        <Brand />
        <NavLinks />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-sm">🦷</span>
          </div>
          <h1 className="text-sm font-bold text-white truncate">{practiceName}</h1>
        </div>
        <button onClick={() => setOpen(o => !o)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
          <span className="text-base">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute top-0 left-0 bottom-0 w-72 bg-slate-900 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <Brand />
            <NavLinks />
          </aside>
        </div>
      )}
    </>
  )
}
