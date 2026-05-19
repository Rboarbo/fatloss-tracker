# Fatloss Tracker — CLAUDE.md

## Project context

Een persoonlijke web-app waarmee Ronald zijn afslankproces bijhoudt. Data wordt opgeslagen in Supabase (cloud) en automatisch aangevuld via Apple Health (Health Auto Export).

- **Gebruiker:** persoonlijk gebruik (Ronald)
- **Doel:** dagelijkse invoer van gewicht, calorieën, metingen én training, met sport-specifieke tracking, automatische Apple Health import en voortgangsvisualisatie
- **Versie:** 2.0
- **Deployment:** statische HTML/JS via GitHub Pages; backend via Supabase

---

## Stack

| Laag | Keuze |
|------|-------|
| Framework | React 18 + Vite |
| Stijl | Tailwind CSS v3 |
| State | React hooks (geen Redux, geen context) |
| Charts | Recharts |
| Icons | lucide-react |
| Routing | geen (single-page, geen router) |
| Auth | Supabase Auth — magic link (email, geen wachtwoord) |
| Database | Supabase Postgres met RLS |
| Edge Functions | Supabase Edge Functions (Deno) |
| Apple Health | Health Auto Export → POST naar Edge Function |

---

## Belangrijke commando's

```bash
npm run dev       # ontwikkelserver (localhost:5173)
npm run build     # productie-build naar /dist
npm run preview   # preview van de build lokaal

# Deploy (GitHub Pages via Actions — push naar main)
git push          # triggert .github/workflows/deploy.yml automatisch

# Edge Function deployen
supabase functions deploy health-import
```

---

## Environment variables

Verplicht in `.env.local` (lokaal) en als GitHub Secrets (CI):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

De Service Role Key staat **nooit** in de frontend — alleen in de Edge Function (auto-inject door Supabase).

---

## Database schema (Supabase Postgres)

Zie `supabase/migrations/001_initial.sql` voor de volledige DDL inclusief RLS.

| Tabel | Beschrijving |
|-------|-------------|
| `settings` | Per-user configuratie (goals, HAE token, eenheid) |
| `daily_metrics` | Auto-import vanuit Apple Health: gewicht, vetpct, lean mass, HR, VO2, etc. |
| `workouts` | Auto-import vanuit Apple Health: sport, duur, kcal, HR — met sport-detectie |
| `milon_details` | Handmatig na Milon ME-sessie: scores, ton, reps — FK → workouts |
| `manual_entries` | Handmatig: taille, heupen, food kcal, gewicht-fallback, notities |

RLS is ingeschakeld op alle tabellen. Elke tabel heeft `user_id uuid REFERENCES auth.users`.

---

## Data flow

```
Apple Health → Health Auto Export → POST /functions/v1/health-import
                                          ↓
                                   Supabase Postgres
                                   ├─ daily_metrics (gewicht, vet%, lean, HR, VO2...)
                                   └─ workouts (sport, duur, kcal, HR, afstand)

LogEntry (handmatig) → manual_entries (taille, food kcal, gewicht-fallback)
                      → workouts (apple_type='manual', alleen als geen auto-import)
                      → milon_details (via modal of inline form)
```

---

## Gecombineerde entry (frontend view)

`src/lib/db.js#fetchAllData` merge dagelijkse data van alle 4 tabellen tot 1 entry per dag:

```js
{
  date: string,
  // Gewicht: HAE first, dan manual_entries.weight_kg als fallback
  weight: number | null,
  waist: number | null,         // manual_entries.waist_cm
  hips: number | null,          // manual_entries.hips_cm
  calories: number | null,      // manual_entries.food_kcal
  notes: string | null,
  training: TrainingType,       // workouts.sport of 'rust'
  trainingDuration: number | null, // workouts.duration_sec / 60
  trainingKcal: number | null,
  avgHR: number | null,
  distance: number | null,
  // Apple Health extended
  bodyFatPct: number | null,
  leanMassKg: number | null,
  restingHR: number | null,
  hrv: number | null,
  vo2Max: number | null,
  stepCount: number | null,
  activeEnergyKcal: number | null,
  // Milon ME details
  milonKcalKracht: number | null,
  milonKcalCardio: number | null,
  milonKcalTotal: number | null,
  milonKrachtScore: number | null,
  milonCardioScore: number | null,
  milonTopPct: string | null,
  milonTon: number | null,
  milonReps: number | null,
  // UI metadata (underscore-prefix = niet opslaan)
  _workoutId: string | null,
  _fromAppleHealth: boolean,
  _sportConfidence: 'high' | 'low' | null,
  _appleType: string | null,
}
```

---

## Data types

### TrainingType

```js
// waarden gedefinieerd in src/lib/sport-config.js
'rust' | 'milon' | 'padel-training' | 'padel-wedstrijd' | 'mtb' | 'wandelen' | 'taichi' | 'anders'
```

