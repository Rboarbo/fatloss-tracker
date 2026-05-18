import { useState } from 'react'
import { addEntry, deleteEntry } from '../lib/storage'

export default function LogEntry({ entries, settings, onEntriesChange }) {
  const today = new Date().toISOString().slice(0, 10)
  const existing = entries.find((e) => e.date === today)

  const [form, setForm] = useState({
    date: today,
    weight: existing?.weight ?? '',
    calories: existing?.calories ?? '',
    waist: existing?.waist ?? '',
    hips: existing?.hips ?? '',
    notes: existing?.notes ?? '',
  })
  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const entry = {
      date: form.date,
      weight: parseFloat(form.weight),
      ...(form.calories ? { calories: parseInt(form.calories, 10) } : {}),
      ...(form.waist ? { waist: parseFloat(form.waist) } : {}),
      ...(form.hips ? { hips: parseFloat(form.hips) } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    }
    onEntriesChange(addEntry(entry))
    setSaved(true)
  }

  function handleDelete(date) {
    if (!confirm(`Meting van ${date} verwijderen?`)) return
    onEntriesChange(deleteEntry(date))
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
        {/* Date field — prominent */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Datum</p>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="mt-1 text-slate-800 font-semibold text-base bg-transparent focus:outline-none"
              required
            />
          </div>
          {existing && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">
              Vandaag bijgewerkt
            </span>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Weight — main field, visually dominant */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Gewicht ({settings.unit})
          </label>
          <div className="flex items-end gap-2 mt-2">
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              step="0.1"
              placeholder="0.0"
              className="text-4xl font-bold text-slate-800 w-32 bg-transparent focus:outline-none placeholder:text-slate-200"
              required
            />
            <span className="text-lg text-slate-400 mb-1">{settings.unit}</span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Optional fields */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Optioneel</p>

          <div className="grid grid-cols-2 gap-3">
            <OptField
              label="Calorieën"
              name="calories"
              value={form.calories}
              onChange={handleChange}
              unit="kcal"
              placeholder="1800"
              color="amber"
            />
            <OptField
              label="Taille"
              name="waist"
              value={form.waist}
              onChange={handleChange}
              unit="cm"
              placeholder="88"
              step="0.5"
              color="violet"
            />
            <OptField
              label="Heupen"
              name="hips"
              value={form.hips}
              onChange={handleChange}
              unit="cm"
              placeholder="100"
              step="0.5"
              color="violet"
            />
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Notitie</label>
              <input
                type="text"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="bijv. cheat day, ziek..."
                className="input mt-1"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm shadow-emerald-200"
        >
          Opslaan
        </button>

        {saved && (
          <p className="text-center text-sm text-emerald-600 font-medium">✓ Opgeslagen!</p>
        )}
      </form>

      {entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-700 px-4 pt-4 pb-3">Alle metingen</h2>
          <ul className="divide-y divide-slate-50">
            {[...entries].reverse().map((e) => (
              <li key={e.date} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{e.weight} {settings.unit}</span>
                    {e.calories && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {e.calories} kcal
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{e.date}</p>
                </div>
                <button
                  onClick={() => handleDelete(e.date)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-1"
                  aria-label="Verwijderen"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function OptField({ label, name, value, onChange, unit, placeholder, step = '1', color }) {
  const colors = {
    amber: 'focus:ring-amber-400',
    violet: 'focus:ring-violet-400',
  }
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center gap-1 mt-1">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          step={step}
          placeholder={placeholder}
          className={`input flex-1 focus:ring-2 ${colors[color]}`}
        />
        <span className="text-xs text-slate-400 flex-shrink-0">{unit}</span>
      </div>
    </div>
  )
}
