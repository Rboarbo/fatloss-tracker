import { useState, useEffect } from 'react'
import {
  Moon, Dumbbell, Target, Trophy, Bike,
  Footprints, Wind, MoreHorizontal,
} from 'lucide-react'
import { addEntry, deleteEntry } from '../lib/storage'
import { SPORT_CONFIG, WORKOUT_FIELDS, sportColor } from '../lib/sport-config'

const SPORT_ICONS = { Moon, Dumbbell, Target, Trophy, Bike, Footprints, Wind, MoreHorizontal }

function SportIcon({ type, size = 14 }) {
  const name = SPORT_CONFIG[type]?.icon ?? 'MoreHorizontal'
  const Icon = SPORT_ICONS[name]
  return Icon ? <Icon size={size} /> : null
}

function emptyForm(date) {
  return {
    date,
    weight: '',
    calories: '',
    waist: '',
    hips: '',
    training: 'rust',
    duration: '',
    trainingKcal: '',
    avgHR: '',
    distance: '',
    notes: '',
  }
}

function entryToForm(e, date) {
  return {
    date: e?.date ?? date,
    weight: e?.weight ?? '',
    calories: e?.calories ?? '',
    waist: e?.waist ?? '',
    hips: e?.hips ?? '',
    training: e?.training ?? 'rust',
    duration: e?.trainingDuration ?? '',
    trainingKcal: e?.trainingKcal ?? '',
    avgHR: e?.avgHR ?? '',
    distance: e?.distance ?? '',
    notes: e?.notes ?? '',
  }
}

export default function LogEntry({ entries, settings, onEntriesChange, initialDate }) {
  const today = new Date().toISOString().slice(0, 10)
  const startDate = initialDate ?? today

  const existing = entries.find((e) => e.date === startDate)
  const [form, setForm] = useState(() => entryToForm(existing, startDate))
  const [saved, setSaved] = useState(false)

  // Re-sync form when initialDate changes (e.g. clicked from WeekView)
  useEffect(() => {
    const e = entries.find((en) => en.date === startDate)
    setForm(entryToForm(e, startDate))
    setSaved(false)
  }, [startDate]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const entry = {
      date: form.date,
      weight: form.weight !== '' ? parseFloat(form.weight) : null,
      training: form.training,
      ...(form.calories ? { calories: parseInt(form.calories, 10) } : {}),
      ...(form.waist ? { waist: parseFloat(form.waist) } : {}),
      ...(form.hips ? { hips: parseFloat(form.hips) } : {}),
      ...(form.duration ? { trainingDuration: parseInt(form.duration, 10) } : {}),
      ...(form.trainingKcal ? { trainingKcal: parseInt(form.trainingKcal, 10) } : {}),
      ...(form.avgHR ? { avgHR: parseInt(form.avgHR, 10) } : {}),
      ...(form.distance ? { distance: parseFloat(form.distance) } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    }
    onEntriesChange(addEntry(entry))
    setSaved(true)
  }

  function handleDelete(date) {
    if (!confirm(`Meting van ${date} verwijderen?`)) return
    onEntriesChange(deleteEntry(date))
  }

  const visibleFields = WORKOUT_FIELDS[form.training] ?? []
  const showWorkoutSection = visibleFields.length > 0

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-5">

        {/* Date */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Datum</p>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="mt-1 text-slate-800 font-semibold text-base bg-transparent focus:outline-none"
            />
          </div>
          {form.date === today && existing && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">
              Vandaag bijgewerkt
            </span>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Weight */}
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
            />
            <span className="text-lg text-slate-400 mb-1">{settings.unit}</span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Training type */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
            Training
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(SPORT_CONFIG).map(([key, cfg]) => {
              const Icon = SPORT_ICONS[cfg.icon]
              const active = form.training === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSaved(false); setForm((f) => ({ ...f, training: key })) }}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all text-xs font-medium"
                  style={{
                    borderColor: active ? cfg.color : 'transparent',
                    backgroundColor: active ? `${cfg.color}18` : '#f8fafc',
                    color: active ? cfg.color : '#94a3b8',
                  }}
                >
                  {Icon && <Icon size={18} />}
                  <span className="leading-tight text-center">{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Workout details — conditional */}
        {showWorkoutSection && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Workout details</p>
            <div className="grid grid-cols-2 gap-3">
              {visibleFields.includes('duration') && (
                <WorkoutField label="Duur" name="duration" value={form.duration} onChange={handleChange} unit="min" placeholder="45" />
              )}
              {visibleFields.includes('trainingKcal') && (
                <WorkoutField label="Workout kcal" name="trainingKcal" value={form.trainingKcal} onChange={handleChange} unit="kcal" placeholder="300" />
              )}
              {visibleFields.includes('avgHR') && (
                <WorkoutField label="Gem. HR" name="avgHR" value={form.avgHR} onChange={handleChange} unit="bpm" placeholder="145" />
              )}
              {visibleFields.includes('distance') && (
                <WorkoutField label="Afstand" name="distance" value={form.distance} onChange={handleChange} unit="km" placeholder="25" step="0.1" />
              )}
              {visibleFields.includes('notes') && (
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Notitie</label>
                  <input
                    type="text"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="bijv. goed gevoel, hoge intensiteit..."
                    className="input mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rust/Anders: only notes */}
        {!showWorkoutSection && (
          <div>
            <label className="text-xs text-slate-400">Notitie (optioneel)</label>
            <input
              type="text"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="bijv. cheat day, ziek..."
              className="input mt-1"
            />
          </div>
        )}

        <hr className="border-slate-100" />

        {/* Body measurements */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Lichaamsmetingen (optioneel)</p>
          <div className="grid grid-cols-2 gap-3">
            <OptField label="Calorieën" name="calories" value={form.calories} onChange={handleChange} unit="kcal" placeholder="1800" color="amber" />
            <OptField label="Taille" name="waist" value={form.waist} onChange={handleChange} unit="cm" placeholder="88" step="0.5" color="violet" />
            <OptField label="Heupen" name="hips" value={form.hips} onChange={handleChange} unit="cm" placeholder="100" step="0.5" color="violet" />
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

      {/* History table */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-700 px-4 pt-4 pb-3">Alle metingen</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="text-left px-4 py-2 font-medium">Datum</th>
                  <th className="text-left px-4 py-2 font-medium">Gewicht</th>
                  <th className="text-left px-4 py-2 font-medium">Training</th>
                  <th className="text-left px-4 py-2 font-medium">Duur</th>
                  <th className="text-left px-4 py-2 font-medium">HR</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...entries].reverse().map((e) => {
                  const sport = e.training ?? 'rust'
                  const cfg = SPORT_CONFIG[sport]
                  return (
                    <tr key={e.date} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{e.date}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                        {e.weight != null ? `${e.weight} ${settings.unit}` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
                        >
                          <SportIcon type={sport} size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                        {e.trainingDuration ? `${e.trainingDuration} min` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                        {e.avgHR ? `${e.avgHR} bpm` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkoutField({ label, name, value, onChange, unit, placeholder, step = '1' }) {
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
          className="input flex-1"
        />
        <span className="text-xs text-slate-400 flex-shrink-0">{unit}</span>
      </div>
    </div>
  )
}

function OptField({ label, name, value, onChange, unit, placeholder, step = '1', color }) {
  const colors = { amber: 'focus:ring-amber-400', violet: 'focus:ring-violet-400' }
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
