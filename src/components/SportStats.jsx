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

  const stats = {}
  recent.forEach((e) => {
    const s = e.training
    if (!stats[s]) {
      stats[s] = {
        sessions: 0, totalMin: 0, totalKcal: 0, hrSum: 0, hrCount: 0,
        // milon-specific
        krachtScores: [], cardioScores: [], totalTon: 0, totalReps: 0, totalMilonKcal: 0,
      }
    }
    const st = stats[s]
    st.sessions++
    if (e.trainingDuration) st.totalMin += e.trainingDuration
    if (e.trainingKcal) st.totalKcal += e.trainingKcal
    if (e.avgHR) { st.hrSum += e.avgHR; st.hrCount++ }
    if (s === 'milon') {
      if (e.milonKrachtScore) st.krachtScores.push(e.milonKrachtScore)
      if (e.milonCardioScore) st.cardioScores.push(e.milonCardioScore)
      if (e.milonTon) st.totalTon += e.milonTon
      if (e.milonReps) st.totalReps += e.milonReps
      if (e.milonKcalTotal) st.totalMilonKcal += e.milonKcalTotal
    }
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

          // Milon score trends: compare first half vs second half
          const krachtTrend = scoreTrend(s.krachtScores)
          const cardioTrend = scoreTrend(s.cardioScores)
          const avgKracht = s.krachtScores.length > 0
            ? Math.round(s.krachtScores.reduce((a, b) => a + b, 0) / s.krachtScores.length)
            : null
          const avgCardio = s.cardioScores.length > 0
            ? Math.round(s.cardioScores.reduce((a, b) => a + b, 0) / s.cardioScores.length)
            : null

          return (
            <div
              key={sport}
              className={`rounded-xl p-3 border ${sport === 'milon' ? 'col-span-2' : ''}`}
              style={{ borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}08` }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: cfg.color }}>
                <SportIcon type={sport} size={16} />
                <span className="text-sm font-semibold">{cfg.label}</span>
              </div>

              {sport === 'milon' ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <Row label="Sessies" value={`${s.sessions}×`} />
                  {hours && <Row label="Duur" value={`${hours} uur`} />}
                  {avgKracht != null && (
                    <Row
                      label="Gem. kracht-score"
                      value={
                        <span className="flex items-center gap-1">
                          {avgKracht}
                          <TrendBadge trend={krachtTrend} />
                        </span>
                      }
                    />
                  )}
                  {avgCardio != null && (
                    <Row
                      label="Gem. cardio-score"
                      value={
                        <span className="flex items-center gap-1">
                          {avgCardio}
                          <TrendBadge trend={cardioTrend} />
                        </span>
                      }
                    />
                  )}
                  {s.totalTon > 0 && <Row label="Totale tonnage" value={`${s.totalTon.toFixed(1)} ton`} />}
                  {s.totalReps > 0 && <Row label="Herhalingen" value={s.totalReps} />}
                  {s.totalMilonKcal > 0 && <Row label="Milon kcal" value={`${s.totalMilonKcal}`} />}
                </div>
              ) : (
                <div className="space-y-1">
                  <Row label="Sessies" value={`${s.sessions}×`} />
                  {hours && <Row label="Duur" value={`${hours} uur`} />}
                  {s.totalKcal > 0 && <Row label="Workout kcal" value={`${s.totalKcal}`} />}
                  {avgHR && <Row label="Gem. HR" value={`${avgHR} bpm`} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Returns 'better' | 'worse' | null by comparing first half avg vs second half avg
// For kracht/cardio: lower score = better
function scoreTrend(scores) {
  if (scores.length < 2) return null
  const mid = Math.floor(scores.length / 2)
  const firstAvg = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid
  const lastAvg = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid)
  if (lastAvg < firstAvg - 0.5) return 'better'
  if (lastAvg > firstAvg + 0.5) return 'worse'
  return null
}

function TrendBadge({ trend }) {
  if (!trend) return null
  return trend === 'better'
    ? <span className="text-emerald-500 text-xs">↓</span>
    : <span className="text-red-400 text-xs">↑</span>
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  )
}
