import { useState } from 'react'
import { saveSettings } from '../lib/storage'

export default function Settings({ settings, onSettingsChange }) {
  const [form, setForm] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
      <h2 className="text-sm font-medium text-gray-700">Instellingen</h2>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Eenheid</label>
        <select name="unit" value={form.unit} onChange={handleChange} className="input">
          <option value="kg">Kilogram (kg)</option>
          <option value="lbs">Pounds (lbs)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Startgewicht ({form.unit})
        </label>
        <input
          type="number"
          name="startWeight"
          value={form.startWeight ?? ''}
          onChange={handleChange}
          step="0.1"
          placeholder="bijv. 90"
          className="input"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Doelgewicht ({form.unit})
        </label>
        <input
          type="number"
          name="goalWeight"
          value={form.goalWeight ?? ''}
          onChange={handleChange}
          step="0.1"
          placeholder="bijv. 75"
          className="input"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Startdatum</label>
        <input
          type="date"
          name="startDate"
          value={form.startDate ?? ''}
          onChange={handleChange}
          className="input"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Opslaan
      </button>

      {saved && (
        <p className="text-center text-sm text-green-600">Instellingen opgeslagen!</p>
      )}
    </form>
  )
}