### Settings (frontend state)

```js
{
  unit: 'kg' | 'lbs',
  startWeight: number | null,
  goalWeight: number | null,
  startDate: string | null,    // ISO date
  heightCm: number | null,
  kcalTarget: number | null,
  proteinTarget: number | null,
  haeApiToken: string | null,  // 32-char hex bearer token voor HAE webhook
}
```

---

## Componenten (v2.0)

| Bestand | Beschrijving |
|---------|--------------|
| `src/lib/supabase.js` | Supabase client (anon key + URL) |
| `src/lib/db.js` | DB helpers: fetchSettings, saveSettings, fetchAllData, saveManualEntry, saveManualWorkout, saveMilonDetails, confirmWorkoutSport, deleteManualData, generateHAEToken |
| `src/lib/storage.js` | localStorage helpers (lezen van legacy data) + `migrateLocalStorageToSupabase` (eenmalig) |
| `src/lib/sport-config.js` | `SPORT_CONFIG`, `WEEKLY_PROTOCOL`, `WORKOUT_FIELDS` |
| `src/components/AuthGate.jsx` | Magic link login screen |
| `src/components/AppLogo.jsx` | SVG flame logo |
| `src/components/WeekView.jsx` | Week-grid (Ma–Zo) met protocol vs. actueel |
| `src/components/SportStats.jsx` | Sport-kaarten met trend-pijlen (afgelopen 4 weken) |
| `src/components/MilonChart.jsx` | Dual-axis chart: kracht-score + tonnage over tijd |
| `src/components/MilonModal.jsx` | Bottom-sheet modal voor Milon ME details op auto-imported workout |
| `src/pages/Dashboard.jsx` | WeekView + hero + body-comp stats + grafieken + SportStats + MilonChart |
| `src/pages/LogEntry.jsx` | Form: auto-imported workout card (🍎 badge, sport-bevestiging, Milon modal) + handmatige metingen |
| `src/pages/Settings.jsx` | Gewichtsdoelen + HAE endpoint/token configuratie + uitloggen |
| `supabase/migrations/001_initial.sql` | Database schema + RLS policies |
| `supabase/functions/health-import/index.ts` | Edge Function: HAE JSON → Postgres |

---

## Edge Function: sport-detectie logica

De `detectSport()` functie in de Edge Function gebruikt workout-naam + dag + duur:

- **HIIT + 25-50 min + ma/wo** → `milon` (high confidence)
- **HIIT + 50-90 min + do** → `padel-training` (high confidence)
- **HIIT + ≥90 min of weekend** → `padel-wedstrijd` (low confidence)
- **Fietsen** → `mtb` (high confidence)
- **Tennis/Padel/Pickleball** → `padel-training`/`padel-wedstrijd` op basis van dag
- **Wandelen ≥20 min** → `wandelen` (high confidence)
- **Tai Chi** → `taichi` (high confidence)

Workouts met `sport_confidence='low'` krijgen een 🟡 indicator in de UI en een dropdown om het sport te bevestigen.

---

## Migratie van localStorage (v1.x → v2.0)

Bij de eerste login na de upgrade roept `App.jsx` `migrateLocalStorageToSupabase()` aan (uit `src/lib/storage.js`). Deze:

1. Leest `fatloss:entries` en `fatloss:settings` uit localStorage
2. Schrijft settings naar `settings` tabel
3. Schrijft gewicht naar `daily_metrics` per dag
4. Maakt manual workouts aan in `workouts` (apple_type='manual')
5. Schrijft Milon-details naar `milon_details`
6. Schrijft overige metingen naar `manual_entries`
7. Verwijdert `fatloss:entries` en `fatloss:settings` uit localStorage

De migratie is idempotent (controleert op bestaande data). localStorage-keys `fatloss:entries` en `fatloss:settings` blijven ongewijzigd in `storage.js` zodat legacy data correct gelezen kan worden.

---

## Niet-doen lijst

- **Geen directe localStorage-reads vanuit componenten** — altijd via `src/lib/storage.js` of `src/lib/db.js`
- **Geen router** — geen React Router, geen URL-gebaseerde navigatie
- **Geen onnodige dependencies** — voeg alleen packages toe als ze echt nodig zijn
- **Geen comments die uitleggen wat code doet** — alleen comments als de *waarom* niet-voor-de-hand-liggend is
- **Geen overengineering** — geen context providers, geen Redux, geen abstractielagen
- **Service Role Key nooit in frontend** — alleen in Edge Function via Deno.env
- **Storage keys niet wijzigen** — `fatloss:entries` en `fatloss:settings` blijven ongewijzigd (voor migratie-compatibiliteit)
- **Auto-imported workouts niet verwijderen vanuit UI** — die komen uit Apple Health; alleen manual entries kunnen worden verwijderd
