import { Info } from 'lucide-react'
import SportStats from '../components/SportStats'
import Tooltip from '../components/Tooltip'

// ─── Age & Norms ──────────────────────────────────────────────────────────────

function getAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// VO2 max normen gebaseerd op sportzorg.nl
const VO2_NORMS = {
  male: [
    { maxAge: 24, zeerSlecht: 32, slecht: 37, redelijk: 43, gemiddeld: 50, goed: 56, zeerGoed: 62 },
    { maxAge: 29, zeerSlecht: 31, slecht: 35, redelijk: 42, gemiddeld: 48, goed: 53, zeerGoed: 59 },
    { maxAge: 34, zeerSlecht: 29, slecht: 34, redelijk: 40, gemiddeld: 45, goed: 51, zeerGoed: 56 },
    { maxAge: 39, zeerSlecht: 28, slecht: 32, redelijk: 38, gemiddeld: 43, goed: 48, zeerGoed: 54 },
    { maxAge: 44, zeerSlecht: 26, slecht: 31, redelijk: 35, gemiddeld: 41, goed: 46, zeerGoed: 51 },
    { maxAge: 49, zeerSlecht: 25, slecht: 29, redelijk: 34, gemiddeld: 39, goed: 43, zeerGoed: 48 },
    { maxAge: 54, zeerSlecht: 24, slecht: 27, redelijk: 32, gemiddeld: 36, goed: 41, zeerGoed: 46 },
    { maxAge: 59, zeerSlecht: 22, slecht: 26, redelijk: 30, gemiddeld: 34, goed: 39, zeerGoed: 43 },
    { maxAge: 999, zeerSlecht: 21, slecht: 24, redelijk: 28, gemiddeld: 32, goed: 36, zeerGoed: 40 },
  ],
  female: [
    { maxAge: 24, zeerSlecht: 27, slecht: 31, redelijk: 36, gemiddeld: 41, goed: 46, zeerGoed: 51 },
    { maxAge: 29, zeerSlecht: 26, slecht: 30, redelijk: 35, gemiddeld: 40, goed: 44, zeerGoed: 49 },
    { maxAge: 34, zeerSlecht: 25, slecht: 29, redelijk: 33, gemiddeld: 37, goed: 42, zeerGoed: 46 },
    { maxAge: 39, zeerSlecht: 24, slecht: 27, redelijk: 31, gemiddeld: 35, goed: 40, zeerGoed: 44 },
    { maxAge: 44, zeerSlecht: 22, slecht: 25, redelijk: 29, gemiddeld: 33, goed: 37, zeerGoed: 41 },
    { maxAge: 49, zeerSlecht: 21, slecht: 23, redelijk: 27, gemiddeld: 31, goed: 35, zeerGoed: 38 },
    { maxAge: 54, zeerSlecht: 19, slecht: 22, redelijk: 25, gemiddeld: 29, goed: 32, zeerGoed: 36 },
    { maxAge: 59, zeerSlecht: 18, slecht: 20, redelijk: 23, gemiddeld: 27, goed: 30, zeerGoed: 33 },
    { maxAge: 999, zeerSlecht: 16, slecht: 18, redelijk: 21, gemiddeld: 24, goed: 27, zeerGoed: 30 },
  ],
}

function getVO2Category(vo2, age, gender = 'male') {
  const table = VO2_NORMS[gender] ?? VO2_NORMS.male
  const row = table.find(r => age <= r.maxAge) ?? table[table.length - 1]
  if (vo2 <= row.zeerSlecht) return { label: 'Zeer slecht', color: '#ef4444', row }
  if (vo2 <= row.slecht)     return { label: 'Slecht',      color: '#f97316', row }
  if (vo2 <= row.redelijk)   return { label: 'Redelijk',    color: '#eab308', row }
  if (vo2 <= row.gemiddeld)  return { label: 'Gemiddeld',   color: '#84cc16', row }
  if (vo2 <= row.goed)       return { label: 'Goed',        color: '#22c55e', row }
  if (vo2 <= row.zeerGoed)   return { label: 'Zeer goed',   color: '#10b981', row }
  return                            { label: 'Uitstekend',  color: '#06b6d4', row }
}

function getVO2AgeBucket(age, gender) {
  const table = VO2_NORMS[gender] ?? VO2_NORMS.male
  const idx = table.findIndex(r => age <= r.maxAge)
  const row = idx === -1 ? table[table.length - 1] : table[idx]
  const maxAge = row.maxAge === 999 ? '60+' : row.maxAge
  const minAge = idx <= 0 ? 18 : table[idx - 1].maxAge + 1
  return `${minAge}–${maxAge}`
}

