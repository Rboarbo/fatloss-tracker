import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import WeekView from '../components/WeekView'
import SportStats from '../components/SportStats'
import MilonChart from '../components/MilonChart'
import { SPORT_CONFIG } from '../lib/sport-config'

export default function Dashboard({ entries, workouts, settings, onSelectDate }) {
  if (entries.length === 0) {
    return (
      <>
        <div className="mb-4">
          <WeekView entries={entries} onSelectDate={onSelectDate} />
        </div>
        <div className="flex flex-col items-center justify-center h-48 text-center px-8">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-slate-700 font-semibold">Nog geen metingen</p>
          <p className="text-slate-400 text-sm mt-1">Voeg je eerste meting in via het tabblad Invoer.</p>
        </div>
      </>
    )
  }

  const weightEntries = entries.filter((e) => e.weight != null)
  const latest = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1] : null
  const prev = weightEntries.length > 1 ? weightEntries[weightEntries.length - 2] : null
  const startWeight = settings.startWeight ?? weightEntries[0]?.weight
  const lost = latest && startWeight ? startWeight - latest.weight : 0
  const toGo = settings.goalWeight && latest ? Math.max(0, latest.weight - settings.goalWeight) : null
  const progress =
    settings.goalWeight && startWeight && startWeight !== settings.goalWeight
      ? Math.min(100, Math.max(0, (lost / (startWeight - settings.goalWeight)) * 100))
      : null
  const trend = latest && prev ? latest.weight - prev.weight : null

  const hasCalories = entries.some((e) => e.calories)
  const hasWaist = entries.some((e) => e.waist)
  const hasWorkout = entries.some((e) => e.trainingDuration)
  const hasBodyFat = entries.some((e) => e.bodyFatPct != null)
  const hasLeanMass = entries.some((e) => e.leanMassKg != null)

  // Latest Apple Health metrics
  const latestWithBodyFat = [...entries].reverse().find((e) => e.bodyFatPct != null)
  const latestWithLean = [...entries].reverse().find((e) => e.leanMassKg != null)
  const latestWithVO2 = [...entries].reverse().find((e) => e.vo2Max != null)
  const latestWithHR = [...entries].reverse().find((e) => e.restingHR != null)

  const chartData = entries.map((e) => ({
    date: shortDate(e.date),
    weight: e.weight ?? null,
    calories: e.calories ?? null,
    waist: e.waist ?? null,
    bodyFat: e.bodyFatPct ?? null,
    leanMass: e.leanMassKg ?? null,
  }))

  // Workout volume per week (last 8 weeks), stacked per sport
  const volumeData = buildVolumeData(entries)
  const volumeSports = [...new Set(entries.filter((e) => e.training && e.trainingDuration).map((e) => e.training))]

  return (
    <div className="space-y-4">
      {/* Week view */}
      <WeekView entries={entries} onSelectDate={onSelectDate} />

      {/* Hero card */}
      {latest && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Huidig gewicht</p>
              <p className="text-5xl font-bold mt-1 leading-none">
                {latest.weight}
                <span className="text-2xl font-normal ml-1">{settings.unit}</span>
              </p>
              {trend !== null && (
                <p className={`text-sm mt-2 font-medium ${trend <= 0 ? 'text-emerald-200' : 'text-red-300'}`}>
                  {trend <= 0 ? '↓' : '↑'} {Math.abs(trend).toFixed(1)} {settings.unit} t.o.v. vorige meting
                </p>
              )}
            </div>
            <div className="text-right bg-white/10 rounded-xl px-4 py-3">
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Verloren</p>
              <p className="text-2xl font-bold mt-0.5">
                {lost >= 0 ? '-' : '+'}{Math.abs(lost).toFixed(1)}
              </p>
              <p className="text-emerald-200 text-xs">{settings.unit}</p>
            </div>
          </div>

          {progress !== null && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-emerald-100 mb-2">
                <span>Voortgang naar doel ({settings.goalWeight} {settings.unit})</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {toGo !== null && toGo > 0 && (
                <p className="text-xs text-emerald-100 mt-2">Nog {toGo.toFixed(1)} {settings.unit} te gaan</p>
              )}
              {toGo === 0 && (
                <p className="text-xs text-white font-semibold mt-2">🎉 Doel bereikt!</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Metingen" value={entries.length} sub="totaal" accent="slate" />
        <StatCard
          label="Gem. verlies"
          value={weightEntries.length > 1 ? (lost / weightEntries.length).toFixed(2) : '–'}
          sub={`${settings.unit}/dag`}
          accent="emerald"
        />
        <StatCard
          label="Doelgewicht"
          value={settings.goalWeight ?? '–'}
          sub={settings.goalWeight ? settings.unit : 'stel in'}
          accent="teal"
        />
      </div>

      {/* Apple Health body composition stats */}
      {(hasBodyFat || hasLeanMass || latestWithVO2 || latestWithHR) && (
        <div className="grid grid-cols-2 gap-3">
          {latestWithBodyFat && (
            <BodyStatCard
              label="Vetpercentage"
              value={latestWithBodyFat.bodyFatPct.toFixed(1)}
              unit="%"
              sub="Apple Health"
              color="#f97316"
            />
          )}
          {latestWithLean && (
            <BodyStatCard
              label="Vetvrije massa"
              value={latestWithLean.leanMassKg.toFixed(1)}
              unit="kg"
              sub="behoud spier"
              color="#10b981"
            />
          )}
          {latestWithVO2 && (
            <BodyStatCard
              label="VO₂ max"
              value={latestWithVO2.vo2Max.toFixed(1)}
              unit="ml/kg·min"
              sub="conditie"
              color="#60a5fa"
            />
          )}
          {latestWithHR && (
            <BodyStatCard
              label="Rust-hartslag"
              value={latestWithHR.restingHR}
              unit="bpm"
              sub="gemiddeld"
              color="#a78bfa"
            />
          )}
        </div>
      )}

      {/* Dagelijks bewegen */}
      <DailyMovementCard entries={entries} />

      {/* Cardioconditie trend */}
      <CardioTrendCard entries={entries} />

      {/* Weight area chart */}
      {weightEntries.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Gewichtsverloop</h2>
          <p className="text-xs text-slate-400 mb-4">{settings.unit} per dag</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData.filter((d) => d.weight)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} ${settings.unit}`, 'Gewicht']} />
              {settings.goalWeight && (
                <ReferenceLine
                  y={settings.goalWeight}
                  stroke="#f59e0b"
                  strokeDasharray="5 4"
                  label={{ value: `Doel: ${settings.goalWeight}`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
                />
              )}
              <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2.5} fill="url(#weightGrad)"
                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body fat % trend */}
      {hasBodyFat && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Vetpercentage</h2>
          <p className="text-xs text-slate-400 mb-4">% lichaamsvet — Apple Health</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData.filter((d) => d.bodyFat)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Vetpercentage']} />
              <Line type="monotone" dataKey="bodyFat" stroke="#f97316" strokeWidth={2}
                dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lean mass trend */}
      {hasLeanMass && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Vetvrije massa</h2>
          <p className="text-xs text-slate-400 mb-4">kg spiermassa — Apple Health</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData.filter((d) => d.leanMass)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)} kg`, 'Vetvrije massa']} />
              <Line type="monotone" dataKey="leanMass" stroke="#10b981" strokeWidth={2}
                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calorie bar chart */}
      {hasCalories && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Calorieën</h2>
          <p className="text-xs text-slate-400 mb-4">kcal per dag</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData.filter((d) => d.calories)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kcal`, 'Calorieën']} />
              <Bar dataKey="calories" fill="#f59e0b" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Waist area chart */}
      {hasWaist && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Taillemeting</h2>
          <p className="text-xs text-slate-400 mb-4">centimeter per dag</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData.filter((d) => d.waist)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="waistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} cm`, 'Taille']} />
              <Area type="monotone" dataKey="waist" stroke="#8b5cf6" strokeWidth={2} fill="url(#waistGrad)"
                dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workout volume per week */}
      {hasWorkout && volumeData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Workout volume per week</h2>
          <p className="text-xs text-slate-400 mb-4">minuten per sport</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [`${v} min`, SPORT_CONFIG[name]?.label ?? name]}
              />
              {volumeSports.map((sport) => (
                <Bar
                  key={sport}
                  dataKey={sport}
                  stackId="volume"
                  fill={SPORT_CONFIG[sport]?.color ?? '#94a3b8'}
                  radius={volumeSports[volumeSports.length - 1] === sport ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sport statistics */}
      <SportStats entries={entries} />

      {/* Week samenvatting */}
      <WeekSummaryCard entries={entries} />

      {/* Milon progression chart */}
      <MilonChart entries={entries} />

      {/* Recent entries */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-700 px-4 pt-4 pb-3">Recente metingen</h2>
        <ul className="divide-y divide-slate-50">
          {[...entries].reverse().slice(0, 8).map((e, i) => {
            const sport = e.training ?? 'rust'
            const cfg = SPORT_CONFIG[sport]
            return (
              <li key={e.date} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <span className="text-slate-400 text-xs w-14 flex-shrink-0">{shortDate(e.date)}</span>
                <span className="font-semibold text-slate-800 text-sm flex-1">
                  {e.weight != null ? `${e.weight} ${settings.unit}` : '—'}
                </span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {e.weight == null && (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
                    >
                      {e._fromAppleHealth && <span title="Apple Health">🍎</span>}
                      {cfg.label}
                    </span>
                  )}
                  {e.calories && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                      {e.calories} kcal
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function BodyStatCard({ label, value, unit, sub, color }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border-l-4" style={{ borderColor: color }}>
      <p className="text-xs text-slate-500 leading-tight">{label}</p>
      <p className="text-xl font-bold mt-1 leading-none" style={{ color }}>
        {value}
        <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function StatCard({ label, value, sub, accent }) {
  const styles = {
    slate: 'bg-slate-50 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    teal: 'bg-teal-50 text-teal-700',
  }
  return (
    <div className={`${styles[accent]} rounded-xl p-3`}>
      <p className="text-xs text-slate-500 leading-tight">{label}</p>
      <p className="text-xl font-bold mt-1 leading-none">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  )
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

const tooltipStyle = {
  background: '#1e293b',
  border: 'none',
  borderRadius: 10,
  color: 'white',
  fontSize: 12,
  padding: '8px 12px',
}

function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const wk = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `W${wk}`
}

function buildVolumeData(entries) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 56) // 8 weeks
  const cutoffISO = cutoff.toISOString().slice(0, 10)

  const weekMap = {}
  entries
    .filter((e) => e.date >= cutoffISO && e.trainingDuration && e.training)
    .forEach((e) => {
      const wk = getISOWeek(e.date)
      if (!weekMap[wk]) weekMap[wk] = { week: wk }
      weekMap[wk][e.training] = (weekMap[wk][e.training] ?? 0) + e.trainingDuration
    })

  return Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week))
}

const STEP_GOAL = 8000
const DAY_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

function DailyMovementCard({ entries }) {
  const today = new Date()
  const todayISO = today.toISOString().slice(0, 10)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 6 + i)
    return d.toISOString().slice(0, 10)
  })
  const entryByDate = Object.fromEntries(entries.map((e) => [e.date, e]))

  if (!days.some((d) => entryByDate[d]?.stepCount != null)) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Dagelijks bewegen</h2>
      <p className="text-xs text-slate-400 mb-3">Stappen, km en kcal — Apple Health</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const e = entryByDate[date]
          const steps = e?.stepCount ?? null
          const km = e?.walkingDistanceKm ?? null
          const kcal = e?.activeEnergyKcal ?? null
          const isToday = date === todayISO
          const dayLabel = DAY_NL[new Date(date + 'T12:00:00').getDay()]
          let stepColor = '#cbd5e1'
          let barPct = 0
          if (steps != null) {
            barPct = Math.min(100, (steps / STEP_GOAL) * 100)
            stepColor = steps >= STEP_GOAL ? '#10b981' : steps >= 5000 ? '#f97316' : '#ef4444'
          }
          return (
            <div
              key={date}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl ${isToday ? 'bg-slate-50' : ''}`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-slate-600' : 'text-slate-400'}`}>
                {dayLabel}
              </span>
              <div className="w-full px-1">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: stepColor }} />
                </div>
              </div>
              <span className="text-xs font-bold leading-none" style={{ color: steps != null ? stepColor : '#e2e8f0' }}>
                {steps != null ? (steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps) : '–'}
              </span>
              {km != null && (
                <span className="text-xs text-slate-400 leading-none">{km.toFixed(1)}km</span>
              )}
              {kcal != null && (
                <span className="text-xs text-slate-300 leading-none">{Math.round(kcal)}</span>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-xs text-slate-300 mt-2">Doel: {STEP_GOAL.toLocaleString('nl-NL')} stappen/dag</p>
    </div>
  )
}

function CardioTrendCard({ entries }) {
  const twoWeeksAgoISO = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return d.toISOString().slice(0, 10)
  })()
  const rev = [...entries].reverse()
  const old = entries.filter((e) => e.date <= twoWeeksAgoISO).reverse()

  const allMetrics = [
    {
      key: 'vo2Max', label: 'VO₂ max', unit: 'ml/kg·min', color: '#60a5fa', higherIsBetter: true,
      data: entries.filter((e) => e.vo2Max != null).map((e) => ({ date: e.date, v: e.vo2Max })),
      latest: rev.find((e) => e.vo2Max != null)?.vo2Max ?? null,
      prev: old.find((e) => e.vo2Max != null)?.vo2Max ?? null,
    },
    {
      key: 'restingHR', label: 'Rust-HR', unit: 'bpm', color: '#a78bfa', higherIsBetter: false,
      data: entries.filter((e) => e.restingHR != null).map((e) => ({ date: e.date, v: e.restingHR })),
      latest: rev.find((e) => e.restingHR != null)?.restingHR ?? null,
      prev: old.find((e) => e.restingHR != null)?.restingHR ?? null,
    },
    {
      key: 'hrv', label: 'HRV', unit: 'ms', color: '#34d399', higherIsBetter: true,
      data: entries.filter((e) => e.hrv != null).map((e) => ({ date: e.date, v: e.hrv })),
      latest: rev.find((e) => e.hrv != null)?.hrv ?? null,
      prev: old.find((e) => e.hrv != null)?.hrv ?? null,
    },
    {
      key: 'walkingHR', label: 'Loop-HR', unit: 'bpm', color: '#fb923c', higherIsBetter: false,
      data: entries.filter((e) => e.walkingHR != null).map((e) => ({ date: e.date, v: e.walkingHR })),
      latest: rev.find((e) => e.walkingHR != null)?.walkingHR ?? null,
      prev: old.find((e) => e.walkingHR != null)?.walkingHR ?? null,
    },
  ].filter((m) => m.data.length > 0)

  if (allMetrics.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Cardioconditie</h2>
      <p className="text-xs text-slate-400 mb-3">Trends — Apple Health</p>
      <div className="grid grid-cols-2 gap-4">
        {allMetrics.map((m) => {
          const diff = m.latest != null && m.prev != null ? m.latest - m.prev : null
          const improved = diff != null ? (m.higherIsBetter ? diff > 0 : diff < 0) : null
          const arrow = diff == null ? null : diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
          const trendColor = improved == null ? '#94a3b8' : improved ? '#10b981' : '#f97316'
          return (
            <div key={m.key}>
              <p className="text-xs font-medium text-slate-500 mb-0.5">{m.label}</p>
              {m.latest != null && (
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-lg font-bold leading-none" style={{ color: m.color }}>
                    {Number(m.latest).toFixed(m.unit === 'ms' || m.unit === 'bpm' ? 0 : 1)}
                  </span>
                  <span className="text-xs text-slate-400">{m.unit}</span>
                  {arrow && (
                    <span className="text-xs font-semibold ml-0.5" style={{ color: trendColor }}>{arrow}</span>
                  )}
                </div>
              )}
              {m.data.length > 1 && (
                <ResponsiveContainer width="100%" height={50}>
                  <LineChart data={m.data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="v" stroke={m.color} strokeWidth={1.5} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekSummaryCard({ entries }) {
  const today = new Date()
  const dow = today.getDay() === 0 ? 7 : today.getDay()
  const weekStartISO = (() => {
    const d = new Date(today)
    d.setDate(today.getDate() - dow + 1)
    return d.toISOString().slice(0, 10)
  })()
  const weekEndISO = today.toISOString().slice(0, 10)

  const wkEntries = entries.filter((e) => e.date >= weekStartISO && e.date <= weekEndISO)
  const totalSteps = wkEntries.reduce((s, e) => s + (e.stepCount ?? 0), 0)
  const withHR = wkEntries.filter((e) => e.restingHR != null)
  const avgHR = withHR.length > 0
    ? Math.round(withHR.reduce((s, e) => s + e.restingHR, 0) / withHR.length)
    : null
  const activeDays = wkEntries.filter((e) => (e.stepCount ?? 0) >= 7500 || e.trainingDuration != null).length

  if (totalSteps === 0 && avgHR == null) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Week samenvatting</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-2xl font-bold text-emerald-600">
            {totalSteps > 0 ? `${Math.round(totalSteps / 1000)}k` : '–'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">stappen deze week</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-violet-500">{avgHR ?? '–'}</p>
          <p className="text-xs text-slate-400 mt-0.5">gem. rust-HR bpm</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-teal-600">
            {activeDays}<span className="text-sm font-normal text-slate-400">/7</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">actieve dagen</p>
        </div>
      </div>
    </div>
  )
}
