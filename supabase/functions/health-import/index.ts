import { createClient } from 'jsr:@supabase/supabase-js@2'

const KJ_TO_KCAL = 1 / 4.184

interface HAEWorkout {
  id: string
  name: string
  start: string
  end: string
  duration: number
  activeEnergyBurned?: { qty: number; units: string }
  heartRate?: { avg?: { qty: number }; max?: { qty: number }; min?: { qty: number } }
  distance?: { qty: number; units: string }
  stepCount?: { qty: number }
  stepCadence?: { qty: number }
  intensity?: { qty: number }
  temperature?: { qty: number }
  humidity?: { qty: number }
  [key: string]: unknown
}

interface HAEMetric {
  name: string
  units: string
  data: Array<{ date: string; qty: number }>
}

// "2026-05-19 20:05:09 +0200" → ISO 8601
function parseHAEDate(s: string): Date {
  return new Date(s.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{4})$/, '$1T$2$3'))
}

function detectSport(w: HAEWorkout): { sport: string; confidence: 'high' | 'low' } {
  const start = parseHAEDate(w.start)
  const day = start.getDay() // 0=Sun, 1=Mon, … 6=Sat
  const min = w.duration / 60
  const name = w.name.toLowerCase()

  if (/fietsen|cycling|fiets/i.test(w.name)) return { sport: 'mtb', confidence: 'high' }
  if (/wandel|walk/i.test(w.name) && min >= 20) return { sport: 'wandelen', confidence: 'high' }
  if (/tai.?chi/i.test(w.name)) return { sport: 'taichi', confidence: 'high' }
  if (/tennis|padel|pickleball/i.test(w.name)) {
    const isWeekend = [0, 5, 6].includes(day)
    return { sport: isWeekend ? 'padel-wedstrijd' : 'padel-training', confidence: 'high' }
  }

  // HIIT disambiguate: Milon (25-50 min, ma/wo) vs Padel training vs Padel wedstrijd
  if (/intensity|hiit|intervaltraining/i.test(w.name)) {
    if (min >= 25 && min <= 50 && [1, 3].includes(day)) return { sport: 'milon', confidence: 'high' }
    if (min >= 25 && min <= 50) return { sport: 'milon', confidence: 'low' }
    if (min > 50 && min < 90 && day === 4) return { sport: 'padel-training', confidence: 'high' }
    if (min >= 90 || [0, 5, 6].includes(day)) return { sport: 'padel-wedstrijd', confidence: 'low' }
    if (min > 50) return { sport: 'padel-training', confidence: 'low' }
  }

  // Generic walking / outdoor walk fallback
  if (name.includes('walk') && min >= 20) return { sport: 'wandelen', confidence: 'low' }

  return { sport: 'anders', confidence: 'low' }
}

function mapWorkout(w: HAEWorkout, userId: string) {
  let kcal: number | null = null
  if (w.activeEnergyBurned) {
    kcal = w.activeEnergyBurned.units === 'kJ'
      ? w.activeEnergyBurned.qty * KJ_TO_KCAL
      : w.activeEnergyBurned.qty
  }

  const { sport, confidence } = detectSport(w)

  return {
    id: w.id,
    user_id: userId,
    start: parseHAEDate(w.start).toISOString(),
    end: parseHAEDate(w.end).toISOString(),
    duration_sec: Math.round(w.duration),
    apple_type: w.name,
    sport,
    sport_confidence: confidence,
    kcal: kcal != null ? Math.round(kcal * 10) / 10 : null,
    avg_hr: w.heartRate?.avg?.qty ?? null,
    max_hr: w.heartRate?.max?.qty ?? null,
    min_hr: w.heartRate?.min?.qty ?? null,
    distance_km: w.distance?.qty ?? null,
    step_count: w.stepCount?.qty ?? null,
    step_cadence: w.stepCadence?.qty ?? null,
    intensity_met: w.intensity?.qty ?? null,
    temperature_c: w.temperature?.qty ?? null,
    humidity_pct: w.humidity?.qty ?? null,
    raw_data: w,
  }
}

const METRIC_MAP: Record<string, string> = {
  weight_body_mass:           'weight_kg',
  body_fat_percentage:        'body_fat_pct',
  lean_body_mass:             'lean_mass_kg',
  body_mass_index:            'bmi',
  resting_heart_rate:         'resting_hr',
  walking_heart_rate_average: 'walking_hr_avg',
  heart_rate_variability:     'hrv_ms',
  vo2_max:                    'vo2_max',
  step_count:                 'step_count',
  walking_running_distance:   'walking_distance_km',
  flights_climbed:            'flights_climbed',
  active_energy_burned:       'active_energy_kcal',
  apple_exercise_time:        'exercise_minutes',
  time_in_daylight:           'time_in_daylight_min',
  blood_oxygen_saturation:    'blood_oxygen_pct',
}

function mapMetrics(metrics: HAEMetric[], userId: string): Record<string, unknown>[] {
  const byDate: Record<string, Record<string, unknown>> = {}

  for (const m of metrics) {
    const col = METRIC_MAP[m.name]
    if (!col) continue

    for (const point of m.data ?? []) {
      const date = parseHAEDate(point.date).toISOString().slice(0, 10)
      if (!byDate[date]) byDate[date] = { date, user_id: userId }

      let val = point.qty
      // active_energy_burned may come in kJ
      if (m.name === 'active_energy_burned' && m.units === 'kJ') val = val * KJ_TO_KCAL

      byDate[date][col] = val
    }
  }

  return Object.values(byDate)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (!token) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Lookup user by HAE API token
  const { data: settings, error: settingsErr } = await supabase
    .from('settings')
    .select('user_id')
    .eq('hae_api_token', token)
    .single()

  if (settingsErr || !settings) {
    return new Response('Invalid token', { status: 401 })
  }
  const userId = settings.user_id as string

  let body: { data?: { workouts?: HAEWorkout[]; metrics?: HAEMetric[] } }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const workouts = body?.data?.workouts ?? []
  const metrics = body?.data?.metrics ?? []

  const workoutRows = workouts.map((w) => mapWorkout(w, userId))
  const dailyRows = mapMetrics(metrics, userId)

  const [wRes, mRes] = await Promise.all([
    supabase.from('workouts').upsert(workoutRows, { onConflict: 'id' }),
    supabase.from('daily_metrics').upsert(dailyRows, { onConflict: 'user_id,date' }),
  ])

  if (wRes.error) console.error('workouts upsert error:', wRes.error)
  if (mRes.error) console.error('daily_metrics upsert error:', mRes.error)

  return new Response(
    JSON.stringify({
      imported_workouts: workoutRows.length,
      imported_daily_metrics: dailyRows.length,
      workouts_low_confidence: workoutRows.filter((w) => w.sport_confidence === 'low').length,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
