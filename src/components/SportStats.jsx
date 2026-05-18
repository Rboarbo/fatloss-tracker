import {
  Moon, Dumbbell, Target, Trophy, Bike,
  Footprints, Wind, MoreHorizontal,
} from 'lucide-react'
import { SPORT_CONFIG } from '../lib/sport-config'

const SPORT_ICONS = { Moon, Dumbbell, Target, Trophy, Bike, Footprints, Wind, MoreHorizontal }

function SportIcon({ type, size = 16 }) {
  const name = SPORT_CONFIG[type]?.icon ?? 'MoreHorizontal'
  const Icon = SPORT_ICONS[name]
  return Icon ? <Icon size={size} /> : null
}

export default function SportStats({ entries }) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 28)
  const cutoffISO = cutoff.toISOString().slice(0, 10)

  const recent = entries.filter((e) => e.date >= cutoffISO && e.training && e.training !== 'rust')

  if (recent.length === 0) return null

  // Aggregate per sport
  const stats = {}
  recent.forEach((e) => {
    const s = e.training
    if (!stats[s]) stats[s] = { sessions: 0, totalMin: 0, totalKcal: 0, hrSum: 0, hrCount: 0 }
    stats[s].sessions++
    if (e.trainingDuration) stats[s].totalMin += e.trainingDuration
    if (e.trainingKcal) stats[s].totalKcal += e.trainingKcal
    if (e.avgHR) { stats[s].hrSum += e.avgHR; stats[s].hrCount++ }
  })

  const sorted = Object.entries(stats).sort((a, b) => b[1].sessions - a[1].sessions)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Training afgelopen 4 weken</h2>
      <p className="text-xs text-slate-400 mb-4">Alleen actieve sporten</p>

      <div className="grid grid-cols-2 gap-3">
        {sorted.map(([sport, s]) => {
          const cfg = SPORT_CONFIG[sport]
          const hours = s.totalMin > 0 ? (s.totalMin / 60).toFixed(1) : null
          const avgHR = s.hrCount > 0 ? Math.round(s.hrSum / s.hrCount) : null

          return (
            <div
              key={sport}
              className="rounded-xl p-3 border"
              style={{ borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}08` }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: cfg.color }}>
                <SportIcon type={sport} size={16} />
                <span className="text-sm font-semibold">{cfg.label}</span>
              </div>
              <div className="space-y-1">
                <Row label="Sessies" value={`${s.sessions}×`} />
                {hours && <Row label="Duur" value={`${hours} uur`} />}
                {s.totalKcal > 0 && <Row label="Workout kcal" value={`${s.totalKcal}`} />}
                {avgHR && <Row label="Gem. HR" value={`${avgHR} bpm`} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  )
}
