import { useState } from 'react'
import { saveSettings } from '../lib/storage'

export default function Settings({ settings, onSettingsChange }) {
  const [form, setForm] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function setUnit(unit) {
    setSaved(false)
    setForm((f) => ({ ...f, unit }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const updated = {
      ...form,
      startWeight: form.startWeight ? parseFloat(form.startWeight) : null,
      goalWeight: form.goalWeight ? parseFloat(form.goalWeight) : null,
    }
    saveSettings(updated)
    onSettingsChange(updated)
    setSaved(true)
  }

  return (
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
