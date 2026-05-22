import { supabase } from './supabase'

// ─── Settings ─────────────────────────────────────────────────────────────────

function defaultSettings() {
  return {
    unit: 'kg',
    startWeight: null,
    goalWeight: null,
    startDate: null,
    heightCm: 168,
    kcalTarget: 1800,
    proteinTarget: 140,
    haeApiToken: null,
  }
}

export async function fetchSettings(userId) {
  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return defaultSettings()

  return {
    unit: data.unit ?? 'kg',
    startWeight: data.start_weight ?? null,
    goalWeight: data.goal_weight ?? null,
    startDate: data.start_date ?? null,
    heightCm: data.height_cm ?? 168,
    kcalTarget: data.kcal_target ?? 1800,
    proteinTarget: data.protein_target ?? 140,
    haeApiToken: data.hae_api_token ?? null,
  }
}

export async function saveSettings(userId, data) {
  await supabase.from('settings').upsert({
    user_id: userId,
    unit: data.unit,
    start_weight: data.startWeight ?? null,
    goal_weight: data.goalWeight ?? null,
    start_date: data.startDate ?? null,
    height_cm: data.heightCm ?? null,
    kcal_target: data.kcalTarget ?? null,
    protein_target: data.proteinTarget ?? null,
    hae_api_token: data.haeApiToken ?? null,
  })
}

// ─── Data loading ─────────────────────────────────────────────────────────────

function round1(v) {
  return v != null ? Math.round(v * 10) / 10 : null
}

function mergeEntry(date, metric, workout, milonDetail, manual) {
  return {
    date,
    weight: round1(metric?.weight_kg ?? manual?.weight_kg),
    waist: manual?.waist_cm ?? null,
    hips: manual?.hips_cm ?? null,
    calories: manual?.food_kcal ?? null,
    notes: manual?.notes ?? null,
    training: workout?.sport ?? 'rust',
    trainingDuration: workout ? Math.round(workout.duration_sec / 60) : null,
    trainingKcal: workout?.kcal != null ? Math.round(workout.kcal) : null,
    avgHR: workout?.avg_hr != null ? Math.round(workout.avg_hr) : null,
    distance: workout?.distance_km ?? null,
    // Extended fields from Apple Health
    bodyFatPct: metric?.body_fat_pct ?? null,
    leanMassKg: metric?.lean_mass_kg ?? null,
    bmi: metric?.bmi ?? null,
    restingHR: metric?.resting_hr ?? null,
    hrv: metric?.hrv_ms ?? null,
    vo2Max: metric?.vo2_max ?? null,
    stepCount: metric?.step_count ?? null,
    activeEnergyKcal: metric?.active_energy_kcal ?? null,
    walkingDistanceKm: metric?.walking_distance_km ?? null,
    walkingHR: metric?.walking_hr_avg ?? null,
    // Milon ME details
    milonKcalKracht: milonDetail?.kcal_kracht ?? null,
    milonKcalCardio: milonDetail?.kcal_cardio ?? null,
    milonKcalTotal:
      milonDetail?.kcal_kracht != null || milonDetail?.kcal_cardio != null
        ? (milonDetail.kcal_kracht ?? 0) + (milonDetail.kcal_cardio ?? 0)
        : null,
    milonKrachtScore: milonDetail?.kracht_score ?? null,
    milonCardioScore: milonDetail?.cardio_score ?? null,
    milonTopPct: milonDetail?.top_pct ?? null,
    milonTon: milonDetail?.ton ?? null,
    milonReps: milonDetail?.reps ?? null,
    // UI metadata
    _workoutId: workout?.id ?? null,
    _fromAppleHealth: workout != null && workout.apple_type !== 'manual',
    _sportConfidence: workout?.sport_confidence ?? null,
    _appleType: workout?.apple_type ?? null,
  }
}

