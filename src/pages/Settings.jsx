import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { saveSettings, generateHAEToken } from '../lib/db'

function formatImportDate(iso) {
  const d = new Date(iso)
  const datePart = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} om ${timePart}`
}

export default function Settings({ settings, userId, onSettingsChange, supabaseUrl }) {
  const [form, setForm] = useState({ ...settings })
  const [saved, setSaved] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [endpointCopied, setEndpointCopied] = useState(false)
  const [testState, setTestState] = useState(null) // null | 'loading' | 'ok' | 'error'
  const [lastImport, setLastImport] = useState(undefined) // undefined = loading

  const endpoint = supabaseUrl
    ? `${supabaseUrl}/functions/v1/health-import`
    : 'https://YOUR_PROJECT.supabase.co/functions/v1/health-import'

  useEffect(() => {
    async function fetchLastImport() {
      const { data } = await supabase
        .from('workouts')
        .select('imported_at')
        .eq('user_id', userId)
        .order('imported_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setLastImport(data?.imported_at ?? null)
    }
    fetchLastImport()
  }, [userId])

  function handleChange(e) {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function setUnit(unit) {
    setSaved(false)
    setForm((f) => ({ ...f, unit }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const updated = {
      ...form,
      birthDate: form.birthDate || null,
      startWeight: form.startWeight ? parseFloat(form.startWeight) : null,
      goalWeight: form.goalWeight ? parseFloat(form.goalWeight) : null,
      heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
      kcalTarget: form.kcalTarget ? parseInt(form.kcalTarget, 10) : null,
      proteinTarget: form.proteinTarget ? parseInt(form.proteinTarget, 10) : null,
    }
    await saveSettings(userId, updated)
    onSettingsChange(updated)
    setSaved(true)
  }

  async function handleGenerateToken() {
    const token = generateHAEToken()
    const updated = { ...form, haeApiToken: token }
    setForm(updated)
    await saveSettings(userId, {
      ...updated,
      startWeight: updated.startWeight ? parseFloat(updated.startWeight) : null,
      goalWeight: updated.goalWeight ? parseFloat(updated.goalWeight) : null,
    })
    onSettingsChange(updated)
  }

  async function copyToClipboard(text, setDone) {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  async function handleTestConnection() {
    if (!form.haeApiToken) return
    setTestState('loading')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${form.haeApiToken}`,
        },
        body: JSON.stringify({ data: { workouts: [], metrics: [] } }),
      })
      setTestState(res.ok ? 'ok' : 'error')
    } catch {
      setTestState('error')
    }
    setTimeout(() => setTestState(null), 4000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Unit toggle */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Eenheid</h2>
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {['kg', 'lbs'].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.unit === u
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {u === 'kg' ? 'Kilogram (kg)' : 'Pounds (lbs)'}
              </button>
            ))}
          </div>
        </div>

        {/* Weight targets */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Gewichtsdoelen</h2>

          <WeightField
            label="Startgewicht"
            name="startWeight"
            value={form.startWeight ?? ''}
            onChange={handleChange}
            unit={form.unit}
            placeholder="bijv. 90"
            hint="Wordt gebruikt voor de voortgangsberekening."
          />

          <WeightField
            label="Doelgewicht"
            name="goalWeight"
            value={form.goalWeight ?? ''}
            onChange={handleChange}
            unit={form.unit}
            placeholder="bijv. 75"
            hint="Zichtbaar als stippellijn in de grafiek."
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate ?? ''}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        {/* Body metrics */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Lichaamsstatistieken</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Geslacht</label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200">
              {[{ value: 'male', label: 'Man' }, { value: 'female', label: 'Vrouw' }].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setSaved(false); setForm(f => ({ ...f, gender: value })) }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.gender === value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Geboortedatum</label>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate ?? ''}
              onChange={handleChange}
              className="input"
            />
            <p className="text-xs text-slate-400 mt-1">Gebruikt voor leeftijdsspecifieke normen (VO₂ max, HR, HRV).</p>
          </div>

          <WeightField
            label="Lengte"
            name="heightCm"
            value={form.heightCm ?? ''}
            onChange={handleChange}
            unit="cm"
            placeholder="168"
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Kcal doel" name="kcalTarget" value={form.kcalTarget ?? ''} onChange={handleChange} unit="kcal" placeholder="1800" />
            <NumberField label="Eiwit doel" name="proteinTarget" value={form.proteinTarget ?? ''} onChange={handleChange} unit="g" placeholder="140" />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm shadow-emerald-200"
        >
          Instellingen opslaan
        </button>

        {saved && (
          <p className="text-center text-sm text-emerald-600 font-medium">✓ Opgeslagen!</p>
        )}
      </form>

      {/* Apple Health automation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Apple Health automatisering</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configureer Health Auto Export voor automatische data-import.</p>
        </div>

        {/* Last import */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Laatste import:</span>
          {lastImport === undefined && <span className="text-slate-300">laden…</span>}
          {lastImport === null && <span className="text-slate-400 italic">Nog geen imports</span>}
          {lastImport && <span className="text-slate-600 font-medium">{formatImportDate(lastImport)}</span>}
        </div>

        {/* Endpoint */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">API endpoint (kopieer naar HAE)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 break-all">
              {endpoint}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(endpoint, setEndpointCopied)}
              className="flex-shrink-0 text-xs px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
            >
              {endpointCopied ? '✓' : 'Kopieer'}
            </button>
          </div>
        </div>

        {/* Token */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Bearer token (Authorization header)</p>
          {form.haeApiToken ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-mono break-all">
                {form.haeApiToken}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(form.haeApiToken, setTokenCopied)}
                className="flex-shrink-0 text-xs px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              >
                {tokenCopied ? '✓' : 'Kopieer'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Nog geen token gegenereerd.</p>
          )}
          <button
            type="button"
            onClick={handleGenerateToken}
            className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {form.haeApiToken ? '↻ Nieuw token genereren' : '+ Token genereren'}
          </button>
        </div>

        {/* Test */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={!form.haeApiToken || testState === 'loading'}
            className="text-xs px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            {testState === 'loading' ? 'Testen…' : 'Test verbinding'}
          </button>
          {testState === 'ok' && (
            <span className="text-xs text-emerald-600 font-medium">✓ Verbinding OK</span>
          )}
          {testState === 'error' && (
            <span className="text-xs text-red-500 font-medium">✕ Verbinding mislukt</span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Stel in HAE: <strong>REST API</strong> trigger met bovenstaande URL en header{' '}
          <code>Authorization: Bearer &lt;token&gt;</code>. Zie README voor volledige setup-stappen.
        </p>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-white transition-all"
      >
        Uitloggen
      </button>
    </div>
  )
}

function WeightField({ label, name, value, onChange, unit, placeholder, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          step="0.1"
          placeholder={placeholder}
          className="input flex-1"
        />
        <span className="text-sm text-slate-400 w-8">{unit}</span>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function NumberField({ label, name, value, onChange, unit, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input flex-1"
        />
        <span className="text-sm text-slate-400 w-8">{unit}</span>
      </div>
    </div>
  )
}