function getNorms(age) {
  const hr = age < 40 ? { excellent: 55, good: 61, average: 67, poor: 73 }
    : age < 50 ? { excellent: 57, good: 63, average: 69, poor: 75 }
    : age < 60 ? { excellent: 58, good: 64, average: 70, poor: 76 }
    : { excellent: 59, good: 65, average: 71, poor: 77 }

  const hrv = age < 40 ? { good: 60, average: 40, low: 25 }
    : age < 50 ? { good: 50, average: 35, low: 20 }
    : age < 60 ? { good: 45, average: 30, low: 18 }
    : { good: 40, average: 25, low: 15 }

  return { hr, hrv }
}

function hrBadge(val, norms) {
  const n = norms?.hr
  if (!n) return null
  if (val <= n.excellent) return { label: 'Uitstekend', color: '#10b981' }
  if (val <= n.good)      return { label: 'Goed', color: '#84cc16' }
  if (val <= n.average)   return { label: 'Gemiddeld', color: '#eab308' }
  return { label: 'Hoog', color: '#ef4444' }
}

function hrvBadge(val, norms) {
  const n = norms?.hrv
  if (!n) return null
  if (val >= n.good)    return { label: 'Goed', color: '#10b981' }
  if (val >= n.average) return { label: 'Gemiddeld', color: '#eab308' }
  return { label: 'Laag', color: '#f97316' }
}

// ─── Static tooltip strings ───────────────────────────────────────────────────

const TT_SCORE = `Je wekelijkse score op basis van drie pijlers:\n🏋 Training (40 pt) — hoeveel geplande sessies voltooid\n👟 Beweging (30 pt) — dagen met ≥8.000 stappen\n❤️ Conditie (30 pt) — rust-hartslag trend t.o.v. vorige week\nScore 80+ = groen · 60-79 = oranje · <60 = rood`
const TT_TRAINING = `Geplande sessies dit protocol: Milon (ma + wo), Padel training (do), MTB (zo) = 4 verplichte sessies.\nScore = voltooide sessies ÷ 4 × 40 punten.\nPadel match (za) telt als bonus.`
const TT_BEWEGING = `Doel: minimaal 8.000 stappen per dag.\nScore = actieve dagen ÷ 7 × 30 punten.\n8.000 stappen = ca. 6 km lopen en is de minimale drempel voor metabole gezondheid op jouw leeftijd.`
const TT_CONDITIE = `Vergelijkt je gemiddelde rust-hartslag deze week met vorige week. Daling = betere cardiofitness.\nStabiel of daling ≤2 bpm = 15 pt · Daling >2 bpm = 30 pt\nStijging = 0 pt. Rust-HR daalt gemiddeld 1 bpm per 4 weken bij consistent trainen.`

