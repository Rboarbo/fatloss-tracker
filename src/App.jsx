import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { fetchAllData, fetchSettings } from './lib/db'
import { migrateLocalStorageToSupabase } from './lib/storage'
import Dashboard from './pages/Dashboard'
import LogEntry from './pages/LogEntry'
import Settings from './pages/Settings'
import AppLogo from './components/AppLogo'
import AuthGate from './components/AuthGate'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [session, setSession] = useState(undefined) // undefined = resolving
  const [entries, setEntries] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [settings, setSettings] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10))

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadData = useCallback(async (userId) => {
    setDataLoading(true)
    try {
      const migrated = await migrateLocalStorageToSupabase(userId, supabase)
      if (migrated) console.info('localStorage data migrated to Supabase')

      const [s, d] = await Promise.all([
        fetchSettings(userId),
        fetchAllData(userId),
      ])
      setSettings(s)
      setEntries(d.entries)
      setWorkouts(d.workouts)
    } catch (err) {
      console.error('loadData error:', err)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session === undefined || session === null) return
    loadData(session.user.id)
  }, [session, loadData])

  function handleSelectDate(date) {
    setLogDate(date)
    setTab('log')
  }

  async function handleRefresh() {
    if (session) await loadData(session.user.id)
  }

  // ── Loading / auth gates ──────────────────────────────────────────────────
  if (session === undefined || (session && dataLoading && !settings)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthGate />
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

      <main className="flex-1 overflow-y-auto p-4 pb-24 max-w-2xl mx-auto w-full">
        {tab === 'dashboard' && (
          <Dashboard
            entries={entries}
            workouts={workouts}
            settings={settings}
            onSelectDate={handleSelectDate}
          />
        )}
        {tab === 'log' && (
          <LogEntry
            entries={entries}
            workouts={workouts}
            settings={settings}
            initialDate={logDate}
            userId={session.user.id}
            onRefresh={handleRefresh}
          />
        )}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            userId={session.user.id}
            onSettingsChange={setSettings}
            supabaseUrl={import.meta.env.VITE_SUPABASE_URL ?? ''}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-t border-slate-200 shadow-lg">
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
