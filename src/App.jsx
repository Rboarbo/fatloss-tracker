import { useState, useEffect } from 'react'
import { getEntries, getSettings } from './lib/storage'
import Dashboard from './pages/Dashboard'
import LogEntry from './pages/LogEntry'
import Settings from './pages/Settings'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'log', label: 'Invoer' },
  { id: 'settings', label: 'Instellingen' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    setEntries(getEntries())
    setSettings(getSettings())
  }, [])

  if (!settings) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Fatloss Tracker</h1>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {tab === 'dashboard' && (
          <Dashboard entries={entries} settings={settings} />
        )}
        {tab === 'log' && (
          <LogEntry
            entries={entries}
            settings={settings}
            onEntriesChange={setEntries}
          />
        )}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
      </main>

      <nav className="bg-white border-t border-gray-200">
        <div className="flex max-w-2xl mx-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'text-blue-600 border-t-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
