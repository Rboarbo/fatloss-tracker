import {
  Moon, Dumbbell, Target, Trophy, Bike,
  Footprints, Wind, MoreHorizontal,
} from 'lucide-react'
import { SPORT_CONFIG, WEEKLY_PROTOCOL } from '../lib/sport-config'

const SPORT_ICONS = { Moon, Dumbbell, Target, Trophy, Bike, Footprints, Wind, MoreHorizontal }
const DAY_LABELS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']

function SportIcon({ type, size = 14 }) {
  const name = SPORT_CONFIG[type]?.icon ?? 'MoreHorizontal'
  const Icon = SPORT_ICONS[name]
  return Icon ? <Icon size={size} /> : null
}

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay() // 0=Sun
  // Week starts Monday (ISO)
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function WeekView({ entries, onSelectDate }) {
  const weekDates = getWeekDates()
  const today = new Date().toISOString().slice(0, 10)

  const entryMap = {}
  entries.forEach((e) => { entryMap[e.date] = e })

  // Score: days filled / planned protocol days hit
  let filled = 0
  let protocolHit = 0
  weekDates.forEach((d) => {
    const iso = d.toISOString().slice(0, 10)
    const dow = d.getDay()
    const planned = WEEKLY_PROTOCOL[dow]
    const actual = entryMap[iso]
    if (actual) filled++
    if (actual && planned !== 'rust' && actual.training === planned) protocolHit++
  })
  const plannedDays = weekDates.filter((d) => WEEKLY_PROTOCOL[d.getDay()] !== 'rust').length

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Deze week</h2>
        <span className="text-xs text-slate-400 font-medium">
          {filled}/7 ingevuld · {protocolHit}/{plannedDays} protocol
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((d) => {
          const iso = d.toISOString().slice(0, 10)
          const dow = d.getDay()
          const dayLabel = DAY_LABELS[dow]
          const dayNum = d.getDate()
          const planned = WEEKLY_PROTOCOL[dow]
          const entry = entryMap[iso]
          const actual = entry?.training
          const isToday = iso === today
          const isPast = iso < today

          const cfg = actual ? SPORT_CONFIG[actual] : null
          const plannedCfg = SPORT_CONFIG[planned]

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`flex flex-col items-center rounded-xl p-1.5 transition-all group ${
                isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
              } ${actual ? 'bg-slate-50' : isPast ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
            >
              {/* Day label */}
              <span className={`text-xs font-medium ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                {dayLabel}
              </span>
              <span className={`text-xs mb-1.5 ${isToday ? 'text-emerald-600 font-bold' : 'text-slate-300'}`}>
                {dayNum}
              </span>

              {/* Actual sport (big) */}
              {actual ? (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                  title={cfg.label}
                >
                  <SportIcon type={actual} size={16} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-100 flex items-center justify-center mb-1 group-hover:border-slate-200 transition-colors">
                  <span className="text-slate-200 text-lg leading-none">+</span>
                </div>
              )}

              {/* Planned sport (small, muted) */}
              <div
                className="flex items-center justify-center opacity-40"
                style={{ color: plannedCfg?.color ?? '#94a3b8' }}
                title={`Gepland: ${plannedCfg?.label}`}
              >
                <SportIcon type={planned} size={10} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