export async function fetchAllData(userId) {
  const [metricsRes, workoutsRes, manualRes] = await Promise.all([
    supabase.from('daily_metrics').select('*').eq('user_id', userId).order('date'),
    supabase
      .from('workouts')
      .select('*, milon_details(*)')
      .eq('user_id', userId)
      .order('start'),
    supabase.from('manual_entries').select('*').eq('user_id', userId).order('date'),
  ])

  const metricsByDate = {}
  for (const m of metricsRes.data ?? []) metricsByDate[m.date] = m

  // One primary workout per date (first, sorted by start ascending)
  const workoutsByDate = {}
  for (const w of workoutsRes.data ?? []) {
    const date = w.start.slice(0, 10)
    if (!workoutsByDate[date]) workoutsByDate[date] = []
    workoutsByDate[date].push(w)
  }

  const manualByDate = {}
  for (const m of manualRes.data ?? []) manualByDate[m.date] = m

  const allDates = [
    ...new Set([
      ...Object.keys(metricsByDate),
      ...Object.keys(workoutsByDate),
      ...Object.keys(manualByDate),
    ]),
  ].sort()

  const entries = allDates.map((date) => {
    const metric = metricsByDate[date]
    const dayWorkouts = workoutsByDate[date] ?? []
    // Prefer auto-imported workout; fall back to first manual workout
    const workout =
      dayWorkouts.find((w) => w.apple_type !== 'manual') ??
      dayWorkouts[0] ??
      null
    const milonDetail = workout?.milon_details?.[0] ?? null
    const manual = manualByDate[date]
    return mergeEntry(date, metric, workout, milonDetail, manual)
  })

  return { entries, workouts: workoutsRes.data ?? [] }
}

// ─── Manual entry mutations ────────────────────────────────────────────────────

export async function saveManualEntry(userId, date, data) {
  // Only upsert if there's something to save
  const hasData =
    data.weightKg != null ||
    data.waistCm != null ||
    data.hipsCm != null ||
    data.foodKcal != null ||
    data.notes != null

  if (!hasData) return

  await supabase.from('manual_entries').upsert(
    {
      user_id: userId,
      date,
      weight_kg: data.weightKg ?? null,
      waist_cm: data.waistCm ?? null,
      hips_cm: data.hipsCm ?? null,
      food_kcal: data.foodKcal ?? null,
      notes: data.notes ?? null,
    },
    { onConflict: 'user_id,date' },
  )
}

// Creates or updates a manually-logged workout (apple_type = 'manual')
// Deletes existing manual workout for the date if training === 'rust'
export async function saveManualWorkout(userId, date, data) {
  // Find existing manual workout for this date
  const dayStart = date + 'T00:00:00Z'
  const dayEnd = date + 'T23:59:59Z'

  const { data: existing } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .eq('apple_type', 'manual')
    .gte('start', dayStart)
    .lte('start', dayEnd)
    .maybeSingle()

  if (data.training === 'rust') {
    if (existing) await supabase.from('workouts').delete().eq('id', existing.id)
    return null
  }

  const durationSec = (data.duration ?? 0) * 60
  const startIso = date + 'T12:00:00Z'
  const endMs = new Date(startIso).getTime() + durationSec * 1000
  const endIso = new Date(endMs).toISOString()

  const row = {
    user_id: userId,
    start: startIso,
    end: endIso,
    duration_sec: durationSec,
    apple_type: 'manual',
    sport: data.training,
    sport_confidence: 'high',
    kcal: data.trainingKcal ?? null,
    avg_hr: data.avgHR ?? null,
    distance_km: data.distance ?? null,
    raw_data: {},
  }

  if (existing) {
    const { data: updated } = await supabase
      .from('workouts')
      .update(row)
      .eq('id', existing.id)
      .select('id')
      .single()
    return updated?.id ?? null
  }

  const { data: created } = await supabase
    .from('workouts')
    .insert(row)
    .select('id')
    .single()
  return created?.id ?? null
}

// Deletes manual measurements for a date; auto-imported workouts are preserved
export async function deleteManualData(userId, date) {
  const dayStart = date + 'T00:00:00Z'
  const dayEnd = date + 'T23:59:59Z'

  await Promise.all([
    supabase.from('manual_entries').delete().eq('user_id', userId).eq('date', date),
    supabase
      .from('workouts')
      .delete()
      .eq('user_id', userId)
      .eq('apple_type', 'manual')
      .gte('start', dayStart)
      .lte('start', dayEnd),
  ])
}

// ─── Workout actions ───────────────────────────────────────────────────────────

export async function confirmWorkoutSport(workoutId, sport) {
  await supabase
    .from('workouts')
    .update({ sport, sport_confidence: 'high' })
    .eq('id', workoutId)
}

// ─── Milon details ─────────────────────────────────────────────────────────────

export async function saveMilonDetails(workoutId, userId, data) {
  await supabase.from('milon_details').upsert(
    {
      workout_id: workoutId,
      user_id: userId,
      kcal_kracht: data.kcal_kracht ?? null,
      kcal_cardio: data.kcal_cardio ?? null,
      kracht_score: data.kracht_score ?? null,
      cardio_score: data.cardio_score ?? null,
      top_pct: data.top_pct ?? null,
      ton: data.ton ?? null,
      reps: data.reps ?? null,
    },
    { onConflict: 'workout_id' },
  )
}

// ─── Token generation ──────────────────────────────────────────────────────────

export function generateHAEToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