// ─── Main component ───────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400 capitalize">{todayNL}</p>
        {weekNum != null && (
          <span className="text-sm font-semibold text-orange-500">
            Week {Math.min(weekNum, 12)} van 12
          </span>
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
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-semibold text-slate-700">Performance Score</h2>
          <Tooltip content={TT_SCORE}>
            <Info size={14} color="#737373" />
          </Tooltip>
        </div>
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
        <BreakdownBar label="🏋 Training" score={score.training} max={40} color="#f97316" tooltip={TT_TRAINING} />
        <BreakdownBar label="👟 Beweging" score={score.steps} max={30} color="#10b981" tooltip={TT_BEWEGING} />
        <BreakdownBar label="❤️ Conditie" score={score.cardio} max={30} color="#a78bfa" tooltip={TT_CONDITIE} />
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

function BreakdownBar({ label, score, max, color, tooltip }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-slate-500 w-24 flex-shrink-0">
        {label}
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info size={11} color="#737373" />
          </Tooltip>
        )}
      </span>
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

  const age    = getAge(settings.birthDate)
  const gender = settings.gender ?? 'male'
  const norms  = age != null ? getNorms(age) : null

  const latestWeight = rev.find(e => e.weight != null)?.weight
  const latestHR     = rev.find(e => e.restingHR != null)?.restingHR
  const latestVO2    = rev.find(e => e.vo2Max != null)?.vo2Max
  const latestHRV    = rev.find(e => e.hrv != null)?.hrv
  const prevWeight   = rev.find(e => e.weight != null && e.date <= sevenISO)?.weight
  const prevHR       = rev.find(e => e.restingHR != null && e.date <= sevenISO)?.restingHR
  const prevVO2      = rev.find(e => e.vo2Max != null && e.date <= sevenISO)?.vo2Max
  const prevHRV      = rev.find(e => e.hrv != null && e.date <= sevenISO)?.hrv

  // VO2 badge & dynamic tooltip
  const vo2Cat   = (latestVO2 != null && age != null) ? getVO2Category(latestVO2, age, gender) : null
  const vo2Bucket = age != null ? getVO2AgeBucket(age, gender) : null
  const genderNL = gender === 'female' ? 'vrouwen' : 'mannen'

  let ttVO2
  if (vo2Cat && age != null) {
    const r = vo2Cat.row
    ttVO2 = `Jouw VO2 max: ${Number(latestVO2).toFixed(1)} → ${vo2Cat.label}\nNorm voor ${genderNL} ${vo2Bucket} jaar:\n- Redelijk: ${r.slecht + 1}–${r.redelijk} · Gemiddeld: ${r.redelijk + 1}–${r.gemiddeld}\n- Goed: ${r.gemiddeld + 1}–${r.goed} · Zeer goed: ${r.goed + 1}–${r.zeerGoed} · Uitstekend: >${r.zeerGoed}\nVerbetert bij Zone 2 cardio (MTB, wandelen op 115-135 bpm).\n\nBron: sportzorg.nl`
  } else {
    ttVO2 = `VO2 max meet hoe efficiënt je lichaam zuurstof gebruikt. Uitgedrukt in ml/kg/min.\nVoeg geboortedatum toe in Instellingen voor leeftijdsspecifieke normen.\nVerbetert bij Zone 2 cardio (MTB, wandelen op 115-135 bpm).`
  }

  // HR & HRV dynamic tooltips
  const ttHR = norms
    ? `Je hartslag in rust. Lager = efficiënter hart.\nVoor jouw leeftijd (${age}): goed = ≤${norms.hr.good} bpm · uitstekend = ≤${norms.hr.excellent} bpm.\nDaalt gemiddeld 1-2 bpm per maand bij regelmatig cardio.`
    : `Je hartslag in rust. Lager = efficiënter hart.\nDaalt gemiddeld 1-2 bpm per maand bij regelmatig cardio.`

  const ttHRV = norms
    ? `Hart Rate Variability — variatie tussen hartslagen.\nHoger = beter herstel. Voor jouw leeftijd (${age}): goed = ≥${norms.hrv.good} ms · gemiddeld = ${norms.hrv.average}–${norms.hrv.good - 1} ms.\nDaalt bij slechte slaap, alcohol, overtraining.`
    : `Hart Rate Variability — variatie tussen hartslagen.\nHoger = beter herstel en minder stress op het zenuwstelsel.\nDaalt bij slechte slaap, alcohol, overtraining.`

  const metrics = [
    {
      label: 'Gewicht',
      unit: settings.unit ?? 'kg',
      latest: latestWeight,
      prev: prevWeight,
      higherIsBetter: false,
      fmt: v => Number(v).toFixed(1),
      tooltip: null,
      badge: null,
    },
    {
      label: 'Rust-HR',
      unit: 'bpm',
      latest: latestHR,
      prev: prevHR,
      higherIsBetter: false,
      fmt: v => String(Math.round(v)),
      tooltip: ttHR,
      badge: latestHR != null ? hrBadge(latestHR, norms) : null,
    },
    {
      label: 'VO₂ max',
      unit: '',
      latest: latestVO2,
      prev: prevVO2,
      higherIsBetter: true,
      fmt: v => Number(v).toFixed(1),
      tooltip: ttVO2,
      badge: vo2Cat ? { label: vo2Cat.label, color: vo2Cat.color } : null,
    },
    {
      label: 'HRV',
      unit: 'ms',
      latest: latestHRV,
      prev: prevHRV,
      higherIsBetter: true,
      fmt: v => String(Math.round(v)),
      tooltip: ttHRV,
      badge: latestHRV != null ? hrvBadge(latestHRV, norms) : null,
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
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <span className="text-xs text-slate-400 leading-tight">{m.label}</span>
                {m.tooltip && (
                  <Tooltip content={m.tooltip}>
                    <Info size={11} color="#737373" />
                  </Tooltip>
                )}
              </div>
              {m.latest != null ? (
                <>
                  <p className="text-base font-bold text-slate-800 leading-none">
                    {m.fmt(m.latest)}
                    {m.unit && <span className="text-xs font-normal text-slate-400 ml-0.5">{m.unit}</span>}
                  </p>
                  {m.badge ? (
                    <span
                      className="inline-block mt-0.5 rounded px-1 text-xs font-semibold leading-tight"
                      style={{ color: m.badge.color, backgroundColor: `${m.badge.color}22` }}
                    >
                      {m.badge.label}
                    </span>
                  ) : (
                    arrowChar && (
                      <p className="text-xs mt-0.5 font-medium" style={{ color: arrowColor }}>{arrowChar}</p>
                    )
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
