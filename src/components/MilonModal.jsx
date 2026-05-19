import { useState } from 'react'
import { Dumbbell, X } from 'lucide-react'
import { saveMilonDetails } from '../lib/db'

export default function MilonModal({ workout, existingDetails, userId, onClose, onSave }) {
  const [form, setForm] = useState({
    kcalKracht: existingDetails?.kcal_kracht ?? '',
    kcalCardio: existingDetails?.kcal_cardio ?? '',
    krachtScore: existingDetails?.kracht_score ?? '',
    cardioScore: existingDetails?.cardio_score ?? '',
    topPct: existingDetails?.top_pct ?? '',
    ton: existingDetails?.ton ?? '',
    reps: existingDetails?.reps ?? '',
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    const kcalKracht = form.kcalKracht !== '' ? parseFloat(form.kcalKracht) : null
    const kcalCardio = form.kcalCardio !== '' ? parseFloat(form.kcalCardio) : null

    await saveMilonDetails(workout.id, userId, {
      kcal_kracht: kcalKracht,
      kcal_cardio: kcalCardio,
      kracht_score: form.krachtScore !== '' ? parseInt(form.krachtScore, 10) : null,
      cardio_score: form.cardioScore !== '' ? parseInt(form.cardioScore, 10) : null,
      top_pct: form.topPct || null,
      ton: form.ton !== '' ? parseFloat(form.ton) : null,
      reps: form.reps !== '' ? parseInt(form.reps, 10) : null,
    })

    setSaving(false)
    onSave()
  }

  const sessionDate = workout.start.slice(0, 10)
  const durationMin = Math.round(workout.duration_sec / 60)

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-2xl w-full max-w-2xl p-5 pb-8 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} style={{ color: '#FF6B1A' }} />
            <div>
              <span className="font-semibold text-slate-800">Milon ME details</span>
              <p className="text-xs text-slate-400">{sessionDate} · {durationMin} min</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-slate-500 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MField label="Kcal kracht" name="kcalKracht" value={form.kcalKracht} onChange={handleChange} placeholder="30" hint="stacked bar donker" />
            <MField label="Kcal cardio" name="kcalCardio" value={form.kcalCardio} onChange={handleChange} placeholder="170" hint="stacked bar licht" />
            <MField label="Kracht-score" name="krachtScore" value={form.krachtScore} onChange={handleChange} placeholder="70" hint="# KRACHT (↓ beter)" />
            <MField label="Cardio-score" name="cardioScore" value={form.cardioScore} onChange={handleChange} placeholder="49" hint="# CARDIO (↓ beter)" />
            <div>
              <label className="text-xs text-slate-500 font-medium">Top % zone</label>
              <p className="text-xs text-slate-300 leading-none mb-1">TOP %-zone</p>
              <input
                type="text"
                name="topPct"
                value={form.topPct}
                onChange={handleChange}
                placeholder="50-60"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
            <MField label="Ton" name="ton" value={form.ton} onChange={handleChange} placeholder="10" hint="TON" step="0.1" />
            <MField label="Herhalingen" name="reps" value={form.reps} onChange={handleChange} placeholder="251" hint="HERHALINGEN" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: saving ? '#ccc' : 'linear-gradient(to right, #FF6B1A, #f97316)' }}
          >
            {saving ? 'Opslaan…' : existingDetails ? 'Bijwerken' : 'Opslaan'}
          </button>
        </form>
      </div>
    </div>
  )
}

function MField({ label, name, value, onChange, placeholder, hint, step = '1' }) {
  return (
    <div>
      <label className="text-xs text-slate-500 font-medium">{label}</label>
      {hint && <p className="text-xs text-slate-300 leading-none mb-1">{hint}</p>}
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
      />
    </div>
  )
}
