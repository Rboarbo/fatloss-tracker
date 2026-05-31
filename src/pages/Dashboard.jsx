import SportStats from '../components/SportStats'

export default function Dashboard({ entries, workouts, settings, onSelectDate }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-8">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-slate-700 font-semibold">Nog geen metingen</p>
        <p className="text-slate-400 text-sm mt-1">Voeg je eerste meting in via het tabblad Invoer.</p>
      </div>
    )
  }

  const today = new Date()
  const todayNL = today.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const weekNum = settings.startDate
    ? Math.max(1, Math.ceil((today - new Date(settings.startDate)) / (7 * 24 * 3600 * 1000)))
    : null

  return (
    <div className="space-y-4">

      {/* 1. Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <h1 className="font-serif text-3xl text-slate-900 leading-tight">Cut Protocol</h1>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{todayNL}</p>
        </div>
        {weekNum != null && (
          <div className="text-right mt-1">
            <span className="text-sm font-semibold text-orange-500">
              Week {Math.min(weekNum, 12)} van 12
            </span>
          </div>
        )}
      </div>

      {/* 2. Body Composition */}
      <BodyCompositionCard entries={entries} />

      {/* 3. Performance Score */}
      <PerformanceScoreCard entries={entries} />

      {/* 4. Vitals Strip */}
      <VitalsStrip entries={entries} settings={settings} />

      {/* 5. Sport statistics */}
      <SportStats entries={entries} />

      {/* 6. Recent measurements */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-700 px-4 pt-4 pb-3">Recente metingen</h2>
        <ul className="divide-y divide-slate-50">
          {[...entries].reverse().slice(0, 8).map((e, i) => (
            <li key={e.date} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <span className="text-slate-400 text-xs w-14 flex-shrink-0">{shortDate(e.date)}</span>
              <span className="font-semibold text-slate-800 text-sm flex-1">
                {e.weight != null ? `${Number(e.weight).toFixed(1)} ${settings.unit}` : '—'}
              </span>
              {e.calories && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  {e.calories} kcal
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}

// ─── Body Composition ─────────────────────────────────────────────────────────

function BodyCompositionCard({ entries }) {
  const rev = [...entries].reverse()
  const latestBF = rev.find(e => e.bodyFatPct != null)
  if (!latestBF) return null

  const prevBF = rev.find(e => e.bodyFatPct != null && e.date < latestBF.date)
  const latestLean = rev.find(e => e.leanMassKg != null)
  const prevLean = latestLean
    ? rev.find(e => e.leanMassKg != null && e.date < latestLean.date)
    : null
  const latestWeight = rev.find(e => e.weight != null)

  const fatMassKg = latestWeight != null ? latestWeight.weight * latestBF.bodyFatPct / 100 : null
  const leanMassKg = latestLean?.leanMassKg
    ?? (fatMassKg != null && latestWeight != null ? latestWeight.weight - fatMassKg : null)
  const totalKg = fatMassKg != null && leanMassKg != null ? fatMassKg + leanMassKg : null
  const fatBarPct = totalKg ? (fatMassKg / totalKg) * 100 : null

  const fatPctDelta = prevBF ? latestBF.bodyFatPct - prevBF.bodyFatPct : null
  const leanDelta = latestLean && prevLean ? latestLean.leanMassKg - prevLean.leanMassKg : null

  let interpretation = null
  if (fatPctDelta != null && leanDelta != null) {
    const fatDown = fatPctDelta < -0.05
    const leanDown = leanDelta < -0.2
    const leanStable = Math.abs(leanDelta) <= 0.2
    if (fatDown && leanStable) interpretation = '✓ Ideaal: vet verlies zonder spierverlies'
    else if (fatDown && leanDown) interpretation = '⚠ Let op: ook spiermassa daalt'
    else interpretation = '→ Geen significante verandering'
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Lichaamssamenstelling</h2>

      {/* Stacked bar */}
      {fatBarPct != null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{fatMassKg.toFixed(1)} kg vet</span>
            <span>{leanMassKg.toFixed(1)} kg spier</span>
          </div>
          <div className="flex h-5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${fatBarPct}%` }} />
            <div className="h-full bg-teal-400 flex-1" />
          </div>
        </div>
      )}

      {/* Two stat blocks */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-3xl font-bold text-amber-500 leading-none">
            {latestBF.bodyFatPct.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">lichaamsvet</p>
          {fatPctDelta != null && (
            <p className={`text-xs font-semibold mt-1 ${fatPctDelta <= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {fatPctDelta <= 0 ? '▼' : '▲'} {Math.abs(fatPctDelta).toFixed(2)}%
            </p>
          )}
        </div>
        {leanMassKg != null && (
          <div>
            <p className="text-3xl font-bold text-teal-500 leading-none">
              {leanMassKg.toFixed(1)}<span className="text-lg font-normal text-slate-400 ml-1">kg</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">spiermassa</p>
            {leanDelta != null && (
              <p className={`text-xs font-semibold mt-1 ${leanDelta >= -0.1 ? 'text-emerald-500' : 'text-orange-400'}`}>
                {leanDelta >= 0 ? '▲' : '▼'} {Math.abs(leanDelta).toFixed(1)} kg
              </p>
            )}
          </div>
        )}
      </div>

      {/* Interpretation */}
      {interpretation && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          {interpretation}
        </p>
      )}
    </div>
  )
}

// ─── Performance Score ────────────────────────────────────────────────────────

function toAvg(arr) {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null
}

function computeWeekScore(weekEntries, prevWeekEntries) {
  const trainedDays = weekEntries.filter(e => e.trainingDuration != null).length
  const trainingScore = Math.min(40, (trainedDays / 4) * 40)

  const activeDays = weekEntries.filter(e => (e.stepCount ?? 0) >= 8000).length
  const stepsScore = (activeDays / 7) * 30

  const thisHR = toAvg(weekEntries.filter(e => e.restingHR != null).map(e => e.restingHR))
  const prevHR = toAvg(prevWeekEntries.filter(e => e.restingHR != null).map(e => e.restingHR))

  let cardioScore = 15
  if (thisHR != null && prevHR != null) {
    cardioScore = thisHR <= prevHR ? 30 : thisHR <= prevHR + 2 ? 15 : 0
  }

  return {
    total: Math.round(trainingScore + stepsScore + cardioScore),
    training: Math.round(trainingScore),
    steps: Math.round(stepsScore),
    cardio: Math.round(cardioScore),
  }
}

function getWeekSlice(entries, mondayDate) {
  const start = mondayDate.toISOString().slice(0, 10)
  const end = new Date(mondayDate)
  end.setDate(mondayDate.getDate() + 6)
  return entries.filter(e => e.date >= start && e.date <= end.toISOString().slice(0, 10))
}

function PerformanceScoreCard({ entries }) {
  const today = new Date()
  const dow = today.getDay() === 0 ? 7 : today.getDay()

  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - dow + 1)
  thisMonday.setHours(0, 0, 0, 0)

  const prevMonday = new Date(thisMonday)
  prevMonday.setDate(thisMonday.getDate() - 7)

  const weekStartISO = thisMonday.toISOString().slice(0, 10)
  const todayISO = today.toISOString().slice(0, 10)
  const weekEntries = entries.filter(e => e.date >= weekStartISO && e.date <= todayISO)
  const prevWeekEntries = getWeekSlice(entries, prevMonday)

  const score = computeWeekScore(weekEntries, prevWeekEntries)

  const histScores = [4, 3, 2, 1].map(n => {
    const wMonday = new Date(thisMonday)
    wMonday.setDate(thisMonday.getDate() - n * 7)
    const pwMonday = new Date(wMonday)
    pwMonday.setDate(wMonday.getDate() - 7)
    return { n, ...computeWeekScore(getWeekSlice(entries, wMonday), getWeekSlice(entries, pwMonday)) }
  })

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Performance Score</h2>
        <span className="text-xs text-slate-400">deze week</span>
      </div>

      <div className="flex items-center gap-4">
        <ScoreDonut score={score.total} />
        <div className="grid grid-cols-2 gap-2 flex-1">
          {histScores.map(hs => (
            <div key={hs.n} className="flex flex-col items-center gap-1">
              <MiniDonut score={hs.total} />
              <span className="text-xs text-slate-400">W-{hs.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <BreakdownBar label="🏋 Training" score={score.training} max={40} color="#f97316" />
        <BreakdownBar label="👟 Beweging" score={score.steps} max={30} color="#10b981" />
        <BreakdownBar label="❤️ Conditie" score={score.cardio} max={30} color="#a78bfa" />
      </div>
    </div>
  )
}

function ScoreDonut({ score, size = 140 }) {
  const r = 50, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(100, score)) / 100 * circ
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444'
  const stars = Math.floor(score / 20)

  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={11} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth={11}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="30" fontWeight="700" fill={color}>{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fill="#94a3b8">
        {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      </text>
    </svg>
  )
}

function MiniDonut({ score, size = 48 }) {
  const r = 16, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(100, score)) / 100 * circ
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f97316' : '#ef4444'

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={color}>{score}</text>
    </svg>
  )
}

function BreakdownBar({ label, score, max, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${(score / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-semibold text-slate-600 w-10 text-right">{score}/{max}</span>
    </div>
  )
}

// ─── Vitals Strip ─────────────────────────────────────────────────────────────

function VitalsStrip({ entries, settings }) {
  const rev = [...entries].reverse()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenISO = sevenDaysAgo.toISOString().slice(0, 10)

  const metrics = [
    {
      label: 'Gewicht',
      unit: settings.unit ?? 'kg',
      latest: rev.find(e => e.weight != null)?.weight,
      prev: rev.find(e => e.weight != null && e.date <= sevenISO)?.weight,
      higherIsBetter: false,
      fmt: v => Number(v).toFixed(1),
    },
    {
      label: 'Rust-HR',
      unit: 'bpm',
      latest: rev.find(e => e.restingHR != null)?.restingHR,
      prev: rev.find(e => e.restingHR != null && e.date <= sevenISO)?.restingHR,
      higherIsBetter: false,
      fmt: v => String(Math.round(v)),
    },
    {
      label: 'VO₂ max',
      unit: '',
      latest: rev.find(e => e.vo2Max != null)?.vo2Max,
      prev: rev.find(e => e.vo2Max != null && e.date <= sevenISO)?.vo2Max,
      higherIsBetter: true,
      fmt: v => Number(v).toFixed(1),
    },
    {
      label: 'HRV',
      unit: 'ms',
      latest: rev.find(e => e.hrv != null)?.hrv,
      prev: rev.find(e => e.hrv != null && e.date <= sevenISO)?.hrv,
      higherIsBetter: true,
      fmt: v => String(Math.round(v)),
    },
  ]

  if (!metrics.some(m => m.latest != null)) return null

  const THRESHOLD = 0.1

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
      <div className="grid grid-cols-4 divide-x divide-slate-100">
        {metrics.map(m => {
          const diff = m.latest != null && m.prev != null ? m.latest - m.prev : null
          const arrowChar = diff == null ? null
            : diff > THRESHOLD ? '↑' : diff < -THRESHOLD ? '↓' : '→'
          const isImproved = diff == null ? null
            : m.higherIsBetter ? diff > THRESHOLD : diff < -THRESHOLD
          const isWorsened = diff == null ? null
            : m.higherIsBetter ? diff < -THRESHOLD : diff > THRESHOLD
          const arrowColor = isImproved ? '#10b981' : isWorsened ? '#ef4444' : '#94a3b8'

          return (
            <div key={m.label} className="text-center px-2 first:pl-0 last:pr-0">
              <p className="text-xs text-slate-400 leading-tight mb-1">{m.label}</p>
              {m.latest != null ? (
                <>
                  <p className="text-base font-bold text-slate-800 leading-none">
                    {m.fmt(m.latest)}
                    {m.unit && <span className="text-xs font-normal text-slate-400 ml-0.5">{m.unit}</span>}
                  </p>
                  {arrowChar && (
                    <p className="text-xs mt-0.5 font-medium" style={{ color: arrowColor }}>{arrowChar}</p>
                  )}
                </>
              ) : (
                <p className="text-base font-bold text-slate-300">–</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortDate(iso) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
