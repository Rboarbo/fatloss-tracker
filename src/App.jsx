import { useState, useEffect } from 'react'
import { getEntries, getSettings } from './lib/storage'
import Dashboard from './pages/Dashboard'
import LogEntry from './pages/LogEntry'
import Settings from './pages/Settings'
import AppLogo from './components/AppLogo'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState(null)
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    setEntries(getEntries())
    setSettings(getSettings())
  }, [])

  function handleSelectDate(date) {
    setLogDate(date)
    setTab('log')
  }

  if (!settings) return null

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 flex items-center gap-3 shadow-lg">
        <AppLogo size={36} />
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Fatloss Tracker</h1>
          <p className="text-slate-400 text-xs mt-0.5">Elke dag telt</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {tab === 'dashboard' && (
          <Dashboard
            entries={entries}
            settings={settings}
            onSelectDate={handleSelectDate}
          />
        )}
        {tab === 'log' && (
          <LogEntry
            entries={entries}
            settings={settings}
            onEntriesChange={setEntries}
            initialDate={logDate}
          />
        )}
        {tab === 'settings' && (
          <Settings settings={settings} onSettingsChange={setSettings} />
        )}
      </main>

      <nav className="bg-white border-t border-slate-200 shadow-up">
        <div className="flex max-w-2xl mx-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', Icon: GridIcon },
            { id: 'log', label: 'Invoer', Icon: PlusIcon },
            { id: 'settings', label: 'Instellingen', Icon: SettingsIcon },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon active={tab === id} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function GridIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function PlusIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
