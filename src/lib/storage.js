const KEYS = {
  entries: 'fatloss:entries',
  settings: 'fatloss:settings',
}

export function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.entries) ?? '[]')
  } catch {
    return []
  }
}

export function saveEntries(entries) {
  localStorage.setItem(KEYS.entries, JSON.stringify(entries))
}

export function addEntry(entry) {
  const entries = getEntries()
  // Replace if same date already exists
  const idx = entries.findIndex((e) => e.date === entry.date)
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  entries.sort((a, b) => a.date.localeCompare(b.date))
  saveEntries(entries)
  return entries
}

export function deleteEntry(date) {
  const entries = getEntries().filter((e) => e.date !== date)
  saveEntries(entries)
  return entries
}

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.settings) ?? 'null') ?? defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings))
}

function defaultSettings() {
  return {
    unit: 'kg',
    startWeight: null,
    goalWeight: null,
    startDate: null,
  }
}

// One-time migration: localStorage → Supabase (runs on first login)
// Returns true if data was migrated, false if nothing to migrate.
export async function migrateLocalStorageToSupabase(userId, supabaseClient) {
  const entries = getEntries()
  const ls = getSettings()

  if (!entries.length && !ls.startWeight) return false

  // Settings
  await supabaseClient.from('settings').upsert(
    {
      user_id: userId,
      unit: ls.unit ?? 'kg',
      start_weight: ls.startWeight ?? null,
      goal_weight: ls.goalWeight ?? null,
      start_date: ls.startDate ?? null,
    },
    { onConflict: 'user_id' },
  )

  for (const e of entries) {
    // Weight → daily_metrics
    if (e.weight != null) {
      await supabaseClient.from('daily_metrics').upsert(
        { date: e.date, user_id: userId, weight_kg: e.weight },
        { onConflict: 'user_id,date' },
      )
    }

    // Workout (non-rust)
    let workoutId = null
    if (e.training && e.training !== 'rust') {
      const durationSec = (e.trainingDuration ?? 0) * 60
      const startIso = e.date + 'T12:00:00Z'
      const endMs = new Date(startIso).getTime() + durationSec * 1000

      const { data: w } = await supabaseClient
        .from('workouts')
        .insert({
          user_id: userId,
          start: startIso,
          end: new Date(endMs).toISOString(),
          duration_sec: durationSec,
          apple_type: 'manual',
          sport: e.training,
          sport_confidence: 'high',
          kcal: e.trainingKcal ?? null,
          avg_hr: e.avgHR ?? null,
          distance_km: e.distance ?? null,
          raw_data: {},
        })
        .select('id')
        .single()

      workoutId = w?.id ?? null
    }

    // Milon details
    if (e.training === 'milon' && workoutId && (e.milonKrachtScore || e.milonTon)) {
      await supabaseClient.from('milon_details').insert({
        workout_id: workoutId,
        user_id: userId,
        kcal_kracht: e.milonKcalKracht ?? null,
        kcal_cardio: e.milonKcalCardio ?? null,
        kracht_score: e.milonKrachtScore ?? null,
        cardio_score: e.milonCardioScore ?? null,
        top_pct: e.milonTopPct ?? null,
        ton: e.milonTon ?? null,
        reps: e.milonReps ?? null,
      })
    }

    // Manual measurements → manual_entries
    if (e.weight != null || e.waist || e.hips || e.calories || e.notes) {
      await supabaseClient.from('manual_entries').upsert(
        {
          date: e.date,
          user_id: userId,
          weight_kg: e.weight ?? null,
          waist_cm: e.waist ?? null,
          hips_cm: e.hips ?? null,
          food_kcal: e.calories ?? null,
          notes: e.notes ?? null,
        },
        { onConflict: 'user_id,date' },
      )
    }
  }

  // Clear localStorage after successful migration
  localStorage.removeItem(KEYS.entries)
  localStorage.removeItem(KEYS.settings)
  return true
}
