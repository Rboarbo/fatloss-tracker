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
    const updated = addEntry(entry)
    onEntriesChange(updated)
    setSaved(true)
  }

  function handleDelete(date) {
    if (!confirm(`Meting van ${date} verwijderen?`)) return
    const updated = deleteEntry(date)
    onEntriesChange(updated)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Meting invoeren</h2>

        <Field label="Datum">
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="input"
            required
          />
        </Field>

        <Field label={`Gewicht (${settings.unit})`}>
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            step="0.1"
            placeholder="bijv. 82.5"
            className="input"
            required
          />
        </Field>

        <Field label="Calorieën (kcal)" optional>
          <input
            type="number"
            name="calories"
            value={form.calories}
            onChange={handleChange}
            placeholder="bijv. 1800"
            className="input"
          />
        </Field>

        <Field label="Taillemaat (cm)" optional>
          <input
            type="number"
            name="waist"
            value={form.waist}
            onChange={handleChange}
            step="0.5"
            placeholder="bijv. 88"
            className="input"
          />
        </Field>

        <Field label="Heupmaat (cm)" optional>
          <input
            type="number"
            name="hips"
            value={form.hips}
            onChange={handleChange}
            step="0.5"
            placeholder="bijv. 100"
            className="input"
          />
        </Field>

        <Field label="Notitie" optional>
          <input
            type="text"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="bijv. cheat day"
            className="input"
          />
        </Field>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Opslaan
        </button>

        {saved && (
          <p className="text-center text-sm text-green-600">Opgeslagen!</p>
        )}
      </form>

      {entries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h2 className="text-sm font-medium text-gray-600 px-4 pt-4 pb-2">Alle metingen</h2>
          <ul className="divide-y divide-gray-100">
            {[...entries].reverse().map((e) => (
              <li key={e.date} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium">{e.date}</span>
                  <span className="text-gray-500 ml-3">{e.weight} {settings.unit}</span>
                  {e.calories && <span className="text-gray-400 ml-2">{e.calories} kcal</span>}
                </div>
                <button
                  onClick={() => handleDelete(e.date)}
                  className="text-red-400 hover:text-red-600 text-xs ml-2"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Field({ label, optional, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {label} {optional && <span className="text-gray-300">(optioneel)</span>}
      </label>
      {children}
    </div>
  )
}
